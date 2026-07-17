import type { DeforestasiCheck, Petani, Plot, StdbStatus, Tier } from '../types';

export interface RuleResult {
  tier: Tier;
  stdbStatus: StdbStatus;
  alasan: string[];
}

// punyaSTDB = petani SUDAH memiliki sertifikat STDB terbit (bukan sekadar data lengkap
// dan siap mengajukan — itu 'dataLengkap'/stdbStatus di bawah). Paritas dengan web
// (lihat tentukanTier di src/lib/ruleEngine.ts): tanpa STDB terbit, tier tidak pernah
// naik ke export_ready, walau deforestasi aman & data lengkap.
export function evaluateKartu(petani: Petani, plot: Plot, cek: DeforestasiCheck, punyaSTDB: boolean): RuleResult {
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

  // Sengaja LEBIH KETAT dari web: mobile menangkap GPS live di lapangan, jadi akurasi
  // rendah adalah risiko nyata yang web (input desk, tanpa langkah tangkap-GPS) tidak
  // punya. Perbedaan ini disengaja, bukan divergensi yang belum ditutup.
  const gpsOk = plot.gpsAccuracyM === undefined || plot.gpsAccuracyM <= 20;
  if (!gpsOk) {
    alasan.push(`Akurasi GPS rendah (${plot.gpsAccuracyM} m > 20 m, point-primary)`);
  }

  alasan.push(
    punyaSTDB ? 'Petani sudah memiliki STDB terbit' : 'Petani belum memiliki STDB terbit — wajib untuk export-ready',
  );

  const stdbStatus: StdbStatus = dataLengkap ? 'lengkap' : 'belum_lengkap';
  const tier: Tier = cek.status === 'aman' && dataLengkap && gpsOk && punyaSTDB ? 'export_ready' : 'lokal';
  return { tier, stdbStatus, alasan };
}
