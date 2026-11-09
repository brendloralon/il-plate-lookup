import Fastify, { type FastifyServerOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { createCkanClient, type CkanClient } from './ckan/client';
import { CKAN_BASE_URL } from './config/datasets';
import { registerVehicleRoutes } from './routes/vehicle';
import { createVehicleReportService } from './services/vehicleReport';

export interface AppOptions {
  logger?: FastifyServerOptions['logger'];
  client?: CkanClient;
  rateLimit?: { max: number; timeWindowMs: number };
  now?: () => Date;
}

export async function buildApp({
  logger = false,
  client = createCkanClient({ baseUrl: CKAN_BASE_URL }),
  rateLimit: limits = { max: 30, timeWindowMs: 60_000 },
  now,
}: AppOptions = {}) {
  const app = Fastify({ logger, trustProxy: true });

  await app.register(rateLimit, {
    max: limits.max,
    timeWindow: limits.timeWindowMs,
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'rate_limited',
      message: `Too many requests. Try again in ${context.after}.`,
    }),
  });

  const service = createVehicleReportService({
    client,
    now,
    onDatasetError: (source, error) => {
      app.log.warn({ source, err: error }, 'dataset lookup failed');
    },
  });

  app.get('/api/health', async () => ({ ok: true }));
  registerVehicleRoutes(app, service);

  return app;
}
