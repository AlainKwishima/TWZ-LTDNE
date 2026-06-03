import { ExportFormat, ReportStatus, ReportType } from '../prisma/types.js';
import { EventBus, EventType, paginationMeta, parsePagination } from '@fems/shared';
import { prisma } from '../prisma/client.js';
import { DataAggregator } from '../clients/data-aggregator.js';
import { generateExport } from './export.service.js';
import {
  ACTIVE_REPORT_TYPES,
  ActiveReportType,
  REPORT_TYPE_LABELS,
  ReportDataSnapshot,
  ReportFilterInput,
} from '../types/index.js';

export class ReportService {
  constructor(private eventBus: EventBus) {}

  async listReports(query: Record<string, unknown>, generatedByFilter?: string) {
    const { page, limit, skip } = parsePagination(query);
    const where: {
      reportType?: ReportType;
      status?: ReportStatus;
      generatedBy?: string;
    } = {};

    if (query.reportType) where.reportType = query.reportType as ReportType;
    if (query.status) where.status = query.status as ReportStatus;
    if (generatedByFilter) where.generatedBy = generatedByFilter;

    const [reports, total] = await Promise.all([
      prisma.generatedReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { filters: true, exports: { select: { id: true, format: true, fileName: true, createdAt: true } } },
      }),
      prisma.generatedReport.count({ where }),
    ]);

    return { reports, meta: paginationMeta(page, limit, total) };
  }

  async generateReport(input: {
    reportType: ActiveReportType;
    title?: string;
    filters?: ReportFilterInput;
    generatedBy?: string;
    headers?: Record<string, string>;
  }) {
    if (!ACTIVE_REPORT_TYPES.includes(input.reportType)) {
      throw new Error(`Unsupported report type: ${input.reportType}`);
    }
    const title =
      input.title ||
      `${REPORT_TYPE_LABELS[input.reportType]} – ${new Date().toISOString().slice(0, 10)}`;
    const filters = input.filters ?? {};

    const report = await prisma.generatedReport.create({
      data: {
        reportType: input.reportType as ReportType,
        title,
        status: ReportStatus.pending,
        generatedBy: input.generatedBy,
        filters: {
          create: {
            dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
            dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
            customerId: filters.customerId,
            status: filters.status,
            technicianId: filters.technicianId,
          },
        },
      },
      include: { filters: true },
    });

    try {
      const aggregator = new DataAggregator(input.headers ?? {});
      const { snapshot, summary } = await aggregator.fetchReportData(input.reportType, filters);

      const updated = await prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.completed,
          rowCount: snapshot.rows.length,
          summary: summary as object,
          dataSnapshot: snapshot as object,
        },
        include: { filters: true, exports: true },
      });

      await this.eventBus.publish(EventType.REPORT_GENERATED, {
        reportId: updated.id,
        reportType: updated.reportType,
        rowCount: updated.rowCount,
        generatedBy: updated.generatedBy,
      });

      return updated;
    } catch (error) {
      const failed = await prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.failed,
          errorMessage: (error as Error).message,
        },
        include: { filters: true },
      });
      throw Object.assign(new Error((error as Error).message), { report: failed });
    }
  }

  async getReportById(id: string, generatedByFilter?: string) {
    const report = await prisma.generatedReport.findUnique({
      where: { id },
      include: { filters: true, exports: true },
    });
    if (!report) return null;
    if (generatedByFilter && report.generatedBy !== generatedByFilter) return null;
    return report;
  }

  async exportReport(id: string, format: ExportFormat, generatedByFilter?: string) {
    const report = await this.getReportById(id, generatedByFilter);
    if (!report) return null;
    if (report.status !== ReportStatus.completed) {
      throw new Error('Report is not ready for export');
    }

    const existing = report.exports.find((e: { format: ExportFormat }) => e.format === format);
    if (existing) {
      return { report, exportRecord: existing };
    }

    const snapshot = report.dataSnapshot as ReportDataSnapshot | null;
    if (!snapshot?.columns?.length) {
      throw new Error('Report has no data to export');
    }

    const exportResult = await generateExport(report.id, report.title, format, snapshot);

    const exportRecord = await prisma.reportExport.create({
      data: {
        generatedReportId: report.id,
        format,
        filePath: exportResult.filePath,
        fileName: exportResult.fileName,
        fileSize: exportResult.fileSize,
        mimeType: exportResult.mimeType,
      },
    });

    return { report, exportRecord };
  }
}
