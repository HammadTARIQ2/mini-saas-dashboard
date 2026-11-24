import bcrypt from 'bcryptjs';
import type { AuthResponse, LoginInput, RegisterInput, User } from '@mini-saas/shared';
import { HttpError } from '../../lib/http-error.js';
import { signAccessToken } from '../../lib/jwt.js';
import { toUserDto } from './auth.mapper.js';
import { UserModel, type UserDocument } from './user.model.js';

const BCRYPT_ROUNDS = 12;

function issueSession(user: UserDocument, rememberMe = false): AuthResponse {
  return {
    token: signAccessToken({ sub: user.id as string, email: user.email }, { rememberMe }),
    user: toUserDto(user),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = await UserModel.exists({ email: input.email });
  if (existing) {
    throw HttpError.conflict('An account with this email already exists');
  }

  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
  });

  return issueSession(user);
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await UserModel.findOne({ email: input.email }).select('+passwordHash');

  // Same message for unknown email and wrong password to avoid user enumeration.
  const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !valid) {
    throw HttpError.unauthorized('Invalid email or password');
  }

  return issueSession(user, input.rememberMe);
}

export async function getUserById(id: string): Promise<User> {
  const user = await UserModel.findById(id);
  if (!user) {
    throw HttpError.unauthorized('User no longer exists');
  }
  return toUserDto(user);
}
