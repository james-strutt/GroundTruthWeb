import { describe, it, expect } from 'vitest';
import { ensureAuthSessionLoaded } from '../shared/supabaseHelpers';

describe('ensureAuthSessionLoaded', () => {
  it('returns false when supabase client is null', async () => {
    const result = await ensureAuthSessionLoaded();
    expect(result).toBe(false);
  });
});
