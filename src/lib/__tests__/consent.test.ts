import { setConsent, simulateAccess, overrideKartu } from '../consent';
import { clearAllData, getAccessLogs, getChain, getKartus, getNotifs } from '../db';
import { prosesPlotBaru } from '../prosesPlot';

beforeEach(() => clearAllData());

const seed = () =>
  prosesPlotBaru({ nama: 'Bu Sari', desa: 'D', telepon: '08', komoditas: 'kopi', lat: -7.15, lng: 107.62, gpsAccuracyM: 5 });

test('access with consent is authorized, no notif', async () => {
  const k = await seed();
  await setConsent(k.id, 'Koperasi', true);
  expect((await simulateAccess(k.id, 'Koperasi')).authorized).toBe(true);
  expect(await getNotifs()).toHaveLength(0);
  expect(await getAccessLogs()).toHaveLength(1);
});

test('access without consent logs unauthorized and raises alert notif', async () => {
  const k = await seed();
  expect((await simulateAccess(k.id, 'Eksportir X')).authorized).toBe(false);
  const notifs = await getNotifs();
  expect(notifs).toHaveLength(1);
  expect(notifs[0].severity).toBe('alert');
});

test('override flips tier, marks manual, extends chain', async () => {
  const k = await seed();
  const before = (await getChain()).length;
  const after = await overrideKartu(k);
  expect(after.tier).toBe('lokal');
  expect(after.overrideManual).toBe(true);
  expect((await getKartus())[0].overrideManual).toBe(true);
  expect((await getChain()).length).toBe(before + 1);
});
