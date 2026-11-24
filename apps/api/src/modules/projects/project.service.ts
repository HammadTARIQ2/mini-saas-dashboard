import type { QueryFilter, SortOrder } from 'mongoose';
import {
  isDeadlineInPast,
  PAST_DEADLINE_MESSAGE,
  PROJECT_STATUSES,
  type CreateProjectInput,
  type ListProjectsQuery,
  type Paginated,
  type Project,
  type ProjectStats,
  type ProjectStatus,
  type UpdateProjectInput,
} from '@mini-saas/shared';
import { HttpError } from '../../lib/http-error.js';
import { escapeRegex } from '../../lib/regex.js';
import { TeamMemberModel } from '../team-members/team-member.model.js';
import { type PopulatedProject, toProjectDto } from './project.mapper.js';
import { type ProjectAttrs, ProjectModel } from './project.model.js';

const ASSIGNEE_FIELDS = 'name email role';

/**
 * Build the Mongo filter for the list endpoint.
 * `search` matches the project name, description, or the assignee's name.
 */
async function buildListFilter(query: ListProjectsQuery): Promise<QueryFilter<ProjectAttrs>> {
  const filter: QueryFilter<ProjectAttrs> = {};

  if (query.status) filter.status = query.status;
  if (query.assignee) filter.assignee = query.assignee;

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    const matchingMembers = await TeamMemberModel.find({ name: pattern }).distinct('_id');
    filter.$or = [
      { name: pattern },
      { description: pattern },
      ...(matchingMembers.length ? [{ assignee: { $in: matchingMembers } }] : []),
    ];
  }

  return filter;
}

export async function listProjects(query: ListProjectsQuery): Promise<Paginated<Project>> {
  const filter = await buildListFilter(query);
  const direction: SortOrder = query.sortOrder === 'asc' ? 1 : -1;
  // `_id` as a tie-breaker keeps pagination stable when sort values are equal.
  const sort: Record<string, SortOrder> = { [query.sortBy]: direction, _id: direction };

  const [items, total] = await Promise.all([
    ProjectModel.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('assignee', ASSIGNEE_FIELDS)
      .lean<PopulatedProject[]>(),
    ProjectModel.countDocuments(filter),
  ]);

  return {
    data: items.map(toProjectDto),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getProject(id: string): Promise<Project> {
  const project = await ProjectModel.findById(id)
    .populate('assignee', ASSIGNEE_FIELDS)
    .lean<PopulatedProject>();
  if (!project) throw HttpError.notFound('Project not found');
  return toProjectDto(project);
}

async function assertAssigneeExists(assigneeId: string): Promise<void> {
  const exists = await TeamMemberModel.exists({ _id: assigneeId });
  if (!exists) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Request validation failed', {
      assignee: ['Assigned team member does not exist'],
    });
  }
}

export async function createProject(input: CreateProjectInput, userId: string): Promise<Project> {
  await assertAssigneeExists(input.assignee);
  const project = await ProjectModel.create({ ...input, createdBy: userId });
  return getProject(project.id as string);
}

/**
 * A past deadline is only rejected when it is being *changed*: an overdue
 * project must still be editable (e.g. to mark it completed) without forcing
 * a new date. The edit form resends every field, including the old deadline.
 */
async function assertDeadlineChangeAllowed(id: string, deadline: Date): Promise<void> {
  if (!isDeadlineInPast(deadline)) return;

  const existing = await ProjectModel.findById(id).select('deadline').lean();
  if (!existing) throw HttpError.notFound('Project not found');
  if (existing.deadline.getTime() !== deadline.getTime()) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Request validation failed', {
      deadline: [PAST_DEADLINE_MESSAGE],
    });
  }
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  if (input.assignee) await assertAssigneeExists(input.assignee);
  if (input.deadline) await assertDeadlineChangeAllowed(id, input.deadline);

  const updated = await ProjectModel.findByIdAndUpdate(id, input, {
    returnDocument: 'after',
    runValidators: true,
  })
    .populate('assignee', ASSIGNEE_FIELDS)
    .lean<PopulatedProject>();

  if (!updated) throw HttpError.notFound('Project not found');
  return toProjectDto(updated);
}

export async function deleteProject(id: string): Promise<void> {
  const deleted = await ProjectModel.findByIdAndDelete(id);
  if (!deleted) throw HttpError.notFound('Project not found');
}

/** Aggregate KPIs shown in the dashboard header cards. */
export async function getProjectStats(now = new Date()): Promise<ProjectStats> {
  const [result] = await ProjectModel.aggregate<{
    totals: { total: number; totalBudget: number }[];
    byStatus: { _id: ProjectStatus; count: number }[];
    overdue: { count: number }[];
  }>([
    {
      $facet: {
        totals: [{ $group: { _id: null, total: { $sum: 1 }, totalBudget: { $sum: '$budget' } } }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        overdue: [
          { $match: { deadline: { $lt: now }, status: { $ne: 'completed' } } },
          { $count: 'count' },
        ],
      },
    },
  ]);

  const byStatus = Object.fromEntries(PROJECT_STATUSES.map((status) => [status, 0])) as Record<
    ProjectStatus,
    number
  >;
  for (const { _id, count } of result?.byStatus ?? []) byStatus[_id] = count;

  return {
    total: result?.totals[0]?.total ?? 0,
    totalBudget: result?.totals[0]?.totalBudget ?? 0,
    overdue: result?.overdue[0]?.count ?? 0,
    byStatus,
  };
}
