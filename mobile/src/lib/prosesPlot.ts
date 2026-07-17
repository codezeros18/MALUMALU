import { addKartu, addPetani, addPlot, newId } from './db';
import { cekDeforestasi } from './geospatial';
import { evaluateKartu } from './ruleEngine';
import { commitEntry } from './hashchain';
import { enqueueWa } from './waOutbox';
import { toChatId } from './waha';
import { STATUS_LINK_SCHEME } from './harga/bot';
import type { Kartu, Petani, Plot } from '../types';

export interface PlotInput {
  nama: string;
  desa?: string;
  telepon?: string;
  komoditas: string;
  lat: number;
  lng: number;
  gpsAccuracyM?: number;
  // Sudah punya sertifikat STDB terbit? Wajib diisi eksplisit (bukan default tersembunyi)
  // supaya setiap pemanggil sadar ini menentukan tier export_ready — lihat ruleEngine.ts.
  punyaSTDB: boolean;
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
  const rule = evaluateKartu(petani, plot, cek, input.punyaSTDB);
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
  await commitEntry(
    { kartuId: kartu.id, tier: kartu.tier, stdbStatus: kartu.stdbStatus, lat: plot.lat, lng: plot.lng },
    now,
  );
  await enqueueWa(
    `✅ *PASPOR PETANI — Kartu Baru*\n\n` +
      `Petani: *${petani.nama}*${petani.desa ? ` (${petani.desa})` : ''}\n` +
      `Komoditas: ${plot.komoditas}\n` +
      `Tier: ${kartu.tier === 'export_ready' ? 'EXPORT-READY' : 'LOKAL'}\n` +
      `Deforestasi: ${cek.status}\n` +
      `Koordinat: ${plot.lat.toFixed(5)}, ${plot.lng.toFixed(5)}`,
  );
  if (petani.telepon) {
    await enqueueWa(
      `✅ *Paspor Petani Anda Sudah Dibuat*\n\n` +
        `Halo *${petani.nama}*, data lahan ${plot.komoditas}${petani.desa ? ` di ${petani.desa}` : ''} sudah tercatat.\n` +
        `Tier: ${kartu.tier === 'export_ready' ? 'EXPORT-READY' : 'LOKAL'}\n\n` +
        `Cek status dokumen Anda:\n${STATUS_LINK_SCHEME}?telepon=${encodeURIComponent(petani.telepon)}`,
      toChatId(petani.telepon),
    );
  }
  return kartu;
}
