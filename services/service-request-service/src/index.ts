import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { EventBus, createServiceRequestOpenApiSpec, successResponse, mountSwagger } from '@fems/shared';
import { prisma } from './prisma/client.js';
import { ServiceRequestService } from './services/service-request.service.js';
import { createServiceRequestRoutes } from './routes/service-request.routes.js';
import { listOverdueInspections } from './services/inspection-overdue.service.js';

const PORT = parseInt(process.env.PORT || '4006', 10);
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const JWT_SECRET = process.env.JWT_SECRET;

async function bootstrap() {
  const app = express();
  const eventBus = new EventBus(RABBITMQ_URL, 'service-request-service');
  const serviceRequestService = new ServiceRequestService(eventBus);

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    successResponse(res, 'Service request service is healthy', {
      service: 'service-request-service',
    });
  });

  mountSwagger(app, {
    serviceName: 'service-request-service',
    spec: createServiceRequestOpenApiSpec(`http://localhost:${PORT}`),
  });

  app.get('/internal/inspections/overdue', async (req, res) => {
    try {
      const days = parseInt(String(req.query.days ?? '0'), 10);
      const data = await listOverdueInspections(Number.isNaN(days) ? 0 : days);
      successResponse(res, 'Overdue inspections', data);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.use('/services', createServiceRequestRoutes(serviceRequestService, JWT_SECRET));

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[service-request-service] Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  await eventBus.connect();

  app.listen(PORT, () => {
    console.log(`[service-request-service] Listening on port ${PORT}`);
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
  console.error('[service-request-service] Failed to start:', error);
  process.exit(1);
});
