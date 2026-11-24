import type { Project, ProjectStatus } from '@mini-saas/shared';
import type { Types } from 'mongoose';
import { type TeamMemberLike, toTeamMemberDto } from '../team-members/team-member.mapper.js';

/** Lean project with its `assignee` populated (or null if the member was removed). */
export interface PopulatedProject {
  _id: Types.ObjectId;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  deadline: Date;
  budget: number;
  assignee: TeamMemberLike | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toProjectDto(project: PopulatedProject): Project {
  return {
    id: project._id.toString(),
    name: project.name,
    description: project.description ?? '',
    status: project.status,
    deadline: project.deadline.toISOString(),
    budget: project.budget,
    assignee: project.assignee ? toTeamMemberDto(project.assignee) : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
