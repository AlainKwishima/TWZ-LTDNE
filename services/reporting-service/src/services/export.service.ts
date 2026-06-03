import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { ExportFormat } from '../prisma/types.js';
import { ReportDataSnapshot } from '../types/index.js';
import { EXPORT_DIR } from '../config/index.js';

const MIME_TYPES: Record<ExportFormat, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export function ensureExportDir(): string {
  const dir = path.resolve(EXPORT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getMimeType(format: ExportFormat): string {
  return MIME_TYPES[format];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export interface ExportResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export async function generateExport(
  reportId: string,
  reportTitle: string,
  format: ExportFormat,
  snapshot: ReportDataSnapshot
): Promise<ExportResult> {
  const dir = ensureExportDir();
  const baseName = `${slugify(reportTitle)}-${reportId.slice(0, 8)}`;

  switch (format) {
    case 'pdf':
      return generatePdf(dir, baseName, reportTitle, snapshot);
    case 'csv':
      return generateCsv(dir, baseName, snapshot);
    case 'xlsx':
      return generateXlsx(dir, baseName, reportTitle, snapshot);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function generatePdf(
  dir: string,
  baseName: string,
  title: string,
  snapshot: ReportDataSnapshot
): Promise<ExportResult> {
  const fileName = `${baseName}.pdf`;
  const filePath = path.join(dir, fileName);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, layout: snapshot.columns.length > 6 ? 'landscape' : 'portrait' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fillColor('#C0392B').fontSize(20).font('Helvetica-Bold').text('TWZ LTD Report', { align: 'left' });
    doc.moveDown(0.5);
    doc.fillColor('#2C3E50').fontSize(14).font('Helvetica-Bold').text(title);
    doc.fontSize(9).font('Helvetica').fillColor('#7F8C8D')
      .text(`Generated: ${new Date().toISOString()}`, { align: 'left' });
    doc.moveDown(1);

    const colWidth = (doc.page.width - 80) / Math.max(snapshot.columns.length, 1);
    let y = doc.y;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
    doc.rect(40, y, doc.page.width - 80, 18).fill('#34495E');
    snapshot.columns.forEach((col, i) => {
      doc.fillColor('#FFFFFF').text(col, 44 + i * colWidth, y + 4, { width: colWidth - 4 });
    });
    y += 22;

    doc.font('Helvetica').fontSize(8).fillColor('#2C3E50');
    for (const row of snapshot.rows) {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }
      snapshot.columns.forEach((col, i) => {
        const value = row[col] ?? row[col.replace(/([A-Z])/g, '_$1').toLowerCase()] ?? '';
        doc.text(String(value), 44 + i * colWidth, y, { width: colWidth - 4 });
      });
      y += 16;
    }

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  const stats = fs.statSync(filePath);
  return { filePath, fileName, fileSize: stats.size, mimeType: MIME_TYPES.pdf };
}

async function generateCsv(dir: string, baseName: string, snapshot: ReportDataSnapshot): Promise<ExportResult> {
  const fileName = `${baseName}.csv`;
  const filePath = path.join(dir, fileName);

  const escape = (val: unknown) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    snapshot.columns.join(','),
    ...snapshot.rows.map((row) => snapshot.columns.map((col) => escape(row[col])).join(',')),
  ];

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  const stats = fs.statSync(filePath);
  return { filePath, fileName, fileSize: stats.size, mimeType: MIME_TYPES.csv };
}

async function generateXlsx(
  dir: string,
  baseName: string,
  title: string,
  snapshot: ReportDataSnapshot
): Promise<ExportResult> {
  const fileName = `${baseName}.xlsx`;
  const filePath = path.join(dir, fileName);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TWZ LTD Reporting Service';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Report');
  sheet.addRow([title]);
  sheet.addRow([`Generated: ${new Date().toISOString()}`]);
  sheet.addRow([]);
  sheet.addRow(snapshot.columns);

  const headerRow = sheet.lastRow!;
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF34495E' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  for (const row of snapshot.rows) {
    sheet.addRow(snapshot.columns.map((col) => row[col] ?? ''));
  }

  snapshot.columns.forEach((_, i) => {
    sheet.getColumn(i + 1).width = 18;
  });

  await workbook.xlsx.writeFile(filePath);
  const stats = fs.statSync(filePath);
  return { filePath, fileName, fileSize: stats.size, mimeType: MIME_TYPES.xlsx };
}
