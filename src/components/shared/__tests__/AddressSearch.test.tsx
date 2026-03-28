import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../utils/sanitise', () => ({
  sanitiseSearchQuery: vi.fn((s: string) => s),
}));

import { AddressSearch } from '../../layout/AddressSearch';

describe('AddressSearch', () => {
  it('renders the search input field', () => {
    render(<AddressSearch />);
    const input = screen.getByPlaceholderText('Search address...');
    expect(input).toBeInTheDocument();
  });

  it('input accepts text and updates the value', () => {
    render(<AddressSearch />);
    const input = screen.getByPlaceholderText('Search address...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '10 George St' } });
    expect(input.value).toBe('10 George St');
  });

  it('shows the clear button when input has a value', () => {
    render(<AddressSearch />);
    const input = screen.getByPlaceholderText('Search address...');

    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Sydney' } });
    const clearBtn = screen.getByRole('button');
    expect(clearBtn).toBeInTheDocument();
  });

  it('clears the input when the clear button is clicked', () => {
    render(<AddressSearch />);
    const input = screen.getByPlaceholderText('Search address...') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Redfern' } });
    expect(input.value).toBe('Redfern');

    const clearBtn = screen.getByRole('button');
    fireEvent.click(clearBtn);
    expect(input.value).toBe('');
  });

  it('calls onSelect when not provided without error', () => {
    render(<AddressSearch />);
    const input = screen.getByPlaceholderText('Search address...');
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(input).toBeInTheDocument();
  });
});
