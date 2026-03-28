import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The DA service creates its own Supabase client from env vars.
 * Without VITE_DA_SUPABASE_URL and VITE_DA_SUPABASE_ANON_KEY,
 * daSupabase will be null and fetchDAsInBounds returns [].
 */

vi.mock('@supabase/supabase-js', () => {
  const mockRpc = vi.fn();
  return {
    createClient: vi.fn(() => ({
      rpc: mockRpc,
    })),
    __mockRpc: mockRpc,
  };
});

describe('fetchDAsInBounds', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns empty array when no DA supabase client is configured', async () => {
    vi.stubEnv('VITE_DA_SUPABASE_URL', '');
    vi.stubEnv('VITE_DA_SUPABASE_ANON_KEY', '');

    const { fetchDAsInBounds } = await import('../daService');
    const result = await fetchDAsInBounds(151.0, -33.9, 151.3, -33.7);
    expect(result).toEqual([]);

    vi.unstubAllEnvs();
  });

  it('computes centre and radius from bounds for the RPC call', async () => {
    vi.stubEnv('VITE_DA_SUPABASE_URL', 'https://da.supabase.co');
    vi.stubEnv('VITE_DA_SUPABASE_ANON_KEY', 'da-key');

    const supabaseMod = await import('@supabase/supabase-js');
    const mockRpc = (supabaseMod as unknown as { __mockRpc: ReturnType<typeof vi.fn> }).__mockRpc;
    mockRpc.mockResolvedValue({ data: [], error: null });

    const { fetchDAsInBounds } = await import('../daService');
    await fetchDAsInBounds(151.0, -33.9, 151.3, -33.7);

    expect(mockRpc).toHaveBeenCalledWith('search_da_near_point', expect.objectContaining({
      p_longitude: expect.closeTo((151.0 + 151.3) / 2, 5),
      p_latitude: expect.closeTo((-33.9 + -33.7) / 2, 5),
      p_limit: 200,
    }));

    const callArgs = mockRpc.mock.calls[0][1];
    expect(callArgs.p_radius_metres).toBeGreaterThan(0);
    expect(callArgs.p_radius_metres).toBeLessThanOrEqual(5000);

    vi.unstubAllEnvs();
  });

  it('returns empty array when RPC returns an error', async () => {
    vi.stubEnv('VITE_DA_SUPABASE_URL', 'https://da.supabase.co');
    vi.stubEnv('VITE_DA_SUPABASE_ANON_KEY', 'da-key');

    const supabaseMod = await import('@supabase/supabase-js');
    const mockRpc = (supabaseMod as unknown as { __mockRpc: ReturnType<typeof vi.fn> }).__mockRpc;
    mockRpc.mockResolvedValue({ data: null, error: { message: 'timeout' } });

    const { fetchDAsInBounds } = await import('../daService');
    const result = await fetchDAsInBounds(151.0, -33.9, 151.3, -33.7);
    expect(result).toEqual([]);

    vi.unstubAllEnvs();
  });
});
