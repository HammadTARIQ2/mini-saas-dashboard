import { Router } from 'express';
import mongoose from 'mongoose';

export const healthRouter = Router();

/** Liveness/readiness probe used by Docker and hosting platforms. */
healthRouter.get('/', (_req, res) => {
  const dbReady = mongoose.connection.readyState === mongoose.ConnectionStates.connected;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'ok' : 'degraded',
    database: dbReady ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
