import fs from 'fs';
import { Response } from 'express';
import {
  AuthRequest,
  errorResponse,
  forwardUserHeaders,
  getPortalCustomerId,
  successResponse,
  UserRole,
} from '@fems/shared';
import { ExportFormat } from '../prisma/types.js';
import { ReportService } from '../services/report.service.js';
import { AnalyticsService } from '../services/analytics.service.js';
import {
  ACTIVE_REPORT_TYPES,
  ActiveReportType,
  ROLE_REPORT_TYPES,
  ReportFilterInput,
} from '../types/index.js';

function allowedReportTypes(role: UserRole): readonly ActiveReportType[] {
  if (role === UserRole.ADMIN) return ACTIVE_REPORT_TYPES;
  if (role === UserRole.INSPECTOR) return ROLE_REPORT_TYPES.Inspector;
  return ROLE_REPORT_TYPES.User;
}

function reportOwnerFilter(req: AuthRequest): string | undefined {
  return req.user?.role === UserRole.ADMIN ? undefined : req.user?.userId;
}

function resolveReportFilters(req: AuthRequest, filters: ReportFilterInput = {}): ReportFilterInput {
  const resolved = { ...filters };
  if (req.user?.role === UserRole.USER) {
    const customerId = getPortalCustomerId(req.user);
    if (customerId) resolved.customerId = customerId;
  }
  if (req.user?.role === UserRole.INSPECTOR && !resolved.technicianId) {
    resolved.technicianId = req.user.userId;
  }
  return resolved;
}

export class ReportController {
  constructor(
    private reportService: ReportService,
    private analyticsService: AnalyticsService
  ) {}

  list = async (req: AuthRequest, res: Response) => {
    const result = await this.reportService.listReports(
      req.query as Record<string, unknown>,
      reportOwnerFilter(req)
    );
    return successResponse(res, 'Reports retrieved', result.reports, 200, result.meta);
  };

  generate = async (req: AuthRequest, res: Response) => {
    const role = req.user?.role;
    if (!role) return errorResponse(res, 'Authentication required', 401);

    const reportType = req.body.reportType as ActiveReportType;
    if (!allowedReportTypes(role).includes(reportType)) {
      return errorResponse(res, 'Report type not allowed for your role', 403);
    }

    try {
      const report = await this.reportService.generateReport({
        reportType,
        title: req.body.title,
        filters: resolveReportFilters(req, req.body.filters),
        generatedBy: req.user?.userId,
        headers: forwardUserHeaders(req),
      });
      return successResponse(res, 'Report generated', report, 201);
    } catch (error) {
      const err = error as Error & { report?: unknown };
      if (err.report) {
        return errorResponse(res, err.message, 500);
      }
      throw error;
    }
  };

  export = async (req: AuthRequest, res: Response) => {
    const format = req.params.format as ExportFormat;
    const result = await this.reportService.exportReport(req.params.id, format, reportOwnerFilter(req));

    if (!result) {
      return errorResponse(res, 'Report not found', 404);
    }

    const { exportRecord } = result;

    if (!fs.existsSync(exportRecord.filePath)) {
      return errorResponse(res, 'Export file not found on disk', 404);
    }

    res.setHeader('Content-Type', exportRecord.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportRecord.fileName}"`);
    res.setHeader('Content-Length', exportRecord.fileSize);

    const stream = fs.createReadStream(exportRecord.filePath);
    stream.pipe(res);
  };
}

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  adminDashboard = async (req: AuthRequest, res: Response) => {
    const service = this.analyticsService.withHeaders(forwardUserHeaders(req));
    const refresh = req.query.refresh === 'true';
    const data = await service.getAdminDashboard(refresh);
    return successResponse(res, 'Dashboard analytics retrieved', data);
  };

  customerDashboard = async (req: AuthRequest, res: Response) => {
    const customerId = (req.query.customerId as string) || getPortalCustomerId(req.user);
    if (!customerId) {
      return errorResponse(res, 'Portal account scope is required', 400);
    }

    const service = this.analyticsService.withHeaders(forwardUserHeaders(req));
    const refresh = req.query.refresh === 'true';
    const data = await service.getCustomerDashboard(customerId, refresh);
    return successResponse(res, 'Customer dashboard analytics retrieved', data);
  };

  technicianDashboard = async (req: AuthRequest, res: Response) => {
    const technicianId = (req.query.technicianId as string) || req.user?.userId;
    if (!technicianId) {
      return errorResponse(res, 'technicianId is required', 400);
    }

    const service = this.analyticsService.withHeaders(forwardUserHeaders(req));
    const refresh = req.query.refresh === 'true';
    const data = await service.getTechnicianDashboard(technicianId, refresh);
    return successResponse(res, 'Technician dashboard analytics retrieved', data);
  };
}
