import { ServiceRequestStatus, ServiceRequestType } from '../generated/prisma/index.js';
import { prisma } from '../prisma/client.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function listOverdueInspections(graceDays = 0) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - graceDays * MS_PER_DAY);

  const requests = await prisma.serviceRequest.findMany({
    where: {
      type: ServiceRequestType.Inspection,
      status: {
        in: [
          ServiceRequestStatus.Pending,
          ServiceRequestStatus.Assigned,
          ServiceRequestStatus.InProgress,
        ],
      },
      scheduledDate: { lt: cutoff },
    },
    orderBy: { scheduledDate: 'asc' },
    take: 200,
  });

  return requests.map((r) => {
    const scheduled = r.scheduledDate!;
    const daysOverdue = Math.ceil((now.getTime() - scheduled.getTime()) / MS_PER_DAY);
    return {
      id: r.id,
      requestNumber: r.requestNumber,
      customerId: r.customerId,
      assetId: r.assetId,
      scheduledDate: scheduled.toISOString(),
      daysOverdue,
    };
  });
}
