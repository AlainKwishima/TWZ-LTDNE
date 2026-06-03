import { AssetStatus, PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaClient as AuthPrisma } from '../../auth-service/src/generated/prisma/index.js';
const prisma = new PrismaClient();

const LEGACY_DEMO_CUSTOMER_ID = '00000000-0000-4000-8000-000000000001';

async function resolvePortalCustomerId(): Promise<string | null> {
  const fromEnv = process.env.DEMO_CUSTOMER_ID?.trim();
  if (fromEnv) return fromEnv;

  const email = (process.env.DEMO_PORTAL_EMAIL || 'user@fems.local').trim().toLowerCase();
  const authUrl = process.env.AUTH_DATABASE_URL?.trim();
  if (!authUrl) {
    console.log('Asset seed skipped: set DEMO_CUSTOMER_ID or AUTH_DATABASE_URL to link demo assets to a portal user.');
    return null;
  }

  const auth = new AuthPrisma({ datasources: { db: { url: authUrl } } });
  try {
    const user = await auth.user.findUnique({
      where: { email },
      select: { id: true, customerId: true },
    });
    if (!user) {
      console.log(`Asset seed skipped: no auth user found for ${email}. Run auth seed first.`);
      return null;
    }
    return user.customerId ?? user.id;
  } finally {
    await auth.$disconnect();
  }
}

async function main() {
  const customerId = await resolvePortalCustomerId();
  if (!customerId) {
    return;
  }

  const reassigned = await prisma.fireExtinguisherAsset.updateMany({
    where: {
      OR: [{ customerId: LEGACY_DEMO_CUSTOMER_ID }, { serialNumber: { startsWith: 'FE-' } }],
    },
    data: { customerId },
  });
  if (reassigned.count > 0) {
    console.log(`Reassigned ${reassigned.count} demo asset(s) to portal user ${customerId}`);
  }

  const installationDate = new Date('2025-05-28T12:00:00.000Z');
  const expirationDate = new Date('2030-05-28T12:00:00.000Z');
  const serialNumber = 'SN-20250528-10001';

  const asset = await prisma.fireExtinguisherAsset.upsert({
    where: { serialNumber },
    update: {
      customerId,
      location: 'Ground floor lobby',
      type: 'Dry Powder ABC',
      size: '6kg',
      installationDate,
      expirationDate,
      status: AssetStatus.Active,
    },
    create: {
      assetCode: serialNumber,
      serialNumber,
      customerId,
      location: 'Ground floor lobby',
      type: 'Dry Powder ABC',
      size: '6kg',
      installationDate,
      expirationDate,
      serviceDate: installationDate,
      status: AssetStatus.Active,
      notes: 'Demo asset from seed data',
      histories: {
        create: {
          eventType: 'SEED',
          description: 'Demo extinguisher registered via seed',
          newStatus: AssetStatus.Active,
        },
      },
    },
  });

  const serial2 = 'SN-20250601-10002';
  await prisma.fireExtinguisherAsset.upsert({
    where: { serialNumber: serial2 },
    update: {
      customerId,
      location: 'Server room',
      type: 'CO2',
      size: '5kg',
      installationDate: new Date('2025-06-01T12:00:00.000Z'),
      expirationDate: new Date('2026-07-01T12:00:00.000Z'),
      status: AssetStatus.ExpiringSoon,
    },
    create: {
      assetCode: serial2,
      serialNumber: serial2,
      customerId,
      location: 'Server room',
      type: 'CO2',
      size: '5kg',
      installationDate: new Date('2025-06-01T12:00:00.000Z'),
      expirationDate: new Date('2026-07-01T12:00:00.000Z'),
      serviceDate: new Date('2025-06-01T12:00:00.000Z'),
      status: AssetStatus.ExpiringSoon,
      notes: 'Demo CO2 unit',
    },
  });

  console.log('Asset service seed completed.');
  console.log(`  - ${asset.serialNumber} (${asset.type} ${asset.size}) for portal user ${customerId}`);
}

main()
  .catch((error) => {
    console.error('Asset seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
