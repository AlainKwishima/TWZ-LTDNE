import { mergePaths, op, pathParam, queryParam, requestJson } from '../helpers.js';

export function notificationPaths(base = '') {
  const p = (path: string) => `${base}${path}`;
  return mergePaths({
    [p('/health')]: op('get', { tags: ['Notifications'], summary: 'Notification service health', security: false }),
    [p('/notifications')]: {
      ...op('get', {
        tags: ['Notifications'],
        summary: 'List notifications',
        security: true,
        parameters: [
          queryParam('page', 'Page'),
          queryParam('limit', 'Limit'),
          queryParam('status', 'Status'),
          queryParam('channel', 'email | sms | in_app'),
          queryParam('unseenOnly', 'true | false'),
        ],
      }),
      ...op('post', {
        tags: ['Notifications'],
        summary: 'Create notification (Admin)',
        security: true,
        requestBody: requestJson('Create notification', {
          type: 'object',
          required: ['channel', 'body'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            channel: { type: 'string', enum: ['email', 'sms', 'in_app'] },
            subject: { type: 'string' },
            body: { type: 'string' },
            sendImmediately: { type: 'boolean' },
          },
        }),
      }),
    },
    [p('/notifications/user/{userId}')]: op('get', {
      tags: ['Notifications'],
      summary: 'Notifications for user',
      security: true,
      parameters: [pathParam('userId', 'User UUID')],
    }),
    [p('/notifications/{id}')]: op('get', {
      tags: ['Notifications'],
      summary: 'Get notification by ID',
      security: true,
      parameters: [pathParam('id', 'Notification UUID')],
    }),
    [p('/notifications/{id}/seen')]: op('patch', {
      tags: ['Notifications'],
      summary: 'Mark notification seen',
      security: true,
      parameters: [pathParam('id', 'Notification UUID')],
    }),
    [p('/notifications/{id}/acknowledge')]: op('patch', {
      tags: ['Notifications'],
      summary: 'Acknowledge notification',
      security: true,
      parameters: [pathParam('id', 'Notification UUID')],
    }),
    [p('/notifications/{id}/resend')]: op('post', {
      tags: ['Notifications'],
      summary: 'Resend notification (Admin)',
      security: true,
      parameters: [pathParam('id', 'Notification UUID')],
    }),
    [p('/templates')]: {
      ...op('get', { tags: ['Templates'], summary: 'List templates (Admin)', security: true }),
      ...op('post', {
        tags: ['Templates'],
        summary: 'Create template (Admin)',
        security: true,
        requestBody: requestJson('Template', {
          type: 'object',
          required: ['code', 'name', 'channel', 'body'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            channel: { type: 'string' },
            subject: { type: 'string' },
            body: { type: 'string' },
            htmlBody: { type: 'string' },
            eventType: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        }),
      }),
    },
    [p('/templates/{id}')]: {
      ...op('get', {
        tags: ['Templates'],
        summary: 'Get template (Admin)',
        security: true,
        parameters: [pathParam('id', 'Template UUID')],
      }),
      ...op('put', {
        tags: ['Templates'],
        summary: 'Update template (Admin)',
        security: true,
        parameters: [pathParam('id', 'Template UUID')],
        requestBody: requestJson('Template update', { type: 'object' }),
      }),
      ...op('delete', {
        tags: ['Templates'],
        summary: 'Delete template (Admin)',
        security: true,
        parameters: [pathParam('id', 'Template UUID')],
      }),
    },
    [p('/internal/compliance-alerts')]: op('post', { tags: ['Internal'], summary: 'Run compliance alerts', security: false }),
    [p('/internal/expiry-alerts')]: op('post', { tags: ['Internal'], summary: 'Run expiry alerts', security: false }),
    [p('/internal/sync-expiry-trackers')]: op('post', { tags: ['Internal'], summary: 'Sync expiry trackers', security: false }),
    [p('/internal/expiry-trackers/{assetId}/book-refill')]: op('post', {
      tags: ['Internal'],
      summary: 'Book refill on tracker (internal)',
      security: false,
      parameters: [pathParam('assetId', 'Asset UUID')],
      requestBody: requestJson('Book refill', {
        type: 'object',
        required: ['customerId'],
        properties: { customerId: { type: 'string', format: 'uuid' } },
      }),
    }),
    [p('/internal/service-request-event')]: op('post', {
      tags: ['Internal'],
      summary: 'Handle service request notification event',
      security: false,
    }),
    [p('/internal/asset-event')]: op('post', {
      tags: ['Internal'],
      summary: 'Handle asset notification event',
      security: false,
    }),
  });
}
