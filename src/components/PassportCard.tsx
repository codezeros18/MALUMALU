import { AlertTriangle, CheckCircle2, Clock, FileWarning } from 'lucide-react';
import Map3D from './Map3D';
import type { Kartu, Petani, Plot } from '../types';

interface PassportCardProps {
  petani: Petani;
  plot?: Plot;
  kartu: Kartu;
}

type StatusTone = 'green' | 'amber' | 'red';

const TONE_BOX_CLASSES: Record<StatusTone, string> = {
  green: 'bg-green-50 text-green-800',
  amber: 'bg-amber-50 text-amber-800',
  red: 'bg-red-50 text-red-700',
};

const TONE_ICON_CLASSES: Record<StatusTone, string> = {
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
};

function getPassportStatus(kartu: Kartu) {
  if (kartu.deforestasi === 'berisiko') {
    return {
      tone: 'red' as StatusTone,
      label: 'Perlu Perhatian',
      desc: 'Area kebun terindikasi berisiko deforestasi — sedang ditinjau petugas.',
      Icon: AlertTriangle,
    };
  }
  if (kartu.deforestasi === 'perlu-audit') {
    return {
      tone: 'amber' as StatusTone,
      label: 'Sedang Ditinjau',
      desc: 'Status area kebun masih perlu audit lanjutan oleh petugas.',
      Icon: Clock,
    };
  }
  if (kartu.stdbStatus === 'belum-lengkap') {
    return {
      tone: 'amber' as StatusTone,
      label: 'Dokumen Belum Lengkap',
      desc: 'Area kebun aman, tapi masih ada dokumen yang perlu dilengkapi.',
      Icon: FileWarning,
    };
  }
  if (kartu.tier === 'export-ready') {
    return {
      tone: 'green' as StatusTone,
      label: 'Aman & Siap Ekspor',
      desc: 'Kebun Anda tercatat resmi, area aman, dan dokumen lengkap.',
      Icon: CheckCircle2,
    };
  }
  return {
    tone: 'green' as StatusTone,
    label: 'Aman',
    desc: 'Kebun Anda tercatat resmi dan area aman dari risiko deforestasi.',
    Icon: CheckCircle2,
  };
}

const TIER_LABEL: Record<Kartu['tier'], string> = {
  lokal: 'Program Lokal',
  'export-ready': 'Siap Ekspor',
};

export default function PassportCard({ petani, plot, kartu }: PassportCardProps) {
  const status = getPassportStatus(kartu);
  const registeredDate = new Date(kartu.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-brand-400 to-brand-800 text-white px-5 py-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wide uppercase text-white/70">
            JejakHijau
          </span>
          <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
            {TIER_LABEL[kartu.tier]}
          </span>
        </div>
        <p className="text-2xl font-bold mt-3 leading-tight">{petani.nama}</p>
        <p className="text-sm text-white/80 mt-0.5">
          {petani.desa || '—'} · {plot?.komoditas ?? '—'}
        </p>
      </div>

      <div className="relative">
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50" />
        <div className="border-t-2 border-dashed border-slate-200 mx-6" />
      </div>

      <div className="p-5 space-y-4">
        <div className={`flex items-center gap-3 rounded-xl p-3 ${TONE_BOX_CLASSES[status.tone]}`}>
          <status.Icon size={22} className={`shrink-0 ${TONE_ICON_CLASSES[status.tone]}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{status.label}</p>
            <p className="text-xs mt-0.5 opacity-90">{status.desc}</p>
          </div>
        </div>

        {plot && (
          <div>
            <p className="text-xs text-slate-400 mb-1.5">
              Lokasi Kebun
              {plot.boundary && plot.boundary.length >= 3 && (
                <>
                  {' '}
                  · batas kebun (poligon,{' '}
                  {plot.luasEstimasiHa
                    ? plot.luasEstimasiHa < 1
                      ? `${Math.round(plot.luasEstimasiHa * 10000)} m²`
                      : `${plot.luasEstimasiHa.toFixed(2)} ha`
                    : `${plot.boundary.length} titik`}
                  )
                </>
              )}
            </p>
            {plot.boundarySnapshot ? (
              <div>
                <img
                  src={plot.boundarySnapshot}
                  alt="Foto batas kebun"
                  className="h-40 w-full object-cover rounded-lg border border-slate-200"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Foto batas kebun — diambil otomatis saat pendataan, bukan peta live. Data
                  koordinat tetap tersimpan lengkap di balik foto ini.
                </p>
              </div>
            ) : (
              <Map3D
                center={{ lat: plot.lat, lng: plot.lng }}
                zoom={13}
                pitch={0}
                markers={
                  plot.boundary && plot.boundary.length >= 3
                    ? []
                    : [{ id: plot.id, lat: plot.lat, lng: plot.lng, color: '#1F5C3A' }]
                }
                polygons={
                  plot.boundary && plot.boundary.length >= 3
                    ? [{ id: plot.id, points: plot.boundary, color: '#1F5C3A' }]
                    : []
                }
                className="h-40"
                offlineHint="Peta tidak tersedia offline — koordinat tetap tercatat."
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Terdaftar sejak</p>
            <p className="text-slate-800 font-medium">{registeredDate}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Komoditas</p>
            <p className="text-slate-800 font-medium capitalize">{plot?.komoditas ?? '—'}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
