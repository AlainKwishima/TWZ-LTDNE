import { mergePaths, op, pathParam, queryParam, requestJson } from '../helpers.js';

export function reportingPaths(reportsBase = '/reports', analyticsBase = '/analytics') {
  const rp = (path: string) => `${reportsBase}${path}`;
  const ap = (path: string) => `${analyticsBase}${path}`;
  return mergePaths({
    [rp('/')]: op('get', {
      tags: ['Reports'],
      summary: 'List generated reports (scoped by role)',
      security: true,
      parameters: [
        queryParam('page', 'Page'),
        queryParam('limit', 'Limit'),
        queryParam('reportType', 'Report type'),
        queryParam('status', 'pending | completed | failed'),
      ],
    }),
    [rp('/generate')]: op('post', {
      tags: ['Reports'],
      summary: 'Generate report',
      security: true,
      requestBody: requestJson('Generate report', {
        type: 'object',
        required: ['reportType'],
        properties: {
          reportType: {
            type: 'string',
            enum: ['asset_inventory', 'expired_assets', 'expiring_soon', 'service_requests', 'notifications'],
          },
          title: { type: 'string' },
          filters: {
            type: 'object',
            properties: {
              dateFrom: { type: 'string', format: 'date' },
              dateTo: { type: 'string', format: 'date' },
              customerId: { type: 'string', format: 'uuid' },
              status: { type: 'string' },
              technicianId: { type: 'string', format: 'uuid' },
            },
          },
        },
      }),
    }),
    [rp('/{id}/export/{format}')]: op('get', {
      tags: ['Reports'],
      summary: 'Download report export (pdf, csv, xlsx)',
      security: true,
      parameters: [
        pathParam('id', 'Report UUID'),
        pathParam('format', 'Export format', { type: 'string', enum: ['pdf', 'csv', 'xlsx'] }),
      ],
      responses: {
        '200': { description: 'File download' },
      },
    }),
    [ap('/dashboard')]: op('get', {
      tags: ['Analytics'],
      summary: 'Admin dashboard KPIs and charts',
      security: true,
      parameters: [queryParam('refresh', 'true to bypass cache')],
    }),
    [ap('/user-dashboard')]: op('get', {
      tags: ['Analytics'],
      summary: 'Portal user dashboard (extinguishers, requests)',
      security: true,
      parameters: [queryParam('refresh', 'true to bypass cache')],
    }),
    [ap('/customer-dashboard')]: op('get', {
      tags: ['Analytics'],
      summary: 'Customer dashboard (alias of user-dashboard)',
      security: true,
    }),
    [ap('/inspector-dashboard')]: op('get', {
      tags: ['Analytics'],
      summary: 'Inspector dashboard KPIs',
      security: true,
      parameters: [queryParam('technicianId', 'Inspector user ID')],
    }),
    [ap('/technician-dashboard')]: op('get', {
      tags: ['Analytics'],
      summary: 'Technician dashboard (alias)',
      security: true,
    }),
  });
}
