import { NotificationCategory, NotificationChannel } from '../generated/prisma/index.js';
import { fetchAssetsForMaintenanceWatch, type MaintenanceWatchAsset } from '../clients/maintenance.client.js';
import { NotificationService } from './notification.service.js';
import { prisma } from '../prisma/client.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const REMINDER_INTERVAL_HOURS = parseInt(process.env.MAINTENANCE_REMINDER_INTERVAL_HOURS || '24', 10);
const INSPECTION_OVERDUE_DAYS = parseInt(process.env.INSPECTION_OVERDUE_DAYS || '0', 10);
const MAINTENANCE_EVENT = 'MAINTENANCE_REMINDER';
const INSPECTION_EVENT = 'INSPECTION_OVERDUE';

function formatDisplayDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

async function wasRecentlySent(
  customerId: string,
  eventType: string,
  assetOrRequestId: string,
  hours: number
): Promise<boolean> {
  const cutoff = new Date(Date.now() - hours * MS_PER_HOUR);
  const recent = await prisma.notification.findMany({
    where: {
      customerId,
      eventType,
      createdAt: { gte: cutoff },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
  return recent.some((n) => {
    const payload = n.eventPayload as Record<string, unknown> | null;
    return payload?.assetId === assetOrRequestId || payload?.serviceRequestId === assetOrRequestId;
  });
}

export class ComplianceCronService {
  constructor(private notificationService: NotificationService) {}

  async runMaintenanceReminders() {
    const assets = await fetchAssetsForMaintenanceWatch();
    const dueAssets = assets.filter((a) => a.maintenanceDue || a.maintenanceOverdue);

    const results = { remindersSent: 0, skipped: 0, inspectionsFlagged: 0 };

    for (const asset of dueAssets) {
      if (await wasRecentlySent(asset.customerId, MAINTENANCE_EVENT, asset.id, REMINDER_INTERVAL_HOURS)) {
        results.skipped++;
        continue;
      }

      const formatted = formatDisplayDate(asset.nextServiceDate);
      const emailTemplate = asset.maintenanceOverdue ? 'maintenance-overdue-email' : 'maintenance-due-email';
      const inAppTemplate = asset.maintenanceOverdue ? 'maintenance-overdue-inapp' : 'maintenance-due-inapp';

      const payload = {
        assetId: asset.id,
        assetCode: asset.assetCode,
        customerId: asset.customerId,
        nextServiceDate: formatted,
        daysUntilService: String(asset.daysUntilService),
        daysOverdue: String(asset.daysOverdue),
      };

      try {
        await this.notificationService.sendTemplatePair(emailTemplate, inAppTemplate, payload, {
          customerId: asset.customerId,
          category: NotificationCategory.Service,
          eventType: MAINTENANCE_EVENT,
          eventPayload: payload,
        });
        results.remindersSent++;
      } catch (error) {
        console.warn(
          `[notification-service] Maintenance reminder failed for ${asset.assetCode}:`,
          (error as Error).message
        );
        await this.notificationService.create({
          channel: NotificationChannel.InApp,
          subject: asset.maintenanceOverdue
            ? `Maintenance overdue — ${asset.assetCode}`
            : `Maintenance due — ${asset.assetCode}`,
          body: asset.maintenanceOverdue
            ? `Extinguisher ${asset.assetCode} is ${asset.daysOverdue} day(s) past due service (${formatted}).`
            : `Extinguisher ${asset.assetCode} is due for service on ${formatted}.`,
          customerId: asset.customerId,
          category: NotificationCategory.Service,
          eventType: MAINTENANCE_EVENT,
          eventPayload: payload,
        });
        results.remindersSent++;
      }
    }

    results.inspectionsFlagged = await this.flagOverdueInspectionRequests();
    return results;
  }

  private async flagOverdueInspectionRequests(): Promise<number> {
    const serviceRequestUrl = process.env.SERVICE_REQUEST_SERVICE_URL || 'http://localhost:4006';
    try {
      const response = await fetch(
        `${serviceRequestUrl}/internal/inspections/overdue?days=${INSPECTION_OVERDUE_DAYS}`
      );
      if (!response.ok) return 0;
      const json = (await response.json()) as {
        data?: Array<{
          id: string;
          customerId: string;
          requestNumber: string;
          assetId: string;
          daysOverdue: number;
        }>;
      };
      let sent = 0;
      for (const item of json.data ?? []) {
        if (await wasRecentlySent(item.customerId, INSPECTION_EVENT, item.id, REMINDER_INTERVAL_HOURS)) {
          continue;
        }
        const payload = {
          serviceRequestId: item.id,
          requestNumber: item.requestNumber,
          assetId: item.assetId,
          customerId: item.customerId,
          daysOverdue: String(item.daysOverdue),
        };
        try {
          await this.notificationService.sendFromTemplate('inspection-overdue-inapp', payload, {
            customerId: item.customerId,
            category: NotificationCategory.Service,
            eventType: INSPECTION_EVENT,
            eventPayload: payload,
          });
          sent++;
        } catch {
          await this.notificationService.create({
            channel: NotificationChannel.InApp,
            subject: `Inspection overdue — ${item.requestNumber}`,
            body: `Service request ${item.requestNumber} is ${item.daysOverdue} day(s) past its scheduled date.`,
            customerId: item.customerId,
            category: NotificationCategory.Service,
            eventType: INSPECTION_EVENT,
            eventPayload: payload,
          });
          sent++;
        }
      }
      return sent;
    } catch (error) {
      console.warn('[ComplianceCron] Inspection overdue fetch failed:', (error as Error).message);
      return 0;
    }
  }
}
