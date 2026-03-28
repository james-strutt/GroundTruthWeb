import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { insertWaitlistEmail } from '../../supabaseClient';
import { WaitlistForm } from '../../App';

vi.mocked(insertWaitlistEmail);

beforeEach(() => {
  vi.mocked(insertWaitlistEmail).mockReset();
});

describe('WaitlistForm', () => {
  it('renders email input and submit button', () => {
    render(<WaitlistForm />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join the waitlist/i })).toBeInTheDocument();
  });

  it('submit with valid email calls insertWaitlistEmail', async () => {
    const user = userEvent.setup();
    vi.mocked(insertWaitlistEmail).mockResolvedValue({ error: null } as ReturnType<typeof insertWaitlistEmail> extends Promise<infer R> ? R : never);

    render(<WaitlistForm />);
    const input = screen.getByLabelText(/email address/i);
    const button = screen.getByRole('button', { name: /join the waitlist/i });

    await user.type(input, 'test@example.com');
    await user.click(button);

    await waitFor(() => {
      expect(insertWaitlistEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message after submission', async () => {
    const user = userEvent.setup();
    vi.mocked(insertWaitlistEmail).mockResolvedValue({ error: null } as ReturnType<typeof insertWaitlistEmail> extends Promise<infer R> ? R : never);

    render(<WaitlistForm />);
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /join the waitlist/i }));

    await waitFor(() => {
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument();
    });
  });

  it('handles duplicate email (23505 error code) by showing success', async () => {
    const user = userEvent.setup();
    vi.mocked(insertWaitlistEmail).mockResolvedValue({
      error: { code: '23505', message: 'duplicate key' },
    } as ReturnType<typeof insertWaitlistEmail> extends Promise<infer R> ? R : never);

    render(<WaitlistForm />);
    await user.type(screen.getByLabelText(/email address/i), 'dupe@example.com');
    await user.click(screen.getByRole('button', { name: /join the waitlist/i }));

    await waitFor(() => {
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument();
    });
  });
});
