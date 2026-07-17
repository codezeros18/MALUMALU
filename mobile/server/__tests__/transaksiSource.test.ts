import { mapTransaksiToPriceSources } from '../transaksiSource';

describe('mapTransaksiToPriceSources', () => {
  it('maps each individual transaksi row to one PriceSource with txnCount 1', () => {
    const rows = [
      {
        id: 't1',
        komoditas: 'kopi',
        wilayah: 'Pangalengan',
        grade: '',
        harga_per_kg: 62000,
        tanggal: '2026-07-17',
        verified: true,
      },
    ];
    expect(mapTransaksiToPriceSources(rows)).toEqual([
      {
        id: 't1',
        kind: 'platform',
        komoditas: 'kopi',
        wilayah: 'Pangalengan',
        grade: '',
        pricePerKg: 62000,
        txnCount: 1,
        verified: true,
        date: '2026-07-17',
      },
    ]);
  });

  it('preserves unverified flag as-is (aggregation layer decides what to do with it)', () => {
    const rows = [
      {
        id: 't2',
        komoditas: 'kopi',
        wilayah: 'Pangalengan',
        grade: 'A',
        harga_per_kg: 70000,
        tanggal: '2026-07-17',
        verified: false,
      },
    ];
    expect(mapTransaksiToPriceSources(rows)[0].verified).toBe(false);
  });

  it('maps an empty list to an empty array', () => {
    expect(mapTransaksiToPriceSources([])).toEqual([]);
  });

  it('produces sources that aggregateDaily can weight-average correctly (each row weight 1)', () => {
    // Konfirmasi end-to-end: 3 baris transaksi individual dengan harga berbeda harus
    // menghasilkan rata-rata SEDERHANA (bobot seragam), bukan bobot aneh.
    const rows = [
      { id: 'a', komoditas: 'kopi', wilayah: 'Pangalengan', grade: '', harga_per_kg: 60000, tanggal: '2026-07-17', verified: true },
      { id: 'b', komoditas: 'kopi', wilayah: 'Pangalengan', grade: '', harga_per_kg: 62000, tanggal: '2026-07-17', verified: true },
      { id: 'c', komoditas: 'kopi', wilayah: 'Pangalengan', grade: '', harga_per_kg: 64000, tanggal: '2026-07-17', verified: true },
    ];
    const sources = mapTransaksiToPriceSources(rows);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { aggregateDaily } = require('../../src/lib/harga/aggregate');
    const ref = aggregateDaily(sources, 'kopi', 'Pangalengan', '', '2026-07-17');
    expect(ref.avg).toBe(62000); // (60000+62000+64000)/3, bobot 1 masing-masing
    expect(ref.txnCount).toBe(3);
  });
});
