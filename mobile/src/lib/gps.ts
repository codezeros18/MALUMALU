import * as Location from 'expo-location';

export interface GpsFix {
  lat: number;
  lng: number;
  accuracyM: number | null;
}

export async function getCurrentPosition(): Promise<GpsFix> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Izin lokasi ditolak. Tap peta untuk memilih titik.');
  }
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracyM: pos.coords.accuracy ?? null,
  };
}
