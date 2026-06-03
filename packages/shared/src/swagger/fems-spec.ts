import { SERVICE_PORTS } from '../constants/index.js';
import { openApiComponents, standardTags } from './components.js';
import { mergePaths } from './helpers.js';
import { authPaths } from './specs/auth.js';
import { assetPaths } from './specs/asset.js';
import { serviceRequestPaths } from './specs/service-request.js';
import { notificationPaths } from './specs/notification.js';
import { reportingPaths } from './specs/reporting.js';
import { op } from './helpers.js';

export interface FemsSpecOptions {
  /** Public base URL shown in Swagger "Servers" (e.g. http://localhost:4000) */
  serverUrl?: string;
  /** When true, paths are prefixed for API gateway (/api/...) */
  gateway?: boolean;
}

const SERVICE_DOC_LINKS = `
Per-service Swagger UI (direct, development ports):
- Auth: http://localhost:${SERVICE_PORTS.AUTH}/api-docs
- Assets: http://localhost:${SERVICE_PORTS.ASSET}/api-docs
- Service requests: http://localhost:${SERVICE_PORTS.SERVICE_REQUEST}/api-docs
- Notifications: http://localhost:${SERVICE_PORTS.NOTIFICATION}/api-docs
- Reporting: http://localhost:${SERVICE_PORTS.REPORTING}/api-docs
`;

export function createFemsOpenApiSpec(options: FemsSpecOptions = {}) {
  const gateway = options.gateway ?? false;
  const serverUrl = options.serverUrl ?? `http://localhost:${SERVICE_PORTS.API_GATEWAY}`;

  const authBase = gateway ? '/api/auth' : '';
  const assetBase = gateway ? '/api' : '';
  const servicesBase = gateway ? '/api/services' : '/services';
  const notifBase = gateway ? '/api' : '';
  const reportsBase = gateway ? '/api/reports' : '/reports';
  const analyticsBase = gateway ? '/api/analytics' : '/analytics';

  const paths = mergePaths(
    {
      ...(gateway
        ? {
            '/health': op('get', {
              tags: ['Gateway'],
              summary: 'API gateway health',
              security: false,
            }),
          }
        : {}),
    },
    authPaths(authBase),
    assetPaths(assetBase),
    serviceRequestPaths(servicesBase),
    notificationPaths(notifBase),
    reportingPaths(reportsBase, analyticsBase)
  );

  return {
    openapi: '3.0.3',
    info: {
      title: gateway ? 'FEMS API Gateway' : 'FEMS Microservice API',
      version: '1.0.0',
      description: gateway
        ? `TWZ LTD Fire Extinguisher Management System — unified API documentation.\n\nAuthenticate via **POST /api/auth/login**, then use **Authorize** with \`Bearer <token>\`.\n\n${SERVICE_DOC_LINKS}`
        : 'FEMS microservice API. Use the API gateway spec for client integration.',
    },
    servers: [{ url: serverUrl, description: gateway ? 'API Gateway' : 'Service' }],
    tags: standardTags,
    paths,
    components: openApiComponents,
  };
}

function serviceSpec(
  title: string,
  description: string,
  serverUrl: string,
  paths: Record<string, unknown>
) {
  return {
    openapi: '3.0.3',
    info: { title, version: '1.0.0', description },
    servers: [{ url: serverUrl }],
    tags: standardTags,
    paths,
    components: openApiComponents,
  };
}

export function createAuthServiceOpenApiSpec(serverUrl = `http://localhost:${SERVICE_PORTS.AUTH}`) {
  return serviceSpec('FEMS Auth Service', 'Authentication, users, OTP', serverUrl, authPaths(''));
}

export function createAssetServiceOpenApiSpec(serverUrl = `http://localhost:${SERVICE_PORTS.ASSET}`) {
  return serviceSpec('FEMS Asset Service', 'Fire extinguisher assets', serverUrl, assetPaths(''));
}

export function createServiceRequestOpenApiSpec(serverUrl = `http://localhost:${SERVICE_PORTS.SERVICE_REQUEST}`) {
  return serviceSpec(
    'FEMS Service Request Service',
    'Maintenance requests',
    serverUrl,
    serviceRequestPaths('/services')
  );
}

export function createNotificationOpenApiSpec(serverUrl = `http://localhost:${SERVICE_PORTS.NOTIFICATION}`) {
  return serviceSpec(
    'FEMS Notification Service',
    'Notifications and templates',
    serverUrl,
    notificationPaths('')
  );
}

export function createReportingOpenApiSpec(serverUrl = `http://localhost:${SERVICE_PORTS.REPORTING}`) {
  return serviceSpec(
    'FEMS Reporting Service',
    'Reports and analytics',
    serverUrl,
    reportingPaths('/reports', '/analytics')
  );
}
