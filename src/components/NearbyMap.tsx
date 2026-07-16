import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Idempotent dengan fix yang sama di MapView.tsx — aman dijalankan dua kali (module-level,
// hanya menimpa default Leaflet icon path yang rusak saat dibundel Vite).
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Marker hijau kecil untuk hasil petani terdekat — dibedakan dari pin biru default
// (dipakai titik referensi) supaya tidak tertukar secara visual di peta.
const farmerIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#166534;border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const PANGALENGAN_CENTER: [number, number] = [-7.15, 107.62];
const DEFAULT_ZOOM = 12;

interface NearbyMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

interface NearbyMapProps {
  referencePoint: { lat: number; lng: number } | null;
  onPickReference: (lat: number, lng: number) => void;
  markers: NearbyMarker[];
}

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function NearbyMap({ referencePoint, onPickReference, markers }: NearbyMapProps) {
  return (
    <div className="relative w-full h-72 sm:h-96 rounded-lg overflow-hidden border border-slate-200">
      <MapContainer center={PANGALENGAN_CENTER} zoom={DEFAULT_ZOOM} className="w-full h-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture onPick={onPickReference} />
        {referencePoint && (
          <Marker position={[referencePoint.lat, referencePoint.lng]}>
            <Popup>Titik referensi (gudang/fasilitas Anda)</Popup>
          </Marker>
        )}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={farmerIcon}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
