import { AssetStatus, Prisma } from '../generated/prisma/index.js';
import {
  AssetEventPayload,
  EventBus,
  EventType,
  generateSerialNumber,
  paginationMeta,
  parsePagination,
} from '@fems/shared';

function parseAssetDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00.000Z`);
  }
  return new Date(value);
}

async function nextUniqueSerial(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const serialNumber = generateSerialNumber();
    const existing = await prisma.fireExtinguisherAsset.findUnique({ where: { serialNumber } });
    if (!existing) return serialNumber;
  }
  throw new Error('Could not generate a unique serial number');
}
import { prisma } from '../prisma/client.js';
import { notifyAssetEventHttp } from '../clients/service-notify.client.js';
import { notifyRefillBooked } from '../clients/notification.client.js';

export class AssetService {
  constructor(private eventBus: EventBus) {}

  async registerAsset(
    input: {
      customerId: string;
      location: string;
      type: string;
      size: string;
      installationDate: string;
      expiryDate: string;
      status?: AssetStatus;
      notes?: string;
    },
    createdBy?: string
  ) {
    const installationDate = parseAssetDate(input.installationDate);
    const expirationDate = parseAssetDate(input.expiryDate);
    if (expirationDate <= installationDate) {
      throw new Error('Expiry date must be after installation date');
    }

    const serialNumber = await nextUniqueSerial();
    const status = input.status ?? AssetStatus.Active;

    const asset = await prisma.fireExtinguisherAsset.create({
      data: {
        assetCode: serialNumber,
        serialNumber,
        customerId: input.customerId,
        location: input.location,
        type: input.type,
        size: input.size,
        installationDate,
        expirationDate,
        serviceDate: installationDate,
        status,
        notes: input.notes,
        histories: {
          create: {
            eventType: 'MANUAL_REGISTRATION',
            description: 'Fire extinguisher registered',
            newStatus: status,
            createdBy,
          },
        },
      },
      include: { histories: true, serviceRecords: true },
    });

    await this.publishAssetCreated(asset);
    return asset;
  }

  async listAssets(query: Record<string, unknown>, customerIdFilter?: string) {
    const { page, limit, skip } = parsePagination(query);
    const search = query.search as string | undefined;
    const ownerFromQuery =
      (query.ownerUserId as string | undefined) ?? (query.customerId as string | undefined);
    const customerId = customerIdFilter ?? ownerFromQuery;
    const type = query.type as string | undefined;
    const size = query.size as string | undefined;
    const status = query.status as AssetStatus | undefined;
    const serialNumber = query.serialNumber as string | undefined;
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';

    const where: Prisma.FireExtinguisherAssetWhereInput = {};
    if (customerId) where.customerId = customerId;
    if (type) where.type = { contains: type, mode: 'insensitive' };
    if (size) where.size = { contains: size, mode: 'insensitive' };
    if (status) where.status = status;
    if (serialNumber) where.serialNumber = { contains: serialNumber, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { assetCode: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.fireExtinguisherAsset.findMany({
        where,
        include: {
          serviceRecords: { orderBy: { serviceDate: 'desc' }, take: 3 },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.fireExtinguisherAsset.count({ where }),
    ]);

    return { assets, meta: paginationMeta(page, limit, total) };
  }

  async deleteAsset(id: string, customerIdFilter?: string, _deletedBy?: string) {
    const where: Prisma.FireExtinguisherAssetWhereInput = { id };
    if (customerIdFilter) where.customerId = customerIdFilter;

    const existing = await prisma.fireExtinguisherAsset.findFirst({ where });
    if (!existing) throw new Error('Asset not found');

    await prisma.fireExtinguisherAsset.delete({ where: { id } });

    return {
      id: existing.id,
      serialNumber: existing.serialNumber,
      customerId: existing.customerId,
    };
  }

  async getAssetById(id: string, customerIdFilter?: string) {
    const where: Prisma.FireExtinguisherAssetWhereInput = { id };
    if (customerIdFilter) where.customerId = customerIdFilter;

    return prisma.fireExtinguisherAsset.findFirst({
      where,
      include: {
        histories: { orderBy: { createdAt: 'desc' } },
        serviceRecords: { orderBy: { serviceDate: 'desc' } },
      },
    });
  }

  async updateAsset(
    id: string,
    data: {
      ownerUserId?: string;
      location?: string;
      type?: string;
      size?: string;
      installationDate?: string;
      expiryDate?: string;
      status?: AssetStatus;
      notes?: string;
      serviceDate?: string;
      nextServiceDate?: string;
    },
    updatedBy?: string
  ) {
    const existing = await prisma.fireExtinguisherAsset.findUnique({ where: { id } });
    if (!existing) throw new Error('Asset not found');

    const installationDate = data.installationDate
      ? parseAssetDate(data.installationDate)
      : undefined;
    const expirationDate = data.expiryDate ? parseAssetDate(data.expiryDate) : undefined;
    if (installationDate && expirationDate && expirationDate <= installationDate) {
      throw new Error('Expiry date must be after installation date');
    }

    const updateData: Prisma.FireExtinguisherAssetUpdateInput = {
      ...(data.ownerUserId ? { customerId: data.ownerUserId } : {}),
      location: data.location,
      type: data.type,
      size: data.size,
      installationDate,
      expirationDate,
      status: data.status,
      notes: data.notes,
      serviceDate: data.serviceDate ? new Date(data.serviceDate) : undefined,
      nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : undefined,
    };

    const asset = await prisma.fireExtinguisherAsset.update({
      where: { id },
      data: updateData,
    });

    if (data.ownerUserId && data.ownerUserId !== existing.customerId) {
      await prisma.assetHistory.create({
        data: {
          assetId: id,
          eventType: 'OWNER_REASSIGNED',
          description: `Owner reassigned to portal user ${data.ownerUserId}`,
          createdBy: updatedBy,
        },
      });
    }

    if (data.status && data.status !== existing.status) {
      await prisma.assetHistory.create({
        data: {
          assetId: id,
          eventType: 'STATUS_CHANGE',
          description: `Status updated from ${existing.status} to ${data.status}`,
          oldStatus: existing.status,
          newStatus: data.status,
          createdBy: updatedBy,
        },
      });
    } else {
      await prisma.assetHistory.create({
        data: {
          assetId: id,
          eventType: 'UPDATED',
          description: 'Asset details updated',
          createdBy: updatedBy,
        },
      });
    }

    return asset;
  }

  async addServiceRecord(
    assetId: string,
    input: {
      serviceType: string;
      serviceDate?: string;
      technicianId?: string;
      technicianName?: string;
      notes?: string;
      nextServiceDate?: string;
      updateExpirationDate?: string;
    },
    createdBy?: string
  ) {
    const asset = await prisma.fireExtinguisherAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new Error('Asset not found');

    const serviceDate = input.serviceDate ? new Date(input.serviceDate) : new Date();
    const nextServiceDate = input.nextServiceDate ? new Date(input.nextServiceDate) : undefined;

    const [record, updatedAsset] = await prisma.$transaction([
      prisma.assetServiceRecord.create({
        data: {
          assetId,
          serviceType: input.serviceType,
          serviceDate,
          technicianId: input.technicianId,
          technicianName: input.technicianName,
          notes: input.notes,
          nextServiceDate,
        },
      }),
      prisma.fireExtinguisherAsset.update({
        where: { id: assetId },
        data: {
          serviceDate,
          nextServiceDate: nextServiceDate ?? asset.nextServiceDate,
          expirationDate: input.updateExpirationDate
            ? new Date(input.updateExpirationDate)
            : asset.expirationDate,
          status: AssetStatus.Serviced,
        },
      }),
      prisma.assetHistory.create({
        data: {
          assetId,
          eventType: 'SERVICE_RECORD',
          description: `${input.serviceType} service recorded`,
          oldStatus: asset.status,
          newStatus: AssetStatus.Serviced,
          createdBy,
          metadata: { serviceType: input.serviceType },
        },
      }),
    ]);

    return { record, asset: updatedAsset };
  }

  async getTimeline(assetId: string) {
    const [histories, serviceRecords] = await Promise.all([
      prisma.assetHistory.findMany({
        where: { assetId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.assetServiceRecord.findMany({
        where: { assetId },
        orderBy: { serviceDate: 'desc' },
      }),
    ]);

    return { histories, serviceRecords };
  }

  async bookRefill(assetId: string, customerId: string) {
    const asset = await prisma.fireExtinguisherAsset.findFirst({
      where: { id: assetId, customerId },
    });
    if (!asset) throw new Error('Asset not found');
    if (asset.refillBookedAt) return asset;

    const updated = await prisma.fireExtinguisherAsset.update({
      where: { id: assetId },
      data: { refillBookedAt: new Date() },
    });

    await prisma.assetHistory.create({
      data: {
        assetId,
        eventType: 'REFILL_BOOKED',
        description: 'Customer booked an extinguisher refill',
        oldStatus: asset.status,
        newStatus: asset.status,
      },
    });

    await notifyRefillBooked(assetId, customerId);
    return updated;
  }

  private async publishAssetCreated(
    asset: {
      id: string;
      assetCode: string;
      serialNumber: string;
      customerId: string;
      type: string;
      size: string;
      location: string | null;
      expirationDate: Date;
      status: AssetStatus;
    },
    userId?: string
  ) {
    const payload: AssetEventPayload = {
      assetId: asset.id,
      assetCode: asset.assetCode,
      serialNumber: asset.serialNumber,
      customerId: asset.customerId,
      type: asset.type,
      size: asset.size,
      location: asset.location ?? undefined,
      expirationDate: asset.expirationDate.toISOString(),
      status: asset.status,
    };
    await this.eventBus.publish(EventType.ASSET_CREATED, payload);
    await notifyAssetEventHttp(EventType.ASSET_CREATED, { ...payload, userId });
  }
}

export class ExpiryCronService {
  constructor(private eventBus: EventBus) {}

  async runExpiryCheck(warningDays = 30) {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);

    const expiringAssets = await prisma.fireExtinguisherAsset.findMany({
      where: {
        expirationDate: { lte: warningDate, gt: now },
        status: { in: [AssetStatus.Active, AssetStatus.Serviced] },
      },
    });

    for (const asset of expiringAssets) {
      if (asset.status === AssetStatus.ExpiringSoon) continue;

      const updated = await prisma.fireExtinguisherAsset.update({
        where: { id: asset.id },
        data: { status: AssetStatus.ExpiringSoon },
      });

      await prisma.assetHistory.create({
        data: {
          assetId: asset.id,
          eventType: 'EXPIRY_WARNING',
          description: `Asset expiring within ${warningDays} days`,
          oldStatus: asset.status,
          newStatus: AssetStatus.ExpiringSoon,
        },
      });

      const payload: AssetEventPayload = {
        assetId: updated.id,
        assetCode: updated.assetCode,
        serialNumber: updated.serialNumber,
        customerId: updated.customerId,
        type: updated.type,
        size: updated.size,
        location: updated.location ?? undefined,
        expirationDate: updated.expirationDate.toISOString(),
        status: updated.status,
      };
      await this.eventBus.publish(EventType.ASSET_EXPIRING_SOON, payload);
      await notifyAssetEventHttp(EventType.ASSET_EXPIRING_SOON, payload);
    }

    const expiredAssets = await prisma.fireExtinguisherAsset.findMany({
      where: {
        expirationDate: { lte: now },
        status: { notIn: [AssetStatus.Expired, AssetStatus.HighRisk] },
      },
    });

    for (const asset of expiredAssets) {
      const updated = await prisma.fireExtinguisherAsset.update({
        where: { id: asset.id },
        data: { status: AssetStatus.Expired },
      });

      await prisma.assetHistory.create({
        data: {
          assetId: asset.id,
          eventType: 'EXPIRED',
          description: 'Asset has expired',
          oldStatus: asset.status,
          newStatus: AssetStatus.Expired,
        },
      });

      const payload: AssetEventPayload = {
        assetId: updated.id,
        assetCode: updated.assetCode,
        serialNumber: updated.serialNumber,
        customerId: updated.customerId,
        type: updated.type,
        size: updated.size,
        location: updated.location ?? undefined,
        expirationDate: updated.expirationDate.toISOString(),
        status: updated.status,
      };
      await this.eventBus.publish(EventType.ASSET_EXPIRED, payload);
      await notifyAssetEventHttp(EventType.ASSET_EXPIRED, payload);
    }

    return {
      expiringSoonUpdated: expiringAssets.length,
      expiredUpdated: expiredAssets.length,
    };
  }
}
