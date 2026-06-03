import { Response } from 'express';
import { AuthRequest, successResponse, errorResponse } from '@fems/shared';
import { UserAdminService } from '../services/user-admin.service.js';
import { AuthError } from '../services/auth.errors.js';

export class UserController {
  constructor(private userAdminService = new UserAdminService()) {}

  list = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.userAdminService.listUsers(req.query as Record<string, unknown>);
      return successResponse(res, 'Users retrieved', result.users, 200, result.meta);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      const user = await this.userAdminService.getUser(req.params.id);
      return successResponse(res, 'User retrieved', user);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const user = await this.userAdminService.createUser(req.body);
      return successResponse(res, 'User created', user, 201);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const user = await this.userAdminService.updateUser(req.params.id, req.body);
      return successResponse(res, 'User updated', user);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown) {
    if (error instanceof AuthError) {
      return errorResponse(res, error.message, error.statusCode);
    }
    return errorResponse(res, (error as Error).message, 400);
  }
}
