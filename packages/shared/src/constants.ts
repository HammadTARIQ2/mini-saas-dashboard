/**
 * Lifecycle states a project can be in.
 * Stored verbatim in the database and used as filter values in the API.
 */
export const PROJECT_STATUSES = ['active', 'on_hold', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Human-readable labels for each status, used by the UI. */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
};

/** Fields the project list can be sorted by. */
export const PROJECT_SORT_FIELDS = ['name', 'deadline', 'budget', 'status', 'createdAt'] as const;
export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const PROJECT_LIMITS = {
  NAME_MIN: 3,
  NAME_MAX: 120,
  DESCRIPTION_MAX: 1000,
  BUDGET_MAX: 100_000_000,
} as const;

export const PASSWORD_MIN_LENGTH = 8;
