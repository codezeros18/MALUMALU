import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { Plot } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

// Fix default marker icon path yang rusak saat dibundel Vite.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const PANGALENGAN_CENTER: [number, number] = [-7.15, 107.62];
const DEFAULT_ZOOM = 13;
const OFFLINE_GRID_BACKGROUND =
  'repeating-linear-gradient(0deg, #e2e8f0 0 1px, transparent 1px 24px),' +
  'repeating-linear-gradient(90deg, #e2e8f0 0 1px, transparent 1px 24px), #f8fafc';

interface MapViewProps {
  plots: Plot[];
  onPickLocation: (lat: number, lng: number) => void;
  pickedPosition?: { lat: number; lng: number } | null;
}

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapView({ plots, onPickLocation, pickedPosition }: MapViewProps) {
  const isOnline = useOnlineStatus();

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-lg overflow-hidden border border-slate-200">
      {!isOnline && (
        <div className="absolute inset-x-0 top-0 z-[1000] flex justify-center pt-2 pointer-events-none">
          <span className="bg-amber-100 text-amber-900 text-xs px-2 py-1 rounded shadow">
            Mode offline: peta dasar mungkin kosong, tap koordinat tetap berfungsi.
          </span>
        </div>
      )}
      <MapContainer
        center={PANGALENGAN_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        style={{ background: isOnline ? undefined : OFFLINE_GRID_BACKGROUND }}
      >
        {isOnline && (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        <ClickCapture onPick={onPickLocation} />
        {plots.map((plot) => (
          <Marker key={plot.id} position={[plot.lat, plot.lng]}>
            <Popup>
              {plot.komoditas}
              {plot.gpsAccuracyM ? ` · akurasi ${Math.round(plot.gpsAccuracyM)}m` : ''}
            </Popup>
          </Marker>
        ))}
        {pickedPosition && (
          <Marker position={[pickedPosition.lat, pickedPosition.lng]}>
            <Popup>Titik terpilih</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
