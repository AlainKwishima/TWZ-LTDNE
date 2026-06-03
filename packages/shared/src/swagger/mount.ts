import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export interface SwaggerMountOptions {
  serviceName: string;
  version?: string;
  description?: string;
  paths?: Record<string, unknown>;
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
  app.get('/api-docs.json', (_req, res) => res.json(spec));
  app.use(basePath, swaggerUi.serve, swaggerUi.setup(spec));
}
