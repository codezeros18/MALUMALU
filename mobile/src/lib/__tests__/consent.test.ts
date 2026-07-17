import { setConsent, simulateAccess, overrideKartu } from '../consent';
import { clearAllData, getAccessLogs, getChain, getKartus, getNotifs } from '../db';
import { prosesPlotBaru } from '../prosesPlot';
import { enqueueWa } from '../waOutbox';

jest.mock('../waOutbox', () => ({ enqueueWa: jest.fn() }));

const enqueueWaMock = enqueueWa as jest.MockedFunction<typeof enqueueWa>;

beforeEach(async () => {
  await clearAllData();
  enqueueWaMock.mockReset();
});

const seed = () =>
  prosesPlotBaru({
    nama: 'Bu Sari',
    desa: 'D',
    telepon: '08',
    komoditas: 'kopi',
    lat: -7.15,
    lng: 107.62,
    gpsAccuracyM: 5,
    punyaSTDB: true,
  });

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

// seed() issues a kartu, which itself queues a message — clear it so these
// assertions only see what the action under test queued.
test('unauthorized access queues a WhatsApp alert naming the party', async () => {
  const k = await seed();
  enqueueWaMock.mockClear();
  await simulateAccess(k.id, 'Eksportir X');
  expect(enqueueWaMock).toHaveBeenCalledTimes(1);
  expect(enqueueWaMock.mock.calls[0][0]).toMatch(/Eksportir X/);
});

test('authorized access queues no WhatsApp message', async () => {
  const k = await seed();
  await setConsent(k.id, 'Koperasi', true);
  enqueueWaMock.mockClear();
  await simulateAccess(k.id, 'Koperasi');
  expect(enqueueWaMock).not.toHaveBeenCalled();
});

test('manual override queues a WhatsApp message with the new tier', async () => {
  const k = await seed();
  enqueueWaMock.mockClear();
  await overrideKartu(k);
  expect(enqueueWaMock).toHaveBeenCalledTimes(1);
  expect(enqueueWaMock.mock.calls[0][0]).toMatch(/LOKAL/i);
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
