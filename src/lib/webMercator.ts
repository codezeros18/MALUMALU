export function pixelOffsetToLatLng(
  centerLat: number,
  centerLng: number,
  zoom: number,
  dx: number,
  dy: number
): { lat: number; lng: number } {
  // Convert latitude to radians
  const latRad = (centerLat * Math.PI) / 180;

  // Earth's circumference in meters
  const earthCircumference = 40075016;

  // Web Mercator resolution at this zoom level (meters per pixel)
  const resolution = (earthCircumference * Math.cos(latRad)) / (256 * Math.pow(2, zoom));

  // Offset in meters
  const offsetLngMeters = dx * resolution;
  const offsetLatMeters = -dy * resolution; // Y coordinate goes down on screen

  // Meters per degree
  const metersPerDegreeLat = 111111;
  const metersPerDegreeLng = 111111 * Math.cos(latRad);

  const dLat = offsetLatMeters / metersPerDegreeLat;
  const dLng = offsetLngMeters / metersPerDegreeLng;

  return {
    lat: centerLat + dLat,
    lng: centerLng + dLng,
  };
}
