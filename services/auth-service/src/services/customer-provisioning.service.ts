import { UserRole } from '@fems/shared';

export interface CustomerRegistrationPayload {
  userId: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  role: string;
}

/**
 * Portal users are scoped by their auth user id (stored as customerId on the user record).
 * No separate customer microservice is required.
 */
export async function provisionCustomerProfile(
  payload: CustomerRegistrationPayload
): Promise<string | null> {
  if (payload.role !== UserRole.USER) {
    return null;
  }
  return payload.userId;
}
