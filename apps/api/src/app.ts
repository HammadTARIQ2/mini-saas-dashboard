import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env, isProduction, isTest } from './config/env.js';
import { httpLogger } from './lib/http-logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';

/**
 * Build the Express application. Kept separate from `server.ts` so tests can
 * mount the app with supertest without opening a network port.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Respect X-Forwarded-* headers when running behind a reverse proxy (nginx, Render, etc.)
  if (isProduction) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  if (!isTest) app.use(httpLogger);

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
