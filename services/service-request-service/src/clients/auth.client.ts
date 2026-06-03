const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

export interface UserContact {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export async function fetchUserContact(userId: string): Promise<UserContact | null> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/internal/users/${userId}/contact`);
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: UserContact };
    const data = json.data;
    if (!data) return null;
    return { ...data, userId: data.userId ?? data.id };
  } catch (error) {
    console.warn('[ServiceRequestService] User contact lookup failed:', (error as Error).message);
    return null;
  }
}
