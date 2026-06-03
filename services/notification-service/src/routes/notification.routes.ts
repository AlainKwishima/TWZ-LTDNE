import { Router } from 'express';
import { z } from 'zod';
import {
  AuthRequest,
  getUserFromHeaders,
  JwtPayload,
  requireRoles,
  UserRole,
  verifyJwt,
} from '@fems/shared';
import { NotificationChannel, NotificationCategory, NotificationStatus } from '../generated/prisma/index.js';
import { NotificationController } from '../controllers/notification.controller.js';
import { TemplateController } from '../controllers/template.controller.js';
import { NotificationService } from '../services/notification.service.js';
import { TemplateService } from '../services/template.service.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';

const channelEnum = z.nativeEnum(NotificationChannel);
const categoryEnum = z.nativeEnum(NotificationCategory);
const statusEnum = z.nativeEnum(NotificationStatus);

const idParamsSchema = z.object({ id: z.string().uuid() });
const userIdParamsSchema = z.object({ userId: z.string().uuid() });

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  userId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  channel: channelEnum.optional(),
  status: statusEnum.optional(),
  category: categoryEnum.optional(),
  unseenOnly: z.enum(['true', 'false']).optional(),
});

const createNotificationSchema = z.object({
  userId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  channel: channelEnum,
  category: categoryEnum.optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  eventType: z.string().optional(),
  eventPayload: z.record(z.unknown()).optional(),
  templateId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  sendImmediately: z.boolean().optional(),
});

const templateListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  channel: channelEnum.optional(),
  eventType: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

const createTemplateSchema = z.object({
  code: z.string().min(2).max(100),
  name: z.string().min(2),
  channel: channelEnum,
  subject: z.string().optional(),
  body: z.string().min(1),
  htmlBody: z.string().optional(),
  eventType: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

export function createNotificationRoutes(
  notificationService: NotificationService,
  jwtSecret: string
): Router {
  const router = Router();
  const controller = new NotificationController(notificationService);
  const auth = verifyJwt(jwtSecret);

  const attachUserFromHeaders = (req: AuthRequest, _res: unknown, next: () => void) => {
    if (!req.user) {
      const headers = getUserFromHeaders(req);
      if (headers.userId && headers.role) {
        req.user = headers as JwtPayload;
      }
    }
    next();
  };

  router.get('/', auth, attachUserFromHeaders, validateQuery(listQuerySchema), controller.list);
  router.get(
    '/user/:userId',
    auth,
    attachUserFromHeaders,
    validateParams(userIdParamsSchema),
    validateQuery(listQuerySchema),
    controller.getByUserId
  );
  router.get('/:id', auth, attachUserFromHeaders, validateParams(idParamsSchema), controller.getById);
  router.post(
    '/',
    auth,
    attachUserFromHeaders,
    requireRoles(UserRole.ADMIN, UserRole.ADMIN),
    validateBody(createNotificationSchema),
    controller.create
  );
  router.patch('/:id/seen', auth, attachUserFromHeaders, validateParams(idParamsSchema), controller.markSeen);
  router.patch(
    '/:id/acknowledge',
    auth,
    attachUserFromHeaders,
    validateParams(idParamsSchema),
    controller.acknowledge
  );
  router.post(
    '/:id/resend',
    auth,
    attachUserFromHeaders,
    requireRoles(UserRole.ADMIN, UserRole.ADMIN),
    validateParams(idParamsSchema),
    controller.resend
  );

  return router;
}

export function createTemplateRoutes(templateService: TemplateService, jwtSecret: string): Router {
  const router = Router();
  const controller = new TemplateController(templateService);
  const auth = verifyJwt(jwtSecret);
  const staffOnly = requireRoles(UserRole.ADMIN, UserRole.ADMIN);

  router.get('/', auth, staffOnly, validateQuery(templateListQuerySchema), controller.list);
  router.get('/:id', auth, staffOnly, validateParams(idParamsSchema), controller.getById);
  router.post('/', auth, staffOnly, validateBody(createTemplateSchema), controller.create);
  router.put(
    '/:id',
    auth,
    staffOnly,
    validateParams(idParamsSchema),
    validateBody(updateTemplateSchema),
    controller.update
  );
  router.delete('/:id', auth, staffOnly, validateParams(idParamsSchema), controller.remove);

  return router;
}
