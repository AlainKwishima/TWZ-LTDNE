import { z } from 'zod';

const assetStatusEnum = z.enum([
  'Active',
  'ExpiringSoon',
  'Expired',
  'Serviced',
  'NeedsReplacement',
  'HighRisk',
]);

const dateField = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
]);

export const registerAssetSchema = z.object({
  /** Portal user id who owns this extinguisher */
  ownerUserId: z.string().uuid(),
  /** Physical placement or site label */
  location: z.string().min(1).max(200),
  type: z.string().min(1).max(120),
  size: z.string().min(1).max(80),
  installationDate: dateField,
  expiryDate: dateField,
  status: assetStatusEnum.optional(),
  notes: z.string().max(2000).optional(),
});

export const updateAssetSchema = z.object({
  ownerUserId: z.string().uuid().optional(),
  location: z.string().min(1).max(200).optional(),
  type: z.string().min(1).max(120).optional(),
  size: z.string().min(1).max(80).optional(),
  installationDate: dateField.optional(),
  expiryDate: dateField.optional(),
  status: assetStatusEnum.optional(),
  notes: z.string().max(2000).optional(),
  serviceDate: z.string().datetime().optional(),
  nextServiceDate: z.string().datetime().optional(),
});

export const serviceRecordSchema = z.object({
  serviceType: z.string().min(1),
  serviceDate: z.string().datetime().optional(),
  technicianId: z.string().optional(),
  technicianName: z.string().optional(),
  notes: z.string().optional(),
  nextServiceDate: z.string().datetime().optional(),
  updateExpirationDate: z.string().datetime().optional(),
});

export const assetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  ownerUserId: z.string().uuid().optional(),
  type: z.string().optional(),
  size: z.string().optional(),
  status: assetStatusEnum.optional(),
  serialNumber: z.string().optional(),
  sortBy: z.enum(['createdAt', 'expirationDate', 'installationDate', 'serialNumber', 'assetCode']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
