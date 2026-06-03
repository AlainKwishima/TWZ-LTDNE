import { z } from 'zod';
import { OTP_PURPOSES, UserRole } from '@fems/shared';

const otpPurposeValues = Object.values(OTP_PURPOSES) as [string, ...string[]];
const signupRoleValues = [UserRole.USER, UserRole.INSPECTOR, UserRole.ADMIN] as [string, ...string[]];

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
    firstName: z.string().min(1, 'First name is required').max(60),
    lastName: z.string().min(1, 'Last name is required').max(60),
    phoneNumber: z.string().min(7).max(20).optional(),
    role: z.enum(signupRoleValues).default(UserRole.USER),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    credential: z.string().min(1, 'Google credential is required'),
    role: z.enum(signupRoleValues).optional(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    code: z.string().length(6, 'OTP must be 6 digits'),
    purpose: z.enum(otpPurposeValues),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    purpose: z.enum(otpPurposeValues),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(32, 'Valid reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1).max(60).optional(),
      lastName: z.string().min(1).max(60).optional(),
      phoneNumber: z.string().min(7).max(20).optional(),
    })
    .refine(
      (data) =>
        data.firstName !== undefined ||
        data.lastName !== undefined ||
        data.phoneNumber !== undefined,
      { message: 'At least one field must be provided' }
    ),
});

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordField,
  }),
});
