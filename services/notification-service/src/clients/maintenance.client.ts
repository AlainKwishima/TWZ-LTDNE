const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL || 'http://localhost:4005';

export interface MaintenanceWatchAsset {
  id: string;
  assetCode: string;
  serialNumber: string;
  customerId: string;
  type: string;
  size: string;
  location?: string | null;
  nextServiceDate: string;
  expirationDate: string;
  status: string;
  daysUntilService: number;
  daysOverdue: number;
  maintenanceDue: boolean;
  maintenanceOverdue: boolean;
}

export async function fetchAssetsForMaintenanceWatch(): Promise<MaintenanceWatchAsset[]> {
  try {
    const response = await fetch(`${ASSET_SERVICE_URL}/internal/assets/maintenance-watch`);
    if (!response.ok) return [];
    const json = (await response.json()) as { data?: MaintenanceWatchAsset[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.warn('[NotificationService] Maintenance watch fetch failed:', (error as Error).message);
    return [];
  }
}
