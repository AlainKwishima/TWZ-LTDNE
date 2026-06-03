import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  EventBus,
  SERVICE_PORTS,
  createAuthServiceOpenApiSpec,
  errorResponse,
  successResponse,
  mountSwagger,
} from '@fems/shared';
import { prisma } from './prisma/client.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createUserRoutes } from './routes/user.routes.js';
import { emailService } from './services/email.service.js';

const PORT = parseInt(process.env.PORT || String(SERVICE_PORTS.AUTH), 10);
const SERVICE_NAME = 'auth-service';

async function bootstrap() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.set('trust proxy', 1);

  try {
    await emailService.ensureReady();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email service failed to start';
    console.error(`[${SERVICE_NAME}] Email configuration error: ${message}`);
  }

  const eventBus = new EventBus(
    process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    SERVICE_NAME
  );
  await eventBus.connect();

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: SERVICE_NAME, status: 'ok' });
  });

  mountSwagger(app, {
    serviceName: SERVICE_NAME,
    spec: createAuthServiceOpenApiSpec(`http://localhost:${PORT}`),
  });

  app.get('/internal/users/:id/contact', async (req, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      return successResponse(res, 'Contact retrieved', {
        id: user.id,
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phoneNumber: user.phoneNumber ?? '',
      });
    } catch (error) {
      return errorResponse(res, (error as Error).message, 500);
    }
  });

  app.use('/', createAuthRoutes(eventBus));
  app.use('/', createUserRoutes());

  app.use((_req, res) => {
    errorResponse(res, 'Route not found', 404);
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
      return errorResponse(res, 'Invalid JSON in request body', 400);
    }
    console.error(`[${SERVICE_NAME}] Unhandled error:`, err);
    errorResponse(res, 'Internal server error', 500);
  });

  const server = app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[${SERVICE_NAME}] Port ${PORT} is already in use. Stop the other auth-service process and restart.`
      );
      process.exit(1);
    }
    throw err;
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
