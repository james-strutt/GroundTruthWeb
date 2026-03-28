import { vi } from 'vitest';

interface MockResponse {
  data: unknown;
  error: null | { message: string };
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

interface MockStorageBucket {
  upload: ReturnType<typeof vi.fn>;
  getPublicUrl: ReturnType<typeof vi.fn>;
}

interface MockSupabase {
  from: ReturnType<typeof vi.fn>;
  auth: {
    getSession: ReturnType<typeof vi.fn>;
  };
  storage: {
    from: ReturnType<typeof vi.fn>;
  };
  _queryBuilder: MockQueryBuilder;
  _storageBucket: MockStorageBucket;
  _setResponse: (response: MockResponse) => void;
}

export function createMockSupabase(
  response: MockResponse = { data: null, error: null },
): MockSupabase {
  let currentResponse = { ...response };

  const queryBuilder: MockQueryBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  for (const method of Object.keys(queryBuilder) as (keyof MockQueryBuilder)[]) {
    if (method === 'single' || method === 'maybeSingle') {
      queryBuilder[method].mockImplementation(() => Promise.resolve(currentResponse));
    } else {
      queryBuilder[method].mockReturnValue(queryBuilder);
    }
  }

  /* Also make select/insert/update/delete resolve directly when used as terminal */
  queryBuilder.select.mockImplementation(() => queryBuilder);
  queryBuilder.insert.mockImplementation(() => queryBuilder);
  queryBuilder.update.mockImplementation(() => queryBuilder);
  queryBuilder.delete.mockImplementation(() => queryBuilder);

  /* Allow awaiting the builder directly (Supabase returns a thenable) */
  (queryBuilder as unknown as Record<string, unknown>)['then'] = (
    resolve: (v: MockResponse) => void,
  ) => resolve(currentResponse);

  const storageBucket: MockStorageBucket = {
    upload: vi.fn().mockResolvedValue({ data: { path: 'mock/path.jpg' }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: 'https://mock.storage/public/mock/path.jpg' },
    }),
  };

  const mock: MockSupabase = {
    from: vi.fn().mockReturnValue(queryBuilder),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue(storageBucket),
    },
    _queryBuilder: queryBuilder,
    _storageBucket: storageBucket,
    _setResponse: (r: MockResponse) => {
      currentResponse = { ...r };
    },
  };

  return mock;
}
