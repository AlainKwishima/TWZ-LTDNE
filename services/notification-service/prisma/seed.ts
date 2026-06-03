import { PrismaClient, NotificationChannel } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export const SEED_CUSTOMER_ID = '00000000-0000-4000-8000-000000000001';
export const SEED_USER_ID = '00000000-0000-4000-8000-000000000101';

const templates = [
  {
    code: 'asset-created-inapp',
    name: 'Asset Created In-App',
    channel: NotificationChannel.InApp,
    subject: 'New asset registered',
    body: 'Fire extinguisher {{assetCode}} has been registered to your account.',
    eventType: 'AssetCreated',
  },
  {
    code: 'asset-expiring-sms',
    name: 'Asset Expiring Soon SMS',
    channel: NotificationChannel.SMS,
    body: 'TWZ LTD Alert: Asset {{assetCode}} expires on {{expirationDate}}. Schedule service soon.',
    eventType: 'AssetExpiringSoon',
  },
  {
    code: 'asset-expired-inapp',
    name: 'Asset Expired In-App',
    channel: NotificationChannel.InApp,
    subject: 'Asset expired',
    body: 'Asset {{assetCode}} has expired. Immediate action required.',
    eventType: 'AssetExpired',
  },
  {
    code: 'service-completed-email',
    name: 'Service Completed Email',
    channel: NotificationChannel.Email,
    subject: 'Service completed for {{assetCode}}',
    body: 'Service ({{serviceType}}) completed for asset {{assetCode}}.',
    eventType: 'ServiceCompleted',
  },
  {
    code: 'expiry-30-days',
    name: 'Expiry 30-Day Reminder',
    channel: NotificationChannel.Email,
    subject: 'Asset {{assetCode}} expires in 30 days',
    body: 'Reminder: Asset {{assetCode}} will expire on {{expirationDate}} (30 days remaining).',
    eventType: 'ExpiryAlert30',
  },
  {
    code: 'expiry-7-days',
    name: 'Expiry 7-Day Reminder',
    channel: NotificationChannel.SMS,
    body: 'TWZ LTD: Asset {{assetCode}} expires in 7 days ({{expirationDate}}).',
    eventType: 'ExpiryAlert7',
  },
  {
    code: 'expiry-on-date',
    name: 'Expiry On Date Alert',
    channel: NotificationChannel.InApp,
    subject: 'Asset expires today',
    body: 'Asset {{assetCode}} expires today. Please arrange replacement or service.',
    eventType: 'ExpiryAlertOnDate',
  },
  {
    code: 'expiry-overdue',
    name: 'Expiry Overdue Alert',
    channel: NotificationChannel.Email,
    subject: 'OVERDUE: Asset {{assetCode}}',
    body: 'Asset {{assetCode}} expired on {{expirationDate}} and is now overdue. Compliance action may be required.',
    eventType: 'ExpiryAlertOverdue',
  },
];

async function main() {
  console.log('Seeding notification service...');

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { code: template.code },
      update: template,
      create: template,
    });
  }

  const inAppTemplate = await prisma.notificationTemplate.findUnique({
    where: { code: 'asset-created-inapp' },
  });

  if (inAppTemplate) {
    const existing = await prisma.notification.findFirst({
      where: { userId: SEED_USER_ID, subject: 'Welcome to TWZ LTD notifications' },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: SEED_USER_ID,
          customerId: SEED_CUSTOMER_ID,
          channel: NotificationChannel.InApp,
          category: 'System',
          subject: 'Welcome to TWZ LTD notifications',
          body: 'You will receive alerts about your fire extinguisher assets here.',
          status: 'Sent',
          sentAt: new Date(),
          templateId: inAppTemplate.id,
          logs: {
            create: {
              action: 'SENT',
              channel: NotificationChannel.InApp,
              detail: 'Seed welcome notification',
            },
          },
        },
      });
    }
  }

  const futureExpiry = new Date();
  futureExpiry.setDate(futureExpiry.getDate() + 25);

  await prisma.expiryAlertTracker.upsert({
    where: { assetId: '00000000-0000-4000-8000-000000000501' },
    update: {},
    create: {
      assetId: '00000000-0000-4000-8000-000000000501',
      assetCode: 'FE-10001',
      customerId: SEED_CUSTOMER_ID,
      userId: SEED_USER_ID,
      expirationDate: futureExpiry,
    },
  });

  console.log(`Seeded ${templates.length} templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
