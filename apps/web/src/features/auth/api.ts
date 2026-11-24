import type { AuthResponse, LoginInput, RegisterInput, User } from '@mini-saas/shared';
import { apiRequest } from '@/lib/api-client';

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input }),
  register: (input: RegisterInput) =>
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input }),
  me: () => apiRequest<User>('/auth/me'),
};
