import { UserRole } from '../constants/index.js';
import type { JwtPayload } from '../types/index.js';

/**
 * Portal users resolve their customer scope from the user record so the
 * frontend and backend can filter assets and requests consistently.
 */
export function getPortalCustomerId(user?: Pick<JwtPayload, 'role' | 'customerId' | 'userId'>): string | undefined {
  if (!user || user.role !== UserRole.USER) {
    return undefined;
  }
  return user.customerId ?? user.userId;
}
