import {
  Prisma,
  ServiceRequestStatus,
  ServiceRequestType,
} from '../generated/prisma/index.js';
import {
  addMonths,
  EventBus,
  EventType,
  paginationMeta,
  parsePagination,
  ServiceCompletedPayload,
} from '@fems/shared';
import { prisma } from '../prisma/client.js';
import { recordAssetService } from './asset.client.js';
import { fetchUserContact } from '../clients/auth.client.js';
import { notifyServiceRequestEventHttp } from '../clients/notification.client.js';
import { recordActivity } from './activity.service.js';

export interface ServiceRequestedPayload {
  serviceRequestId: string;
  requestNumber: string;
  customerId: string;
  assetId: string;
  type: string;
  status: string;
  description?: string;
}

export interface TechnicianAssignedPayload {
  serviceRequestId: string;
  requestNumber: string;
  customerId: string;
  assetId: string;
  technicianId: string;
  technicianName?: string;
  assignedBy?: string;
}

export interface ServiceRequestListQuery {
  page?: number;
  limit?: number;
  status?: ServiceRequestStatus;
  type?: ServiceRequestType;
  customerId?: string;
  assetId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const requestInclude = {
  assignment: true,
  notes: { orderBy: { createdAt: 'desc' as const } },
  completion: true,
  activities: { orderBy: { createdAt: 'asc' as const } },
};

function generateRequestNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SR-${date}-${random}`;
}

/**
 * Coordinates the full maintenance request lifecycle, including assignment,
 * audit history, asset updates, and notification fan-out.
 */
export class ServiceRequestService {
  constructor(private eventBus: EventBus) {}

  /**
   * Returns the paginated request queue using the caller's filter scope.
   */
  async list(query: ServiceRequestListQuery) {
    const { page, limit, skip } = parsePagination(query as Record<string, unknown>);
    const where: Prisma.ServiceRequestWhereInput = {};

    if (query.customerId) where.customerId = query.customerId;
    if (query.assetId) where.assetId = query.assetId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { requestNumber: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortField = ['createdAt', 'scheduledDate', 'status', 'requestNumber'].includes(
      query.sortBy || ''
    )
      ? query.sortBy!
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: requestInclude,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return { requests, meta: paginationMeta(page, limit, total) };
  }

  /**
   * Returns only the requests owned by the customer so the portal can show a personal queue.
   */
  async listByCustomer(customerId: string, query: ServiceRequestListQuery) {
    return this.list({ ...query, customerId });
  }

  /**
   * Returns the requests currently assigned to the signed-in inspector.
   */
  async listAssignedToTechnician(technicianId: string, query: ServiceRequestListQuery) {
    const { page, limit, skip } = parsePagination(query as Record<string, unknown>);
    const where: Prisma.ServiceRequestWhereInput = {
      assignment: { technicianId },
      status: { not: ServiceRequestStatus.Cancelled },
    };

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    const sortField = ['createdAt', 'scheduledDate', 'status', 'requestNumber'].includes(
      query.sortBy || ''
    )
      ? query.sortBy!
      : 'scheduledDate';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: requestInclude,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return { requests, meta: paginationMeta(page, limit, total) };
  }

  /**
   * Loads a single request with its assignment, notes, completion, and activity trail.
   */
  async getById(id: string) {
    return prisma.serviceRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
  }

  /**
   * Creates a new maintenance request and emits the initial audit and notification events.
   */
  async create(
    input: {
      customerId: string;
      assetId: string;
      type: ServiceRequestType;
      description?: string;
      scheduledDate?: string;
      priority?: string;
    },
    requestedByUserId?: string
  ) {
    let requestNumber = generateRequestNumber();
    while (await prisma.serviceRequest.findUnique({ where: { requestNumber } })) {
      requestNumber = generateRequestNumber();
    }

    const request = await prisma.serviceRequest.create({
      data: {
        requestNumber,
        customerId: input.customerId,
        assetId: input.assetId,
        requestedByUserId,
        type: input.type,
        status: ServiceRequestStatus.Pending,
        description: input.description,
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
        priority: input.priority ?? 'normal',
      },
      include: requestInclude,
    });

    await recordActivity({
      serviceRequestId: request.id,
      eventType: 'CREATED',
      description: `Maintenance request ${request.requestNumber} submitted (${request.type})`,
      actorId: requestedByUserId,
      actorRole: 'User',
      newStatus: ServiceRequestStatus.Pending,
      metadata: { assetId: request.assetId, type: request.type },
    });

    await this.publishServiceRequested(request, requestedByUserId);
    return request;
  }

  /**
   * Assigns an inspector, persists the assignment history, and notifies the customer and inspector.
   */
  async assignTechnician(
    id: string,
    input: {
      technicianId: string;
      technicianName?: string;
      notes?: string;
      scheduledDate?: string;
    },
    assignedBy?: string,
    assignedByRole?: string
  ) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { assignment: true },
    });

    if (!existing) throw new Error('Service request not found');
    if (existing.status === ServiceRequestStatus.Completed) {
      throw new Error('Cannot assign a completed service request');
    }
    if (existing.status === ServiceRequestStatus.Cancelled) {
      throw new Error('Cannot assign a cancelled service request');
    }

    let technicianName = input.technicianName;
    if (!technicianName) {
      const contact = await fetchUserContact(input.technicianId);
      technicianName = contact?.fullName ?? undefined;
    }

    const previousInspectorId = existing.assignment?.technicianId;

    const request = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: ServiceRequestStatus.Assigned,
        scheduledDate: input.scheduledDate
          ? new Date(input.scheduledDate)
          : existing.scheduledDate,
        assignment: {
          upsert: {
            create: {
              technicianId: input.technicianId,
              technicianName,
              assignedBy,
              notes: input.notes,
            },
            update: {
              technicianId: input.technicianId,
              technicianName,
              assignedBy,
              notes: input.notes,
              assignedAt: new Date(),
            },
          },
        },
      },
      include: requestInclude,
    });

    await recordActivity({
      serviceRequestId: request.id,
      eventType: 'INSPECTOR_ASSIGNED',
      description: previousInspectorId
        ? `Inspector reassigned to ${technicianName ?? input.technicianId}`
        : `Inspector ${technicianName ?? input.technicianId} assigned`,
      actorId: assignedBy,
      actorRole: assignedByRole,
      oldStatus: existing.status,
      newStatus: ServiceRequestStatus.Assigned,
      metadata: {
        technicianId: input.technicianId,
        technicianName,
        previousTechnicianId: previousInspectorId,
      },
    });

    await this.publishTechnicianAssigned(request, { requestedByUserId: existing.requestedByUserId });
    return request;
  }

  /**
   * Enforces the request workflow so only valid status transitions are stored.
   */
  async updateStatus(
    id: string,
    status: ServiceRequestStatus,
    actor?: { actorId?: string; actorRole?: string }
  ) {
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) throw new Error('Service request not found');

    if (existing.status === ServiceRequestStatus.Completed) {
      throw new Error('Completed service requests cannot be updated');
    }

    if (status === ServiceRequestStatus.Assigned && !existing) {
      throw new Error('Invalid status transition');
    }

    if (
      status === ServiceRequestStatus.InProgress &&
      existing.status !== ServiceRequestStatus.Assigned &&
      existing.status !== ServiceRequestStatus.InProgress
    ) {
      throw new Error('Only assigned requests can be marked in progress');
    }

    const request = await prisma.serviceRequest.update({
      where: { id },
      data: { status },
      include: requestInclude,
    });

    const eventType = status === ServiceRequestStatus.Cancelled ? 'CANCELLED' : 'STATUS_CHANGED';
    await recordActivity({
      serviceRequestId: id,
      eventType,
      description:
        status === ServiceRequestStatus.Cancelled
          ? `Request ${request.requestNumber} cancelled`
          : `Status changed from ${existing.status} to ${status}`,
      actorId: actor?.actorId,
      actorRole: actor?.actorRole,
      oldStatus: existing.status,
      newStatus: status,
    });

    await notifyServiceRequestEventHttp(EventType.SERVICE_REQUESTED, {
      ...this.buildRequestNotifyPayload(request),
      eventKind: status === ServiceRequestStatus.Cancelled ? 'CANCELLED' : 'STATUS_CHANGED',
      oldStatus: existing.status,
      newStatus: status,
    });

    return request;
  }

  /**
   * Stores an operator note and records it in the request history.
   */
  async addNote(
    id: string,
    content: string,
    createdBy?: string,
    authorRole?: string
  ) {
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) throw new Error('Service request not found');

    const note = await prisma.serviceNote.create({
      data: {
        serviceRequestId: id,
        content,
        createdBy,
        authorRole,
      },
    });

    await recordActivity({
      serviceRequestId: id,
      eventType: 'NOTE_ADDED',
      description: `Note added: ${content.slice(0, 120)}${content.length > 120 ? '...' : ''}`,
      actorId: createdBy,
      actorRole: authorRole,
      metadata: { noteId: note.id },
    });

    const request = await this.getById(id);
    return { note, request };
  }

  /**
   * Completes the request, writes the service outcome back to the asset record,
   * and publishes the completion event for reporting and notifications.
   */
  async complete(
    id: string,
    input: {
      summary: string;
      workPerformed?: string;
      partsUsed?: string;
      nextServiceDate?: string;
      nextExpirationDate?: string;
      serviceIntervalMonths?: number;
    },
    technicianId: string,
    technicianName?: string,
    authHeaders: Record<string, string> = {}
  ) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { assignment: true, completion: true },
    });

    if (!existing) throw new Error('Service request not found');
    if (existing.completion) throw new Error('Service request is already completed');
    if (!existing.assignment) throw new Error('Service request has no assigned technician');
    if (existing.assignment.technicianId !== technicianId) {
      throw new Error('Only the assigned technician can complete this request');
    }
    if (
      existing.status !== ServiceRequestStatus.Assigned &&
      existing.status !== ServiceRequestStatus.InProgress
    ) {
      throw new Error('Only assigned or in-progress requests can be completed');
    }

    const completedAt = new Date();
    const nextServiceDate = input.nextServiceDate
      ? new Date(input.nextServiceDate)
      : input.serviceIntervalMonths
        ? addMonths(completedAt, input.serviceIntervalMonths)
        : addMonths(completedAt, 12);

    const nextExpirationDate = input.nextExpirationDate
      ? new Date(input.nextExpirationDate)
      : undefined;

    const request = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: ServiceRequestStatus.Completed,
        completion: {
          create: {
            technicianId,
            completedAt,
            summary: input.summary,
            workPerformed: input.workPerformed,
            partsUsed: input.partsUsed,
            nextServiceDate,
            nextExpirationDate,
          },
        },
      },
      include: requestInclude,
    });

    await recordAssetService(
      existing.assetId,
      {
        serviceType: existing.type,
        serviceDate: completedAt.toISOString(),
        technicianId,
        technicianName,
        notes: [input.summary, input.workPerformed].filter(Boolean).join(' — '),
        nextServiceDate: nextServiceDate.toISOString(),
        updateExpirationDate: nextExpirationDate?.toISOString(),
      },
      authHeaders
    );

    const payload: ServiceCompletedPayload = {
      serviceRequestId: request.id,
      assetId: request.assetId,
      customerId: request.customerId,
      technicianId,
      serviceType: request.type,
      nextServiceDate: nextServiceDate.toISOString(),
      nextExpirationDate: nextExpirationDate?.toISOString(),
    };

    await recordActivity({
      serviceRequestId: request.id,
      eventType: 'COMPLETED',
      description: `Request ${request.requestNumber} completed: ${input.summary}`,
      actorId: technicianId,
      actorRole: 'Inspector',
      oldStatus: existing.status,
      newStatus: ServiceRequestStatus.Completed,
      metadata: {
        summary: input.summary,
        workPerformed: input.workPerformed,
        technicianName,
      },
    });

    await this.eventBus.publish(EventType.SERVICE_COMPLETED, payload);
    await notifyServiceRequestEventHttp(EventType.SERVICE_COMPLETED, {
      ...payload,
      requestNumber: request.requestNumber,
      assetCode: payload.assetId,
    });

    return request;
  }

  private buildRequestNotifyPayload(request: {
    id: string;
    requestNumber: string;
    customerId: string;
    assetId: string;
    type: ServiceRequestType;
    status: ServiceRequestStatus;
    description: string | null;
    requestedByUserId?: string | null;
    assignment?: {
      technicianId: string;
      technicianName: string | null;
    } | null;
  }) {
    return {
      serviceRequestId: request.id,
      requestNumber: request.requestNumber,
      customerId: request.customerId,
      assetId: request.assetId,
      type: request.type,
      status: request.status,
      description: request.description ?? undefined,
      requestedByUserId: request.requestedByUserId ?? request.customerId,
      technicianId: request.assignment?.technicianId,
      technicianName: request.assignment?.technicianName ?? undefined,
    };
  }

  private async publishServiceRequested(
    request: {
    id: string;
    requestNumber: string;
    customerId: string;
    assetId: string;
    type: ServiceRequestType;
    status: ServiceRequestStatus;
    description: string | null;
    requestedByUserId?: string | null;
  },
    requestedByUserId?: string
  ) {
    const payload: ServiceRequestedPayload = {
      serviceRequestId: request.id,
      requestNumber: request.requestNumber,
      customerId: request.customerId,
      assetId: request.assetId,
      type: request.type,
      status: request.status,
      description: request.description ?? undefined,
    };
    await this.eventBus.publish(EventType.SERVICE_REQUESTED, payload);
    await notifyServiceRequestEventHttp(EventType.SERVICE_REQUESTED, {
      ...this.buildRequestNotifyPayload({ ...request, requestedByUserId: requestedByUserId ?? request.requestedByUserId }),
      eventKind: 'CREATED',
    });
  }

  private async publishTechnicianAssigned(
    request: {
      id: string;
      requestNumber: string;
      customerId: string;
      assetId: string;
      type: ServiceRequestType;
      status: ServiceRequestStatus;
      description: string | null;
      requestedByUserId?: string | null;
      assignment: {
        technicianId: string;
        technicianName: string | null;
        assignedBy: string | null;
      } | null;
    },
    context: { requestedByUserId?: string | null }
  ) {
    if (!request.assignment) return;

    const payload: TechnicianAssignedPayload = {
      serviceRequestId: request.id,
      requestNumber: request.requestNumber,
      customerId: request.customerId,
      assetId: request.assetId,
      technicianId: request.assignment.technicianId,
      technicianName: request.assignment.technicianName ?? undefined,
      assignedBy: request.assignment.assignedBy ?? undefined,
    };
    await this.eventBus.publish(EventType.TECHNICIAN_ASSIGNED, payload);
    await notifyServiceRequestEventHttp(EventType.TECHNICIAN_ASSIGNED, {
      ...this.buildRequestNotifyPayload({ ...request, requestedByUserId: context.requestedByUserId }),
      eventKind: 'INSPECTOR_ASSIGNED',
      assignedBy: request.assignment.assignedBy ?? undefined,
    });
  }
}
