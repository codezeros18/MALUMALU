import { evaluateKartu } from '../ruleEngine';
import type { DeforestasiCheck, Petani, Plot } from '../../types';

const petani = (o: Partial<Petani> = {}): Petani => ({
  id: 'p',
  nama: 'Bu Sari',
  desa: 'Margamukti',
  telepon: '0812',
  createdAt: 't',
  ...o,
});
const plot = (o: Partial<Plot> = {}): Plot => ({
  id: 'pl',
  petaniId: 'p',
  lat: -7.15,
  lng: 107.62,
  komoditas: 'kopi',
  gpsAccuracyM: 8,
  capturedAt: 't',
  ...o,
});
const cek = (status: DeforestasiCheck['status']): DeforestasiCheck => ({
  status,
  cellValue: status === 'terindikasi' ? 1 : 0,
  source: 's',
  catatan: 'c',
});

test('aman + complete data + good gps + punya STDB => export_ready / lengkap', () => {
  const r = evaluateKartu(petani(), plot(), cek('aman'), true);
  expect(r.tier).toBe('export_ready');
  expect(r.stdbStatus).toBe('lengkap');
});

test('terindikasi forces lokal even with complete data and STDB', () => {
  expect(evaluateKartu(petani(), plot(), cek('terindikasi'), true).tier).toBe('lokal');
});

test('missing telepon => belum_lengkap + lokal, reason mentions data', () => {
  const r = evaluateKartu(petani({ telepon: undefined }), plot(), cek('aman'), true);
  expect(r.tier).toBe('lokal');
  expect(r.stdbStatus).toBe('belum_lengkap');
  expect(r.alasan.join(' ')).toMatch(/belum lengkap/i);
});

test('gps accuracy > 20m forces lokal with point-primary reason', () => {
  const r = evaluateKartu(petani(), plot({ gpsAccuracyM: 35 }), cek('aman'), true);
  expect(r.tier).toBe('lokal');
  expect(r.alasan.join(' ')).toMatch(/akurasi gps/i);
});

test('di_luar_area forces lokal', () => {
  expect(evaluateKartu(petani(), plot(), cek('di_luar_area'), true).tier).toBe('lokal');
});

test('without punyaSTDB, otherwise-eligible plot stays lokal, reason mentions STDB', () => {
  // Regression test for bug #3: mobile used to have no punyaSTDB concept at all, so an
  // otherwise-perfect plot (aman + complete data + good gps) reached export_ready with
  // no certificate on file — diverging from web, which always required one.
  const r = evaluateKartu(petani(), plot(), cek('aman'), false);
  expect(r.tier).toBe('lokal');
  expect(r.alasan.join(' ')).toMatch(/belum memiliki stdb/i);
});
