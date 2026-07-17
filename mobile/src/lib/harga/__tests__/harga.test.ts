import { aggregateDaily, filterSources, getReferencePrice, normalize, todayIso } from '../aggregate';
import { handlePriceMessage, parsePriceQuery, STATUS_LINK_SCHEME } from '../bot';
import { SAMPLE_PRICE_SOURCES } from '../prices';
import type { PriceSource } from '../types';

const src = (o: Partial<PriceSource>): PriceSource => ({
  id: o.id ?? 'x',
  kind: o.kind ?? 'platform',
  komoditas: o.komoditas ?? 'kopi',
  wilayah: o.wilayah ?? 'Pangalengan',
  grade: o.grade ?? '',
  pricePerKg: o.pricePerKg ?? 60000,
  txnCount: o.txnCount ?? 1,
  verified: o.verified ?? true,
  date: o.date ?? '2026-07-17',
});

describe('normalize', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalize('  KoPi  CHERRY ')).toBe('kopi cherry');
  });
});

describe('filterSources', () => {
  it('keeps only matching komoditas, wilayah, and verified within window', () => {
    const out = filterSources(SAMPLE_PRICE_SOURCES, 'kopi', 'Pangalengan', '2026-07-17', 7);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every(s => s.verified && s.komoditas === 'kopi' && s.wilayah === 'Pangalengan')).toBe(true);
  });

  it('excludes sources outside the daily window', () => {
    const stale = src({ date: '2026-06-01' });
    const out = filterSources([stale], 'kopi', 'Pangalengan', '2026-07-17', 7);
    expect(out).toHaveLength(0);
  });

  it('excludes unverified sources', () => {
    const unverified = src({ verified: false });
    const out = filterSources([unverified], 'kopi', 'Pangalengan', '2026-07-17', 7);
    expect(out).toHaveLength(0);
  });
});

describe('aggregateDaily', () => {
  it('computes weighted average, low and high from priced sources', () => {
    const sources = [
      src({ pricePerKg: 58000, txnCount: 4 }),
      src({ pricePerKg: 61000, txnCount: 3 }),
      src({ pricePerKg: 64000, txnCount: 5 }),
    ];
    const ref = aggregateDaily(sources, 'kopi', 'Pangalengan', '', '2026-07-17');
    expect(ref).not.toBeNull();
    // (58000*4 + 61000*3 + 64000*5) / 12 = 61250 (matematis benar — lihat Audit
    // Sprint 18, docs/06_PROGRESS_LOG.md: rumus ini SUDAH BENAR, bukan bug)
    expect(ref!.avg).toBe(61250);
    expect(ref!.low).toBe(58000);
    expect(ref!.high).toBe(64000);
    expect(ref!.txnCount).toBe(12);
  });

  it('returns null when no sources match the grade', () => {
    const ref = aggregateDaily([src({ grade: 'A' })], 'kopi', 'Pangalengan', 'B', '2026-07-17');
    expect(ref).toBeNull();
  });

  it('returns null when only external sources with zero txn exist', () => {
    const ref = aggregateDaily([src({ kind: 'eksternal', txnCount: 0 })], 'kopi', 'Pangalengan', '', '2026-07-17');
    expect(ref).toBeNull();
  });

  it('filters by komoditas AND wilayah, not just grade (Sprint 22 fix)', () => {
    const sources = [
      src({ komoditas: 'kopi', wilayah: 'Pangalengan', pricePerKg: 60000, txnCount: 2 }),
      // Wilayah lain — harus DIKELUARKAN meski grade cocok. Sebelum fix, aggregateDaily
      // sendiri (dipanggil langsung tanpa lewat filterSources()) akan ikut memasukkan
      // baris ini dan mencemari rata-rata.
      src({ komoditas: 'kopi', wilayah: 'Bandung', pricePerKg: 40000, txnCount: 10 }),
      // Komoditas lain — juga harus DIKELUARKAN.
      src({ komoditas: 'sawit', wilayah: 'Pangalengan', pricePerKg: 2000, txnCount: 10 }),
    ];
    const ref = aggregateDaily(sources, 'kopi', 'Pangalengan', '', '2026-07-17');
    expect(ref).not.toBeNull();
    expect(ref!.avg).toBe(60000);
    expect(ref!.txnCount).toBe(2);
  });
});

describe('getReferencePrice', () => {
  it('returns the Pangalengan kopi reference from sample data', () => {
    const ref = getReferencePrice(SAMPLE_PRICE_SOURCES, 'kopi', 'Pangalengan', '2026-07-17');
    expect(ref).not.toBeNull();
    expect(ref!.low).toBe(58000);
    expect(ref!.high).toBe(64000);
    expect(ref!.avg).toBe(61250);
    expect(ref!.txnCount).toBe(12);
  });

  it('returns null for an unknown wilayah', () => {
    const ref = getReferencePrice(SAMPLE_PRICE_SOURCES, 'kopi', 'Jakarta', '2026-07-17');
    expect(ref).toBeNull();
  });
});

describe('parsePriceQuery', () => {
  it('parses "harga kopi Pangalengan"', () => {
    expect(parsePriceQuery('harga kopi Pangalengan')).toEqual({ komoditas: 'kopi', wilayah: 'Pangalengan' });
  });

  it('maps alias "coffee" to kopi', () => {
    expect(parsePriceQuery('harga coffee Bandung')?.komoditas).toBe('kopi');
  });

  it('returns null when not starting with harga', () => {
    expect(parsePriceQuery('halo bot')).toBeNull();
  });

  it('returns null when wilayah missing', () => {
    expect(parsePriceQuery('harga kopi')).toBeNull();
  });
});

describe('handlePriceMessage', () => {
  const sources = SAMPLE_PRICE_SOURCES;

  it('formats the exact brief reply for a found price', () => {
    const r = handlePriceMessage('harga kopi Pangalengan', '0812', sources, undefined, '2026-07-17');
    expect(r.found).toBe(true);
    expect(r.text).toContain('📊 Harga referensi kopi cherry, Pangalengan (update hari ini):');
    expect(r.text).toContain('Rp 58.000 - Rp 64.000/kg (rata-rata Rp 61.250)');
    expect(r.text).toContain('Berdasarkan 12 transaksi terverifikasi minggu ini.');
  });

  it('appends the upper-band nudge + link when Paspor is lengkap', () => {
    const r = handlePriceMessage('harga kopi Pangalengan', '0812', sources, () => ({ lengkap: true, tier: 'export_ready' }), '2026-07-17');
    expect(r.text).toContain('kisaran atas');
    expect(r.text).toContain(STATUS_LINK_SCHEME);
  });

  it('appends the completion nudge + link when Paspor is not lengkap', () => {
    const r = handlePriceMessage('harga kopi Pangalengan', '0812', sources, () => ({ lengkap: false, tier: 'lokal' }), '2026-07-17');
    expect(r.text).toContain('Lengkapi Paspor (STDB+GPS)');
    expect(r.text).toContain(STATUS_LINK_SCHEME);
  });

  it('embeds the farmer telepon in the status link so status.tsx can identify them', () => {
    const r = handlePriceMessage('harga kopi Pangalengan', '0812-3456-7890', sources, () => ({ lengkap: true, tier: 'export_ready' }), '2026-07-17');
    expect(r.text).toContain(`${STATUS_LINK_SCHEME}?telepon=${encodeURIComponent('0812-3456-7890')}`);
  });

  it('embeds telepon in the link for the not-lengkap branch too', () => {
    const r = handlePriceMessage('harga kopi Pangalengan', '0812-3456-7890', sources, () => ({ lengkap: false, tier: 'lokal' }), '2026-07-17');
    expect(r.text).toContain(`${STATUS_LINK_SCHEME}?telepon=${encodeURIComponent('0812-3456-7890')}`);
  });

  it('returns not-found text for unknown wilayah', () => {
    const r = handlePriceMessage('harga kopi Jakarta', '0812', sources, undefined, '2026-07-17');
    expect(r.found).toBe(false);
    expect(r.text).toContain('Belum ada data harga terverifikasi');
  });

  it('returns a usage hint when the query is malformed', () => {
    const r = handlePriceMessage('halo', '0812', sources, undefined, '2026-07-17');
    expect(r.found).toBe(false);
    expect(r.text).toContain('harga [komoditas] [wilayah]');
  });
});

describe('todayIso', () => {
  it('returns YYYY-MM-DD', () => {
    expect(todayIso(new Date('2026-07-17T09:00:00Z'))).toBe('2026-07-17');
  });
});

describe('STATUS_LINK_SCHEME (dari env EXPO_PUBLIC_STATUS_SCHEME, bukan hardcode)', () => {
  const ORIGINAL = process.env.EXPO_PUBLIC_STATUS_SCHEME;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.EXPO_PUBLIC_STATUS_SCHEME;
    else process.env.EXPO_PUBLIC_STATUS_SCHEME = ORIGINAL;
  });

  it('memakai nilai dari env kalau di-set', () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_STATUS_SCHEME = 'customscheme://cek-status';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reloaded = require('../bot');
    expect(reloaded.STATUS_LINK_SCHEME).toBe('customscheme://cek-status');
  });

  it('fallback ke default kalau env tidak di-set', () => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_STATUS_SCHEME;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reloaded = require('../bot');
    expect(reloaded.STATUS_LINK_SCHEME).toBe('pasporpetani://status');
  });
});
