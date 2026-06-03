import { AssetStatus } from '../generated/prisma/index.js';
import { prisma } from '../prisma/client.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function listAssetsForMaintenanceWatch() {
  const now = new Date();
  const assets = await prisma.fireExtinguisherAsset.findMany({
    where: {
      status: { notIn: [AssetStatus.HighRisk] },
      nextServiceDate: { not: null },
    },
    select: {
      id: true,
      assetCode: true,
      serialNumber: true,
      customerId: true,
      type: true,
      size: true,
      location: true,
      nextServiceDate: true,
      expirationDate: true,
      status: true,
    },
    orderBy: { nextServiceDate: 'asc' },
  });

  return assets.map((asset) => {
    const next = asset.nextServiceDate!;
    const daysUntilService = Math.ceil((next.getTime() - now.getTime()) / MS_PER_DAY);
    const daysOverdue = daysUntilService < 0 ? Math.abs(daysUntilService) : 0;
    return {
      ...asset,
      nextServiceDate: next.toISOString(),
      expirationDate: asset.expirationDate.toISOString(),
      daysUntilService,
      daysOverdue,
      maintenanceDue: daysUntilService <= 14,
      maintenanceOverdue: daysOverdue > 0,
    };
  });
}
