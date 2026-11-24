import { zodResolver } from '@hookform/resolvers/zod';
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type Project,
  type TeamMember,
} from '@mini-saas/shared';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { controlClasses, FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { ApiError, getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { localTodayIsoDate, toDateInputValue } from '@/lib/format';
import { createProjectFormSchema, type ProjectFormValues } from '../project-form-schema';

interface ProjectFormModalProps {
  open: boolean;
  /** When provided the form edits this project; otherwise it creates a new one. */
  project?: Project | null;
  teamMembers: TeamMember[];
  onClose: () => void;
  /** Persist the values. Throwing an `ApiError` surfaces its messages in the form. */
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}

const EMPTY_VALUES: ProjectFormValues = {
  name: '',
  description: '',
  status: 'active',
  assignee: '',
  deadline: '',
  budget: Number.NaN,
};

function toFormValues(project?: Project | null): ProjectFormValues {
  if (!project) return EMPTY_VALUES;
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    assignee: project.assignee?.id ?? '',
    deadline: toDateInputValue(project.deadline),
    budget: project.budget,
  };
}

/** Modal form used for both creating and editing a project. */
export function ProjectFormModal({
  open,
  project,
  teamMembers,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const isEdit = !!project;
  const [formError, setFormError] = useState<string | null>(null);

  // Past dates are blocked, except an overdue project's existing deadline.
  const today = localTodayIsoDate();
  const currentDeadline = project ? toDateInputValue(project.deadline) : undefined;
  const minDeadline = currentDeadline && currentDeadline < today ? currentDeadline : today;
  const schema = useMemo(
    () => createProjectFormSchema({ today, currentDeadline }),
    [today, currentDeadline],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(project),
  });

  // Re-initialise whenever the modal opens for a different project.
  useEffect(() => {
    if (open) reset(toFormValues(project));
  }, [open, project, reset]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      // Map server-side field errors back onto the matching inputs.
      if (error instanceof ApiError && error.details) {
        let mapped = false;
        for (const [field, messages] of Object.entries(error.details)) {
          if (field in EMPTY_VALUES && messages[0]) {
            setError(field as keyof ProjectFormValues, { message: messages[0] });
            mapped = true;
          }
        }
        if (mapped) return;
      }
      setFormError(getErrorMessage(error));
    }
  });

  const handleClose = () => {
    if (isSubmitting) return;
    setFormError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit project' : 'New project'}
      description={
        isEdit ? 'Update the project details below.' : 'Add a project to your workspace.'
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="space-y-5 px-6 py-5">
          {formError && <FormAlert message={formError} />}

          <FormField label="Project name" error={errors.name?.message}>
            {(field) => (
              <input
                {...field}
                {...register('name')}
                placeholder="e.g. Customer portal redesign"
                className={controlClasses}
                data-autofocus
              />
            )}
          </FormField>

          <FormField label="Description" error={errors.description?.message} hint="Optional">
            {(field) => (
              <textarea
                {...field}
                {...register('description')}
                rows={3}
                placeholder="What is this project about?"
                className={cn(controlClasses, 'resize-none')}
              />
            )}
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Status" error={errors.status?.message}>
              {(field) => (
                <select {...field} {...register('status')} className={controlClasses}>
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PROJECT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <FormField label="Assigned to" error={errors.assignee?.message}>
              {(field) => (
                <select {...field} {...register('assignee')} className={controlClasses}>
                  <option value="" disabled>
                    Select a team member
                  </option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <FormField label="Deadline" error={errors.deadline?.message}>
              {(field) => (
                <input
                  {...field}
                  {...register('deadline')}
                  type="date"
                  min={minDeadline}
                  className={controlClasses}
                />
              )}
            </FormField>

            <FormField label="Budget (USD)" error={errors.budget?.message}>
              {(field) => (
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400">
                    $
                  </span>
                  <input
                    {...field}
                    {...register('budget', { valueAsNumber: true })}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    placeholder="0"
                    className={cn(controlClasses, 'pl-7')}
                  />
                </div>
              )}
            </FormField>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end sm:rounded-b-2xl">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
