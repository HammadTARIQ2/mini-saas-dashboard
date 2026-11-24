import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Populated by the `requireAuth` middleware for authenticated requests. */
      user?: {
        id: string;
        email: string;
      };
    }
  }
}
