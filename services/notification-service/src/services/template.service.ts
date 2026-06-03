import { NotificationChannel, Prisma } from '../generated/prisma/index.js';
import { parsePagination, paginationMeta } from '@fems/shared';
import { prisma } from '../prisma/client.js';

export interface TemplateListQuery {
  page?: number;
  limit?: number;
  channel?: NotificationChannel;
  eventType?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateTemplateInput {
  code: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  htmlBody?: string;
  eventType?: string;
  isActive?: boolean;
}

export class TemplateService {
  async list(query: TemplateListQuery) {
    const { page, limit, skip } = parsePagination(query as Record<string, unknown>);
    const where: Prisma.NotificationTemplateWhereInput = {};

    if (query.channel) where.channel = query.channel;
    if (query.eventType) where.eventType = query.eventType;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notificationTemplate.count({ where }),
    ]);

    return { templates, meta: paginationMeta(page, limit, total) };
  }

  async getById(id: string) {
    return prisma.notificationTemplate.findUnique({ where: { id } });
  }

  async getByCode(code: string) {
    return prisma.notificationTemplate.findUnique({ where: { code } });
  }

  async create(input: CreateTemplateInput) {
    return prisma.notificationTemplate.create({ data: input });
  }

  async update(id: string, input: Partial<CreateTemplateInput>) {
    return prisma.notificationTemplate.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    const inUse = await prisma.notification.count({ where: { templateId: id } });
    if (inUse > 0) {
      return prisma.notificationTemplate.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return prisma.notificationTemplate.delete({ where: { id } });
  }
}
