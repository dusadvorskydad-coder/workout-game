import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { Coords } from '../types';

export type LocationState =
  | { status: 'loading'; coords: null }
  | { status: 'denied'; coords: null }
  | { status: 'error'; coords: null }
  | { status: 'ok'; coords: Coords };

/** Sleduje polohu uživatele, dokud je komponenta zobrazená. */
export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ status: 'loading', coords: null });

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setState({ status: 'denied', coords: null });
          return;
        }
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 5000 },
          (position) => {
            setState({
              status: 'ok',
              coords: {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                accuracyM: position.coords.accuracy,
              },
            });
          },
          () => {
            setState((prev) => (prev.status === 'ok' ? prev : { status: 'error', coords: null }));
          },
        );
        if (cancelled) sub.remove();
        else subscription = sub;
      } catch {
        if (!cancelled) setState({ status: 'error', coords: null });
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return state;
}
