import {
  addKartu,
  addNotif,
  addPetani,
  clearAllData,
  getKartus,
  getNotifs,
  getPetani,
  markNotifRead,
  newId,
  updateKartu,
} from '../db';
import type { Kartu, Petani } from '../../types';

const petani = (over: Partial<Petani> = {}): Petani => ({
  id: newId(),
  nama: 'Bu Sari',
  desa: 'Margamukti',
  telepon: '0812',
  createdAt: '2026-07-16T00:00:00Z',
  ...over,
});

beforeEach(() => clearAllData());

test('addPetani then getPetani returns saved record', async () => {
  const p = petani();
  await addPetani(p);
  expect(await getPetani()).toEqual([p]);
});

test('updateKartu replaces by id without mutating others', async () => {
  const base: Kartu = {
    id: 'k1',
    petaniId: 'p1',
    plotId: 'pl1',
    tier: 'lokal',
    stdbStatus: 'belum_lengkap',
    alasan: [],
    deforestasi: { status: 'aman', cellValue: 0, source: 's', catatan: 'c' },
    overrideManual: false,
    createdAt: 'now',
  };
  await addKartu(base);
  await addKartu({ ...base, id: 'k2' });
  await updateKartu({ ...base, tier: 'export_ready' });
  const all = await getKartus();
  expect(all.find(k => k.id === 'k1')?.tier).toBe('export_ready');
  expect(all.find(k => k.id === 'k2')?.tier).toBe('lokal');
});

test('markNotifRead flips read flag', async () => {
  await addNotif({ id: 'n1', pesan: 'x', severity: 'alert', read: false, createdAt: 'now' });
  await markNotifRead('n1');
  expect((await getNotifs())[0].read).toBe(true);
});
