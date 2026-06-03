const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

export interface CustomerContact {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  userId: string | null;
}

/**
 * Notification delivery resolves contact details from auth-service because the
 * portal keeps the same person in both auth and customer-facing records.
 */
export async function fetchCustomerContact(customerId: string): Promise<CustomerContact | null> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/internal/users/${customerId}/contact`);
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: CustomerContact };
    return json.data ?? null;
  } catch (error) {
    console.warn('[NotificationService] User contact lookup failed:', (error as Error).message);
    return null;
  }
}
