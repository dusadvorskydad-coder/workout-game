// Společný žebříček přes Supabase.
//
// Zapne se, když jsou v souboru .env vyplněné EXPO_PUBLIC_SUPABASE_URL
// a EXPO_PUBLIC_SUPABASE_KEY. Bez nich aplikace ukládá jen do zařízení.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '../types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const isOnline = supabase != null;

type Row = {
  id: string;
  spot_id: string;
  challenge_id: string;
  value: number;
  verified: boolean;
  created_at: string;
  profiles: { nickname: string } | { nickname: string }[] | null;
};

const COLUMNS = 'id, spot_id, challenge_id, value, verified, created_at, profiles(nickname)';

function toResult(row: Row): Result {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    spotId: row.spot_id,
    challengeId: row.challenge_id,
    nickname: profile?.nickname ?? 'Neznámý',
    value: row.value,
    at: row.created_at,
    verified: row.verified,
  };
}

/** Výsledky od začátku aktuálního měsíce (jedna sezóna). */
export async function fetchSeasonResults(client: SupabaseClient, now = new Date()): Promise<Result[]> {
  const seasonStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data, error } = await client
    .from('results')
    .select(COLUMNS)
    .gte('created_at', seasonStart)
    .order('created_at', { ascending: true })
    .limit(5000);
  if (error) throw new Error('Žebříček se nepodařilo načíst. Zkontroluj připojení.');
  return (data as unknown as Row[]).map(toResult);
}

/** Vrátí ID přihlášeného hráče; při prvním spuštění založí anonymní účet. */
async function ensureUser(client: SupabaseClient): Promise<string> {
  const { data: current } = await client.auth.getSession();
  if (current.session) return current.session.user.id;
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) throw new Error('Nepodařilo se přihlásit. Zkontroluj připojení.');
  return data.user.id;
}

export async function submitResult(
  client: SupabaseClient,
  result: Omit<Result, 'id' | 'at'>,
): Promise<Result> {
  const userId = await ensureUser(client);

  const { error: profileError } = await client
    .from('profiles')
    .upsert({ id: userId, nickname: result.nickname }, { onConflict: 'id' });
  if (profileError) {
    // 23505 = porušení unikátnosti, tedy přezdívku už má někdo jiný.
    if (profileError.code === '23505') throw new Error('Tahle přezdívka je obsazená, zvol jinou.');
    throw new Error('Přezdívku se nepodařilo uložit. Zkontroluj připojení.');
  }

  // Hráče a čas zápisu doplňuje server, klient je poslat nemůže.
  const { data, error } = await client
    .from('results')
    .insert({
      spot_id: result.spotId,
      challenge_id: result.challengeId,
      value: Math.round(result.value),
      verified: result.verified,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error('Výsledek se nepodařilo uložit. Zkontroluj připojení.');
  return toResult(data as unknown as Row);
}
