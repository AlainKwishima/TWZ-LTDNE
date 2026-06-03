import { AssetEventPayload, EventType } from '@fems/shared';

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007';

async function postJson(url: string, body: unknown): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.warn(`[AssetService] ${url} returned ${response.status}: ${text}`);
    }
  } catch (error) {
    console.warn(`[AssetService] Failed to call ${url}:`, (error as Error).message);
  }
}

export async function notifyAssetEventHttp(
  eventType: EventType,
  payload: AssetEventPayload & { userId?: string }
): Promise<void> {
  await postJson(`${NOTIFICATION_SERVICE_URL}/internal/asset-event`, {
    eventType,
    payload,
  });
}
