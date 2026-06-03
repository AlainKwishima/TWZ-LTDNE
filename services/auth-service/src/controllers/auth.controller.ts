import { Response } from 'express';
import { z } from 'zod';
import { OtpPurpose, RoleName } from '../generated/prisma/index.js';
import { AuthRequest, errorResponse, successResponse } from '@fems/shared';
import { AuthService, AuthContext } from '../services/auth.service.js';
import { AuthError } from '../services/auth.errors.js';
import { ValidatedRequest } from '../middleware/validate.middleware.js';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  googleAuthSchema,
} from '../validators/auth.validators.js';

type SignupPayload = z.infer<typeof signupSchema>;
type LoginPayload = z.infer<typeof loginSchema>;
type VerifyOtpPayload = z.infer<typeof verifyOtpSchema>;
type ResendOtpPayload = z.infer<typeof resendOtpSchema>;
type ForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordPayload = z.infer<typeof resetPasswordSchema>;
type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
type ChangePasswordPayload = z.infer<typeof changePasswordSchema>;
type GoogleAuthPayload = z.infer<typeof googleAuthSchema>;

function getAuthContext(req: AuthRequest): AuthContext {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

export class AuthController {
  constructor(private authService: AuthService) {}

  signup = async (req: ValidatedRequest<SignupPayload>, res: Response) => {
    try {
      const { body } = req.validated!;
      const result = await this.authService.signup(
        { ...body, role: body.role as RoleName },
        getAuthContext(req)
      );
      return successResponse(res, result.message, result, 201);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  login = async (req: ValidatedRequest<LoginPayload>, res: Response) => {
    try {
      const { body } = req.validated!;
      const result = await this.authService.login(body, getAuthContext(req));
      if ('token' in result) {
        return successResponse(res, 'Login successful', result);
      }
      return successResponse(res, result.message, result);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  googleAuth = async (req: ValidatedRequest<GoogleAuthPayload>, res: Response) => {
    try {
      const { body } = req.validated!;
      const result = await this.authService.googleAuth(
        {
          credential: body.credential,
          role: body.role as RoleName | undefined,
        },
        getAuthContext(req)
      );
      return successResponse(res, 'Google sign-in successful', result);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  verifyOtp = async (req: ValidatedRequest<VerifyOtpPayload>, res: Response) => {
    try {
      const { body } = req.validated!;
      const result = await this.authService.verifyOtp(
        { ...body, purpose: body.purpose as OtpPurpose },
        getAuthContext(req)
      );
      if ('token' in result) {
        return successResponse(res, 'Verification successful', result);
      }
      return successResponse(res, result.message, result);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  resendOtp = async (req: ValidatedRequest<ResendOtpPayload>, res: Response) => {
    try {
      const { body } = req.validated!;
      const result = await this.authService.resendOtp(
        { ...body, purpose: body.purpose as OtpPurpose },
        getAuthContext(req)
      );
      return successResponse(res, result.message);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  forgotPassword = async (
    req: ValidatedRequest<ForgotPasswordPayload>,
    res: Response
  ) => {
    try {
      const { body } = req.validated!;
      const result = await this.authService.forgotPassword(body, getAuthContext(req));
      return successResponse(res, result.message);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  resetPassword = async (
    req: ValidatedRequest<ResetPasswordPayload>,
    res: Response
  ) => {
    try {
      const { body } = req.validated!;
      const result = await this.authService.resetPassword(body, getAuthContext(req));
      return successResponse(res, result.message);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  me = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return errorResponse(res, 'Authentication required', 401);
      }
      const result = await this.authService.getMe(req.user.userId, req.user);
      return successResponse(res, 'Profile retrieved', result);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  changePassword = async (
    req: AuthRequest & ValidatedRequest<ChangePasswordPayload>,
    res: Response
  ) => {
    try {
      if (!req.user?.userId) {
        return errorResponse(res, 'Authentication required', 401);
      }
      const { body } = req.validated!;
      const result = await this.authService.changePassword(
        req.user.userId,
        body,
        getAuthContext(req)
      );
      return successResponse(res, result.message);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  updateProfile = async (
    req: AuthRequest & ValidatedRequest<UpdateProfilePayload>,
    res: Response
  ) => {
    try {
      if (!req.user?.userId) {
        return errorResponse(res, 'Authentication required', 401);
      }
      const { body } = req.validated!;
      const user = await this.authService.updateProfile(
        req.user.userId,
        body,
        getAuthContext(req)
      );
      return successResponse(res, 'Profile updated', { user });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown) {
    if (error instanceof AuthError) {
      return errorResponse(res, error.message, error.statusCode);
    }
    console.error('[AuthController]', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
