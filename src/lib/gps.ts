export interface GpsPosition {
  lat: number;
  lng: number;
  accuracyM: number;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

function friendlyGeoError(err: GeolocationPositionError): Error {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new Error('Izin lokasi ditolak. Aktifkan akses lokasi untuk menandai plot.');
    case err.POSITION_UNAVAILABLE:
      return new Error('Lokasi GPS tidak tersedia saat ini. Coba lagi di area terbuka.');
    case err.TIMEOUT:
      return new Error('Pengambilan lokasi GPS terlalu lama (timeout). Coba lagi.');
    default:
      return new Error('Gagal mengambil lokasi GPS.');
  }
}

export function getCurrentPosition(): Promise<GpsPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Perangkat ini tidak mendukung geolocation.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        });
      },
      (err) => reject(friendlyGeoError(err)),
      GEOLOCATION_OPTIONS,
    );
  });
}

export function watchPosition(
  cb: (position: GpsPosition) => void,
  onError?: (err: Error) => void,
): number | null {
  if (!navigator.geolocation) {
    onError?.(new Error('Perangkat ini tidak mendukung geolocation.'));
    return null;
  }
  return navigator.geolocation.watchPosition(
    (pos) => {
      cb({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: pos.coords.accuracy,
      });
    },
    (err) => onError?.(friendlyGeoError(err)),
    GEOLOCATION_OPTIONS,
  );
}

export function clearWatch(watchId: number): void {
  navigator.geolocation?.clearWatch(watchId);
}
