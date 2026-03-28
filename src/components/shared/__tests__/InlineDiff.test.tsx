import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { InlineDiff } from '../InlineDiff';

const BASE_FIELDS = [
  { key: 'condition', label: 'Condition', oldValue: 'Good', newValue: 'Fair' },
  { key: 'notes', label: 'Notes', oldValue: 'Original note', newValue: 'Updated note' },
];

function renderDiff(overrides: Record<string, unknown> = {}) {
  const props = {
    title: 'AI Suggestions',
    fields: BASE_FIELDS,
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onAcceptAll: vi.fn(),
    onRejectAll: vi.fn(),
    ...overrides,
  };
  render(<InlineDiff {...props} />);
  return props;
}

describe('InlineDiff', () => {
  it('renders field labels and old/new values', () => {
    renderDiff();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Original note')).toBeInTheDocument();
    expect(screen.getByText('Updated note')).toBeInTheDocument();
  });

  it('shows "No changes detected" when all values are identical', () => {
    const unchangedFields = [
      { key: 'condition', label: 'Condition', oldValue: 'Good', newValue: 'Good' },
    ];
    renderDiff({ fields: unchangedFields });
    expect(screen.getByText('No changes detected')).toBeInTheDocument();
  });

  it('accept button calls onAccept with key and new value', async () => {
    const user = userEvent.setup();
    const props = renderDiff();

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
      .filter((btn) => btn.textContent?.trim() !== 'Accept all');
    await user.click(acceptButtons[0]);

    expect(props.onAccept).toHaveBeenCalledWith('condition', 'Fair');
  });

  it('reject button calls onReject with key', async () => {
    const user = userEvent.setup();
    const props = renderDiff();

    const rejectButtons = screen.getAllByRole('button', { name: /reject/i })
      .filter((btn) => btn.textContent?.trim() !== 'Reject all');
    await user.click(rejectButtons[0]);

    expect(props.onReject).toHaveBeenCalledWith('condition');
  });

  it('Accept All button calls onAcceptAll', async () => {
    const user = userEvent.setup();
    const props = renderDiff();

    await user.click(screen.getByRole('button', { name: /accept all/i }));
    expect(props.onAcceptAll).toHaveBeenCalledOnce();
  });

  it('Reject All button calls onRejectAll', async () => {
    const user = userEvent.setup();
    const props = renderDiff();

    await user.click(screen.getByRole('button', { name: /reject all/i }));
    expect(props.onRejectAll).toHaveBeenCalledOnce();
  });
});
