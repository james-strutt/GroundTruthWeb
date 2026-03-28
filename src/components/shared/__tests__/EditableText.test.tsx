import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../services/aiService', () => ({
  refineTextWithAI: vi.fn(),
}));

import { EditableText } from '../EditableText';

describe('EditableText', () => {
  it('displays text value in view mode', () => {
    render(<EditableText value="Hello world" onSave={vi.fn()} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows placeholder when value is empty', () => {
    render(<EditableText value="" onSave={vi.fn()} placeholder="Enter text" />);
    expect(screen.getByText('Enter text')).toBeInTheDocument();
  });

  it('clicking enters edit mode and shows an input', async () => {
    render(<EditableText value="Editable" onSave={vi.fn()} />);
    const display = screen.getByRole('button', { name: /edit: editable/i });
    await userEvent.click(display);
    expect(screen.getByDisplayValue('Editable')).toBeInTheDocument();
  });

  it('shows a textarea when multiline is true', async () => {
    render(<EditableText value="Multi" onSave={vi.fn()} multiline />);
    const display = screen.getByRole('button', { name: /edit: multi/i });
    await userEvent.click(display);
    const textarea = screen.getByDisplayValue('Multi');
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('blur saves and exits edit mode when value changed', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditableText value="Original" onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /edit: original/i }));
    const input = screen.getByDisplayValue('Original');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated');

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Updated');
    });
  });

  it('Enter key saves and exits edit mode for single-line input', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditableText value="Original" onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /edit: original/i }));
    const input = screen.getByDisplayValue('Original');
    await userEvent.clear(input);
    await userEvent.type(input, 'New value');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('New value');
    });
  });

  it('Escape key cancels without saving', async () => {
    const onSave = vi.fn();
    render(<EditableText value="Original" onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /edit: original/i }));
    const input = screen.getByDisplayValue('Original');
    await userEvent.clear(input);
    await userEvent.type(input, 'Changed');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('calls onSave with new value when saved via Save button', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditableText value="Before" onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /edit: before/i }));
    const input = screen.getByDisplayValue('Before');
    await userEvent.clear(input);
    await userEvent.type(input, 'After');

    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('After');
    });
  });
});
