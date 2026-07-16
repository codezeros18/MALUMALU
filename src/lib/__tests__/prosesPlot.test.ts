import { prosesPlotBaru } from '../prosesPlot';
import { clearAllData, getChain, getKartus, getPetani, getPlots } from '../db';

beforeEach(() => clearAllData());

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

test('two plots produce a linked 2-entry chain', async () => {
  await prosesPlotBaru({ nama: 'A', komoditas: 'kopi', lat: -7.15, lng: 107.62 });
  await prosesPlotBaru({ nama: 'B', komoditas: 'kopi', lat: -7.16, lng: 107.6 });
  const chain = await getChain();
  expect(chain).toHaveLength(2);
  expect(chain[1].previousHash).toBe(chain[0].hash);
});
