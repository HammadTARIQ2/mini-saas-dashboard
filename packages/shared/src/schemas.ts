import { z } from 'zod';
import {
  PAGINATION,
  PASSWORD_MIN_LENGTH,
  PROJECT_LIMITS,
  PROJECT_SORT_FIELDS,
  PROJECT_STATUSES,
  SORT_ORDERS,
} from './constants.js';

/** A 24-character hex MongoDB ObjectId. */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/* -------------------------------------------------------------------------- */
/*                                    Auth                                    */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Projects                                  */
/* -------------------------------------------------------------------------- */

/**
 * Payload accepted when creating a project.
 * `deadline` accepts an ISO date/datetime string and is coerced to a Date.
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(PROJECT_LIMITS.NAME_MIN, `Name must be at least ${PROJECT_LIMITS.NAME_MIN} characters`)
    .max(PROJECT_LIMITS.NAME_MAX),
  description: z.string().trim().max(PROJECT_LIMITS.DESCRIPTION_MAX).optional().default(''),
  status: z.enum(PROJECT_STATUSES),
  deadline: z.coerce.date({ error: 'Deadline must be a valid date' }),
  assignee: objectIdSchema,
  budget: z.coerce
    .number({ error: 'Budget must be a number' })
    .nonnegative('Budget cannot be negative')
    .max(PROJECT_LIMITS.BUDGET_MAX),
});

/** Partial update: every field optional, but at least one must be supplied. */
export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

/** Query-string parameters accepted by `GET /projects`. */
export const listProjectsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  assignee: objectIdSchema.optional(),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  sortBy: z.enum(PROJECT_SORT_FIELDS).default('createdAt'),
  sortOrder: z.enum(SORT_ORDERS).default('desc'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
