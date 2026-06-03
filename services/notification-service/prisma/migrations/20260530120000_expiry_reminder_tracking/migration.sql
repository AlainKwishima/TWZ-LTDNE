ALTER TABLE "expiry_alert_trackers" ADD COLUMN IF NOT EXISTS "customerSeenAt" TIMESTAMP(3);
ALTER TABLE "expiry_alert_trackers" ADD COLUMN IF NOT EXISTS "refillBookedAt" TIMESTAMP(3);
ALTER TABLE "expiry_alert_trackers" ADD COLUMN IF NOT EXISTS "alertsResolvedAt" TIMESTAMP(3);
ALTER TABLE "expiry_alert_trackers" ADD COLUMN IF NOT EXISTS "lastReminderSentAt" TIMESTAMP(3);
ALTER TABLE "expiry_alert_trackers" ADD COLUMN IF NOT EXISTS "policeReportSent" BOOLEAN NOT NULL DEFAULT false;
