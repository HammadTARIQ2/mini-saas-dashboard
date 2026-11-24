import type { Project, ProjectSortField, SortOrder } from '@mini-saas/shared';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate, isPastDate } from '@/lib/format';
import { StatusBadge } from './StatusBadge';

interface ProjectsTableProps {
  projects: Project[];
  sortBy: ProjectSortField;
  sortOrder: SortOrder;
  onSort: (field: ProjectSortField) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const isOverdue = (project: Project) =>
  project.status !== 'completed' && isPastDate(project.deadline);

/**
 * Responsive project list: a sortable table from `md` up, stacked cards on
 * small screens (wide tables are unusable on phones).
 */
export function ProjectsTable(props: ProjectsTableProps) {
  return (
    <>
      <DesktopTable {...props} />
      <MobileList {...props} />
    </>
  );
}

function DesktopTable({
  projects,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: ProjectsTableProps) {
  const sortable = (field: ProjectSortField, label: string, align: 'left' | 'right' = 'left') => (
    <SortableHeader
      field={field}
      label={label}
      align={align}
      active={sortBy === field}
      order={sortOrder}
      onSort={onSort}
    />
  );

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50/80">
          <tr>
            {sortable('name', 'Project')}
            {sortable('status', 'Status')}
            <th scope="col" className={thClasses}>
              Assignee
            </th>
            {sortable('deadline', 'Deadline')}
            {sortable('budget', 'Budget', 'right')}
            <th scope="col" className={cn(thClasses, 'w-24')}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {projects.map((project) => (
            <tr key={project.id} className="group hover:bg-slate-50/60">
              <td className="max-w-xs px-4 py-3.5 lg:max-w-md">
                <p className="truncate font-medium text-slate-900">{project.name}</p>
                {project.description && (
                  <p className="truncate text-sm text-slate-500">{project.description}</p>
                )}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={project.status} />
              </td>
              <td className="px-4 py-3.5">
                <Assignee project={project} />
              </td>
              <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                <Deadline project={project} />
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-medium whitespace-nowrap text-slate-900 tabular-nums">
                {formatCurrency(project.budget)}
              </td>
              <td className="px-4 py-3.5">
                <RowActions project={project} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileList({ projects, onEdit, onDelete }: ProjectsTableProps) {
  return (
    <ul className="divide-y divide-slate-100 md:hidden">
      {projects.map((project) => (
        <li key={project.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{project.name}</p>
              {project.description && (
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{project.description}</p>
              )}
            </div>
            <StatusBadge status={project.status} />
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Deadline</dt>
              <dd>
                <Deadline project={project} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Budget</dt>
              <dd className="font-medium text-slate-900 tabular-nums">
                {formatCurrency(project.budget)}
              </dd>
            </div>
          </dl>
          <div className="flex items-center justify-between">
            <Assignee project={project} />
            <RowActions project={project} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const thClasses =
  'px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap';

interface SortableHeaderProps {
  field: ProjectSortField;
  label: string;
  align: 'left' | 'right';
  active: boolean;
  order: SortOrder;
  onSort: (field: ProjectSortField) => void;
}

function SortableHeader({ field, label, align, active, order, onSort }: SortableHeaderProps) {
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(thClasses, align === 'right' && 'text-right')}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          'inline-flex items-center gap-1 uppercase hover:text-slate-900',
          active && 'text-slate-900',
        )}
      >
        {label}
        <Icon className={cn('size-3.5', !active && 'opacity-40')} aria-hidden="true" />
      </button>
    </th>
  );
}

function Assignee({ project }: { project: Project }): ReactNode {
  if (!project.assignee) return <span className="text-sm text-slate-400">Unassigned</span>;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={project.assignee.name} className="size-7" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-700">{project.assignee.name}</p>
        <p className="hidden truncate text-xs text-slate-500 lg:block">{project.assignee.role}</p>
      </div>
    </div>
  );
}

function Deadline({ project }: { project: Project }) {
  const overdue = isOverdue(project);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        overdue ? 'text-rose-600' : 'text-slate-700',
      )}
    >
      {formatDate(project.deadline)}
      {overdue && (
        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700">
          Overdue
        </span>
      )}
    </span>
  );
}

interface RowActionsProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function RowActions({ project, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(project)}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
        aria-label={`Edit ${project.name}`}
        title="Edit"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(project)}
        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        aria-label={`Delete ${project.name}`}
        title="Delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
