import { SERVICE_PORTS } from '@fems/shared';

const isProduction = process.env.NODE_ENV === 'production';

function serviceUrl(envKey: string, dockerHost: string, port: number): string {
  return process.env[envKey] || (isProduction ? `http://${dockerHost}:${port}` : `http://localhost:${port}`);
}

export const serviceUrls = {
  auth: serviceUrl('AUTH_SERVICE_URL', 'auth-service', SERVICE_PORTS.AUTH),
  asset: serviceUrl('ASSET_SERVICE_URL', 'asset-service', SERVICE_PORTS.ASSET),
  serviceRequest: serviceUrl('SERVICE_REQUEST_SERVICE_URL', 'service-request-service', SERVICE_PORTS.SERVICE_REQUEST),
  notification: serviceUrl('NOTIFICATION_SERVICE_URL', 'notification-service', SERVICE_PORTS.NOTIFICATION),
  reporting: serviceUrl('REPORTING_SERVICE_URL', 'reporting-service', SERVICE_PORTS.REPORTING),
} as const;

export const gatewayConfig = {
  port: parseInt(process.env.PORT || String(SERVICE_PORTS.API_GATEWAY), 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || '',
} as const;
