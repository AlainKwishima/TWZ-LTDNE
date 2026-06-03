import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { AuthRequest, errorResponse, forwardUserHeaders } from '@fems/shared';
import { serviceUrls } from '../config/services.js';
import {
  adminOnly,
  allAuthenticatedRoles,
  createRouteGuard,
  inspectorRoles,
  portalUserRoles,
} from '../middleware/auth.middleware.js';

function attachUserHeaders(proxyReq: import('http').ClientRequest, req: AuthRequest): void {
  const headers = forwardUserHeaders(req);
  for (const [key, value] of Object.entries(headers)) {
    proxyReq.setHeader(key, value);
  }
}

function prefixPath(basePath: string) {
  return (path: string) => {
    if (path === '/' || path === '') {
      return basePath;
    }
    return `${basePath}${path}`;
  };
}

function createServiceProxy(target: string, pathRewrite?: Options['pathRewrite']) {
  const options: Options = {
    target,
    changeOrigin: true,
    ...(pathRewrite ? { pathRewrite } : {}),
    on: {
      proxyReq: (proxyReq, req) => {
        attachUserHeaders(proxyReq, req as AuthRequest);
      },
      error: (err, _req, res) => {
        console.error('[api-gateway] Proxy error:', err.message);
        if ('writeHead' in res && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Upstream service unavailable' }));
        }
      },
    },
  };

  return createProxyMiddleware(options);
}

const authGuard = createRouteGuard({
  publicPaths: [
    '/api/auth/signup',
    '/api/auth/login',
    '/api/auth/google',
    '/api/auth/verify-otp',
    '/api/auth/resend-otp',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ],
  roleRules: [
    { methods: ['GET', 'POST', 'PATCH'], pattern: /^\/api\/auth\/users/, roles: adminOnly },
  ],
});

const assetGuard = createRouteGuard({
  roleRules: [
    { methods: ['POST'], pattern: /^\/api\/assets\/[^/]+\/book-refill$/, roles: portalUserRoles },
    { methods: ['POST', 'PATCH'], pattern: /^\/api\/assets/, roles: inspectorRoles },
    { methods: ['DELETE'], pattern: /^\/api\/assets\/[^/]+$/, roles: allAuthenticatedRoles },
    { methods: ['GET'], pattern: /^\/api\/assets/, roles: allAuthenticatedRoles },
  ],
});

const serviceRequestGuard = createRouteGuard({
  roleRules: [
    { methods: ['GET'], pattern: /^\/api\/services\/requests$/, roles: adminOnly },
    { methods: ['POST'], pattern: /^\/api\/services\/requests$/, roles: portalUserRoles },
    { methods: ['GET'], pattern: /^\/api\/services\/requests\/my$/, roles: portalUserRoles },
    { methods: ['GET'], pattern: /^\/api\/services\/requests\/assigned$/, roles: inspectorRoles },
    { methods: ['PATCH'], pattern: /^\/api\/services\/requests\/[^/]+\/assign$/, roles: adminOnly },
    { methods: ['PATCH'], pattern: /^\/api\/services\/requests\/[^/]+\/status$/, roles: inspectorRoles },
    {
      methods: ['GET'],
      pattern: /^\/api\/services\/requests\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      roles: allAuthenticatedRoles,
    },
    { methods: ['POST'], pattern: /^\/api\/services\/requests\/[^/]+\/notes$/, roles: allAuthenticatedRoles },
    { methods: ['POST'], pattern: /^\/api\/services\/requests\/[^/]+\/complete$/, roles: inspectorRoles },
  ],
});

const notificationGuard = createRouteGuard({
  roleRules: [
    {
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      pattern: /^\/api\/notifications/,
      roles: allAuthenticatedRoles,
    },
  ],
});

const reportingGuard = createRouteGuard({
  roleRules: [
    { methods: ['GET', 'POST'], pattern: /^\/api\/reports/, roles: allAuthenticatedRoles },
    { methods: ['GET'], pattern: /^\/api\/analytics\/dashboard$/, roles: adminOnly },
    { methods: ['GET'], pattern: /^\/api\/analytics\/user-dashboard$/, roles: portalUserRoles },
    { methods: ['GET'], pattern: /^\/api\/analytics\/inspector-dashboard$/, roles: inspectorRoles },
    { methods: ['GET'], pattern: /^\/api\/analytics\/customer-dashboard$/, roles: portalUserRoles },
    { methods: ['GET'], pattern: /^\/api\/analytics\/technician-dashboard$/, roles: inspectorRoles },
  ],
});

export function createProxyRoutes(): Router {
  const router = Router();

  router.use('/api/auth', authGuard, createServiceProxy(serviceUrls.auth));
  router.use('/api/assets', assetGuard, createServiceProxy(serviceUrls.asset, prefixPath('/assets')));
  router.use(
    '/api/services',
    serviceRequestGuard,
    createServiceProxy(serviceUrls.serviceRequest, prefixPath('/services'))
  );
  router.use(
    '/api/notifications',
    notificationGuard,
    createServiceProxy(serviceUrls.notification, prefixPath('/notifications'))
  );
  router.use('/api/reports', reportingGuard, createServiceProxy(serviceUrls.reporting, prefixPath('/reports')));
  router.use('/api/analytics', reportingGuard, createServiceProxy(serviceUrls.reporting, prefixPath('/analytics')));

  router.use((_req, res) => {
    errorResponse(res, 'Route not found', 404);
  });

  return router;
}
