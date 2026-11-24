import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { isTest } from '../../config/env.js';
import { requireAuth } from '../../middleware/require-auth.js';
import * as controller from './auth.controller.js';

/** Throttle credential endpoints to slow down brute-force attempts. */
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => isTest,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, try again later' } },
});

export const authRouter = Router();

authRouter.post('/register', credentialsLimiter, controller.register);
authRouter.post('/login', credentialsLimiter, controller.login);
authRouter.get('/me', requireAuth, controller.me);
