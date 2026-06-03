import { Router } from 'express';
import {
  AuthRequest,
  getUserFromHeaders,
  JwtPayload,
  optionalAuth,
  requireRoles,
  UserRole,
  verifyJwt,
} from '@fems/shared';
import { ServiceRequestController } from '../controllers/service-request.controller.js';
import { ServiceRequestService } from '../services/service-request.service.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import {
  addNoteSchema,
  assignTechnicianSchema,
  completeRequestSchema,
  createRequestSchema,
  idParamsSchema,
  listQuerySchema,
  updateStatusSchema,
} from '../schemas/validation.js';

export function createServiceRequestRoutes(
  serviceRequestService: ServiceRequestService,
  jwtSecret?: string
): Router {
  const router = Router();
  const controller = new ServiceRequestController(serviceRequestService);
  const secret = jwtSecret || process.env.JWT_SECRET || '';

  const auth = secret ? verifyJwt(secret) : optionalAuth(secret);
  const staffOrAdmin = requireRoles(UserRole.ADMIN);
  const customer = requireRoles(UserRole.USER);
  const inspector = requireRoles(UserRole.INSPECTOR);
  const staffInspectorOrAdmin = requireRoles(UserRole.ADMIN, UserRole.INSPECTOR);

  /**
   * Internal service-to-service calls may carry trusted user headers instead of a JWT payload,
   * so the shared auth guards can still evaluate the request consistently.
   */
  const attachUserFromHeaders = (req: AuthRequest, _res: unknown, next: () => void) => {
    if (!req.user) {
      const headers = getUserFromHeaders(req);
      if (headers.userId && headers.role && headers.email) {
        req.user = headers as JwtPayload;
      }
    }
    next();
  };

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'service-request-service' });
  });

  router.use(auth, attachUserFromHeaders);

  router.get(
    '/requests',
    staffOrAdmin,
    validateQuery(listQuerySchema),
    controller.list
  );

  router.get(
    '/requests/my',
    customer,
    validateQuery(listQuerySchema),
    controller.listMy
  );

  router.get(
    '/requests/assigned',
    inspector,
    validateQuery(listQuerySchema),
    controller.listAssigned
  );

  router.get(
    '/requests/:id',
    requireRoles(UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER),
    validateParams(idParamsSchema),
    controller.getById
  );

  router.post(
    '/requests',
    customer,
    validateBody(createRequestSchema),
    controller.create
  );

  router.patch(
    '/requests/:id/assign',
    staffOrAdmin,
    validateParams(idParamsSchema),
    validateBody(assignTechnicianSchema),
    controller.assign
  );

  router.patch(
    '/requests/:id/status',
    staffInspectorOrAdmin,
    validateParams(idParamsSchema),
    validateBody(updateStatusSchema),
    controller.updateStatus
  );

  router.post(
    '/requests/:id/notes',
    requireRoles(UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER),
    validateParams(idParamsSchema),
    validateBody(addNoteSchema),
    controller.addNote
  );

  router.post(
    '/requests/:id/complete',
    inspector,
    validateParams(idParamsSchema),
    validateBody(completeRequestSchema),
    controller.complete
  );

  return router;
}
