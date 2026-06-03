import { Router } from 'express';
import { verifyJwt, requireRoles, UserRole } from '@fems/shared';
import { UserController } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  listUsersQuerySchema,
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from '../validators/user.validators.js';

export function createUserRoutes(): Router {
  const router = Router();
  const controller = new UserController();
  const jwtSecret = process.env.JWT_SECRET || '';
  const adminOnly = [verifyJwt(jwtSecret), requireRoles(UserRole.ADMIN)];

  router.get('/users', ...adminOnly, validate(listUsersQuerySchema), controller.list);
  router.get('/users/:id', ...adminOnly, validate(userIdParamSchema), controller.getById);
  router.post('/users', ...adminOnly, validate(createUserSchema), controller.create);
  router.patch('/users/:id', ...adminOnly, validate(updateUserSchema), controller.update);

  return router;
}
