import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Challenge, Result } from '../types';

// Výsledky jsou zatím uložené jen v tomto zařízení. Až přibude server,
// stačí vyměnit obsah funkcí loadResults a addResult.

const RESULTS_KEY = 'workout-game/results/v1';
const NICKNAME_KEY = 'workout-game/nickname/v1';

export async function loadResults(): Promise<Result[]> {
  const raw = await AsyncStorage.getItem(RESULTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addResult(result: Omit<Result, 'id' | 'at'>): Promise<Result> {
  const saved: Result = {
    ...result,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  };
  const all = await loadResults();
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify([...all, saved]));
  return saved;
}

export async function loadNickname(): Promise<string> {
  return (await AsyncStorage.getItem(NICKNAME_KEY)) ?? '';
}

export async function saveNickname(nickname: string): Promise<void> {
  await AsyncStorage.setItem(NICKNAME_KEY, nickname);
}

/** Sezóna je kalendářní měsíc, např. "2026-11". */
export function seasonOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const MONTHS_CS = [
  'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec',
];

export function seasonLabel(date: Date): string {
  return `${MONTHS_CS[date.getMonth()]} ${date.getFullYear()}`;
}

export function daysLeftInSeason(date: Date): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return lastDay - date.getDate();
}

/**
 * Žebříček jedné výzvy na jednom hřišti v aktuální sezóně.
 * Každý hráč je v něm jednou, se svým nejlepším výsledkem.
 */
export function leaderboard(
  results: Result[],
  spotId: string,
  challenge: Challenge,
  now: Date = new Date(),
): Result[] {
  const season = seasonOf(now);
  const isBetter = (a: number, b: number) => (challenge.better === 'higher' ? a > b : a < b);
  const best = new Map<string, Result>();
  for (const r of results) {
    if (r.spotId !== spotId || r.challengeId !== challenge.id) continue;
    if (seasonOf(new Date(r.at)) !== season) continue;
    const key = r.nickname.trim().toLowerCase();
    const current = best.get(key);
    if (!current || isBetter(r.value, current.value)) best.set(key, r);
  }
  return [...best.values()].sort((a, b) => {
    if (a.value !== b.value) return isBetter(a.value, b.value) ? -1 : 1;
    // Při shodě vyhrává ten, kdo výsledek zapsal dřív.
    return a.at.localeCompare(b.at);
  });
}

export function formatTime(ms: number): string {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalS = Math.floor(totalCs / 100);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(m)}:${pad(s)},${pad(cs)}`;
}

export function formatValue(challenge: Challenge, value: number): string {
  return challenge.kind === 'time' ? formatTime(value) : `${value}×`;
}
