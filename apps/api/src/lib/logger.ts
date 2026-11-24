import { pino } from 'pino';
import { env, isProduction } from '../config/env.js';

/**
 * Structured JSON logger. In development the output is piped through
 * pino-pretty for readability; in production it stays as JSON for log shippers.
 * Credentials are redacted defensively in case a request object is ever logged.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    'password',
    '*.password',
  ],
  ...(isProduction || env.NODE_ENV === 'test'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:HH:MM:ss',
            // Request details are already in the message line.
            ignore: 'pid,hostname,req,res,responseTime',
          },
        },
      }),
});
