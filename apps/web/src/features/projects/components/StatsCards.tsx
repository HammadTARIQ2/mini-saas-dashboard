import type { ProjectStats } from '@mini-saas/shared';
import { AlarmClock, CircleCheck, FolderKanban, Wallet, type LucideIcon } from 'lucide-react';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';

interface StatCardProps {
  label: string;
  value: string;
  title?: string;
  icon: LucideIcon;
  tone: string;
}

function StatCard({ label, value, title, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900 tabular-nums" title={title}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function StatsCards({ stats, loading }: { stats?: ProjectStats; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl bg-slate-200/70" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Total projects"
        value={String(stats.total)}
        icon={FolderKanban}
        tone="bg-indigo-50 text-indigo-600"
      />
      <StatCard
        label="Active"
        value={String(stats.byStatus.active)}
        icon={CircleCheck}
        tone="bg-emerald-50 text-emerald-600"
      />
      <StatCard
        label="Overdue"
        value={String(stats.overdue)}
        icon={AlarmClock}
        tone="bg-rose-50 text-rose-600"
      />
      <StatCard
        label="Total budget"
        value={formatCompactCurrency(stats.totalBudget)}
        title={formatCurrency(stats.totalBudget)}
        icon={Wallet}
        tone="bg-amber-50 text-amber-600"
      />
    </div>
  );
}
