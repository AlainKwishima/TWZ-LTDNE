import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import {
  AssetEventPayload,
  DomainEvent,
  EventBus,
  EventType,
  SERVICE_PORTS,
  ServiceCompletedPayload,
  successResponse,
} from '@fems/shared';
import { NotificationService } from './services/notification.service.js';
import { prisma } from './prisma/client.js';
import { TemplateService } from './services/template.service.js';
import { ExpiryCronService } from './services/expiry-cron.service.js';
import { ComplianceCronService } from './services/compliance-cron.service.js';
import { mountSwagger } from '@fems/shared';
import { bootstrapNotificationTemplates } from './services/template-bootstrap.js';
import { createNotificationRoutes, createTemplateRoutes } from './routes/notification.routes.js';
import { EmailService } from './services/email.service.js';

const PORT = parseInt(process.env.PORT || String(SERVICE_PORTS.NOTIFICATION), 10);
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 8,20 * * *';
const COMPLIANCE_CRON_SCHEDULE = process.env.COMPLIANCE_CRON_SCHEDULE || '0 9 * * *';
const EXPIRY_RUN_ON_STARTUP = process.env.EXPIRY_RUN_ON_STARTUP !== 'false';
const SERVICE_NAME = 'notification-service';

async function runExpiryPipeline(
  expiryCron: ExpiryCronService,
  notificationService: NotificationService,
  label: string
) {
  const synced = await notificationService.syncExpiryTrackersFromAssets();
  const result = await expiryCron.runDailyExpiryAlerts();
  console.log(`[${SERVICE_NAME}] ${label}:`, { synced, ...result });
}

async function bootstrap() {
  const app = express();
  const emailService = new EmailService();

  try {
    await emailService.ensureReady();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email service failed to start';
    console.error(`[${SERVICE_NAME}] Email configuration error: ${message}`);
  }

  const eventBus = new EventBus(RABBITMQ_URL, SERVICE_NAME);
  const notificationService = new NotificationService(eventBus);
  const templateService = new TemplateService();
  const expiryCron = new ExpiryCronService(notificationService);
  const complianceCron = new ComplianceCronService(notificationService);

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    successResponse(res, 'Notification service is healthy', { service: SERVICE_NAME });
  });

  mountSwagger(app, { serviceName: SERVICE_NAME });

  app.post('/internal/compliance-alerts', async (_req, res) => {
    try {
      const result = await complianceCron.runMaintenanceReminders();
      successResponse(res, 'Compliance alerts processed', result);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/internal/expiry-alerts', async (_req, res) => {
    try {
      const result = await expiryCron.runDailyExpiryAlerts();
      successResponse(res, 'Expiry alerts processed', result);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/internal/sync-expiry-trackers', async (_req, res) => {
    try {
      const result = await notificationService.syncExpiryTrackersFromAssets();
      successResponse(res, 'Expiry trackers synced', result);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/internal/expiry-trackers/:assetId/book-refill', async (req, res) => {
    try {
      const { customerId } = req.body as { customerId?: string };
      if (!customerId) {
        return res.status(400).json({ success: false, message: 'customerId is required' });
      }
      const tracker = await notificationService.bookRefillForAsset(req.params.assetId, customerId);
      successResponse(res, 'Refill recorded for expiry tracking', tracker);
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/internal/service-request-event', async (req, res) => {
    try {
      const { eventType, payload } = req.body as {
        eventType: string;
        payload: Record<string, unknown>;
      };
      if (!eventType || !payload?.serviceRequestId) {
        return res
          .status(400)
          .json({ success: false, message: 'eventType and payload.serviceRequestId are required' });
      }
      await notificationService.handleServiceRequestEvent(eventType, payload);
      successResponse(res, 'Service request event processed');
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/internal/asset-event', async (req, res) => {
    try {
      const { eventType, payload } = req.body as {
        eventType: string;
        payload: AssetEventPayload & { userId?: string };
      };
      if (!eventType || !payload?.assetId) {
        return res.status(400).json({ success: false, message: 'eventType and payload.assetId are required' });
      }
      await notificationService.handleAssetEvent(eventType, payload);
      successResponse(res, 'Asset event processed');
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.use('/notifications', createNotificationRoutes(notificationService, process.env.JWT_SECRET || ''));
  app.use('/templates', createTemplateRoutes(templateService, process.env.JWT_SECRET || ''));

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(`[${SERVICE_NAME}] Unhandled error:`, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  await eventBus.connect();

  eventBus.on(EventType.ASSET_CREATED, async (event: DomainEvent) => {
    try {
      await notificationService.handleAssetCreated(event.payload as unknown as AssetEventPayload);
    } catch (error) {
      console.error(`[${SERVICE_NAME}] AssetCreated handler error:`, error);
    }
  });

  eventBus.on(EventType.ASSET_EXPIRING_SOON, async (event: DomainEvent) => {
    try {
      await notificationService.handleAssetExpiringSoon(event.payload as unknown as AssetEventPayload);
    } catch (error) {
      console.error(`[${SERVICE_NAME}] AssetExpiringSoon handler error:`, error);
    }
  });

  eventBus.on(EventType.ASSET_EXPIRED, async (event: DomainEvent) => {
    try {
      await notificationService.handleAssetExpired(event.payload as unknown as AssetEventPayload);
    } catch (error) {
      console.error(`[${SERVICE_NAME}] AssetExpired handler error:`, error);
    }
  });

  eventBus.on(EventType.SERVICE_COMPLETED, async (event: DomainEvent) => {
    try {
      await notificationService.handleServiceCompleted(event.payload as unknown as ServiceCompletedPayload);
    } catch (error) {
      console.error(`[${SERVICE_NAME}] ServiceCompleted handler error:`, error);
    }
  });

  await eventBus.subscribe([
    EventType.ASSET_CREATED,
    EventType.ASSET_EXPIRING_SOON,
    EventType.ASSET_EXPIRED,
    EventType.SERVICE_COMPLETED,
  ]);

  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      await runExpiryPipeline(expiryCron, notificationService, 'Expiry cron completed');
    } catch (error) {
      console.error(`[${SERVICE_NAME}] Expiry cron failed:`, error);
    }
  });
  console.log(`[${SERVICE_NAME}] Expiry cron scheduled: ${CRON_SCHEDULE}`);

  cron.schedule(COMPLIANCE_CRON_SCHEDULE, async () => {
    try {
      const result = await complianceCron.runMaintenanceReminders();
      console.log(`[${SERVICE_NAME}] Compliance cron completed:`, result);
    } catch (error) {
      console.error(`[${SERVICE_NAME}] Compliance cron failed:`, error);
    }
  });
  console.log(`[${SERVICE_NAME}] Compliance cron scheduled: ${COMPLIANCE_CRON_SCHEDULE}`);

  await bootstrapNotificationTemplates();

  if (EXPIRY_RUN_ON_STARTUP) {
    void runExpiryPipeline(expiryCron, notificationService, 'Startup expiry check completed').catch(
      (error) => console.error(`[${SERVICE_NAME}] Startup expiry check failed:`, error)
    );
  }

  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
  });

  const shutdown = async () => {
    await eventBus.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error(`[${SERVICE_NAME}] Failed to start:`, error);
  process.exit(1);
});
