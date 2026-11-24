import request from 'supertest';
import { createApp } from '../src/app.js';
import { TeamMemberModel } from '../src/modules/team-members/team-member.model.js';

export const app = createApp();

export const testUser = {
  name: 'Test User',
  email: 'test.user@example.com',
  password: 'super-secret-pass',
};

/** Register a user and return a ready-to-use `Authorization` header value. */
export async function authenticate(): Promise<string> {
  const res = await request(app).post('/api/v1/auth/register').send(testUser).expect(201);
  return `Bearer ${res.body.token as string}`;
}

export async function createTeamMember(name = 'Grace Hopper') {
  const member = await TeamMemberModel.create({
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    role: 'Engineer',
  });
  return member.id as string;
}

export function futureDate(days = 30): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
