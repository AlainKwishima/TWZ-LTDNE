import { AssetStatus } from '../generated/prisma/index.js';
import { prisma } from '../prisma/client.js';

export async function listAssetsForExpiryWatch() {
  return prisma.fireExtinguisherAsset.findMany({
    where: {
      status: {
        notIn: [AssetStatus.HighRisk],
      },
    },
    select: {
      id: true,
      assetCode: true,
      serialNumber: true,
      customerId: true,
      type: true,
      size: true,
      expirationDate: true,
      status: true,
      refillBookedAt: true,
    },
    orderBy: { expirationDate: 'asc' },
  });
}
