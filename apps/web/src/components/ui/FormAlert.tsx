import { CircleAlert } from 'lucide-react';

export function FormAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
