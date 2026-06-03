import { mergePaths, op, pathParam, queryParam, requestJson } from '../helpers.js';

const registerAssetBody = {
  type: 'object',
  required: ['ownerUserId', 'location', 'type', 'size', 'installationDate', 'expiryDate'],
  properties: {
    ownerUserId: { type: 'string', format: 'uuid' },
    location: { type: 'string' },
    type: { type: 'string' },
    size: { type: 'string' },
    installationDate: { type: 'string', format: 'date' },
    expiryDate: { type: 'string', format: 'date' },
    status: { $ref: '#/components/schemas/AssetStatus' },
    notes: { type: 'string' },
  },
};

export function assetPaths(base = '') {
  const p = (path: string) => `${base}${path}`;
  return mergePaths({
    [p('/health')]: op('get', { tags: ['Assets'], summary: 'Asset service health', security: false }),
    [p('/assets')]: {
      ...op('get', {
        tags: ['Assets'],
        summary: 'List fire extinguishers (scoped by role)',
        security: true,
        parameters: [
          queryParam('page', 'Page'),
          queryParam('limit', 'Limit'),
          queryParam('search', 'Search serial, type, location'),
          queryParam('customerId', 'Owner portal user ID'),
          queryParam('status', 'Asset status filter'),
          queryParam('type', 'Extinguisher type'),
          queryParam('size', 'Size'),
        ],
      }),
      ...op('post', {
        tags: ['Assets'],
        summary: 'Register asset (Admin, Inspector)',
        security: true,
        requestBody: requestJson('Register asset', registerAssetBody),
      }),
    },
    [p('/assets/{id}')]: {
      ...op('get', {
        tags: ['Assets'],
        summary: 'Get asset by ID',
        security: true,
        parameters: [pathParam('id', 'Asset UUID')],
      }),
      ...op('patch', {
        tags: ['Assets'],
        summary: 'Update asset (Admin, Inspector)',
        security: true,
        parameters: [pathParam('id', 'Asset UUID')],
        requestBody: requestJson('Update asset', {
          type: 'object',
          properties: {
            ownerUserId: { type: 'string', format: 'uuid' },
            location: { type: 'string' },
            type: { type: 'string' },
            size: { type: 'string' },
            installationDate: { type: 'string', format: 'date' },
            expiryDate: { type: 'string', format: 'date' },
            status: { $ref: '#/components/schemas/AssetStatus' },
            notes: { type: 'string' },
            nextServiceDate: { type: 'string', format: 'date-time' },
          },
        }),
      }),
      ...op('delete', {
        tags: ['Assets'],
        summary: 'Remove fire extinguisher (Admin/Inspector any; User own only)',
        security: true,
        parameters: [pathParam('id', 'Asset UUID')],
      }),
    },
    [p('/assets/{id}/timeline')]: op('get', {
      tags: ['Assets'],
      summary: 'Asset history and service records',
      security: true,
      parameters: [pathParam('id', 'Asset UUID')],
    }),
    [p('/assets/{id}/service-records')]: op('post', {
      tags: ['Assets'],
      summary: 'Add service record (Admin, Inspector)',
      security: true,
      parameters: [pathParam('id', 'Asset UUID')],
      requestBody: requestJson('Service record', {
        type: 'object',
        required: ['serviceType'],
        properties: {
          serviceType: { type: 'string' },
          serviceDate: { type: 'string', format: 'date-time' },
          technicianId: { type: 'string', format: 'uuid' },
          technicianName: { type: 'string' },
          notes: { type: 'string' },
          nextServiceDate: { type: 'string', format: 'date-time' },
          updateExpirationDate: { type: 'string', format: 'date-time' },
        },
      }),
    }),
    [p('/assets/{id}/book-refill')]: op('post', {
      tags: ['Assets'],
      summary: 'Book refill (portal User)',
      security: true,
      parameters: [pathParam('id', 'Asset UUID')],
    }),
    [p('/internal/expiry-check')]: op('post', {
      tags: ['Internal'],
      summary: 'Run expiry status check (internal)',
      security: false,
    }),
    [p('/internal/assets/expiry-watch')]: op('get', {
      tags: ['Internal'],
      summary: 'List assets for expiry watch (internal)',
      security: false,
    }),
    [p('/internal/assets/maintenance-watch')]: op('get', {
      tags: ['Internal'],
      summary: 'List assets for maintenance watch (internal)',
      security: false,
    }),
  });
}
