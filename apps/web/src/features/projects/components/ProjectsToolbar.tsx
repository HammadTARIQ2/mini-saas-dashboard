import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStats,
  type ProjectStatus,
  type TeamMember,
} from '@mini-saas/shared';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { controlClasses } from '@/components/ui/FormField';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/cn';
import type { ProjectFilterState } from '../useProjectFilters';

interface ProjectsToolbarProps {
  filters: ProjectFilterState;
  stats?: ProjectStats;
  teamMembers: TeamMember[];
  onChange: (patch: Partial<ProjectFilterState>) => void;
}

const STATUS_TABS: (ProjectStatus | undefined)[] = [undefined, ...PROJECT_STATUSES];

/** Search box, status tabs and assignee filter. */
export function ProjectsToolbar({ filters, stats, teamMembers, onChange }: ProjectsToolbarProps) {
  // Local state keeps typing responsive; the URL is updated once typing pauses.
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) onChange({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced value
  }, [debouncedSearch]);

  // Sync the input when the URL changes from outside (e.g. "Clear filters", back button).
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    if (filters.search !== search.trim()) setSearch(filters.search);
  }

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Filter by status"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {STATUS_TABS.map((status) => {
          const selected = filters.status === status;
          const count = status ? stats?.byStatus[status] : stats?.total;
          return (
            <button
              key={status ?? 'all'}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange({ status })}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                selected
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
              )}
            >
              {status ? PROJECT_STATUS_LABELS[status] : 'All projects'}
              {count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs tabular-nums',
                    selected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/70 text-slate-600',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by project, description or assignee…"
            aria-label="Search projects"
            className={cn(controlClasses, 'pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden')}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <select
          value={filters.assignee ?? ''}
          onChange={(event) => onChange({ assignee: event.target.value || undefined })}
          aria-label="Filter by assignee"
          className={cn(controlClasses, 'sm:w-56')}
        >
          <option value="">All team members</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
