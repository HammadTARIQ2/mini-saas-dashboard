import type { User } from '@mini-saas/shared';
import type { UserDocument } from './user.model.js';

export function toUserDto(user: UserDocument): User {
  return {
    id: user.id as string,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}
