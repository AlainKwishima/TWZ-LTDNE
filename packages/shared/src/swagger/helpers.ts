type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface OpOptions {
  tags: string[];
  summary: string;
  description?: string;
  security?: boolean;
  parameters?: Record<string, unknown>[];
  requestBody?: Record<string, unknown>;
  responses?: Record<string, unknown>;
}

export function jsonResponse(description: string, schemaRef?: string): Record<string, unknown> {
  return {
    description,
    content: {
      'application/json': {
        schema: schemaRef ? { $ref: schemaRef } : { $ref: '#/components/schemas/ApiResponse' },
      },
    },
  };
}

export function op(method: HttpMethod, options: OpOptions): Record<string, unknown> {
  const operation: Record<string, unknown> = {
    tags: options.tags,
    summary: options.summary,
    description: options.description,
    responses: {
      '200': jsonResponse('Success'),
      '400': jsonResponse('Validation error', '#/components/schemas/ErrorResponse'),
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
      '500': jsonResponse('Server error', '#/components/schemas/ErrorResponse'),
      ...options.responses,
    },
  };
  if (options.security) {
    operation.security = [{ bearerAuth: [] }];
  }
  if (options.parameters?.length) {
    operation.parameters = options.parameters;
  }
  if (options.requestBody) {
    operation.requestBody = options.requestBody;
  }
  return { [method]: operation };
}

export function pathParam(name: string, description: string, schema: Record<string, unknown> = { type: 'string', format: 'uuid' }) {
  return { name, in: 'path', required: true, description, schema };
}

export function queryParam(name: string, description: string, schema: Record<string, unknown> = { type: 'string' }) {
  return { name, in: 'query', required: false, description, schema };
}

export function requestJson(description: string, schema: Record<string, unknown>, required = true) {
  return {
    required,
    content: {
      'application/json': {
        schema,
        description,
      },
    },
  };
}

export function mergePaths(...parts: Record<string, unknown>[]): Record<string, unknown> {
  return Object.assign({}, ...parts);
}

export function prefixPaths(prefix: string, paths: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, def] of Object.entries(paths)) {
    const key = path.startsWith(prefix) ? path : `${prefix}${path}`;
    out[key] = def;
  }
  return out;
}
