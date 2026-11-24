/**
 * Vercel serverless entry point for the Express API.
 *
 * Vercel routes every `/api/*` request here (see vercel.json). The compiled
 * Express app from `apps/api/dist` handles the request exactly as it does when
 * run as a long-lived server; only the database connection is managed
 * differently: it is opened lazily and reused across warm invocations.
 */
import { createApp } from '../apps/api/dist/app.js';
import { connectDatabase } from '../apps/api/dist/config/database.js';
import { env } from '../apps/api/dist/config/env.js';

const app = createApp();

/** @type {Promise<unknown> | undefined} */
let connection;

function ensureDatabase() {
  connection ??= connectDatabase(env.MONGODB_URI).catch((err) => {
    // Allow the next invocation to retry instead of caching the failure.
    connection = undefined;
    throw err;
  });
  return connection;
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
export default async function handler(req, res) {
  try {
    await ensureDatabase();
  } catch {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database is unavailable, try again shortly',
        },
      }),
    );
    return;
  }
  return app(req, res);
}
