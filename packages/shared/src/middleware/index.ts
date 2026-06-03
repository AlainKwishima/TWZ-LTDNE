import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../constants/index.js';
import { JwtPayload } from '../types/index.js';
import { errorResponse, getPortalCustomerId } from '../utils/index.js';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Validates a bearer token and attaches the decoded portal identity to the request.
 */
export function verifyJwt(secret: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      req.user = decoded;
      next();
    } catch {
      return errorResponse(res, 'Invalid or expired token', 401);
    }
  };
}

/**
 * Rejects requests unless the authenticated user holds one of the allowed roles.
 */
export function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }
    next();
  };
}

/**
 * Lets public routes accept a token when present, but keeps the request usable when absent.
 */
export function optionalAuth(secret: string) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        req.user = jwt.verify(token, secret) as JwtPayload;
      } catch {
        // ignore invalid token for optional auth
      }
    }
    next();
  };
}

/**
 * Forwards the authenticated portal identity to downstream services without re-parsing JWTs.
 */
export function forwardUserHeaders(req: AuthRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }
  if (req.user) {
    headers['X-User-Id'] = req.user.userId;
    headers['X-User-Role'] = req.user.role;
    headers['X-User-Email'] = req.user.email;
    const customerId = getPortalCustomerId(req.user);
    if (customerId) {
      headers['X-Customer-Id'] = customerId;
    }
  }
  return headers;
}

/**
 * Rehydrates trusted identity headers on internal service-to-service requests.
 */
export function getUserFromHeaders(req: Request): Partial<JwtPayload> {
  return {
    userId: req.headers['x-user-id'] as string,
    role: req.headers['x-user-role'] as UserRole,
    email: req.headers['x-user-email'] as string,
    customerId: req.headers['x-customer-id'] as string,
  };
}
