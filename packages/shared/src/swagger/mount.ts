import type { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createFemsOpenApiSpec } from './fems-spec.js';

export interface SwaggerMountOptions {
  serviceName: string;
  version?: string;
  description?: string;
  /** Full OpenAPI document; when set, other path options are ignored */
  spec?: Record<string, unknown>;
  paths?: Record<string, unknown>;
  serverUrl?: string;
  gateway?: boolean;
}

function defaultPaths(serviceName: string): Record<string, unknown> {
  return {
    '/health': {
      get: {
        tags: [serviceName],
        summary: 'Health check',
        responses: { '200': { description: 'Service is healthy' } },
      },
    },
  };
}

export function createOpenApiSpec(options: SwaggerMountOptions) {
  if (options.spec) return options.spec;
  if (options.gateway || options.serverUrl) {
    return createFemsOpenApiSpec({
      serverUrl: options.serverUrl,
      gateway: options.gateway,
    });
  }
  return {
    openapi: '3.0.3',
    info: {
      title: options.serviceName,
      version: options.version ?? '1.0.0',
      description: options.description ?? `${options.serviceName} API`,
    },
    paths: options.paths ?? defaultPaths(options.serviceName),
  };
}

export function mountSwagger(app: Express, options: SwaggerMountOptions, basePath = '/api-docs'): void {
  const spec = createOpenApiSpec(options);

  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.json(spec);
  });

  app.use(
    basePath,
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: `${options.serviceName} API`,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );
}
