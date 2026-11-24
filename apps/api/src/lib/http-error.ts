/**
 * An error that maps directly onto an HTTP response.
 * Throw it anywhere in a request handler; the error middleware serialises it.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message: string, details?: Record<string, string[]>) {
    return new HttpError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new HttpError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new HttpError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new HttpError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string) {
    return new HttpError(409, 'CONFLICT', message);
  }
}
