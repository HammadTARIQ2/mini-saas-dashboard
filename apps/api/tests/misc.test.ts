import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, authenticate, createTeamMember } from './helpers.js';

describe('Misc API behaviour', () => {
  it('reports health', async () => {
    const res = await request(app).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'connected' });
  });

  it('lists team members sorted by name', async () => {
    const token = await authenticate();
    await createTeamMember('Zed Last');
    await createTeamMember('Amy First');

    const res = await request(app)
      .get('/api/v1/team-members')
      .set('Authorization', token)
      .expect(200);
    expect(res.body.data.map((m: { name: string }) => m.name)).toEqual(['Amy First', 'Zed Last']);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nope').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
