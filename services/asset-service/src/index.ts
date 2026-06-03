import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { EventBus, successResponse, mountSwagger } from '@fems/shared';
import { createRoutes } from './routes/index.js';
import { AssetService, ExpiryCronService } from './services/asset.service.js';
import { listAssetsForExpiryWatch } from './services/expiry-watch.service.js';
import { listAssetsForMaintenanceWatch } from './services/maintenance-watch.service.js';
import { triggerExpiryAlerts } from './clients/notification.client.js';

const PORT = parseInt(process.env.PORT || '4005', 10);
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 2 * * *';
const EXPIRY_WARNING_DAYS = parseInt(process.env.EXPIRY_WARNING_DAYS || '60', 10);
const EXPIRY_RUN_ON_STARTUP = process.env.EXPIRY_RUN_ON_STARTUP !== 'false';

async function bootstrap() {
  const app = express();
  const eventBus = new EventBus(RABBITMQ_URL, 'asset-service');
  await eventBus.connect();

  const expiryCron = new ExpiryCronService(eventBus);
  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      const result = await expiryCron.runExpiryCheck(EXPIRY_WARNING_DAYS);
      console.log('[AssetService] Expiry cron completed:', result);
      await triggerExpiryAlerts();
    } catch (error) {
      console.error('[AssetService] Expiry cron failed:', error);
    }
  });
  console.log(`[AssetService] Expiry cron scheduled: ${CRON_SCHEDULE}`);

  if (EXPIRY_RUN_ON_STARTUP) {
    void expiryCron.runExpiryCheck(EXPIRY_WARNING_DAYS).then((result) => {
      console.log('[AssetService] Startup expiry check completed:', result);
    }).catch((error) => {
      console.error('[AssetService] Startup expiry check failed:', error);
    });
  }

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    successResponse(res, 'Asset service is healthy', { service: 'asset-service' });
  });

  mountSwagger(app, { serviceName: 'asset-service' });

  app.post('/internal/expiry-check', async (_req, res) => {
    try {
      const result = await expiryCron.runExpiryCheck(EXPIRY_WARNING_DAYS);
      successResponse(res, 'Expiry check completed', result);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/internal/assets/expiry-watch', async (_req, res) => {
    try {
      const assets = await listAssetsForExpiryWatch();
      successResponse(res, 'Assets for expiry tracking', assets);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/internal/assets/maintenance-watch', async (_req, res) => {
    try {
      const assets = await listAssetsForMaintenanceWatch();
      successResponse(res, 'Assets for maintenance tracking', assets);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.use('/', createRoutes(eventBus));

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[AssetService] Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  const server = app.listen(PORT, () => {
    console.log(`[AssetService] Running on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await eventBus.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((error) => {
  console.error('[AssetService] Failed to start:', error);
  process.exit(1);
});
