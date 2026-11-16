import type { Coords, Spot } from '../types';

export type SpotMapProps = {
  spots: Spot[];
  center: { lat: number; lon: number };
  position: Coords | null;
  onSelect: (spotId: string) => void;
};
