import {
  PrismaClient,
  ServiceRequestStatus,
  ServiceRequestType,
} from '../src/generated/prisma/index.js';
import { addMonths } from '@fems/shared';

const prisma = new PrismaClient();

/**
 * Stable customer fixture used by the seeded request history.
 * Swap it for a live customer id when seeding against a real environment.
 */
export const SEED_CUSTOMER_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Seeded requests need a real extinguisher asset id, so this placeholder keeps the fixture deterministic.
 */
export const SEED_ASSET_ID = '00000000-0000-4000-8000-000000000010';

export const SEED_REQUEST_PENDING_ID = '00000000-0000-4000-8000-000000000601';
export const SEED_REQUEST_ASSIGNED_ID = '00000000-0000-4000-8000-000000000602';
export const SEED_REQUEST_IN_PROGRESS_ID = '00000000-0000-4000-8000-000000000603';

async function main() {
  console.log('Seeding service request service...');

  const pending = await prisma.serviceRequest.upsert({
    where: { requestNumber: 'SR-20250530-0001' },
    update: {},
    create: {
      id: SEED_REQUEST_PENDING_ID,
      requestNumber: 'SR-20250530-0001',
      customerId: SEED_CUSTOMER_ID,
      assetId: SEED_ASSET_ID,
      requestedByUserId: 'seed-customer-user',
      type: ServiceRequestType.Refill,
      status: ServiceRequestStatus.Pending,
      description: 'Dry powder extinguisher needs refill - lobby unit',
      priority: 'normal',
      notes: {
        create: {
          content: 'Customer reported low pressure gauge reading.',
          createdBy: 'customer@twzltd.local',
          authorRole: 'User',
        },
      },
    },
    include: { notes: true },
  });

  const assigned = await prisma.serviceRequest.upsert({
    where: { requestNumber: 'SR-20250530-0002' },
    update: {},
    create: {
      id: SEED_REQUEST_ASSIGNED_ID,
      requestNumber: 'SR-20250530-0002',
      customerId: SEED_CUSTOMER_ID,
      assetId: SEED_ASSET_ID,
      requestedByUserId: 'seed-customer-user',
      type: ServiceRequestType.Inspection,
      status: ServiceRequestStatus.Assigned,
      description: 'Annual inspection for server room CO2 unit',
      scheduledDate: addMonths(new Date(), 1),
      priority: 'high',
      assignment: {
        create: {
          technicianId: 'seed-technician-user',
          technicianName: 'Field Technician',
          assignedBy: 'staff@twzltd.local',
          notes: 'Schedule during low-traffic hours',
        },
      },
    },
    include: { assignment: true },
  });

  const inProgress = await prisma.serviceRequest.upsert({
    where: { requestNumber: 'SR-20250530-0003' },
    update: {},
    create: {
      id: SEED_REQUEST_IN_PROGRESS_ID,
      requestNumber: 'SR-20250530-0003',
      customerId: SEED_CUSTOMER_ID,
      assetId: SEED_ASSET_ID,
      type: ServiceRequestType.TechnicianVisit,
      status: ServiceRequestStatus.InProgress,
      description: 'On-site visit for multiple lobby extinguishers',
      assignment: {
        create: {
          technicianId: 'seed-technician-user',
          technicianName: 'Field Technician',
          assignedBy: 'admin@twzltd.local',
        },
      },
      notes: {
        create: [
          {
            content: 'Technician en route - ETA 30 minutes.',
            createdBy: 'tech@twzltd.local',
            authorRole: 'Inspector',
          },
        ],
      },
    },
    include: { assignment: true, notes: true },
  });

  console.log('Service request seed complete:', {
    pending: pending.id,
    assigned: assigned.id,
    inProgress: inProgress.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
