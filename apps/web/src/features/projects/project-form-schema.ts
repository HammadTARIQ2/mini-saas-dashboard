import {
  PAST_DEADLINE_MESSAGE,
  PROJECT_LIMITS,
  PROJECT_STATUSES,
  objectIdSchema,
} from '@mini-saas/shared';
import { z } from 'zod';

/**
 * Client-side form schema. Mirrors the API's `createProjectSchema` but keeps
 * `deadline` as the `YYYY-MM-DD` string produced by `<input type="date">`;
 * the API coerces it to a Date and re-validates everything server-side.
 */
export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(PROJECT_LIMITS.NAME_MIN, `Name must be at least ${PROJECT_LIMITS.NAME_MIN} characters`)
    .max(PROJECT_LIMITS.NAME_MAX, `Name must be at most ${PROJECT_LIMITS.NAME_MAX} characters`),
  description: z
    .string()
    .trim()
    .max(
      PROJECT_LIMITS.DESCRIPTION_MAX,
      `Keep it under ${PROJECT_LIMITS.DESCRIPTION_MAX} characters`,
    ),
  status: z.enum(PROJECT_STATUSES, { error: 'Select a status' }),
  assignee: objectIdSchema.or(z.literal('')).refine(Boolean, 'Select a team member'),
  deadline: z.iso.date({ error: 'Pick a deadline' }),
  budget: z
    .number({ error: 'Enter a budget' })
    .nonnegative('Budget cannot be negative')
    .max(PROJECT_LIMITS.BUDGET_MAX, 'Budget is too large'),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface DeadlineRuleOptions {
  /** Today's date in the user's time zone (`YYYY-MM-DD`). */
  today: string;
  /** When editing, the stored deadline — kept valid even if already past. */
  currentDeadline?: string;
}

/**
 * Form schema with the deadline rule applied: the deadline must be today or
 * later, unless it is the unchanged deadline of a project being edited (so an
 * overdue project can still be updated, e.g. marked as completed).
 */
export function createProjectFormSchema({ today, currentDeadline }: DeadlineRuleOptions) {
  return projectFormSchema.extend({
    deadline: projectFormSchema.shape.deadline.refine(
      (deadline) => deadline >= today || deadline === currentDeadline,
      PAST_DEADLINE_MESSAGE,
    ),
  });
}
