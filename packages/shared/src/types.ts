import type { ProjectStatus } from './constants.js';

/**
 * Wire types — the JSON shapes returned by the REST API.
 * Dates are serialised as ISO-8601 strings.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline: string;
  budget: number;
  assignee: TeamMember | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ProjectStats {
  total: number;
  totalBudget: number;
  overdue: number;
  byStatus: Record<ProjectStatus, number>;
}

/** Standard error envelope returned for every non-2xx response. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
