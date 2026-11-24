import type { Project } from '@mini-saas/shared';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface DeleteProjectDialogProps {
  project: Project | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  project,
  deleting,
  onCancel,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <Modal
      open={!!project}
      onClose={deleting ? () => {} : onCancel}
      title="Delete project"
      size="sm"
    >
      <div className="flex gap-4 px-6 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
          <TriangleAlert className="size-5 text-rose-600" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900">{project?.name}</span>? This action cannot
          be undone.
        </p>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end sm:rounded-b-2xl">
        <Button variant="secondary" onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={deleting}>
          Delete project
        </Button>
      </div>
    </Modal>
  );
}
