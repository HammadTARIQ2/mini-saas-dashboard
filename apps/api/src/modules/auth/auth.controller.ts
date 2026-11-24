import type { Request, Response } from 'express';
import { loginSchema, registerSchema } from '@mini-saas/shared';
import * as authService from './auth.service.js';

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  res.status(201).json(await authService.register(input));
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  res.json(await authService.login(input));
}

export async function me(req: Request, res: Response) {
  // `requireAuth` guarantees req.user is set.
  res.json(await authService.getUserById(req.user!.id));
}
