import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmModal } from '../ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    title: 'Delete item',
    message: 'Are you sure you want to delete this item?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders title and message', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('confirm button fires onConfirm callback', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancel button fires onCancel callback', async () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Escape key fires onCancel', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders custom confirm label', () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Delete forever" />);
    expect(screen.getByText('Delete forever')).toBeInTheDocument();
  });

  it('danger variant applies danger class to confirm button', () => {
    const { container } = render(<ConfirmModal {...defaultProps} variant="danger" />);
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).toContain('danger');
    expect(container.querySelector('[role="alertdialog"]')).toBeInTheDocument();
  });

  it('default variant does not apply danger class', () => {
    render(<ConfirmModal {...defaultProps} variant="default" />);
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).not.toContain('danger');
  });
});
