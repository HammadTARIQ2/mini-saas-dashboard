import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'lg';
  children: ReactNode;
}

/**
 * Accessible modal dialog (focus trap, Esc to close, scroll lock) built on
 * Headless UI, with enter/leave transitions.
 */
export function Modal({ open, onClose, title, description, size = 'lg', children }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
          <DialogPanel
            transition
            className={cn(
              'w-full rounded-t-2xl bg-white shadow-xl transition duration-200 ease-out sm:rounded-2xl',
              'data-closed:translate-y-4 data-closed:opacity-0 sm:data-closed:translate-y-0 sm:data-closed:scale-95',
              size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-xl',
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  {title}
                </DialogTitle>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
