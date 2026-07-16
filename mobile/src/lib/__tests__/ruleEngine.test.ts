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

test('aman + complete data + good gps => export_ready / lengkap', () => {
  const r = evaluateKartu(petani(), plot(), cek('aman'));
  expect(r.tier).toBe('export_ready');
  expect(r.stdbStatus).toBe('lengkap');
});

test('terindikasi forces lokal even with complete data', () => {
  expect(evaluateKartu(petani(), plot(), cek('terindikasi')).tier).toBe('lokal');
});

test('missing telepon => belum_lengkap + lokal, reason mentions data', () => {
  const r = evaluateKartu(petani({ telepon: undefined }), plot(), cek('aman'));
  expect(r.tier).toBe('lokal');
  expect(r.stdbStatus).toBe('belum_lengkap');
  expect(r.alasan.join(' ')).toMatch(/belum lengkap/i);
});

test('gps accuracy > 20m forces lokal with point-primary reason', () => {
  const r = evaluateKartu(petani(), plot({ gpsAccuracyM: 35 }), cek('aman'));
  expect(r.tier).toBe('lokal');
  expect(r.alasan.join(' ')).toMatch(/akurasi gps/i);
});

test('di_luar_area forces lokal', () => {
  expect(evaluateKartu(petani(), plot(), cek('di_luar_area')).tier).toBe('lokal');
});
