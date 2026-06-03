import { z } from 'zod';
import { ExportFormat } from '../prisma/types.js';
import { ACTIVE_REPORT_TYPES } from '../types/index.js';

export const reportFilterSchema = z.object({
  dateFrom: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  dateTo: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  customerId: z.string().uuid().optional(),
  status: z.string().optional(),
  technicianId: z.string().uuid().optional(),
});

export const generateReportSchema = z.object({
  reportType: z.enum(ACTIVE_REPORT_TYPES),
  title: z.string().min(3).max(200).optional(),
  filters: reportFilterSchema.optional(),
});

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  reportType: z.enum(ACTIVE_REPORT_TYPES).optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
});

export const reportIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const exportParamsSchema = z.object({
  id: z.string().uuid(),
  format: z.enum(['pdf', 'csv', 'xlsx']),
});

export const customerDashboardQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
});

export const technicianDashboardQuerySchema = z.object({
  technicianId: z.string().uuid().optional(),
});

export const exportFormatEnum = z.nativeEnum(ExportFormat);
