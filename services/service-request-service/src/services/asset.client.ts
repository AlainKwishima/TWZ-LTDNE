const ASSET_SERVICE_URL = process.env.ASSET_SERVICE_URL || 'http://localhost:4005';

export interface AssetServiceRecordInput {
  serviceType: string;
  serviceDate?: string;
  technicianId?: string;
  technicianName?: string;
  notes?: string;
  nextServiceDate?: string;
  updateExpirationDate?: string;
}

export async function recordAssetService(
  assetId: string,
  input: AssetServiceRecordInput,
  headers: Record<string, string> = {}
): Promise<void> {
  const response = await fetch(`${ASSET_SERVICE_URL}/assets/${assetId}/service-records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Asset service error (${response.status}): ${body}`);
  }
}
