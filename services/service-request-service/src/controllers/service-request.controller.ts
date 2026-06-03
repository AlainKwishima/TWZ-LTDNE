import { Response } from 'express';
import { ServiceRequestStatus } from '../generated/prisma/index.js';
import {
  AuthRequest,
  JwtPayload,
  UserRole,
  errorResponse,
  forwardUserHeaders,
  getPortalCustomerId,
  getUserFromHeaders,
  successResponse,
} from '@fems/shared';
import { ServiceRequestService } from '../services/service-request.service.js';

function resolveUser(req: AuthRequest) {
  return req.user || getUserFromHeaders(req);
}

function asJwtUser(user: ReturnType<typeof resolveUser>): JwtPayload | undefined {
  if (user?.userId && user?.email && user?.role) {
    return user as JwtPayload;
  }
  return undefined;
}

export class ServiceRequestController {
  constructor(private serviceRequestService: ServiceRequestService) {}

  list = async (req: AuthRequest, res: Response) => {
    const result = await this.serviceRequestService.list({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as ServiceRequestStatus | undefined,
      type: req.query.type as never,
      customerId: req.query.customerId as string | undefined,
      assetId: req.query.assetId as string | undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    });

    return successResponse(res, 'Service requests retrieved', result.requests, 200, result.meta);
  };

  listMy = async (req: AuthRequest, res: Response) => {
    const user = resolveUser(req);
    const jwtUser = asJwtUser(user);
    const customerId = jwtUser ? getPortalCustomerId(jwtUser) : undefined;
    if (!customerId) {
      return errorResponse(res, 'Portal account scope required', 403);
    }

    const result = await this.serviceRequestService.listByCustomer(customerId, {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as ServiceRequestStatus | undefined,
      type: req.query.type as never,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    });

    return successResponse(res, 'Your service requests retrieved', result.requests, 200, result.meta);
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      const user = resolveUser(req);
      const request = await this.serviceRequestService.getById(req.params.id);
      if (!request) {
        return errorResponse(res, 'Service request not found', 404);
      }

      const jwtUser = asJwtUser(user);
      const portalCustomerId = jwtUser ? getPortalCustomerId(jwtUser) : undefined;
      const canView =
        user.role === UserRole.ADMIN ||
        (user.role === UserRole.USER &&
          portalCustomerId &&
          request.customerId === portalCustomerId) ||
        (user.role === UserRole.INSPECTOR && request.assignment?.technicianId === user.userId);

      if (!canView) {
        return errorResponse(res, 'Insufficient permissions', 403);
      }

      return successResponse(res, 'Service request retrieved', request);
    } catch (error) {
      return errorResponse(res, (error as Error).message, 400);
    }
  };

  listAssigned = async (req: AuthRequest, res: Response) => {
    const user = resolveUser(req);
    if (!user.userId) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const result = await this.serviceRequestService.listAssignedToTechnician(user.userId, {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as ServiceRequestStatus | undefined,
      type: req.query.type as never,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    });

    return successResponse(res, 'Assigned service requests retrieved', result.requests, 200, result.meta);
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const user = resolveUser(req);
      const jwtUser = asJwtUser(user);
      const customerId = jwtUser ? getPortalCustomerId(jwtUser) : undefined;
      if (!customerId) {
        return errorResponse(res, 'Portal account scope required to create service requests', 403);
      }

      const request = await this.serviceRequestService.create(
        {
          customerId,
          assetId: req.body.assetId,
          type: req.body.type,
          description: req.body.description,
          scheduledDate: req.body.scheduledDate,
          priority: req.body.priority,
        },
        user.userId
      );

      return successResponse(res, 'Service request created', request, 201);
    } catch (error) {
      return errorResponse(res, (error as Error).message, 400);
    }
  };

  assign = async (req: AuthRequest, res: Response) => {
    try {
      const user = resolveUser(req);
      const request = await this.serviceRequestService.assignTechnician(
        req.params.id,
        req.body,
        user.userId,
        user.role
      );
      return successResponse(res, 'Inspector assigned', request);
    } catch (error) {
      const message = (error as Error).message;
      const status = message.includes('not found') ? 404 : 400;
      return errorResponse(res, message, status);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response) => {
    try {
      const user = resolveUser(req);
      const existing = await this.serviceRequestService.getById(req.params.id);
      if (!existing) {
        return errorResponse(res, 'Service request not found', 404);
      }

      if (user.role === UserRole.INSPECTOR) {
        if (existing.assignment?.technicianId !== user.userId) {
          return errorResponse(res, 'Insufficient permissions', 403);
        }
        const allowed: ServiceRequestStatus[] = [
          ServiceRequestStatus.InProgress,
          ServiceRequestStatus.Assigned,
        ];
        if (!allowed.includes(req.body.status)) {
          return errorResponse(res, 'Technicians may only set Assigned or InProgress status', 403);
        }
      }

      const request = await this.serviceRequestService.updateStatus(req.params.id, req.body.status, {
        actorId: user.userId,
        actorRole: user.role,
      });
      return successResponse(res, 'Status updated', request);
    } catch (error) {
      const message = (error as Error).message;
      const status = message.includes('not found') ? 404 : 400;
      return errorResponse(res, message, status);
    }
  };

  addNote = async (req: AuthRequest, res: Response) => {
    try {
      const user = resolveUser(req);
      const existing = await this.serviceRequestService.getById(req.params.id);
      if (!existing) {
        return errorResponse(res, 'Service request not found', 404);
      }

      const jwtUser = asJwtUser(user);
      const portalCustomerId = jwtUser ? getPortalCustomerId(jwtUser) : undefined;
      const isOwner =
        user.role === UserRole.USER && portalCustomerId && existing.customerId === portalCustomerId;
      const isAssignedTech =
        user.role === UserRole.INSPECTOR && existing.assignment?.technicianId === user.userId;
      const isStaff = user.role === UserRole.ADMIN || user.role === UserRole.INSPECTOR;

      if (!isOwner && !isAssignedTech && !isStaff) {
        return errorResponse(res, 'Insufficient permissions', 403);
      }

      const result = await this.serviceRequestService.addNote(
        req.params.id,
        req.body.content,
        user.email,
        user.role
      );

      return successResponse(res, 'Note added', result, 201);
    } catch (error) {
      const message = (error as Error).message;
      const status = message.includes('not found') ? 404 : 400;
      return errorResponse(res, message, status);
    }
  };

  complete = async (req: AuthRequest, res: Response) => {
    try {
      const user = resolveUser(req);
      if (!user.userId) {
        return errorResponse(res, 'Authentication required', 401);
      }

      const request = await this.serviceRequestService.complete(
        req.params.id,
        req.body,
        user.userId,
        user.email,
        forwardUserHeaders(req)
      );

      return successResponse(res, 'Service request completed', request);
    } catch (error) {
      const message = (error as Error).message;
      const status = message.includes('not found') ? 404 : 400;
      return errorResponse(res, message, status);
    }
  };
}
