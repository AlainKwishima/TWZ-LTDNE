import { Response } from 'express';
import { NotificationChannel } from '../generated/prisma/index.js';
import { errorResponse, successResponse } from '@fems/shared';
import { TemplateService } from '../services/template.service.js';

export class TemplateController {
  constructor(private templateService: TemplateService) {}

  list = async (req: { query: Record<string, unknown> }, res: Response) => {
    const result = await this.templateService.list({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      channel: req.query.channel as NotificationChannel | undefined,
      eventType: req.query.eventType as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
    });
    return successResponse(res, 'Templates retrieved', result.templates, 200, result.meta);
  };

  getById = async (req: { params: { id: string } }, res: Response) => {
    const template = await this.templateService.getById(req.params.id);
    if (!template) return errorResponse(res, 'Template not found', 404);
    return successResponse(res, 'Template retrieved', template);
  };

  create = async (req: { body: Parameters<TemplateService['create']>[0] }, res: Response) => {
    try {
      const template = await this.templateService.create(req.body);
      return successResponse(res, 'Template created', template, 201);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        return errorResponse(res, 'Template code already exists', 409);
      }
      throw error;
    }
  };

  update = async (
    req: { params: { id: string }; body: Parameters<TemplateService['update']>[1] },
    res: Response
  ) => {
    try {
      const template = await this.templateService.update(req.params.id, req.body);
      return successResponse(res, 'Template updated', template);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return errorResponse(res, 'Template not found', 404);
      }
      throw error;
    }
  };

  remove = async (req: { params: { id: string } }, res: Response) => {
    try {
      const template = await this.templateService.remove(req.params.id);
      return successResponse(res, 'Template removed or deactivated', template);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return errorResponse(res, 'Template not found', 404);
      }
      throw error;
    }
  };
}
