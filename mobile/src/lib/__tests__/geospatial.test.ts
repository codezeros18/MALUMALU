import { cekDeforestasi } from '../geospatial';

test('center of Pangalengan is aman', () => {
  const r = cekDeforestasi(-7.15, 107.62);
  expect(r.status).toBe('aman');
  expect(r.cellValue).toBe(0);
});

test('northeast risk cluster is terindikasi', () => {
  expect(cekDeforestasi(-7.07, 107.69).status).toBe('terindikasi');
});

test('outside bbox is di_luar_area with null cell', () => {
  const r = cekDeforestasi(-6.2, 106.8);
  expect(r.status).toBe('di_luar_area');
  expect(r.cellValue).toBeNull();
});

test('exact edge coordinates clamp into grid, not crash', () => {
  expect(() => cekDeforestasi(-7.05, 107.72)).not.toThrow();
});
