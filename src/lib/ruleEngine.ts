import type { DeforestasiCheck, Petani, Plot, StdbStatus, Tier } from '../types';

export interface RuleResult {
  tier: Tier;
  stdbStatus: StdbStatus;
  alasan: string[];
}

export function evaluateKartu(petani: Petani, plot: Plot, cek: DeforestasiCheck): RuleResult {
  const alasan: string[] = [];

  if (cek.status === 'aman') {
    alasan.push('Bebas indikasi deforestasi pasca-2020 (peta risiko, data demo)');
  } else if (cek.status === 'terindikasi') {
    alasan.push('Terindikasi deforestasi pasca-2020 pada peta risiko');
  } else {
    alasan.push('Plot di luar cakupan peta risiko');
  }

  const dataLengkap = Boolean(petani.nama && petani.desa && petani.telepon && plot.komoditas);
  alasan.push(
    dataLengkap ? 'Data petani lengkap (siap STDB)' : 'Data petani belum lengkap (desa/telepon kosong)',
  );

  const gpsOk = plot.gpsAccuracyM === undefined || plot.gpsAccuracyM <= 20;
  if (!gpsOk) {
    alasan.push(`Akurasi GPS rendah (${plot.gpsAccuracyM} m > 20 m, point-primary)`);
  }

  const stdbStatus: StdbStatus = dataLengkap ? 'lengkap' : 'belum_lengkap';
  const tier: Tier = cek.status === 'aman' && dataLengkap && gpsOk ? 'export_ready' : 'lokal';
  return { tier, stdbStatus, alasan };
}
