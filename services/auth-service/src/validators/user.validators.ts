import { z } from 'zod';
import { UserRole } from '@fems/shared';

const adminRoleValues = [UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER] as [string, ...string[]];

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    role: z.enum(adminRoleValues).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: passwordField,
    firstName: z.string().min(1).max(60),
    lastName: z.string().min(1).max(60),
    phoneNumber: z.string().min(7).max(20).optional(),
    role: z.enum(adminRoleValues),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1).max(60).optional(),
      lastName: z.string().min(1).max(60).optional(),
      phoneNumber: z.string().min(7).max(20).nullable().optional(),
      role: z.enum(adminRoleValues).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
  params: z.object({ id: z.string().uuid() }),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
