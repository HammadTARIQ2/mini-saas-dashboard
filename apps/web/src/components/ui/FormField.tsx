import { useId, type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  /** Render-prop receives the generated id and aria attributes for the control. */
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby'?: string;
  }) => ReactNode;
}

/** Label + control + error message, wired together for screen readers. */
export function FormField({ label, error, hint, children }: FormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': !!error,
        'aria-describedby': message ? messageId : undefined,
      })}
      {message && (
        <p id={messageId} className={error ? 'text-sm text-red-600' : 'text-sm text-slate-500'}>
          {message}
        </p>
      )}
    </div>
  );
}

/** Shared look for text inputs, selects and textareas. */
export const controlClasses =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 ' +
  'placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 ' +
  'aria-invalid:ring-red-400 aria-invalid:focus:ring-red-500 disabled:bg-slate-50 disabled:text-slate-500';
