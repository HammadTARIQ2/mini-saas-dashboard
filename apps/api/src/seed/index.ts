/**
 * CLI entry point: `npm run seed`
 * Connects using MONGODB_URI, resets the demo data and exits.
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { seedDatabase } from './seed.js';

try {
  await connectDatabase(env.MONGODB_URI);
  await seedDatabase();
  await disconnectDatabase();
  process.exit(0);
} catch (err) {
  logger.fatal({ err }, 'Seeding failed');
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
}
