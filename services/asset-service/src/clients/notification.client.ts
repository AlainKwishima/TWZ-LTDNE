const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007';

export async function notifyRefillBooked(assetId: string, customerId: string): Promise<void> {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/internal/expiry-trackers/${assetId}/book-refill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });
    if (!response.ok) {
      console.warn(
        `[asset-service] Refill tracker sync failed (${response.status}):`,
        await response.text()
      );
    }
  } catch (error) {
    console.warn('[asset-service] Refill tracker sync failed:', (error as Error).message);
  }
}

export async function triggerExpiryAlerts(): Promise<void> {
  try {
    await fetch(`${NOTIFICATION_SERVICE_URL}/internal/expiry-alerts`, { method: 'POST' });
  } catch (error) {
    console.warn('[asset-service] Expiry alert trigger failed:', (error as Error).message);
  }
}
