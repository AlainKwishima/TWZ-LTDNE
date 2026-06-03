import { Response } from 'express';
import {
  AuthRequest,
  UserRole,
  errorResponse,
  successResponse,
} from '@fems/shared';
import {
  NotificationChannel,
  NotificationCategory,
  NotificationStatus,
} from '../generated/prisma/index.js';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  list = async (req: AuthRequest, res: Response) => {
    const query = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      userId: req.query.userId as string | undefined,
      customerId: req.query.customerId as string | undefined,
      channel: req.query.channel as NotificationChannel | undefined,
      status: req.query.status as NotificationStatus | undefined,
      category: req.query.category as NotificationCategory | undefined,
      unseenOnly: req.query.unseenOnly === 'true',
    };

    if (req.user?.role === UserRole.USER) {
      if (!req.user.customerId) {
        return errorResponse(res, 'Customer profile required', 403);
      }
      query.customerId = req.user.customerId;
      query.channel = NotificationChannel.InApp;
    }

    const result = await this.notificationService.list(query);
    return successResponse(res, 'Notifications retrieved', result.notifications, 200, result.meta);
  };

  getById = async (req: AuthRequest, res: Response) => {
    const notification = await this.notificationService.getById(req.params.id);
    if (!notification) return errorResponse(res, 'Notification not found', 404);
    if (!this.canAccess(req, notification.customerId)) {
      return errorResponse(res, 'Forbidden', 403);
    }
    return successResponse(res, 'Notification retrieved', notification);
  };

  getByUserId = async (
    req: AuthRequest & { params: { userId: string }; query: Record<string, unknown> },
    res: Response
  ) => {
    if (req.user?.role === UserRole.USER && req.params.userId !== req.user.userId) {
      return errorResponse(res, 'Forbidden', 403);
    }

    const result = await this.notificationService.getByUserId(req.params.userId, {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      channel: req.query.channel as NotificationChannel | undefined,
      unseenOnly: req.query.unseenOnly === 'true',
    });
    return successResponse(res, 'User notifications retrieved', result.notifications, 200, result.meta);
  };

  create = async (req: AuthRequest & { body: Parameters<NotificationService['create']>[0] }, res: Response) => {
    try {
      const notification = await this.notificationService.create(req.body);
      return successResponse(res, 'Notification created', notification, 201);
    } catch (error) {
      return errorResponse(res, (error as Error).message, 400);
    }
  };

  markSeen = async (req: AuthRequest, res: Response) => {
    const existing = await this.notificationService.getById(req.params.id);
    if (!existing) return errorResponse(res, 'Notification not found', 404);
    if (!this.canAccess(req, existing.customerId)) {
      return errorResponse(res, 'Forbidden', 403);
    }

    const notification = await this.notificationService.markSeen(req.params.id);
    return successResponse(res, 'Notification marked as seen', notification);
  };

  acknowledge = async (req: AuthRequest, res: Response) => {
    const existing = await this.notificationService.getById(req.params.id);
    if (!existing) return errorResponse(res, 'Notification not found', 404);
    if (!this.canAccess(req, existing.customerId)) {
      return errorResponse(res, 'Forbidden', 403);
    }

    const notification = await this.notificationService.acknowledge(req.params.id);
    return successResponse(res, 'Notification acknowledged', notification);
  };

  resend = async (req: AuthRequest, res: Response) => {
    const notification = await this.notificationService.resend(req.params.id);
    if (!notification) return errorResponse(res, 'Notification not found', 404);
    return successResponse(res, 'Notification resent', notification);
  };

  private canAccess(req: AuthRequest, customerId: string | null | undefined): boolean {
    if (!req.user) return false;
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.INSPECTOR) return true;
    if (req.user.role === UserRole.USER) {
      return Boolean(req.user.customerId && req.user.customerId === customerId);
    }
    return false;
  }
}
