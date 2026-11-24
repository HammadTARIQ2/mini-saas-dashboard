/**
 * Deadline rules shared by the API and the web app.
 *
 * Deadlines are calendar dates stored at UTC midnight. "Today" depends on the
 * user's time zone, so the server allows a one-day grace period: someone west
 * of UTC can still pick their local "today" even when it is already tomorrow
 * in UTC. The UI applies the stricter local-date rule on top of this.
 */
export const DEADLINE_GRACE_DAYS = 1;

export const PAST_DEADLINE_MESSAGE = 'Deadline cannot be in the past';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Earliest deadline the API accepts, as a UTC-midnight Date. */
export function earliestAllowedDeadline(now: Date = new Date()): Date {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(todayUtc - DEADLINE_GRACE_DAYS * DAY_MS);
}

/** True when `deadline` falls before the earliest allowed date. */
export function isDeadlineInPast(deadline: Date, now: Date = new Date()): boolean {
  return deadline.getTime() < earliestAllowedDeadline(now).getTime();
}
