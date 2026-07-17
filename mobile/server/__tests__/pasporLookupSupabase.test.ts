import { lookupPasporByPhoneSupabase } from '../pasporLookupSupabase';

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
});

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  jest.restoreAllMocks();
});

function mockFetchSequence(responses: unknown[]) {
  const fetchMock = jest.fn();
  for (const body of responses) {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => body });
  }
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

test('returns null when phone number is not registered', async () => {
  mockFetchSequence([[]]); // petani fetch returns empty
  const result = await lookupPasporByPhoneSupabase('081234567890');
  expect(result).toBeNull();
});

test('returns lengkap=true + tier export_ready when STDB+GPS complete and latest kartu is export-ready', async () => {
  mockFetchSequence([
    [{ id: 'p1', nama: 'Ade', desa: 'Pangalengan', telepon: '081234567890' }], // petani
    [{ id: 'plot1', petani_id: 'p1', gps_accuracy_m: 8 }], // plot
    [{ id: 'k1', petani_id: 'p1', tier: 'export-ready', created_at: 100 }], // kartu
  ]);

  const result = await lookupPasporByPhoneSupabase('081234567890');
  expect(result).toEqual({ lengkap: true, tier: 'export_ready' });
});

test('maps web tier "lokal" to mobile tier "lokal" unchanged', async () => {
  mockFetchSequence([
    [{ id: 'p1', nama: 'Ade', desa: 'Pangalengan', telepon: '081234567890' }],
    [],
    [{ id: 'k1', petani_id: 'p1', tier: 'lokal', created_at: 100 }],
  ]);

  const result = await lookupPasporByPhoneSupabase('081234567890');
  expect(result?.tier).toBe('lokal');
});

test('lengkap=false when GPS accuracy is too low (> 20m)', async () => {
  mockFetchSequence([
    [{ id: 'p1', nama: 'Ade', desa: 'Pangalengan', telepon: '081234567890' }],
    [{ id: 'plot1', petani_id: 'p1', gps_accuracy_m: 45 }],
    [{ id: 'k1', petani_id: 'p1', tier: 'lokal', created_at: 100 }],
  ]);

  const result = await lookupPasporByPhoneSupabase('081234567890');
  expect(result?.lengkap).toBe(false);
});

test('lengkap=false when desa is missing (STDB not complete)', async () => {
  mockFetchSequence([
    [{ id: 'p1', nama: 'Ade', desa: null, telepon: '081234567890' }],
    [],
    [],
  ]);

  const result = await lookupPasporByPhoneSupabase('081234567890');
  expect(result?.lengkap).toBe(false);
});

test('picks the most recently created kartu when multiple exist', async () => {
  mockFetchSequence([
    [{ id: 'p1', nama: 'Ade', desa: 'Pangalengan', telepon: '081234567890' }],
    [],
    [
      { id: 'k1', petani_id: 'p1', tier: 'lokal', created_at: 100 },
      { id: 'k2', petani_id: 'p1', tier: 'export-ready', created_at: 200 },
    ],
  ]);

  const result = await lookupPasporByPhoneSupabase('081234567890');
  expect(result?.tier).toBe('export_ready');
});

test('matches phone number regardless of formatting (digits-only comparison)', async () => {
  mockFetchSequence([
    [{ id: 'p1', nama: 'Ade', desa: 'Pangalengan', telepon: '0812-3456-7890' }],
    [],
    [],
  ]);

  const result = await lookupPasporByPhoneSupabase('0812 3456 7890');
  expect(result).not.toBeNull();
});
