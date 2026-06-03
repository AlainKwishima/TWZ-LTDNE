import type { User } from './types';

/** Portal users are scoped by customerId on the account, or by user id when unset. */
export function getPortalCustomerId(user: Pick<User, 'role' | 'customerId' | 'id'> | null | undefined): string | undefined {
  if (!user || user.role !== 'User') {
    return undefined;
  }
  return user.customerId ?? user.id;
}
