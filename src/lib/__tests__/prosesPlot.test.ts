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
  });
  expect(kartu.tier).toBe('export_ready');
  expect(await getPetani()).toHaveLength(1);
  expect(await getPlots()).toHaveLength(1);
  expect(await getKartus()).toHaveLength(1);
  expect(await getChain()).toHaveLength(1);
});

test('a new kartu queues a WhatsApp message naming the farmer and tier', async () => {
  await prosesPlotBaru({
    nama: 'Bu Sari',
    desa: 'Margamukti',
    telepon: '0812',
    komoditas: 'kopi',
    lat: -7.15,
    lng: 107.62,
  });
  expect(enqueueWaMock).toHaveBeenCalledTimes(1);
  const text = enqueueWaMock.mock.calls[0][0];
  expect(text).toMatch(/Bu Sari/);
  expect(text).toMatch(/EXPORT-READY/i);
});

test('two plots produce a linked 2-entry chain', async () => {
  await prosesPlotBaru({ nama: 'A', komoditas: 'kopi', lat: -7.15, lng: 107.62 });
  await prosesPlotBaru({ nama: 'B', komoditas: 'kopi', lat: -7.16, lng: 107.6 });
  const chain = await getChain();
  expect(chain).toHaveLength(2);
  expect(chain[1].previousHash).toBe(chain[0].hash);
});
