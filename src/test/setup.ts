import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  insertWaitlistEmail: vi.fn(),
  getWaitlistCount: vi.fn().mockResolvedValue(null),
}));
