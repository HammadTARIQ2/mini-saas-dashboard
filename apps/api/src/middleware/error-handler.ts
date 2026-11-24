import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import type { ApiErrorBody } from '@mini-saas/shared';
import { HttpError } from '../lib/http-error.js';
import { logger } from '../lib/logger.js';

/** 404 for any route that was not matched. */
export const notFoundHandler: RequestHandler = (req) => {
  throw HttpError.notFound(`Route ${req.method} ${req.originalUrl} not found`);
};

/**
 * Translate any thrown error into the standard `{ error: { code, message } }`
 * envelope. Known error types map to 4xx; everything else is logged and
 * returned as an opaque 500 so internals never leak to clients.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const httpError = toHttpError(err);

  if (httpError.status >= 500) {
    logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  }

  const body: ApiErrorBody = {
    error: {
      code: httpError.code,
      message: httpError.message,
      ...(httpError.details ? { details: httpError.details } : {}),
    },
  };
  res.status(httpError.status).json(body);
};

function toHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) return err;

  if (err instanceof z.ZodError) {
    const { fieldErrors, formErrors } = z.flattenError(err);
    const details = Object.fromEntries(
      Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => !!entry[1]),
    );
    if (formErrors.length) details._ = formErrors;
    return new HttpError(422, 'VALIDATION_ERROR', 'Request validation failed', details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return HttpError.badRequest(`Invalid value for "${err.path}"`);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([path, error]) => [path, [error.message]]),
    );
    return new HttpError(422, 'VALIDATION_ERROR', 'Request validation failed', details);
  }

  if (isDuplicateKeyError(err)) {
    return HttpError.conflict('A record with the same unique value already exists');
  }

  // Malformed JSON body (thrown by express.json())
  if (isBodyParserError(err)) {
    return HttpError.badRequest('Malformed JSON request body');
  }

  return new HttpError(500, 'INTERNAL_SERVER_ERROR', 'Something went wrong');
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;
}

function isBodyParserError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { type?: unknown }).type === 'entity.parse.failed'
  );
}
