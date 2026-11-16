export type Spot = {
  id: string;
  name: string;
  place: string | null;
  lat: number;
  lon: number;
  /** Vzdálenost nejvzdálenějšího prvku od středu hřiště v metrech. */
  radiusM: number;
  stationCount: number;
  equipment: string[];
  notes: string[];
  osmIds: string[];
};

export type Challenge = {
  id: string;
  name: string;
  /** reps = počet opakování, time = čas ze stopek */
  kind: 'reps' | 'time';
  /** Co je lepší výsledek. */
  better: 'higher' | 'lower';
  summary: string;
  rules: string[];
  /** Cviky, ke kterým se u výzvy ukáže návod. */
  exercises: string[];
};

export type Exercise = {
  id: string;
  name: string;
  steps: string[];
  mistakes: string[];
};

export type Result = {
  id: string;
  spotId: string;
  challengeId: string;
  nickname: string;
  /** Opakování, nebo čas v milisekundách. */
  value: number;
  /** ISO datum. */
  at: string;
  /** Výsledek byl uložen přímo na hřišti (podle GPS). */
  verified: boolean;
};

export type Coords = { lat: number; lon: number; accuracyM: number | null };
