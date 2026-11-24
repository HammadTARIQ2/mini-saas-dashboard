import { pino } from 'pino';
import { env, isProduction } from '../config/env.js';

/**
 * Structured JSON logger. In development the output is piped through
 * pino-pretty for readability; in production it stays as JSON for log shippers.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'password', '*.password'],
  ...(isProduction || env.NODE_ENV === 'test'
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, singleLine: true } } }),
});
