import type { Project, ProjectSortField } from '@mini-saas/shared';
import { FolderOpen, Plus, RefreshCw, SearchX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { DeleteProjectDialog } from '../components/DeleteProjectDialog';
import { Pagination } from '../components/Pagination';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectsTable } from '../components/ProjectsTable';
import { ProjectsToolbar } from '../components/ProjectsToolbar';
import { StatsCards } from '../components/StatsCards';
import type { ProjectFormValues } from '../project-form-schema';
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useProjectStats,
  useTeamMembers,
  useUpdateProject,
} from '../queries';
import { useProjectFilters } from '../useProjectFilters';

export function ProjectsPage() {
  const { filters, update, reset, hasActiveFilters } = useProjectFilters();

  const projectsQuery = useProjects({
    search: filters.search || undefined,
    status: filters.status,
    assignee: filters.assignee,
    page: filters.page,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });
  const statsQuery = useProjectStats();
  const teamMembersQuery = useTeamMembers();

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  // `formOpen` and `editing` are separate so the modal keeps its content while animating out.
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    if (editing) {
      await updateProject.mutateAsync({ id: editing.id, payload: values });
      toast.success('Project updated');
    } else {
      await createProject.mutateAsync(values);
      toast.success('Project created');
    }
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProject.mutateAsync(deleting.id);
      toast.success(`Deleted “${deleting.name}”`);
      setDeleting(null);
      // Step back if we just removed the last row on a page.
      if (projectsQuery.data?.data.length === 1 && filters.page > 1) {
        update({ page: filters.page - 1 });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSort = (field: ProjectSortField) => {
    const sameField = filters.sortBy === field;
    update({
      sortBy: field,
      // Text columns start ascending; numbers/dates start descending.
      sortOrder: sameField
        ? filters.sortOrder === 'asc'
          ? 'desc'
          : 'asc'
        : field === 'name' || field === 'status'
          ? 'asc'
          : 'desc',
    });
  };

  const projects = projectsQuery.data?.data ?? [];
  const hasRows = !projectsQuery.isPending && !projectsQuery.isError && projects.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track status, deadlines, owners and budgets across your portfolio.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!teamMembersQuery.data}>
          <Plus className="size-4" aria-hidden="true" />
          New project
        </Button>
      </div>

      <StatsCards stats={statsQuery.data} loading={statsQuery.isPending} />

      <section className="space-y-4" aria-label="Project list">
        <ProjectsToolbar
          filters={filters}
          stats={statsQuery.data}
          teamMembers={teamMembersQuery.data ?? []}
          onChange={update}
        />

        {/* Desktop: one bordered panel. Mobile: the list renders as separate cards, so the
            panel styling only applies while loading / empty / error. */}
        <div
          className={cn(
            'relative md:overflow-hidden md:rounded-xl md:bg-white md:shadow-sm md:ring-1 md:ring-slate-200',
            !hasRows && 'overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200',
          )}
        >
          {projectsQuery.isFetching && !projectsQuery.isPending && (
            <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-indigo-500" />
          )}

          {projectsQuery.isPending ? (
            <div className="flex justify-center py-20">
              <Spinner className="size-8 text-indigo-600" />
            </div>
          ) : projectsQuery.isError ? (
            <EmptyState
              icon={RefreshCw}
              title="Could not load projects"
              description={getErrorMessage(projectsQuery.error)}
              action={
                <Button variant="secondary" onClick={() => projectsQuery.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : projects.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={SearchX}
                title="No matching projects"
                description="Try a different search term or clear the filters."
                action={
                  <Button variant="secondary" onClick={reset}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                description="Create your first project to start tracking it here."
                action={
                  <Button onClick={openCreate}>
                    <Plus className="size-4" aria-hidden="true" />
                    New project
                  </Button>
                }
              />
            )
          ) : (
            <>
              <ProjectsTable
                projects={projects}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onSort={handleSort}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
              <Pagination
                meta={projectsQuery.data.meta}
                onPageChange={(page) => update({ page })}
              />
            </>
          )}
        </div>
      </section>

      <ProjectFormModal
        open={formOpen}
        project={editing}
        teamMembers={teamMembersQuery.data ?? []}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <DeleteProjectDialog
        project={deleting}
        deleting={deleteProject.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
