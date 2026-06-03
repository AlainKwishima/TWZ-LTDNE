import { mergePaths, op, pathParam, queryParam, requestJson } from '../helpers.js';

export function serviceRequestPaths(base = '/services') {
  const p = (path: string) => `${base}${path}`;
  return mergePaths({
    [p('/health')]: op('get', { tags: ['Service Requests'], summary: 'Service request health', security: false }),
    [p('/requests')]: {
      ...op('get', {
        tags: ['Service Requests'],
        summary: 'List all requests (Admin)',
        security: true,
        parameters: [
          queryParam('page', 'Page'),
          queryParam('limit', 'Limit'),
          queryParam('status', 'Status filter'),
          queryParam('customerId', 'Customer ID'),
          queryParam('assetId', 'Asset ID'),
        ],
      }),
      ...op('post', {
        tags: ['Service Requests'],
        summary: 'Create maintenance request (User)',
        security: true,
        requestBody: requestJson('Create request', {
          type: 'object',
          required: ['assetId', 'type'],
          properties: {
            assetId: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            priority: { type: 'string' },
            description: { type: 'string' },
            scheduledDate: { type: 'string', format: 'date-time' },
          },
        }),
      }),
    },
    [p('/requests/my')]: op('get', {
      tags: ['Service Requests'],
      summary: 'My requests (User)',
      security: true,
      parameters: [queryParam('page', 'Page'), queryParam('limit', 'Limit'), queryParam('status', 'Status')],
    }),
    [p('/requests/assigned')]: op('get', {
      tags: ['Service Requests'],
      summary: 'Assigned requests (Inspector)',
      security: true,
      parameters: [queryParam('page', 'Page'), queryParam('limit', 'Limit'), queryParam('status', 'Status')],
    }),
    [p('/requests/{id}')]: op('get', {
      tags: ['Service Requests'],
      summary: 'Get request with activity history',
      security: true,
      parameters: [pathParam('id', 'Request UUID')],
    }),
    [p('/requests/{id}/assign')]: op('patch', {
      tags: ['Service Requests'],
      summary: 'Assign inspector (Admin)',
      security: true,
      parameters: [pathParam('id', 'Request UUID')],
      requestBody: requestJson('Assign', {
        type: 'object',
        required: ['technicianId'],
        properties: {
          technicianId: { type: 'string', format: 'uuid' },
          technicianName: { type: 'string' },
          scheduledDate: { type: 'string', format: 'date-time' },
        },
      }),
    }),
    [p('/requests/{id}/status')]: op('patch', {
      tags: ['Service Requests'],
      summary: 'Update status (Admin, Inspector)',
      security: true,
      parameters: [pathParam('id', 'Request UUID')],
      requestBody: requestJson('Status update', {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string' } },
      }),
    }),
    [p('/requests/{id}/notes')]: op('post', {
      tags: ['Service Requests'],
      summary: 'Add note to request',
      security: true,
      parameters: [pathParam('id', 'Request UUID')],
      requestBody: requestJson('Note', {
        type: 'object',
        required: ['note'],
        properties: { note: { type: 'string' } },
      }),
    }),
    [p('/requests/{id}/complete')]: op('post', {
      tags: ['Service Requests'],
      summary: 'Complete request (Inspector)',
      security: true,
      parameters: [pathParam('id', 'Request UUID')],
      requestBody: requestJson('Completion', {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          findings: { type: 'string' },
          recommendations: { type: 'string' },
        },
      }),
    }),
    [p('/internal/inspections/overdue')]: op('get', {
      tags: ['Internal'],
      summary: 'Overdue inspections (internal)',
      security: false,
      parameters: [queryParam('days', 'Grace days', { type: 'integer' })],
    }),
  });
}
