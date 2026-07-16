import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { pixelOffsetToLatLng } from '../lib/webMercator';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const TERRAIN_DEM_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'];

const OFFLINE_GRID_BACKGROUND =
  'repeating-linear-gradient(0deg, #e2e8f0 0 1px, transparent 1px 24px),' +
  'repeating-linear-gradient(90deg, #e2e8f0 0 1px, transparent 1px 24px), #f8fafc';

export interface Map3DMarker {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  label?: string;
}

interface Map3DProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Map3DMarker[];
  onPick?: (lat: number, lng: number) => void;
  offlineHint?: string;
  className?: string;
}

export default function Map3D({ center, zoom, markers, onPick, offlineHint, className }: Map3DProps) {
  const isOnline = useOnlineStatus();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!isOnline || !containerRef.current) return;
    const markers = markerRefs.current;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom,
      pitch: 60,
      bearing: -17,
      maxPitch: 85,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: TERRAIN_DEM_TILES,
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 15,
      });
      map.setTerrain({ source: 'terrain-dem', exaggeration: 1.4 });

      const firstSymbolId = map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
      map.addLayer(
        {
          id: 'hillshade-3d',
          type: 'hillshade',
          source: 'terrain-dem',
          paint: { 'hillshade-exaggeration': 0.6 },
        },
        firstSymbolId,
      );
    });

    map.on('click', (e) => onPickRef.current?.(e.lngLat.lat, e.lngLat.lng));

    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
    // Peta hanya diinisialisasi ulang saat status online berubah — pergerakan
    // center/zoom setelahnya ditangani lewat easeTo() di effect terpisah di bawah,
    // bukan lewat re-mount (supaya animasi halus & marker tidak ikut ter-reset).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  useEffect(() => {
    mapRef.current?.easeTo({ center: [center.lng, center.lat], zoom, duration: 600 });
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isOnline) return;

    const seenIds = new Set<string>();
    for (const marker of markers) {
      seenIds.add(marker.id);
      const existing = markerRefs.current.get(marker.id);
      if (existing) {
        existing.setLngLat([marker.lng, marker.lat]);
        continue;
      }
      const el = document.createElement('div');
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '9999px';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.45)';
      el.style.background = marker.color ?? '#1F5C3A';
      const mk = new maplibregl.Marker({ element: el });
      if (marker.label) {
        mk.setPopup(new maplibregl.Popup({ offset: 14 }).setText(marker.label));
      }
      mk.setLngLat([marker.lng, marker.lat]).addTo(map);
      markerRefs.current.set(marker.id, mk);
    }
    for (const [id, mk] of markerRefs.current) {
      if (!seenIds.has(id)) {
        mk.remove();
        markerRefs.current.delete(id);
      }
    }
  }, [markers, isOnline]);

  const handleOfflineClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!onPick || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    const { lat, lng } = pixelOffsetToLatLng(center.lat, center.lng, zoom, dx, dy);
    onPick(lat, lng);
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border border-slate-200 ${className ?? 'h-72 sm:h-80'}`}
    >
      {!isOnline && (
        <>
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2 pointer-events-none">
            <span className="bg-amber-100 text-amber-900 text-xs px-2 py-1 rounded shadow">
              {offlineHint ?? 'Mode offline: peta 3D tidak tersedia, tap koordinat tetap berfungsi.'}
            </span>
          </div>
          <div
            role={onPick ? 'button' : undefined}
            tabIndex={onPick ? 0 : undefined}
            onClick={handleOfflineClick}
            style={{ background: OFFLINE_GRID_BACKGROUND }}
            className={`w-full h-full ${onPick ? 'cursor-crosshair' : ''}`}
          />
        </>
      )}
      <div ref={containerRef} className={`w-full h-full ${isOnline ? '' : 'hidden'}`} />
    </div>
  );
}
