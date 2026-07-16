import { useCallback, useState } from 'react';
import { getCurrentPosition, type GpsPosition } from '../lib/gps';

interface UseGeolocationResult {
  position: GpsPosition | null;
  loading: boolean;
  error: string | null;
  request: () => Promise<void>;
}

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil lokasi GPS.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { position, loading, error, request };
}
