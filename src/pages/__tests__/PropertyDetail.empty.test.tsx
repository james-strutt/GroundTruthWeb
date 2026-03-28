import { describe, it, expect, vi } from 'vitest';

vi.mock('../../services/propertyService', () => ({
  updateProperty: vi.fn(),
}));

vi.mock('../../hooks/queries/useProperties', () => ({
  usePropertyQuery: vi.fn(() => ({
    data: null,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
  })),
  usePropertyActivitiesQuery: vi.fn(() => ({
    data: null,
    isLoading: true,
  })),
}));

vi.mock('../../hooks/queries/useDirectories', () => ({
  useDirectoryQuery: vi.fn(() => ({ data: null })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-prop-id' }),
  };
});

describe('PropertyDetail smoke test', () => {
  it('can be imported without errors', async () => {
    const mod = await import('../../pages/properties/PropertyDetail');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});
