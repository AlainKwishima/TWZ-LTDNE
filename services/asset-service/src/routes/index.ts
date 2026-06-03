import { Router } from 'express';
import { verifyJwt, requireRoles, UserRole, EventBus } from '@fems/shared';
import { createAssetController } from '../controllers/asset.controller.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  registerAssetSchema,
  updateAssetSchema,
  serviceRecordSchema,
  assetQuerySchema,
} from '../schemas/validation.js';

export function createRoutes(eventBus: EventBus): Router {
  const router = Router();
  const jwtSecret = process.env.JWT_SECRET || '';
  const auth = verifyJwt(jwtSecret);
  const adminOrInspector = requireRoles(UserRole.ADMIN, UserRole.INSPECTOR);
  const portalUserOnly = requireRoles(UserRole.USER);
  const controller = createAssetController(eventBus);

  router.get('/assets', auth, validateQuery(assetQuerySchema), controller.listAssets);
  router.get('/assets/:id', auth, controller.getAsset);
  router.get('/assets/:id/timeline', auth, controller.getTimeline);

  router.post('/assets', auth, adminOrInspector, validateBody(registerAssetSchema), controller.registerAsset);
  router.patch('/assets/:id', auth, adminOrInspector, validateBody(updateAssetSchema), controller.updateAsset);
  router.delete('/assets/:id', auth, controller.deleteAsset);
  router.post(
    '/assets/:id/service-records',
    auth,
    adminOrInspector,
    validateBody(serviceRecordSchema),
    controller.addServiceRecord
  );
  router.post('/assets/:id/book-refill', auth, portalUserOnly, controller.bookRefill);

  return router;
}
