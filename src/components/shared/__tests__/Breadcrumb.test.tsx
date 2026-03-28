import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Breadcrumb } from '../Breadcrumb';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Breadcrumb', () => {
  const segments = [
    { label: 'Home', path: '/app' },
    { label: 'Properties', path: '/app/properties' },
    { label: '42 Wallaby Way' },
  ];

  it('renders all segment labels', () => {
    renderWithRouter(<Breadcrumb segments={segments} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('42 Wallaby Way')).toBeInTheDocument();
  });

  it('non-last segments with paths are rendered as links with correct href', () => {
    renderWithRouter(<Breadcrumb segments={segments} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/app');

    const propertiesLink = screen.getByText('Properties').closest('a');
    expect(propertiesLink).toBeInTheDocument();
    expect(propertiesLink).toHaveAttribute('href', '/app/properties');
  });

  it('last segment is not a link', () => {
    renderWithRouter(<Breadcrumb segments={segments} />);
    const lastSegment = screen.getByText('42 Wallaby Way');
    expect(lastSegment.closest('a')).toBeNull();
    expect(lastSegment.tagName).toBe('SPAN');
  });

  it('renders separators between segments', () => {
    const { container } = renderWithRouter(<Breadcrumb segments={segments} />);
    const separators = container.querySelectorAll('svg');
    expect(separators).toHaveLength(segments.length - 1);
  });

  it('single segment renders without separators', () => {
    const { container } = renderWithRouter(
      <Breadcrumb segments={[{ label: 'Dashboard' }]} />,
    );
    const separators = container.querySelectorAll('svg');
    expect(separators).toHaveLength(0);
  });
});
