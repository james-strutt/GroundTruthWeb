import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { EmptyState } from '../EmptyState';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    renderWithRouter(
      <EmptyState icon={<span data-testid="icon">icon</span>} title="No items" subtitle="Add your first item" />,
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add your first item')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    renderWithRouter(
      <EmptyState icon={<span data-testid="icon">icon</span>} title="No items" subtitle="Nothing here" />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders CTA link when ctaTo and ctaLabel are provided', () => {
    renderWithRouter(
      <EmptyState
        icon={<span>icon</span>}
        title="No items"
        subtitle="Nothing here"
        ctaLabel="Create new"
        ctaTo="/app/new"
      />,
    );
    const link = screen.getByText('Create new');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/app/new');
  });

  it('does not render CTA when ctaTo is not provided', () => {
    renderWithRouter(
      <EmptyState
        icon={<span>icon</span>}
        title="No items"
        subtitle="Nothing here"
        ctaLabel="Create new"
      />,
    );
    expect(screen.queryByText('Create new')).not.toBeInTheDocument();
  });

  it('does not render CTA when ctaLabel is not provided', () => {
    renderWithRouter(
      <EmptyState
        icon={<span>icon</span>}
        title="No items"
        subtitle="Nothing here"
        ctaTo="/app/new"
      />,
    );
    const links = screen.queryAllByRole('link');
    expect(links).toHaveLength(0);
  });
});
