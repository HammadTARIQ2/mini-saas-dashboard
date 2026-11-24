import type { RequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';
import { verifyAccessToken } from '../lib/jwt.js';

/**
 * Reject the request unless it carries a valid `Authorization: Bearer <jwt>`
 * header. On success the decoded identity is attached to `req.user`.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const [scheme, token] = header?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw HttpError.unauthorized();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    throw HttpError.unauthorized('Invalid or expired token');
  }

  next();
};
