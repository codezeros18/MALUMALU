import Map3D, { type Map3DMarker } from './Map3D';

const PANGALENGAN_CENTER = { lat: -7.15, lng: 107.62 };
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

export default function NearbyMap({ referencePoint, onPickReference, markers }: NearbyMapProps) {
  const mapMarkers: Map3DMarker[] = markers.map((m) => ({
    id: m.id,
    lat: m.lat,
    lng: m.lng,
    color: '#166534',
    label: m.label,
  }));

  if (referencePoint) {
    mapMarkers.push({
      id: '__reference__',
      lat: referencePoint.lat,
      lng: referencePoint.lng,
      color: '#2563EB',
      label: 'Titik referensi (gudang/fasilitas Anda)',
    });
  }

  return (
    <Map3D
      center={PANGALENGAN_CENTER}
      zoom={DEFAULT_ZOOM}
      markers={mapMarkers}
      onPick={onPickReference}
      className="h-72 sm:h-96"
    />
  );
}
