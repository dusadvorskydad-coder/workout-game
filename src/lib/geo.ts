import type { Spot } from '../types';

/** Tolerance kolem hřiště, ve které se výsledek počítá jako uložený na místě. */
export const CHECK_IN_TOLERANCE_M = 60;

export function distanceM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isAtSpot(position: { lat: number; lon: number } | null, spot: Spot): boolean {
  if (!position) return false;
  return distanceM(position, spot) <= spot.radiusM + CHECK_IN_TOLERANCE_M;
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}
