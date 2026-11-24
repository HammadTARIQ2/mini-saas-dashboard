import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProjectModel } from '../src/modules/projects/project.model.js';
import { app, authenticate, createTeamMember, futureDate } from './helpers.js';

const BASE = '/api/v1/projects';

describe('Projects API', () => {
  let token: string;
  let assignee: string;

  const validProject = () => ({
    name: 'Website redesign',
    description: 'Refresh the marketing site',
    status: 'active',
    deadline: futureDate(),
    assignee,
    budget: 15000,
  });

  const create = (overrides: Record<string, unknown> = {}) =>
    request(app)
      .post(BASE)
      .set('Authorization', token)
      .send({ ...validProject(), ...overrides });

  beforeEach(async () => {
    token = await authenticate();
    assignee = await createTeamMember();
  });

  it('requires authentication', async () => {
    await request(app).get(BASE).expect(401);
    await request(app).post(BASE).send(validProject()).expect(401);
  });

  describe('POST /projects', () => {
    it('creates a project and populates the assignee', async () => {
      const res = await create().expect(201);

      expect(res.headers.location).toBe(`${BASE}/${res.body.id}`);
      expect(res.body).toMatchObject({
        name: 'Website redesign',
        status: 'active',
        budget: 15000,
        assignee: { id: assignee, name: 'Grace Hopper' },
      });
    });

    it('returns field-level validation errors', async () => {
      const res = await create({ name: '', status: 'archived', budget: -5 }).expect(422);
      expect(Object.keys(res.body.error.details)).toEqual(
        expect.arrayContaining(['name', 'status', 'budget']),
      );
    });

    it('rejects an assignee that does not exist', async () => {
      const res = await create({ assignee: '0123456789abcdef01234567' }).expect(422);
      expect(res.body.error.details.assignee).toBeDefined();
    });
  });

  describe('GET /projects', () => {
    beforeEach(async () => {
      const ada = await createTeamMember('Ada Lovelace');
      await create({ name: 'Alpha launch', status: 'active', budget: 1000 });
      await create({ name: 'Beta pricing', status: 'on_hold', budget: 2000 });
      await create({ name: 'Gamma analytics', status: 'completed', budget: 3000, assignee: ada });
    });

    it('lists projects with pagination metadata', async () => {
      const res = await request(app)
        .get(BASE)
        .query({ limit: 2 })
        .set('Authorization', token)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get(BASE)
        .query({ status: 'on_hold' })
        .set('Authorization', token)
        .expect(200);
      expect(res.body.data.map((p: { name: string }) => p.name)).toEqual(['Beta pricing']);
    });

    it('searches by project name (case-insensitive) and assignee name', async () => {
      const byName = await request(app)
        .get(BASE)
        .query({ search: 'ALPHA' })
        .set('Authorization', token)
        .expect(200);
      expect(byName.body.data.map((p: { name: string }) => p.name)).toEqual(['Alpha launch']);

      const byAssignee = await request(app)
        .get(BASE)
        .query({ search: 'lovelace' })
        .set('Authorization', token)
        .expect(200);
      expect(byAssignee.body.data.map((p: { name: string }) => p.name)).toEqual([
        'Gamma analytics',
      ]);
    });

    it('treats regex metacharacters in search as literals', async () => {
      const res = await request(app)
        .get(BASE)
        .query({ search: '.*' })
        .set('Authorization', token)
        .expect(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('sorts by budget', async () => {
      const res = await request(app)
        .get(BASE)
        .query({ sortBy: 'budget', sortOrder: 'asc' })
        .set('Authorization', token)
        .expect(200);
      expect(res.body.data.map((p: { budget: number }) => p.budget)).toEqual([1000, 2000, 3000]);
    });

    it('rejects invalid query parameters', async () => {
      await request(app)
        .get(BASE)
        .query({ status: 'unknown' })
        .set('Authorization', token)
        .expect(422);
    });
  });

  describe('GET /projects/stats', () => {
    it('aggregates totals, budget, overdue and per-status counts', async () => {
      await create({ status: 'active', budget: 100 });
      // The API refuses past deadlines, so insert historical projects directly.
      const past = { name: 'Legacy work', deadline: new Date('2020-01-01'), assignee };
      await ProjectModel.create({ ...past, status: 'active', budget: 200 }); // overdue
      await ProjectModel.create({ ...past, status: 'completed', budget: 300 }); // done, not overdue

      const res = await request(app).get(`${BASE}/stats`).set('Authorization', token).expect(200);
      expect(res.body).toEqual({
        total: 3,
        totalBudget: 600,
        overdue: 1,
        byStatus: { active: 2, on_hold: 0, completed: 1 },
      });
    });
  });

  describe('deadline rules', () => {
    const daysFromToday = (days: number) =>
      new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    it('rejects creating a project with a past deadline', async () => {
      const res = await create({ deadline: daysFromToday(-3) }).expect(422);
      expect(res.body.error.details.deadline).toEqual(['Deadline cannot be in the past']);
    });

    it('accepts today as a deadline', async () => {
      await create({ deadline: daysFromToday(0) }).expect(201);
    });

    it('rejects moving a deadline into the past', async () => {
      const { body: created } = await create().expect(201);
      const res = await request(app)
        .patch(`${BASE}/${created.id}`)
        .set('Authorization', token)
        .send({ deadline: daysFromToday(-10) })
        .expect(422);
      expect(res.body.error.details.deadline).toBeDefined();
    });

    it('still allows editing an overdue project when its deadline is unchanged', async () => {
      const overdue = await ProjectModel.create({
        name: 'Overdue work',
        status: 'active',
        deadline: new Date('2020-01-01'),
        budget: 500,
        assignee,
      });

      const res = await request(app)
        .patch(`${BASE}/${overdue.id}`)
        .set('Authorization', token)
        .send({ status: 'completed', deadline: '2020-01-01' })
        .expect(200);
      expect(res.body.status).toBe('completed');
    });
  });

  describe('single project routes', () => {
    it('reads, updates and deletes a project', async () => {
      const { body: created } = await create().expect(201);
      const url = `${BASE}/${created.id}`;

      await request(app).get(url).set('Authorization', token).expect(200);

      const updated = await request(app)
        .patch(url)
        .set('Authorization', token)
        .send({ status: 'completed', budget: 20000 })
        .expect(200);
      expect(updated.body).toMatchObject({
        status: 'completed',
        budget: 20000,
        name: created.name,
      });

      await request(app).delete(url).set('Authorization', token).expect(204);
      await request(app).get(url).set('Authorization', token).expect(404);
    });

    it('only changes the fields that were sent', async () => {
      const { body: created } = await create().expect(201);
      const res = await request(app)
        .patch(`${BASE}/${created.id}`)
        .set('Authorization', token)
        .send({ status: 'on_hold' })
        .expect(200);
      expect(res.body).toMatchObject({
        status: 'on_hold',
        description: created.description,
        budget: created.budget,
      });
    });

    it('rejects an empty update', async () => {
      const { body: created } = await create().expect(201);
      await request(app)
        .patch(`${BASE}/${created.id}`)
        .set('Authorization', token)
        .send({})
        .expect(422);
    });

    it('returns 404 for unknown and malformed ids', async () => {
      await request(app)
        .get(`${BASE}/0123456789abcdef01234567`)
        .set('Authorization', token)
        .expect(404);
      await request(app).get(`${BASE}/not-an-id`).set('Authorization', token).expect(404);
    });
  });
});
