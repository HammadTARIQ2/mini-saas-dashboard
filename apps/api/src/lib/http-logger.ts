import type { IncomingMessage, ServerResponse } from 'node:http';
import { pinoHttp } from 'pino-http';
import { logger } from './logger.js';

const HEALTH_PATH = '/api/v1/health';

/** Express rewrites `req.url` inside sub-routers; `originalUrl` keeps the full path. */
const fullUrl = (req: IncomingMessage) =>
  (req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url;

/**
 * One concise line per request, e.g. `GET /api/v1/projects 200 42ms`.
 *
 * Only the method, URL and status are serialised — never headers — so tokens,
 * cookies from other localhost apps and other PII cannot end up in the logs.
 * Client errors log at `warn`, server errors at `error`.
 */
export const httpLogger = pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === HEALTH_PATH },
  serializers: {
    req: (req: IncomingMessage & { id?: unknown }) => ({
      id: req.id,
      method: req.method,
      url: fullUrl(req),
    }),
    res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) =>
    `${req.method} ${fullUrl(req)} ${res.statusCode} ${Math.round(responseTime)}ms`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${fullUrl(req)} ${res.statusCode} failed: ${err.message}`,
});
