import {
  PAGINATION,
  PROJECT_SORT_FIELDS,
  PROJECT_STATUSES,
  type ProjectSortField,
  type ProjectStatus,
  type SortOrder,
} from '@mini-saas/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface ProjectFilterState {
  search: string;
  status: ProjectStatus | undefined;
  assignee: string | undefined;
  page: number;
  sortBy: ProjectSortField;
  sortOrder: SortOrder;
}

const DEFAULTS = { sortBy: 'createdAt', sortOrder: 'desc' } as const;

const isOneOf = <T extends string>(values: readonly T[], value: string | null): value is T =>
  value !== null && (values as readonly string[]).includes(value);

/**
 * Filters, sorting and pagination live in the URL query string so views are
 * shareable, bookmarkable and survive a refresh. Unknown values are ignored.
 */
export function useProjectFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<ProjectFilterState>(() => {
    const status = params.get('status');
    const sortBy = params.get('sortBy');
    const page = Number(params.get('page'));

    return {
      search: params.get('q') ?? '',
      status: isOneOf(PROJECT_STATUSES, status) ? status : undefined,
      assignee: params.get('assignee') ?? undefined,
      page: Number.isInteger(page) && page > 0 ? page : PAGINATION.DEFAULT_PAGE,
      sortBy: isOneOf(PROJECT_SORT_FIELDS, sortBy) ? sortBy : DEFAULTS.sortBy,
      sortOrder: params.get('sortOrder') === 'asc' ? 'asc' : DEFAULTS.sortOrder,
    };
  }, [params]);

  /** Apply a patch to the URL. Any change other than `page` resets to page 1. */
  const update = useCallback(
    (patch: Partial<ProjectFilterState>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          const set = (key: string, value: string | number | undefined) => {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          };

          if ('search' in patch) set('q', patch.search);
          if ('status' in patch) set('status', patch.status);
          if ('assignee' in patch) set('assignee', patch.assignee);
          if ('sortBy' in patch) set('sortBy', patch.sortBy);
          if ('sortOrder' in patch) set('sortOrder', patch.sortOrder);

          if ('page' in patch) set('page', patch.page === 1 ? undefined : patch.page);
          else next.delete('page');

          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const reset = useCallback(() => setParams({}, { replace: true }), [setParams]);

  const hasActiveFilters = !!(filters.search || filters.status || filters.assignee);

  return { filters, update, reset, hasActiveFilters };
}
