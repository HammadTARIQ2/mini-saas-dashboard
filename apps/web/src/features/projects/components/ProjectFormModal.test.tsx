import type { Project, TeamMember } from '@mini-saas/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { localTodayIsoDate } from '@/lib/format';
import { ProjectFormModal } from './ProjectFormModal';

const members: TeamMember[] = [
  { id: 'a'.repeat(24), name: 'Ada Lovelace', email: 'ada@example.com', role: 'Engineer' },
  { id: 'b'.repeat(24), name: 'Alan Turing', email: 'alan@example.com', role: 'Engineer' },
];

const project: Project = {
  id: 'c'.repeat(24),
  name: 'Existing project',
  description: 'Already in flight',
  status: 'on_hold',
  deadline: '2030-01-15T00:00:00.000Z',
  budget: 4200,
  assignee: members[1]!,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

function renderModal(props: Partial<Parameters<typeof ProjectFormModal>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <ProjectFormModal
      open
      teamMembers={members}
      onClose={vi.fn()}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { onSubmit, user: userEvent.setup() };
}

describe('<ProjectFormModal />', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const { onSubmit, user } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Create project' }));

    expect(await screen.findByText(/name must be at least/i)).toBeInTheDocument();
    // Errors are announced via aria-describedby on the matching control.
    expect(screen.getByLabelText('Assigned to')).toHaveAccessibleDescription(
      'Select a team member',
    );
    expect(screen.getByLabelText('Deadline')).toHaveAccessibleDescription('Pick a deadline');
    expect(screen.getByLabelText('Budget (USD)')).toHaveAccessibleDescription('Enter a budget');
    expect(screen.getByLabelText('Budget (USD)')).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits typed values for a new project', async () => {
    const { onSubmit, user } = renderModal();

    await user.type(screen.getByLabelText('Project name'), 'Launch v2');
    await user.selectOptions(screen.getByLabelText('Assigned to'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Deadline'), '2030-05-01');
    await user.type(screen.getByLabelText('Budget (USD)'), '15000');
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Launch v2',
        description: '',
        status: 'active',
        assignee: members[0]!.id,
        deadline: '2030-05-01',
        budget: 15000,
      }),
    );
  });

  it('pre-fills the form when editing', () => {
    renderModal({ project });

    expect(screen.getByRole('heading', { name: 'Edit project' })).toBeInTheDocument();
    expect(screen.getByLabelText('Project name')).toHaveValue('Existing project');
    expect(screen.getByLabelText('Status')).toHaveValue('on_hold');
    expect(screen.getByLabelText('Assigned to')).toHaveValue(members[1]!.id);
    expect(screen.getByLabelText('Deadline')).toHaveValue('2030-01-15');
    expect(screen.getByLabelText('Budget (USD)')).toHaveValue(4200);
  });

  it('maps server-side field errors onto inputs', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(422, 'VALIDATION_ERROR', 'Request validation failed', {
        name: ['Name already taken'],
      }),
    );
    const { user } = renderModal({ project, onSubmit });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Name already taken')).toBeInTheDocument();
  });

  describe('deadline rules', () => {
    const overdueProject: Project = { ...project, deadline: '2020-01-15T00:00:00.000Z' };

    it('blocks past dates in the picker and rejects a typed past date', async () => {
      const { onSubmit, user } = renderModal();
      const deadline = screen.getByLabelText('Deadline');

      expect(deadline).toHaveAttribute('min', localTodayIsoDate());

      await user.type(screen.getByLabelText('Project name'), 'Back-dated');
      await user.selectOptions(screen.getByLabelText('Assigned to'), 'Ada Lovelace');
      await user.type(deadline, '2020-01-01');
      await user.type(screen.getByLabelText('Budget (USD)'), '100');
      await user.click(screen.getByRole('button', { name: 'Create project' }));

      await waitFor(() =>
        expect(deadline).toHaveAccessibleDescription('Deadline cannot be in the past'),
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('lets an overdue project be saved with its unchanged deadline', async () => {
      const { onSubmit, user } = renderModal({ project: overdueProject });

      await user.selectOptions(screen.getByLabelText('Status'), 'Completed');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'completed', deadline: '2020-01-15' }),
        ),
      );
    });

    it('does not allow moving an overdue deadline to another past date', async () => {
      const { onSubmit, user } = renderModal({ project: overdueProject });
      const deadline = screen.getByLabelText('Deadline');

      await user.clear(deadline);
      await user.type(deadline, '2020-02-01');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() =>
        expect(deadline).toHaveAccessibleDescription('Deadline cannot be in the past'),
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
