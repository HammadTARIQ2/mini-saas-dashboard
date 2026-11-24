import type { ProjectStatus } from '@mini-saas/shared';
import { logger } from '../lib/logger.js';
import { hashPassword } from '../modules/auth/auth.service.js';
import { UserModel } from '../modules/auth/user.model.js';
import { ProjectModel } from '../modules/projects/project.model.js';
import { TeamMemberModel } from '../modules/team-members/team-member.model.js';
import { createRandom } from './random.js';
import { loadSeedSources } from './sources.js';

/** Credentials for the demo account created by the seeder (documented in the README). */
export const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@minisaas.dev',
  password: 'Demo@12345',
} as const;

const ROLES = ['Engineer', 'Designer', 'Product Manager', 'QA Engineer', 'Data Analyst', 'DevOps'];
const DAY_MS = 24 * 60 * 60 * 1000;
const PROJECT_COUNT = 36;

/** "sunt aut facere repellat provident" -> "Sunt Aut Facere Repellat" */
function toProjectName(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function firstSentence(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1, 220);
}

/**
 * Reset the collections and insert a deterministic demo dataset:
 * one demo user, the team members and a set of projects across all statuses.
 */
export async function seedDatabase(): Promise<void> {
  const random = createRandom(20_240_601);
  const { people, posts } = await loadSeedSources();

  await Promise.all([
    UserModel.deleteMany({}),
    TeamMemberModel.deleteMany({}),
    ProjectModel.deleteMany({}),
  ]);
  logger.info('Cleared existing users, team members and projects');

  const demoUser = await UserModel.create({
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    passwordHash: await hashPassword(DEMO_USER.password),
  });

  const members = await TeamMemberModel.insertMany(
    people.map((person, index) => ({
      name: person.name,
      email: person.email,
      role: ROLES[index % ROLES.length],
    })),
  );

  const now = Date.now();
  const projects = posts.slice(0, PROJECT_COUNT).map((post) => {
    const status = random.weighted<ProjectStatus>([
      ['active', 5],
      ['on_hold', 2],
      ['completed', 3],
    ]);
    // Completed work sits in the past; active work mostly in the future (some overdue).
    const offsetDays =
      status === 'completed' ? -random.int(5, 180) : random.int(status === 'active' ? -20 : 5, 240);

    return {
      name: toProjectName(post.title),
      description: firstSentence(post.body),
      status,
      deadline: new Date(now + offsetDays * DAY_MS),
      budget: random.int(10, 500) * 500,
      assignee: random.pick(members)._id,
      createdBy: demoUser._id,
    };
  });

  await ProjectModel.insertMany(projects);

  logger.info(`Seeded 1 user, ${members.length} team members and ${projects.length} projects`);
  logger.info(`Demo login → ${DEMO_USER.email} / ${DEMO_USER.password}`);
}
