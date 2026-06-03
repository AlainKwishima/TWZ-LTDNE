import { Response } from 'express';
import {
  AuthRequest,
  getPortalCustomerId,
  successResponse,
  errorResponse,
  EventBus,
  UserRole,
} from '@fems/shared';
import { AssetService } from '../services/asset.service.js';

function getCustomerScope(req: AuthRequest): string | undefined {
  return getPortalCustomerId(req.user);
}

export function createAssetController(eventBus: EventBus) {
  const assetService = new AssetService(eventBus);

  return {
    async listAssets(req: AuthRequest, res: Response) {
      try {
        const scope = getCustomerScope(req);
        const result = await assetService.listAssets(req.query as Record<string, unknown>, scope);
        return successResponse(res, 'Assets retrieved', result.assets, 200, result.meta);
      } catch (error) {
        return errorResponse(res, (error as Error).message, 400);
      }
    },

    async getAsset(req: AuthRequest, res: Response) {
      try {
        const scope = getCustomerScope(req);
        const asset = await assetService.getAssetById(req.params.id, scope);
        if (!asset) return errorResponse(res, 'Asset not found', 404);
        return successResponse(res, 'Asset retrieved', asset);
      } catch (error) {
        return errorResponse(res, (error as Error).message, 400);
      }
    },

    async registerAsset(req: AuthRequest, res: Response) {
      try {
        const body = req.body as {
          ownerUserId: string;
          location: string;
          type: string;
          size: string;
          installationDate: string;
          expiryDate: string;
          status?: import('../generated/prisma/index.js').AssetStatus;
          notes?: string;
        };
        const asset = await assetService.registerAsset(
          {
            customerId: body.ownerUserId,
            location: body.location,
            type: body.type,
            size: body.size,
            installationDate: body.installationDate,
            expiryDate: body.expiryDate,
            status: body.status,
            notes: body.notes,
          },
          req.user?.userId
        );
        return successResponse(res, 'Asset registered successfully', asset, 201);
      } catch (error) {
        return errorResponse(res, (error as Error).message, 400);
      }
    },

    async updateAsset(req: AuthRequest, res: Response) {
      try {
        const body = req.body as {
          ownerUserId?: string;
          location?: string;
          type?: string;
          size?: string;
          installationDate?: string;
          expiryDate?: string;
          status?: import('../generated/prisma/index.js').AssetStatus;
          notes?: string;
          serviceDate?: string;
          nextServiceDate?: string;
        };
        const asset = await assetService.updateAsset(
          req.params.id,
          {
            ownerUserId: body.ownerUserId,
            location: body.location,
            type: body.type,
            size: body.size,
            installationDate: body.installationDate,
            expiryDate: body.expiryDate,
            status: body.status,
            notes: body.notes,
            serviceDate: body.serviceDate,
            nextServiceDate: body.nextServiceDate,
          },
          req.user?.userId
        );
        return successResponse(res, 'Asset updated', asset);
      } catch (error) {
        return errorResponse(res, (error as Error).message, 400);
      }
    },

    async addServiceRecord(req: AuthRequest, res: Response) {
      try {
        const result = await assetService.addServiceRecord(req.params.id, req.body, req.user?.userId);
        return successResponse(res, 'Service record added', result, 201);
      } catch (error) {
        return errorResponse(res, (error as Error).message, 400);
      }
    },

    async getTimeline(req: AuthRequest, res: Response) {
      try {
        const scope = getCustomerScope(req);
        const asset = await assetService.getAssetById(req.params.id, scope);
        if (!asset) return errorResponse(res, 'Asset not found', 404);

        const timeline = await assetService.getTimeline(req.params.id);
        return successResponse(res, 'Asset timeline retrieved', timeline);
      } catch (error) {
        return errorResponse(res, (error as Error).message, 400);
      }
    },

    async deleteAsset(req: AuthRequest, res: Response) {
      try {
        const role = req.user?.role;
        const scope = getCustomerScope(req);
        if (role === UserRole.USER) {
          if (!scope) {
            return errorResponse(res, 'Portal account scope required', 403);
          }
          const result = await assetService.deleteAsset(req.params.id, scope, req.user?.userId);
          return successResponse(res, 'Asset removed', result);
        }
        if (role === UserRole.ADMIN || role === UserRole.INSPECTOR) {
          const result = await assetService.deleteAsset(req.params.id, undefined, req.user?.userId);
          return successResponse(res, 'Asset removed', result);
        }
        return errorResponse(res, 'Not authorized to remove assets', 403);
      } catch (error) {
        const message = (error as Error).message;
        const status = message === 'Asset not found' ? 404 : 400;
        return errorResponse(res, message, status);
      }
    },

    async bookRefill(req: AuthRequest, res: Response) {
      try {
        const customerId = getPortalCustomerId(req.user);
        if (!customerId) {
          return errorResponse(res, 'Portal account scope required', 403);
        }
        const asset = await assetService.bookRefill(req.params.id, customerId);
        return successResponse(res, 'Refill booked successfully', asset);
      } catch (error) {
        return errorResponse(res, (error as Error).message, 400);
      }
    },
  };
}
