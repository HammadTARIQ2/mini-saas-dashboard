import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

interface SignOptionsInput {
  /** Use the longer "Remember me" lifetime instead of the default. */
  rememberMe?: boolean;
}

export function signAccessToken(
  payload: AccessTokenPayload,
  { rememberMe = false }: SignOptionsInput = {},
): string {
  const expiresIn = rememberMe ? env.JWT_REMEMBER_EXPIRES_IN : env.JWT_EXPIRES_IN;
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: expiresIn as SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

/** Verify a token and return its payload. Throws if invalid or expired. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Malformed token payload');
  }
  return { sub: decoded.sub, email: String(decoded.email) };
}
