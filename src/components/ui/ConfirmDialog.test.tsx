import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('should not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Delete Tour"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText('Delete Tour')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Tour"
        message="Are you sure you want to delete this tour?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Delete Tour')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this tour?')).toBeInTheDocument();
  });

  it('should render default button labels', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Tour"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should render custom button labels', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Tour"
        message="Are you sure?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Tour"
        message="Are you sure?"
        onConfirm={mockConfirm}
        onCancel={vi.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    await user.click(confirmButton);

    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Tour"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={mockCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const mockCancel = vi.fn();

    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Tour"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={mockCancel}
      />
    );

    const backdrop = screen.getByTestId('dialog-backdrop');
    expect(backdrop).toBeInTheDocument();

    await user.click(backdrop);
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('should apply destructive styling when isDestructive is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Tour"
        message="This action cannot be undone"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDestructive={true}
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveClass('btn-danger');
  });

  it('should apply primary styling when isDestructive is false', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Start Round"
        message="Ready to begin?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDestructive={false}
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveClass('btn-primary');
  });

  it('should display warning icon when isDestructive is true', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Tour"
        message="This action cannot be undone"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDestructive={true}
      />
    );

    const iconContainer = screen.getByTestId('icon-destructive');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should display info icon when isDestructive is false', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        title="Start Round"
        message="Ready to begin?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDestructive={false}
      />
    );

    const iconContainer = screen.getByTestId('icon-info');
    expect(iconContainer).toBeInTheDocument();
  });
});
