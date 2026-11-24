import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@mini-saas/shared';
import { cn } from '@/lib/cn';

const styles: Record<ProjectStatus, { badge: string; dot: string }> = {
  active: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  on_hold: { badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  completed: { badge: 'bg-slate-100 text-slate-700 ring-slate-500/20', dot: 'bg-slate-400' },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        styles[status].badge,
      )}
    >
      <span className={cn('size-1.5 rounded-full', styles[status].dot)} aria-hidden="true" />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}
