import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
        M
      </span>
      <span className="text-base font-semibold tracking-tight text-slate-900">Mini SaaS</span>
    </div>
  );
}
