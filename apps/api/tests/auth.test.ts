import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, authenticate, testUser } from './helpers.js';

describe('Auth API', () => {
  it('registers a user and returns a token without leaking the password hash', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser).expect(201);

    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: testUser.name, email: testUser.email });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate emails with 409', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser).expect(201);
    const res = await request(app).post('/api/v1/auth/register').send(testUser).expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('validates the registration payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: 'short' })
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.details)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
  });

  it('logs in with valid credentials (email is case-insensitive)', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser).expect(201);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email.toUpperCase(), password: testUser.password })
      .expect(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects invalid credentials with a generic message', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser).expect(201);
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrong-password' })
      .expect(401);
    const unknownUser = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever' })
      .expect(401);
    expect(wrongPassword.body.error.message).toBe(unknownUser.body.error.message);
  });

  it('issues a longer-lived token when rememberMe is set', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser).expect(201);
    const lifetime = async (rememberMe?: boolean) => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password, rememberMe })
        .expect(200);
      const { iat, exp } = jwt.decode(res.body.token) as { iat: number; exp: number };
      return exp - iat;
    };

    expect(await lifetime()).toBe(24 * 60 * 60); // JWT_EXPIRES_IN default: 1d
    expect(await lifetime(true)).toBe(30 * 24 * 60 * 60); // JWT_REMEMBER_EXPIRES_IN default: 30d
  });

  it('returns the current user from /me', async () => {
    const token = await authenticate();
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', token).expect(200);
    expect(res.body.email).toBe(testUser.email);
  });

  it('rejects missing or invalid tokens', async () => {
    await request(app).get('/api/v1/auth/me').expect(401);
    await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer nope').expect(401);
  });
});
