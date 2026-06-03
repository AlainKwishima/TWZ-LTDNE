import { NotificationCategory } from '../generated/prisma/index.js';
import { NotificationService } from './notification.service.js';
import { prisma } from '../prisma/client.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const EXPIRY_START_DAYS = parseInt(process.env.EXPIRY_START_DAYS || '60', 10);
const REMINDER_INTERVAL_HOURS = parseInt(process.env.EXPIRY_REMINDER_INTERVAL_HOURS || '24', 10);

function daysUntil(expirationDate: Date, now: Date): number {
  return Math.ceil((expirationDate.getTime() - now.getTime()) / MS_PER_DAY);
}

function daysOverdue(expirationDate: Date, now: Date): number {
  return Math.ceil((now.getTime() - expirationDate.getTime()) / MS_PER_DAY);
}

function hoursSince(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / MS_PER_HOUR;
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function buildExpiryAlertCopy(expirationDate: Date, remaining: number, overdue: number, assetCode: string) {
  const formattedDate = formatDisplayDate(expirationDate);

  if (overdue >= 1) {
    return {
      expiryStatus: `${overdue} day(s) overdue`,
      expiryDetail: `expired on ${formattedDate} and is now ${overdue} day(s) overdue`,
      alertSubject: `Extinguisher ${assetCode} — ${overdue} day(s) overdue`,
      alertBody: `Extinguisher ${assetCode} expired on ${formattedDate} and is ${overdue} day(s) overdue. Open TWZ LTD, mark this alert as read, and book a refill to stop reminders.`,
    };
  }

  if (remaining <= 0) {
    return {
      expiryStatus: 'expires today',
      expiryDetail: `expires today (${formattedDate})`,
      alertSubject: `Extinguisher ${assetCode} — expires today`,
      alertBody: `Extinguisher ${assetCode} expires today (${formattedDate}). Open TWZ LTD, mark this alert as read, and book a refill to stop reminders.`,
    };
  }

  return {
    expiryStatus: `${remaining} day(s) remaining`,
    expiryDetail: `expires on ${formattedDate} (${remaining} day(s) remaining)`,
    alertSubject: `Extinguisher ${assetCode} — ${remaining} day(s) until expiry`,
    alertBody: `Extinguisher ${assetCode} expires on ${formattedDate} (${remaining} day(s) remaining). Open TWZ LTD, mark this alert as read, and book a refill to stop reminders.`,
  };
}

export class ExpiryCronService {
  constructor(private notificationService: NotificationService) {}

  async runDailyExpiryAlerts() {
    await this.notificationService.syncExpiryTrackersFromAssets();

    const now = new Date();
    const trackers = await prisma.expiryAlertTracker.findMany({
      where: { alertsResolvedAt: null },
    });

    const results = {
      remindersSent: 0,
      resolved: 0,
      policeReports: 0,
      skipped: 0,
    };

    for (const tracker of trackers) {
      const remaining = daysUntil(tracker.expirationDate, now);
      const overdue = daysOverdue(tracker.expirationDate, now);

      if (remaining > EXPIRY_START_DAYS) {
        results.skipped++;
        continue;
      }

      if (tracker.customerSeenAt && tracker.refillBookedAt) {
        await prisma.expiryAlertTracker.update({
          where: { id: tracker.id },
          data: { alertsResolvedAt: now },
        });
        results.resolved++;
        continue;
      }

      if (tracker.lastReminderSentAt && hoursSince(tracker.lastReminderSentAt, now) < REMINDER_INTERVAL_HOURS) {
        results.skipped++;
        continue;
      }

      const alertCopy = buildExpiryAlertCopy(
        tracker.expirationDate,
        remaining,
        overdue,
        tracker.assetCode
      );

      const payload = {
        assetId: tracker.assetId,
        assetCode: tracker.assetCode,
        customerId: tracker.customerId,
        userId: tracker.userId,
        expirationDate: tracker.expirationDate.toISOString().slice(0, 10),
        expirationDateFormatted: formatDisplayDate(tracker.expirationDate),
        daysRemaining: String(Math.max(remaining, 0)),
        daysOverdue: String(Math.max(overdue, 0)),
        expiryStatus: alertCopy.expiryStatus,
        expiryDetail: alertCopy.expiryDetail,
        alertSubject: alertCopy.alertSubject,
        alertBody: alertCopy.alertBody,
      };

      const overrides = {
        userId: tracker.userId || undefined,
        customerId: tracker.customerId,
        category: NotificationCategory.Expiry,
      };

      try {
        await this.notificationService.sendTemplatePair(
          'expiry-reminder-email',
          'expiry-reminder-inapp',
          payload,
          overrides
        );

        await prisma.expiryAlertTracker.update({
          where: { id: tracker.id },
          data: { lastReminderSentAt: now },
        });
        results.remindersSent++;

        if (overdue >= 1 && !tracker.policeReportSent) {
          await prisma.expiryAlertTracker.update({
            where: { id: tracker.id },
            data: { policeReportSent: true },
          });
          results.policeReports++;
        }
      } catch (error) {
        console.error(
          `[notification-service] Expiry reminder failed for ${tracker.assetCode}:`,
          (error as Error).message
        );
        results.skipped++;
      }
    }

    return results;
  }
}

