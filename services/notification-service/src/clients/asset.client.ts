const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL || 'http://localhost:4005';

export interface ExpiryWatchAsset {
  id: string;
  assetCode: string;
  serialNumber: string;
  customerId: string;
  type: string;
  size: string;
  expirationDate: string;
  status: string;
  refillBookedAt?: string | null;
}

export async function fetchAssetsForExpiryWatch(): Promise<ExpiryWatchAsset[]> {
  try {
    const response = await fetch(`${ASSET_SERVICE_URL}/internal/assets/expiry-watch`);
    if (!response.ok) return [];
    const json = (await response.json()) as { data?: ExpiryWatchAsset[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.warn('[NotificationService] Asset expiry watch fetch failed:', (error as Error).message);
    return [];
  }
}
