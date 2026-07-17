import { useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { computeAreaHa, MIN_POLYGON_POINTS, type LatLng } from '../lib/polygon';
import Button from './ui/Button';

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

  useEffect(() => {
    if (gpsPosition) onAddPoint({ lat: gpsPosition.lat, lng: gpsPosition.lng });
    // Hanya reaksi ke titik GPS baru — onAddPoint sengaja tidak masuk dependency supaya
    // tidak memicu ulang saat parent re-render dengan referensi fungsi baru.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsPosition]);

  const canFinish = points.length >= MIN_POLYGON_POINTS && !disabled;
  const areaHa = points.length >= MIN_POLYGON_POINTS ? computeAreaHa(points) : 0;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Jalan ke tiap sudut kebun, catat titik lewat GPS atau tap di peta — minimal{' '}
        {MIN_POLYGON_POINTS} titik, batas kebun & luasnya otomatis tergambar.
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
        <p className="text-xs text-brand-800 font-medium">
          Estimasi luas: {areaHa < 1 ? `${Math.round(areaHa * 10000)} m²` : `${areaHa.toFixed(2)} ha`}
        </p>
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

      <Button type="button" onClick={onFinish} disabled={!canFinish} fullWidth size="md">
        {points.length < MIN_POLYGON_POINTS
          ? `Selesai Poligon (butuh ${MIN_POLYGON_POINTS - points.length} titik lagi)`
          : 'Selesai Poligon'}
      </Button>
    </div>
  );
}
