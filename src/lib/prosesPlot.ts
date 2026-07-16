import { addKartu, addPetani, addPlot, getChain, newId, setChain } from './db';
import { cekDeforestasi } from './geospatial';
import { evaluateKartu } from './ruleEngine';
import { appendEntry } from './hashchain';
import type { Kartu, Petani, Plot } from '../types';

export interface PlotInput {
  nama: string;
  desa?: string;
  telepon?: string;
  komoditas: string;
  lat: number;
  lng: number;
  gpsAccuracyM?: number;
}

export async function prosesPlotBaru(input: PlotInput): Promise<Kartu> {
  const now = new Date().toISOString();
  const petani: Petani = {
    id: newId(),
    nama: input.nama,
    desa: input.desa,
    telepon: input.telepon,
    createdAt: now,
  };
  const plot: Plot = {
    id: newId(),
    petaniId: petani.id,
    lat: input.lat,
    lng: input.lng,
    komoditas: input.komoditas,
    gpsAccuracyM: input.gpsAccuracyM,
    capturedAt: now,
  };
  const cek = cekDeforestasi(input.lat, input.lng);
  const rule = evaluateKartu(petani, plot, cek);
  const kartu: Kartu = {
    id: newId(),
    petaniId: petani.id,
    plotId: plot.id,
    ...rule,
    deforestasi: cek,
    overrideManual: false,
    createdAt: now,
  };
  await addPetani(petani);
  await addPlot(plot);
  await addKartu(kartu);
  const chain = await getChain();
  await setChain(
    appendEntry(
      chain,
      { kartuId: kartu.id, tier: kartu.tier, stdbStatus: kartu.stdbStatus, lat: plot.lat, lng: plot.lng },
      now,
    ),
  );
  return kartu;
}
