import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorResponse, mountSwagger } from '@fems/shared';
import { gatewayConfig } from './config/services.js';
import { createProxyRoutes } from './routes/proxy.routes.js';

const SERVICE_NAME = 'api-gateway';

async function bootstrap() {
  if (!gatewayConfig.jwtSecret) {
    console.warn(`[${SERVICE_NAME}] JWT_SECRET is not set; protected routes will reject tokens`);
  }

  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: gatewayConfig.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(morgan('combined'));
  app.set('trust proxy', 1);

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: SERVICE_NAME, status: 'ok' });
  });

  mountSwagger(app, {
    serviceName: SERVICE_NAME,
    description: 'API gateway — proxied routes are documented on each microservice.',
  });

  app.use(createProxyRoutes());

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(`[${SERVICE_NAME}] Unhandled error:`, err);
    errorResponse(res, 'Internal server error', 500);
  });

  app.listen(gatewayConfig.port, () => {
    console.log(`[${SERVICE_NAME}] Listening on port ${gatewayConfig.port}`);
    console.log(`[${SERVICE_NAME}] Frontend CORS origin: ${gatewayConfig.frontendUrl}`);
  });
}

bootstrap().catch((error) => {
  console.error(`[${SERVICE_NAME}] Failed to start:`, error);
  process.exit(1);
});
