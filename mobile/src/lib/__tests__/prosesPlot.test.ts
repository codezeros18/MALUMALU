import { prosesPlotBaru } from '../prosesPlot';
import { clearAllData, getChain, getKartus, getPetani, getPlots } from '../db';
import { enqueueWa } from '../waOutbox';

jest.mock('../waOutbox', () => ({ enqueueWa: jest.fn() }));

const enqueueWaMock = enqueueWa as jest.MockedFunction<typeof enqueueWa>;

beforeEach(async () => {
  await clearAllData();
  enqueueWaMock.mockReset();
});

test('prosesPlotBaru persists petani, plot, kartu and appends chain entry', async () => {
  const kartu = await prosesPlotBaru({
    nama: 'Bu Sari',
    desa: 'Margamukti',
    telepon: '0812',
    komoditas: 'kopi',
    lat: -7.15,
    lng: 107.62,
    gpsAccuracyM: 8,
    punyaSTDB: true,
  });
  expect(kartu.tier).toBe('export_ready');
  expect(await getPetani()).toHaveLength(1);
  expect(await getPlots()).toHaveLength(1);
  expect(await getKartus()).toHaveLength(1);
  expect(await getChain()).toHaveLength(1);
});

test('without punyaSTDB an otherwise export-ready plot stays lokal', async () => {
  const kartu = await prosesPlotBaru({
    nama: 'Bu Sari',
    desa: 'Margamukti',
    telepon: '0812',
    komoditas: 'kopi',
    lat: -7.15,
    lng: 107.62,
    gpsAccuracyM: 8,
    punyaSTDB: false,
  });
  expect(kartu.tier).toBe('lokal');
});

test('a new kartu queues a WhatsApp message naming the farmer and tier', async () => {
  await prosesPlotBaru({
    nama: 'Bu Sari',
    desa: 'Margamukti',
    telepon: '0812',
    komoditas: 'kopi',
    lat: -7.15,
    lng: 107.62,
    punyaSTDB: true,
  });
  expect(enqueueWaMock).toHaveBeenCalledTimes(2);
  const text = enqueueWaMock.mock.calls[0][0];
  expect(text).toMatch(/Bu Sari/);
  expect(text).toMatch(/EXPORT-READY/i);
});

test('a new kartu also queues a status-check WhatsApp message to the farmer herself', async () => {
  await prosesPlotBaru({
    nama: 'Bu Sari',
    desa: 'Margamukti',
    telepon: '0812',
    komoditas: 'kopi',
    lat: -7.15,
    lng: 107.62,
    punyaSTDB: true,
  });
  expect(enqueueWaMock).toHaveBeenCalledTimes(2);
  const [text, chatId] = enqueueWaMock.mock.calls[1];
  expect(chatId).toBe('62812@c.us');
  expect(text).toMatch(/Bu Sari/);
  expect(text).toMatch(/EXPORT-READY/i);
  expect(text).toMatch(/telepon=0812/);
});

test('a new kartu without a phone number on file queues only the officer message', async () => {
  await prosesPlotBaru({
    nama: 'Tanpa Telepon',
    komoditas: 'kopi',
    lat: -7.15,
    lng: 107.62,
    punyaSTDB: true,
  });
  expect(enqueueWaMock).toHaveBeenCalledTimes(1);
});

test('two plots produce a linked 2-entry chain', async () => {
  await prosesPlotBaru({ nama: 'A', komoditas: 'kopi', lat: -7.15, lng: 107.62, punyaSTDB: true });
  await prosesPlotBaru({ nama: 'B', komoditas: 'kopi', lat: -7.16, lng: 107.6, punyaSTDB: true });
  const chain = await getChain();
  expect(chain).toHaveLength(2);
  expect(chain[1].previousHash).toBe(chain[0].hash);
});

test('concurrent prosesPlotBaru calls all get a linked chain entry (no race-condition data loss)', async () => {
  await Promise.all([
    prosesPlotBaru({ nama: 'A', komoditas: 'kopi', lat: -7.15, lng: 107.62, punyaSTDB: true }),
    prosesPlotBaru({ nama: 'B', komoditas: 'kopi', lat: -7.16, lng: 107.6, punyaSTDB: true }),
    prosesPlotBaru({ nama: 'C', komoditas: 'kopi', lat: -7.17, lng: 107.61, punyaSTDB: true }),
  ]);
  expect(await getKartus()).toHaveLength(3);
  expect(await getChain()).toHaveLength(3);
});
