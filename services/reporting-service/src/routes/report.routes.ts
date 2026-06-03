import { Router } from 'express';
import { verifyJwt, requireRoles, UserRole, EventBus } from '@fems/shared';
import { ReportController, AnalyticsController } from '../controllers/report.controller.js';
import { ReportService } from '../services/report.service.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { AnalyticsCacheService } from '../services/analytics-cache.service.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import {
  generateReportSchema,
  listReportsQuerySchema,
  exportParamsSchema,
  customerDashboardQuerySchema,
  technicianDashboardQuerySchema,
} from '../schemas/validation.js';

export function createReportRoutes(
  reportService: ReportService,
  analyticsService: AnalyticsService,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = verifyJwt(jwtSecret);
  const allRoles = requireRoles(UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER);
  const controller = new ReportController(reportService, analyticsService);

  router.get('/', auth, allRoles, validateQuery(listReportsQuerySchema), controller.list);
  router.post('/generate', auth, allRoles, validateBody(generateReportSchema), controller.generate);
  router.get('/:id/export/:format', auth, allRoles, validateParams(exportParamsSchema), controller.export);

  return router;
}

export function createAnalyticsRoutes(analyticsService: AnalyticsService, jwtSecret: string): Router {
  const router = Router();
  const auth = verifyJwt(jwtSecret);
  const adminOnly = requireRoles(UserRole.ADMIN);
  const customerRole = requireRoles(UserRole.USER);
  const technicianRole = requireRoles(UserRole.INSPECTOR);
  const controller = new AnalyticsController(analyticsService);

  router.get('/dashboard', auth, adminOnly, controller.adminDashboard);
  router.get(
    '/customer-dashboard',
    auth,
    customerRole,
    validateQuery(customerDashboardQuerySchema),
    controller.customerDashboard
  );
  router.get(
    '/user-dashboard',
    auth,
    customerRole,
    validateQuery(customerDashboardQuerySchema),
    controller.customerDashboard
  );
  router.get(
    '/technician-dashboard',
    auth,
    technicianRole,
    validateQuery(technicianDashboardQuerySchema),
    controller.technicianDashboard
  );
  router.get(
    '/inspector-dashboard',
    auth,
    technicianRole,
    validateQuery(technicianDashboardQuerySchema),
    controller.technicianDashboard
  );

  return router;
}

export function createReportingRoutes(
  eventBus: EventBus,
  cacheService: AnalyticsCacheService,
  jwtSecret: string
): { reportRoutes: Router; analyticsRoutes: Router } {
  const reportService = new ReportService(eventBus);
  const analyticsService = new AnalyticsService(cacheService);

  return {
    reportRoutes: createReportRoutes(reportService, analyticsService, jwtSecret),
    analyticsRoutes: createAnalyticsRoutes(analyticsService, jwtSecret),
  };
}
