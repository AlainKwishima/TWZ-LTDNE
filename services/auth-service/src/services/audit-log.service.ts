import { AuditAction, Prisma } from '../generated/prisma/index.js';
import { prisma } from '../prisma/client.js';

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuthAuditLog(
  userId: string | null,
  action: AuditAction,
  ctx: AuditContext = {},
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.authAuditLog.create({
    data: {
      userId,
      action,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
