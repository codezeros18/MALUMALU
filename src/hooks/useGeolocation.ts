import { useState } from 'react';

interface PositionData {
  lat: number;
  lng: number;
  accuracyM: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<PositionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = () => {
    setLoading(true);
    setError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Akses GPS tidak didukung oleh browser Anda.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        console.warn('[geolocation] Gagal mengambil lokasi riil, menggunakan simulasi koordinat Pangalengan', err);
        // Fallback to Pangalengan default coordinates for smooth demo within blocked iframes
        setPosition({
          lat: -7.1667,
          lng: 107.6167,
          accuracyM: 8.5,
        });
        setError('Gagal mengakses GPS riil (Peringatan: Berjalan di iframe AI Studio biasanya memblokir akses sensor. Kami menggunakan koordinat simulasi Pangalengan).');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return { position, loading, error, request };
}
