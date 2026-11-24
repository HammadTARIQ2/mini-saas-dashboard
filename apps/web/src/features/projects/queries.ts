import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, teamMembersApi, type ProjectFilters } from './api';
import type { ProjectFormValues } from './project-form-schema';

/** Hierarchical query keys — invalidating `all` refreshes lists and stats together. */
export const projectKeys = {
  all: ['projects'] as const,
  list: (filters: ProjectFilters) => [...projectKeys.all, 'list', filters] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
};

export function useProjects(filters: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: ({ signal }) => projectsApi.list(filters, signal),
    // Keep showing the current page while the next one loads (no flicker).
    placeholderData: keepPreviousData,
  });
}

export function useProjectStats() {
  return useQuery({ queryKey: projectKeys.stats(), queryFn: projectsApi.stats });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: teamMembersApi.list,
    staleTime: 5 * 60_000,
  });
}

function useInvalidateProjects() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: projectKeys.all });
}

export function useCreateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (payload: ProjectFormValues) => projectsApi.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProjectFormValues> }) =>
      projectsApi.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: invalidate,
  });
}
