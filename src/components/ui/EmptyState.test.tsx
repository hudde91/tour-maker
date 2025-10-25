import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  it('should render title and description', () => {
    render(
      <EmptyState
        icon="🏌️"
        title="No tours yet"
        description="Create your first golf tournament"
      />
    );

    expect(screen.getByText('No tours yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first golf tournament')).toBeInTheDocument();
    expect(screen.getByText('🏌️')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const mockAction = vi.fn();

    render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        action={{
          label: 'Create Tour',
          onClick: mockAction,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Tour' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-primary');
  });

  it('should call action onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn();

    render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        action={{
          label: 'Create Tour',
          onClick: mockAction,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Tour' });
    await user.click(button);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should render secondary action button', async () => {
    const mockSecondaryAction = vi.fn();

    render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        secondaryAction={{
          label: 'Learn More',
          onClick: mockSecondaryAction,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Learn More' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-secondary');
  });

  it('should call secondary action onClick when clicked', async () => {
    const user = userEvent.setup();
    const mockSecondaryAction = vi.fn();

    render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        secondaryAction={{
          label: 'Learn More',
          onClick: mockSecondaryAction,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Learn More' });
    await user.click(button);

    expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
  });

  it('should render both action and secondary action', () => {
    render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        action={{
          label: 'Create Tour',
          onClick: vi.fn(),
        }}
        secondaryAction={{
          label: 'Learn More',
          onClick: vi.fn(),
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Create Tour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn More' })).toBeInTheDocument();
  });

  it('should apply secondary variant to action button when specified', () => {
    render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        action={{
          label: 'Create Tour',
          onClick: vi.fn(),
          variant: 'secondary',
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Tour' });
    expect(button).toHaveClass('btn-secondary');
  });

  it('should apply correct size classes for small size', () => {
    const { container } = render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        size="small"
      />
    );

    const emptyStateContainer = container.firstChild as HTMLElement;
    expect(emptyStateContainer).toHaveClass('py-8');
  });

  it('should apply correct size classes for medium size (default)', () => {
    const { container } = render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
      />
    );

    const emptyStateContainer = container.firstChild as HTMLElement;
    expect(emptyStateContainer).toHaveClass('py-12');
  });

  it('should apply correct size classes for large size', () => {
    const { container } = render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        size="large"
      />
    );

    const emptyStateContainer = container.firstChild as HTMLElement;
    expect(emptyStateContainer).toHaveClass('py-16');
  });

  it('should render custom illustration instead of icon when provided', () => {
    const customIllustration = <div data-testid="custom-illustration">Custom</div>;

    render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        illustration={customIllustration}
      />
    );

    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
    // Icon should not be rendered when illustration is provided
    expect(screen.queryByText('🏌️')).not.toBeInTheDocument();
  });

  it('should apply card class when showCard is true (default)', () => {
    const { container } = render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
      />
    );

    const emptyStateContainer = container.firstChild as HTMLElement;
    expect(emptyStateContainer).toHaveClass('card');
  });

  it('should not apply card class when showCard is false', () => {
    const { container } = render(
      <EmptyState
        icon="🏌️"
        title="No tours"
        description="Get started"
        showCard={false}
      />
    );

    const emptyStateContainer = container.firstChild as HTMLElement;
    expect(emptyStateContainer).not.toHaveClass('card');
  });
});
