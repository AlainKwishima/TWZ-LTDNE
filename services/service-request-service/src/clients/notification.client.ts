import { EventType } from '@fems/shared';

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007';

export async function notifyServiceRequestEventHttp(
  eventType: EventType,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/internal/service-request-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, payload }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.warn(
        `[ServiceRequestService] Notification ${eventType} returned ${response.status}: ${text}`
      );
    }
  } catch (error) {
    console.warn(`[ServiceRequestService] Notification ${eventType} failed:`, (error as Error).message);
  }
}
