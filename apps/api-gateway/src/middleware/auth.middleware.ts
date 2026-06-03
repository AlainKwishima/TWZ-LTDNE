import { NextFunction, RequestHandler, Response } from 'express';
import {
  type AuthRequest,
  UserRole,
  errorResponse,
  forwardUserHeaders,
  optionalAuth,
  requireRoles,
  verifyJwt,
} from '@fems/shared';
import { gatewayConfig } from '../config/services.js';

export type { AuthRequest };
export { forwardUserHeaders, optionalAuth, requireRoles, verifyJwt };

export interface RoleRule {
  methods: string[];
  pattern: RegExp;
  roles: UserRole[];
}

export interface RouteGuardConfig {
  publicPaths?: string[];
  optionalAuthPrefixes?: string[];
  roleRules?: RoleRule[];
}

function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function findRoleRule(method: string, path: string, rules: RoleRule[]): RoleRule | undefined {
  return rules.find((rule) => rule.methods.includes(method) && rule.pattern.test(path));
}

function enforceRoles(req: AuthRequest, res: Response, next: NextFunction, roles: UserRole[]): void {
  requireRoles(...roles)(req, res, next);
}

export function createRouteGuard(config: RouteGuardConfig): RequestHandler {
  const { publicPaths = [], optionalAuthPrefixes = [], roleRules = [] } = config;

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const path = req.originalUrl.split('?')[0];

    if (publicPaths.includes(path)) {
      return next();
    }

    const roleRule = findRoleRule(req.method, path, roleRules);

    const continueWithRoles = () => {
      if (roleRule) {
        return enforceRoles(req, res, next, roleRule.roles);
      }
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }
      return next();
    };

    if (matchesPrefix(path, optionalAuthPrefixes)) {
      return optionalAuth(gatewayConfig.jwtSecret)(req, res, () => {
        if (roleRule && req.user) {
          return enforceRoles(req, res, next, roleRule.roles);
        }
        return next();
      });
    }

    return verifyJwt(gatewayConfig.jwtSecret)(req, res, continueWithRoles);
  };
}

/** Admin-only management (customers, products, escalations, user accounts). */
export const adminOnly = [UserRole.ADMIN];
/** Portal users who shop and own assets. */
export const portalUserRoles = [UserRole.USER, UserRole.ADMIN];
/** Field inspectors and admins. */
export const inspectorRoles = [UserRole.INSPECTOR, UserRole.ADMIN];
export const allAuthenticatedRoles = [UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER];
