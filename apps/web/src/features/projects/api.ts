import type {
  ListProjectsQuery,
  Paginated,
  Project,
  ProjectStats,
  TeamMember,
} from '@mini-saas/shared';
import { apiRequest } from '@/lib/api-client';
import type { ProjectFormValues } from './project-form-schema';

export type ProjectFilters = Partial<ListProjectsQuery>;

export const projectsApi = {
  list: (filters: ProjectFilters, signal?: AbortSignal) =>
    apiRequest<Paginated<Project>>('/projects', { query: filters, signal }),
  stats: () => apiRequest<ProjectStats>('/projects/stats'),
  create: (payload: ProjectFormValues) =>
    apiRequest<Project>('/projects', { method: 'POST', body: payload }),
  update: (id: string, payload: Partial<ProjectFormValues>) =>
    apiRequest<Project>(`/projects/${id}`, { method: 'PATCH', body: payload }),
  remove: (id: string) => apiRequest<void>(`/projects/${id}`, { method: 'DELETE' }),
};

export const teamMembersApi = {
  list: () => apiRequest<{ data: TeamMember[] }>('/team-members').then((res) => res.data),
};
