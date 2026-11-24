import { logger } from '../lib/logger.js';

/**
 * Raw seed material. We try JSONPlaceholder first (as suggested by the brief)
 * and fall back to a bundled dataset so seeding also works offline / in CI.
 */

const JSONPLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com';

export interface SeedPerson {
  name: string;
  email: string;
  company: string;
}

export interface SeedPost {
  title: string;
  body: string;
}

const FALLBACK_PEOPLE: SeedPerson[] = [
  { name: 'Ava Thompson', email: 'ava.thompson@example.com', company: 'Design' },
  { name: 'Liam Carter', email: 'liam.carter@example.com', company: 'Engineering' },
  { name: 'Sofia Martinez', email: 'sofia.martinez@example.com', company: 'Product' },
  { name: 'Noah Patel', email: 'noah.patel@example.com', company: 'Engineering' },
  { name: 'Mia Chen', email: 'mia.chen@example.com', company: 'Marketing' },
  { name: 'Ethan Brooks', email: 'ethan.brooks@example.com', company: 'Data' },
  { name: 'Zara Ahmed', email: 'zara.ahmed@example.com', company: 'Operations' },
  { name: 'Lucas Rossi', email: 'lucas.rossi@example.com', company: 'Engineering' },
];

const FALLBACK_POSTS: SeedPost[] = [
  'Customer portal redesign',
  'Billing service migration',
  'Mobile onboarding flow',
  'Analytics data warehouse',
  'Marketing site refresh',
  'Internal admin tooling',
  'Payment gateway integration',
  'Search relevance tuning',
  'Accessibility audit',
  'Notification centre',
  'SSO for enterprise customers',
  'Usage-based pricing rollout',
].map((title) => ({ title, body: `Planning, delivery and launch of the ${title.toLowerCase()}.` }));

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${JSONPLACEHOLDER_URL}${path}`, {
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`GET ${path} responded ${response.status}`);
  return (await response.json()) as T;
}

export async function loadSeedSources(): Promise<{ people: SeedPerson[]; posts: SeedPost[] }> {
  try {
    const [users, posts] = await Promise.all([
      fetchJson<{ name: string; email: string; company: { bs: string } }[]>('/users'),
      fetchJson<SeedPost[]>('/posts'),
    ]);
    logger.info(`Fetched ${users.length} users and ${posts.length} posts from JSONPlaceholder`);
    return {
      people: users.map((user) => ({
        name: user.name,
        email: user.email.toLowerCase(),
        company: user.company.bs,
      })),
      posts,
    };
  } catch (err) {
    logger.warn({ err }, 'JSONPlaceholder unavailable — using bundled fallback data');
    return { people: FALLBACK_PEOPLE, posts: FALLBACK_POSTS };
  }
}
