import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  AuditAction,
  OtpPurpose,
  Prisma,
  RoleName,
  User,
} from '../generated/prisma/index.js';
import {
  EventBus,
  EventType,
  JwtPayload,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  UserRole,
  generateOtp,
  getPortalCustomerId,
} from '@fems/shared';
import { prisma } from '../prisma/client.js';
import { emailService } from './email.service.js';
import { verifyGoogleIdToken } from './google-auth.service.js';
import { AuthError } from './auth.errors.js';
import { formatFullName, splitDisplayName } from '../utils/user-name.js';

const BCRYPT_ROUNDS = 12;

const ROLE_PRIORITY: RoleName[] = [RoleName.Admin, RoleName.Inspector, RoleName.User];

export interface AuthContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface SignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: RoleName;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GoogleAuthInput {
  credential: string;
  role?: RoleName;
}

export interface VerifyOtpInput {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

export interface ResendOtpInput {
  email: string;
  purpose: OtpPurpose;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

export class AuthService {
  constructor(private eventBus: EventBus) {}

  async signup(input: SignupInput, ctx: AuthContext) {
    const email = input.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    if (existing) {
      if (!existing.isEmailVerified) {
        await this.createAndSendOtp(existing, OtpPurpose.signup, ctx);
        return {
          userId: existing.id,
          email: existing.email,
          role: this.resolvePrimaryRole(existing),
          message:
            'This email already has a pending account. A new verification code has been sent.',
          requiresOtp: true,
        };
      }
      throw new AuthError(
        'Email is already registered. Sign in or use forgot password if needed.',
        409
      );
    }

    const roleRecord = await prisma.role.findUnique({
      where: { name: input.role },
    });
    if (!roleRecord) {
      throw new AuthError(`${input.role} role is not configured. Run database seed.`, 500);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phoneNumber: input.phoneNumber?.trim(),
        isEmailVerified: false,
        roles: {
          create: { roleId: roleRecord.id },
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (input.role === RoleName.User) {
      await prisma.user.update({
        where: { id: user.id },
        data: { customerId: user.id },
      });
    }

    await this.createAndSendOtp(user, OtpPurpose.signup, ctx);

    await this.auditLog(user.id, AuditAction.SIGNUP, ctx, {
      email,
      role: this.resolvePrimaryRole(user),
    });

    return {
      userId: user.id,
      email: user.email,
      role: this.resolvePrimaryRole(user),
      message: 'Account created. Please verify your email with the OTP sent.',
      requiresOtp: true,
    };
  }

  async login(input: LoginInput, ctx: AuthContext) {
    const email = input.email.toLowerCase().trim();
    const user = await this.findUserWithRoles(email);

    if (!user) {
      await this.auditLog(null, AuditAction.LOGIN_FAILED, ctx, { email, reason: 'user_not_found' });
      throw new AuthError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AuthError('Account is deactivated', 403);
    }

    if (!user.passwordHash) {
      await this.auditLog(user.id, AuditAction.LOGIN_FAILED, ctx, { reason: 'google_only_account' });
      throw new AuthError('This account uses Google sign-in. Please continue with Google.', 401);
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      await this.auditLog(user.id, AuditAction.LOGIN_FAILED, ctx, { reason: 'invalid_password' });
      throw new AuthError('Invalid email or password', 401);
    }

    if (!user.isEmailVerified) {
      await this.createAndSendOtp(user, OtpPurpose.signup, ctx);
      return {
        requiresOtp: true,
        purpose: OtpPurpose.signup,
        email: user.email,
        message:
          'Your email is not verified yet. A new verification code has been sent — check your inbox and spam folder.',
      };
    }

    const loginRequiresOtp = process.env.LOGIN_REQUIRES_OTP === 'true';
    if (loginRequiresOtp) {
      await this.createAndSendOtp(user, OtpPurpose.login, ctx);
      return {
        requiresOtp: true,
        purpose: OtpPurpose.login,
        email: user.email,
        message: 'OTP sent. Complete login by verifying the code.',
      };
    }

    return this.completeLogin(user, ctx);
  }

  async googleAuth(input: GoogleAuthInput, ctx: AuthContext) {
    const googleProfile = await verifyGoogleIdToken(input.credential);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleProfile.googleId }, { email: googleProfile.email }],
      },
      include: { roles: { include: { role: true } } },
    });

    let user: UserWithRoles;

    if (existing) {
      if (!existing.isActive) {
        throw new AuthError('Account is deactivated', 403);
      }

      if (existing.googleId && existing.googleId !== googleProfile.googleId) {
        throw new AuthError('Google account does not match this user', 409);
      }

      if (!existing.googleId) {
        user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            googleId: googleProfile.googleId,
            isEmailVerified: true,
          },
          include: { roles: { include: { role: true } } },
        });
      } else {
        user = existing;
      }
    } else {
      const role = input.role ?? RoleName.User;
      const roleRecord = await prisma.role.findUnique({ where: { name: role } });
      if (!roleRecord) {
        throw new AuthError(`${role} role is not configured. Run database seed.`, 500);
      }

      const { firstName, lastName } = splitDisplayName(googleProfile.fullName);
      user = await prisma.user.create({
        data: {
          email: googleProfile.email,
          googleId: googleProfile.googleId,
          firstName,
          lastName,
          isEmailVerified: true,
          roles: {
            create: { roleId: roleRecord.id },
          },
        },
        include: { roles: { include: { role: true } } },
      });

      await this.auditLog(user.id, AuditAction.SIGNUP, ctx, {
        email: googleProfile.email,
        role: this.resolvePrimaryRole(user),
        provider: 'google',
      });
    }

    return this.completeLogin(user, ctx);
  }

  async verifyOtp(input: VerifyOtpInput, ctx: AuthContext) {
    const email = input.email.toLowerCase().trim();
    const user = await this.findUserWithRoles(email);

    if (!user) {
      throw new AuthError('Invalid verification request', 400);
    }

    const otpRecord = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        purpose: input.purpose,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new AuthError('OTP expired or not found. Request a new code.', 400);
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      throw new AuthError('Maximum OTP attempts exceeded. Request a new code.', 429);
    }

    const codeHash = this.hashOtp(input.code);
    const expected = Buffer.from(otpRecord.codeHash, 'utf8');
    const actual = Buffer.from(codeHash, 'utf8');
    if (expected.length !== actual.length) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AuthError('Invalid OTP code', 400);
    }
    const isValid = crypto.timingSafeEqual(expected, actual);

    if (!isValid) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      await this.auditLog(user.id, AuditAction.OTP_FAILED, ctx, {
        purpose: input.purpose,
      });
      throw new AuthError('Invalid OTP code', 400);
    }

    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    await this.auditLog(user.id, AuditAction.OTP_VERIFIED, ctx, {
      purpose: input.purpose,
    });

    if (input.purpose === OtpPurpose.signup && !user.isEmailVerified) {
      let updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
        include: { roles: { include: { role: true } } },
      });

      updatedUser = await this.ensureCustomerProfile(updatedUser);

      await this.eventBus.publish(EventType.USER_REGISTERED, {
        userId: updatedUser.id,
        email: updatedUser.email,
        fullName: formatFullName(updatedUser.firstName, updatedUser.lastName),
        phoneNumber: updatedUser.phoneNumber,
        role: this.resolvePrimaryRole(updatedUser),
        customerId: updatedUser.customerId,
      });

      await this.eventBus.publish(EventType.OTP_VERIFIED, {
        userId: updatedUser.id,
        email: updatedUser.email,
        purpose: input.purpose,
      });

      return {
        message: 'Email verified successfully. You can now sign in.',
        verified: true,
        email: updatedUser.email,
      };
    }

    await this.eventBus.publish(EventType.OTP_VERIFIED, {
      userId: user.id,
      email: user.email,
      purpose: input.purpose,
    });

    if (input.purpose === OtpPurpose.login) {
      return this.completeLogin(user, ctx);
    }

    if (input.purpose === OtpPurpose.password_reset) {
      return {
        message: 'OTP verified. You may now reset your password using the reset token.',
        verified: true,
      };
    }

    return {
      message: 'OTP verified successfully',
      verified: true,
    };
  }

  async resendOtp(input: ResendOtpInput, ctx: AuthContext) {
    const email = input.email.toLowerCase().trim();
    const user = await this.findUserWithRoles(email);

    if (!user) {
      return { message: 'If the account exists, a new OTP has been sent.' };
    }

    if (input.purpose === OtpPurpose.signup && user.isEmailVerified) {
      throw new AuthError('This email is already verified. Please sign in.', 400);
    }

    await this.createAndSendOtp(user, input.purpose, ctx);

    return { message: 'If the account exists, a new OTP has been sent.' };
  }

  async forgotPassword(input: ForgotPasswordInput, ctx: AuthContext) {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'If the account exists, password reset instructions have been sent.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      const resetLink = `${process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:5173'}/reset-password?token=${encodeURIComponent(rawToken)}`;
      console.log(`[AuthService] Password reset link for ${email}: ${resetLink}`);
    }

    try {
      await emailService.sendPasswordResetEmail(user.email, rawToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send password reset email';
      throw new AuthError(message, 503);
    }

    await this.auditLog(user.id, AuditAction.PASSWORD_RESET_REQUESTED, ctx);

    return { message: 'If the account exists, password reset instructions have been sent.' };
  }

  async resetPassword(input: ResetPasswordInput, ctx: AuthContext) {
    const tokenHash = this.hashToken(input.token);

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });

    if (!resetRecord) {
      throw new AuthError('Invalid or expired reset token', 400);
    }

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.auditLog(resetRecord.userId, AuditAction.PASSWORD_RESET_COMPLETED, ctx);

    return { message: 'Password reset successfully' };
  }

  async getMe(userId: string, tokenPayload?: JwtPayload) {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new AuthError('User not found', 404);
    }

    user = await this.ensureCustomerProfile(user);
    const sanitized = this.sanitizeUser(user);

    if (user.customerId && tokenPayload && !tokenPayload.customerId) {
      return {
        user: sanitized,
        token: this.signToken({
          userId: user.id,
          email: user.email,
          role: this.resolvePrimaryRole(user),
          customerId: user.customerId,
        }),
      };
    }

    return { user: sanitized };
  }

  async changePassword(userId: string, input: ChangePasswordInput, ctx: AuthContext) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new AuthError('Account not found or password login not available', 404);
    }

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AuthError('Current password is incorrect', 400);
    }

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.auditLog(userId, AuditAction.PROFILE_UPDATED, ctx, { passwordChanged: true });

    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: string, input: UpdateProfileInput, ctx: AuthContext) {
    const data: Prisma.UserUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName.trim();
    if (input.lastName !== undefined) data.lastName = input.lastName.trim();
    if (input.phoneNumber !== undefined) data.phoneNumber = input.phoneNumber.trim() || null;

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: { roles: { include: { role: true } } },
    });

    await this.auditLog(userId, AuditAction.PROFILE_UPDATED, ctx, {
      fields: Object.keys(input),
    });

    return this.sanitizeUser(user);
  }

  verifyAccessToken(token: string): JwtPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AuthError('JWT is not configured', 500);
    }
    return jwt.verify(token, secret) as JwtPayload;
  }

  private async completeLogin(user: UserWithRoles, ctx: AuthContext) {
    const linkedUser = await this.ensureCustomerProfile(user);
    const role = this.resolvePrimaryRole(linkedUser);
    const token = this.signToken({
      userId: linkedUser.id,
      email: linkedUser.email,
      role,
      customerId: getPortalCustomerId({
        role,
        customerId: linkedUser.customerId ?? undefined,
        userId: linkedUser.id,
      }),
    });

    await prisma.user.update({
      where: { id: linkedUser.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditLog(linkedUser.id, AuditAction.LOGIN, ctx);

    return {
      token,
      user: this.sanitizeUser(linkedUser),
    };
  }

  private async ensureCustomerProfile(user: UserWithRoles): Promise<UserWithRoles> {
    const role = this.resolvePrimaryRole(user);
    if (role !== UserRole.USER || user.customerId) {
      return user;
    }

    return prisma.user.update({
      where: { id: user.id },
      data: { customerId: user.id },
      include: { roles: { include: { role: true } } },
    });
  }

  private signToken(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AuthError('JWT is not configured', 500);
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  private async createAndSendOtp(
    user: User,
    purpose: OtpPurpose,
    ctx: AuthContext
  ): Promise<void> {
    const code = generateOtp(6);
    const codeHash = this.hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otp.create({
      data: {
        userId: user.id,
        destination: user.email,
        codeHash,
        purpose,
        expiresAt,
      },
    });

    try {
      await emailService.sendOtpEmail(user.email, code, purpose);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send verification email';
      if (process.env.NODE_ENV === 'development') {
        console.error(`[AuthService] OTP email failed for ${user.email}: ${message}`);
        console.log(
          `[AuthService] DEV OTP for ${user.email} (purpose: ${purpose}): ${code} — use this code on /verify-otp`
        );
      } else {
        throw new AuthError(message, 503);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[AuthService] OTP sent to ${user.email} (purpose: ${purpose})`);
    }

    await this.auditLog(user.id, AuditAction.OTP_SENT, ctx, { purpose });
  }

  private hashOtp(code: string): string {
    const secret = process.env.OTP_SECRET;
    if (!secret) {
      throw new AuthError('OTP secret is not configured', 500);
    }
    return crypto.createHmac('sha256', secret).update(code).digest('hex');
  }

  private hashToken(token: string): string {
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new AuthError('Token hashing secret is not configured', 500);
    }
    return crypto.createHmac('sha256', secret).update(token).digest('hex');
  }

  private resolvePrimaryRole(user: UserWithRoles): UserRole {
    const roleNames = user.roles.map((ur) => ur.role.name);
    for (const priority of ROLE_PRIORITY) {
      if (roleNames.includes(priority)) {
        return priority as UserRole;
      }
    }
    return UserRole.USER;
  }

  private async findUserWithRoles(email: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
  }

  private sanitizeUser(user: UserWithRoles) {
    const role = this.resolvePrimaryRole(user);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: formatFullName(user.firstName, user.lastName),
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      customerId: user.customerId,
      role,
      roles: user.roles.map((ur) => ur.role.name),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async auditLog(
    userId: string | null,
    action: AuditAction,
    ctx: AuthContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await prisma.authAuditLog.create({
      data: {
        userId,
        action,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}

