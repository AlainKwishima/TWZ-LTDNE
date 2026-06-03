import { Router } from 'express';
import { verifyJwt, EventBus } from '@fems/shared';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { validate } from '../middleware/validate.middleware.js';
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

export function createAuthRoutes(eventBus: EventBus): Router {
  const router = Router();
  const authService = new AuthService(eventBus);
  const controller = new AuthController(authService);
  const jwtSecret = process.env.JWT_SECRET || '';

  router.post('/signup', validate(signupSchema), controller.signup);
  router.post('/login', validate(loginSchema), controller.login);
  router.post('/google', validate(googleAuthSchema), controller.googleAuth);
  router.post('/verify-otp', validate(verifyOtpSchema), controller.verifyOtp);
  router.post('/resend-otp', validate(resendOtpSchema), controller.resendOtp);
  router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword);
  router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);
  router.get('/me', verifyJwt(jwtSecret), controller.me);
  router.put('/profile', verifyJwt(jwtSecret), validate(updateProfileSchema), controller.updateProfile);
  router.put('/change-password', verifyJwt(jwtSecret), validate(changePasswordSchema), controller.changePassword);

  return router;
}
