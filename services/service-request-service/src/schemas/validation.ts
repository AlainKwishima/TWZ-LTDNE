import { z } from 'zod';
import { ServiceRequestStatus, ServiceRequestType } from '../generated/prisma/index.js';

export const idParamsSchema = z.object({ id: z.string().uuid() });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(ServiceRequestStatus).optional(),
  type: z.nativeEnum(ServiceRequestType).optional(),
  customerId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'scheduledDate', 'status', 'requestNumber']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const createRequestSchema = z.object({
  assetId: z.string().uuid(),
  type: z.nativeEnum(ServiceRequestType),
  description: z.string().min(1).optional(),
  scheduledDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid(),
  technicianName: z.string().min(1).optional(),
  notes: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(ServiceRequestStatus),
});

export const addNoteSchema = z.object({
  content: z.string().min(1),
});

export const completeRequestSchema = z.object({
  summary: z.string().min(1),
  workPerformed: z.string().optional(),
  partsUsed: z.string().optional(),
  nextServiceDate: z.string().datetime().optional(),
  nextExpirationDate: z.string().datetime().optional(),
  serviceIntervalMonths: z.number().int().min(1).max(120).optional(),
});
