import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CHALLENGES } from './src/data/challenges';
import spotsData from './src/data/spots.json';
import { addResult, loadNickname, loadResults, saveNickname } from './src/lib/results';
import { useLocation } from './src/lib/useLocation';
import ChallengeScreen from './src/screens/ChallengeScreen';
import MapScreen from './src/screens/MapScreen';
import SpotScreen from './src/screens/SpotScreen';
import { colors } from './src/theme';
import type { Result, Spot } from './src/types';

const SPOTS: Spot[] = spotsData;

type Route =
  | { name: 'map' }
  | { name: 'spot'; spotId: string }
  | { name: 'challenge'; spotId: string; challengeId: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'map' });
  const [results, setResults] = useState<Result[]>([]);
  const [nickname, setNickname] = useState('');
  const location = useLocation();

  useEffect(() => {
    loadResults().then(setResults).catch(() => {});
    loadNickname().then(setNickname).catch(() => {});
  }, []);

  const goBack = useCallback(() => {
    setRoute((current) =>
      current.name === 'challenge' ? { name: 'spot', spotId: current.spotId } : { name: 'map' },
    );
  }, []);

  // Tlačítko Zpět na Androidu.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'map') return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [route.name, goBack]);

  const changeNickname = (value: string) => {
    setNickname(value);
    saveNickname(value).catch(() => {});
  };

  const spot = route.name === 'map' ? undefined : SPOTS.find((s) => s.id === route.spotId);
  const challenge =
    route.name === 'challenge' ? CHALLENGES.find((c) => c.id === route.challengeId) : undefined;

  let screen;
  if (route.name === 'challenge' && spot && challenge) {
    screen = (
      <ChallengeScreen
        key={`${spot.id}/${challenge.id}`}
        spot={spot}
        challenge={challenge}
        results={results}
        location={location}
        nickname={nickname}
        onNickname={changeNickname}
        onBack={goBack}
        onSave={async (value, verified) => {
          const saved = await addResult({
            spotId: spot.id,
            challengeId: challenge.id,
            nickname: nickname.trim(),
            value,
            verified,
          });
          setResults((all) => [...all, saved]);
        }}
      />
    );
  } else if (route.name !== 'map' && spot) {
    screen = (
      <SpotScreen
        spot={spot}
        results={results}
        location={location}
        onBack={goBack}
        onChallenge={(challengeId) => setRoute({ name: 'challenge', spotId: spot.id, challengeId })}
      />
    );
  } else {
    screen = (
      <MapScreen
        spots={SPOTS}
        location={location}
        onSelect={(spotId) => setRoute({ name: 'spot', spotId })}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        {screen}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
