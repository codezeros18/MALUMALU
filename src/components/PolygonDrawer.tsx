import { useEffect, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { computeAreaHa, MIN_POLYGON_POINTS, type LatLng } from '../lib/polygon';
import { getPolygonRisk, type PolygonRiskResult } from '../lib/geospatial';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import type { BadgeTone } from './ui/Badge';

interface PolygonDrawerProps {
  points: LatLng[];
  onAddPoint: (point: LatLng) => void;
  onRemoveLast: () => void;
  onFinish: () => void;
  onReset: () => void;
  disabled?: boolean;
}

// Alur: Agen jalan ke tiap sudut kebun (mis. 5 sudut = segi lima), di tiap sudut catat
// titik lewat GPS ATAU tap di peta (tap ditangani parent lewat onPickLocation map,
// diteruskan sebagai onAddPoint yang sama) — begitu >= 3 titik, poligon otomatis
// digambar & luasnya dihitung (lib/polygon.ts, turf area()), bukan estimasi manual.
export default function PolygonDrawer({
  points,
  onAddPoint,
  onRemoveLast,
  onFinish,
  onReset,
  disabled = false,
}: PolygonDrawerProps) {
  const { position: gpsPosition, loading: gpsLoading, error: gpsError, request: requestGps } =
    useGeolocation();
  const [risk, setRisk] = useState<PolygonRiskResult | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    if (gpsPosition) onAddPoint({ lat: gpsPosition.lat, lng: gpsPosition.lng });
    // Hanya reaksi ke titik GPS baru — onAddPoint sengaja tidak masuk dependency supaya
    // tidak memicu ulang saat parent re-render dengan referensi fungsi baru.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsPosition]);

  // Skor risiko deforestasi (Sprint 19) — sinyal ADITIF di samping luas, dihitung ulang
  // tiap titik berubah. TIDAK menyentuh cekDeforestasi()/tentukanTier() yang sudah ada;
  // ini murni tambahan visual untuk poligon yang sedang digambar.
  useEffect(() => {
    if (points.length < MIN_POLYGON_POINTS) {
      setRisk(null);
      return;
    }
    let cancelled = false;
    setRiskLoading(true);
    getPolygonRisk(points)
      .then((result) => {
        if (!cancelled) setRisk(result);
      })
      .catch(() => {
        if (!cancelled) setRisk(null);
      })
      .finally(() => {
        if (!cancelled) setRiskLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [points]);

  const handleAddManual = () => {
    setManualError(null);
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (manualLat.trim() === '' || manualLng.trim() === '' || Number.isNaN(lat) || Number.isNaN(lng)) {
      setManualError('Isi lat & lng dengan angka yang valid.');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setManualError('Lat harus -90..90, lng harus -180..180.');
      return;
    }
    onAddPoint({ lat, lng });
    setManualLat('');
    setManualLng('');
  };

  const canFinish = points.length >= MIN_POLYGON_POINTS && !disabled;
  const areaHa = points.length >= MIN_POLYGON_POINTS ? computeAreaHa(points) : 0;

  const RISK_TONE: Record<PolygonRiskResult['risk'], BadgeTone> = {
    rendah: 'aman',
    sedang: 'perlu-audit',
    tinggi: 'berisiko',
  };
  const RISK_LABEL: Record<PolygonRiskResult['risk'], string> = {
    rendah: 'Risiko Rendah',
    sedang: 'Risiko Sedang — Perlu Audit',
    tinggi: 'Risiko Tinggi — Perlu Audit',
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Jalan ke tiap sudut kebun, catat titik lewat GPS, tap di peta, atau ketik koordinat
        manual — minimal {MIN_POLYGON_POINTS} titik, batas kebun & luasnya otomatis tergambar.
      </p>

      {points.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada titik dicatat.</p>
      ) : (
        <ul className="space-y-1">
          {points.map((p, i) => (
            <li
              key={i}
              className="flex items-center justify-between text-xs border border-slate-100 rounded px-2 py-1"
            >
              <span>
                Titik {i + 1}: {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {points.length >= MIN_POLYGON_POINTS && (
        <div className="space-y-1.5">
          <p className="text-xs text-brand-800 font-medium">
            Estimasi luas: {areaHa < 1 ? `${Math.round(areaHa * 10000)} m²` : `${areaHa.toFixed(2)} ha`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Skor risiko deforestasi:</span>
            {riskLoading && <span className="text-xs text-slate-400">Menghitung…</span>}
            {!riskLoading && risk && (
              <Badge tone={RISK_TONE[risk.risk]}>
                {RISK_LABEL[risk.risk]} ({risk.forestOverlapPct.toFixed(0)}% area hutan)
              </Badge>
            )}
          </div>
          {!riskLoading && risk && (
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Batas kebun digambar via tap peta/GPS (bukan jalur GPS kontinu resmi). {risk.catatanError}{' '}
              Skor ini indikator awal, bukan vonis — tetap perlu audit manual.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={requestGps}
          disabled={gpsLoading || disabled}
          size="sm"
        >
          {gpsLoading ? 'Mengambil lokasi…' : `Catat Titik ${points.length + 1} via GPS`}
        </Button>
        {points.length > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={onRemoveLast} disabled={disabled}>
            Hapus titik terakhir
          </Button>
        )}
        {points.length > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={onReset} disabled={disabled}>
            Reset
          </Button>
        )}
      </div>
      {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}

      <div className="border-t border-slate-100 pt-2 space-y-1.5">
        <p className="text-xs text-slate-500">Atau ketik koordinat titik {points.length + 1} langsung:</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            step="any"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            placeholder="Lat, contoh: -7.14995"
            className="text-sm w-40"
            disabled={disabled}
          />
          <Input
            type="number"
            step="any"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            placeholder="Lng, contoh: 107.61885"
            className="text-sm w-40"
            disabled={disabled}
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleAddManual} disabled={disabled}>
            Tambah Titik
          </Button>
        </div>
        {manualError && <p className="text-xs text-red-600">{manualError}</p>}
      </div>

      <Button type="button" onClick={onFinish} disabled={!canFinish} fullWidth size="md">
        {points.length < MIN_POLYGON_POINTS
          ? `Selesai Poligon (butuh ${MIN_POLYGON_POINTS - points.length} titik lagi)`
          : 'Selesai Poligon'}
      </Button>
    </div>
  );
}
