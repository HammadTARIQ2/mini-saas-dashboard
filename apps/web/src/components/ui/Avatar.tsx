import { initials } from '@/lib/format';
import { cn } from '@/lib/cn';

const palette = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
];

/** Initials avatar with a colour derived from the name, so it is stable across renders. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        palette[hash % palette.length],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
