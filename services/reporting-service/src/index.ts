import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  DomainEvent,
  EventBus,
  EventType,
  SERVICE_PORTS,
  createReportingOpenApiSpec,
  successResponse,
  errorResponse,
  mountSwagger,
} from '@fems/shared';
import { prisma } from './prisma/client.js';
import { AnalyticsCacheService } from './services/analytics-cache.service.js';
import { createReportingRoutes } from './routes/report.routes.js';
import { ensureExportDir } from './services/export.service.js';

const PORT = parseInt(process.env.PORT || String(SERVICE_PORTS.REPORTING), 10);
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const JWT_SECRET = process.env.JWT_SECRET || '';
const SERVICE_NAME = 'reporting-service';

const ANALYTICS_EVENTS: EventType[] = [
  EventType.USER_REGISTERED,
  EventType.ASSET_CREATED,
  EventType.ASSET_EXPIRED,
  EventType.ASSET_EXPIRING_SOON,
  EventType.SERVICE_REQUESTED,
  EventType.SERVICE_COMPLETED,
  EventType.TECHNICIAN_ASSIGNED,
  EventType.NOTIFICATION_SENT,
  EventType.NOTIFICATION_ACKNOWLEDGED,
];

async function bootstrap() {
  ensureExportDir();

  const app = express();
  const eventBus = new EventBus(RABBITMQ_URL, SERVICE_NAME);
  const cacheService = new AnalyticsCacheService();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    successResponse(res, 'Reporting service is healthy', { service: SERVICE_NAME });
  });
  mountSwagger(app, {
    serviceName: SERVICE_NAME,
    spec: createReportingOpenApiSpec(`http://localhost:${PORT}`),
  });

  const { reportRoutes, analyticsRoutes } = createReportingRoutes(eventBus, cacheService, JWT_SECRET);
  app.use('/reports', reportRoutes);
  app.use('/analytics', analyticsRoutes);

  app.use((_req, res) => {
    errorResponse(res, 'Route not found', 404);
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(`[${SERVICE_NAME}] Unhandled error:`, err);
    errorResponse(res, 'Internal server error', 500);
  });

  await eventBus.connect();

  for (const eventType of ANALYTICS_EVENTS) {
    eventBus.on(eventType, async (event: DomainEvent) => {
      try {
        cacheService.handleEvent(event.type, event.payload as Record<string, unknown>);
      } catch (error) {
        console.error(`[${SERVICE_NAME}] Cache invalidation error for ${event.type}:`, error);
      }
    });
  }

  await eventBus.subscribe(ANALYTICS_EVENTS);

  const server = app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[${SERVICE_NAME}] ${signal} received, shutting down...`);
    server.close();
    await eventBus.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error(`[${SERVICE_NAME}] Failed to start:`, error);
  process.exit(1);
});
