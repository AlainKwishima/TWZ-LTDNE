import { ServiceRequestStatus, Prisma } from '../generated/prisma/index.js';
import { prisma } from '../prisma/client.js';

/**
 * Request activity is the audit trail that preserves assignment, status, note,
 * and completion history for reporting and compliance.
 */
export type ActivityEventType =
  | 'CREATED'
  | 'INSPECTOR_ASSIGNED'
  | 'STATUS_CHANGED'
  | 'NOTE_ADDED'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Stores a lifecycle event against the request so the request history stays
 * reconstructable even when the live status changes later.
 */
export async function recordActivity(input: {
  serviceRequestId: string;
  eventType: ActivityEventType;
  description: string;
  actorId?: string;
  actorRole?: string;
  oldStatus?: ServiceRequestStatus;
  newStatus?: ServiceRequestStatus;
  metadata?: Record<string, unknown>;
}) {
  return prisma.serviceRequestActivity.create({
    data: {
      serviceRequestId: input.serviceRequestId,
      eventType: input.eventType,
      description: input.description,
      actorId: input.actorId,
      actorRole: input.actorRole,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
