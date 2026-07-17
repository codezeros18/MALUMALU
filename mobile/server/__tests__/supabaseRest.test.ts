import { fetchSupabaseTable, isSupabaseConfigured } from '../supabaseRest';

const ENV_KEYS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
});

afterEach(() => {
  ENV_KEYS.forEach((k) => delete process.env[k]);
  jest.restoreAllMocks();
});

test('isSupabaseConfigured is false when SUPABASE_URL is missing', () => {
  delete process.env.SUPABASE_URL;
  expect(isSupabaseConfigured()).toBe(false);
});

test('isSupabaseConfigured is true when both url and anon key are set', () => {
  expect(isSupabaseConfigured()).toBe(true);
});

test('fetchSupabaseTable calls the REST endpoint with apikey + bearer headers', async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: '1' }],
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const rows = await fetchSupabaseTable('petani', '?select=id,nama');

  expect(fetchMock).toHaveBeenCalledWith(
    'https://example.supabase.co/rest/v1/petani?select=id,nama',
    { headers: { apikey: 'test-anon-key', Authorization: 'Bearer test-anon-key' } },
  );
  expect(rows).toEqual([{ id: '1' }]);
});

test('fetchSupabaseTable throws with status + body when Supabase rejects the request', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: async () => 'internal error',
  }) as unknown as typeof fetch;

  await expect(fetchSupabaseTable('petani')).rejects.toThrow(/500.*internal error/);
});

test('fetchSupabaseTable throws a clear error when not configured', async () => {
  delete process.env.SUPABASE_URL;
  await expect(fetchSupabaseTable('petani')).rejects.toThrow(/belum dikonfigurasi/);
});
