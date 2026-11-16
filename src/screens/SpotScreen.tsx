import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { CHALLENGES, equipmentLabel } from '../data/challenges';
import { distanceM, formatDistance, isAtSpot } from '../lib/geo';
import { daysLeftInSeason, formatValue, leaderboard, seasonLabel } from '../lib/results';
import type { LocationState } from '../lib/useLocation';
import { colors } from '../theme';
import type { Result, Spot } from '../types';

type Props = {
  spot: Spot;
  results: Result[];
  location: LocationState;
  onBack: () => void;
  onChallenge: (challengeId: string) => void;
};

export default function SpotScreen({ spot, results, location, onBack, onChallenge }: Props) {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const position = location.coords;
  const here = isAtSpot(position, spot);
  const daysLeft = daysLeftInSeason(now);

  return (
    <View style={styles.root}>
      <Header title={spot.name} subtitle={spot.place ?? undefined} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 24 }}>
        <View style={[styles.status, here && styles.statusHere]}>
          <Text style={[styles.statusText, here && styles.statusTextHere]}>
            {here
              ? 'Jsi na hřišti. Výsledky se uloží jako ověřené polohou.'
              : position
                ? `Hřiště je ${formatDistance(distanceM(position, spot))} od tebe. Ověřený výsledek jde uložit jen na místě.`
                : 'Bez polohy se výsledky uloží jako neověřené.'}
          </Text>
        </View>

        {(spot.equipment.length > 0 || spot.notes.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.label}>Vybavení</Text>
            {spot.equipment.length > 0 && (
              <View style={styles.chips}>
                {spot.equipment.map((e) => (
                  <View key={e} style={styles.chip}>
                    <Text style={styles.chipText}>{equipmentLabel(e)}</Text>
                  </View>
                ))}
              </View>
            )}
            {spot.notes.map((n) => (
              <Text key={n} style={styles.noteText}>
                {n}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.seasonRow}>
          <Text style={styles.heading}>Výzvy · {seasonLabel(now)}</Text>
          <Text style={styles.seasonLeft}>
            {daysLeft === 0 ? 'poslední den sezóny' : `do konce sezóny ${daysLeft} d`}
          </Text>
        </View>

        {CHALLENGES.map((challenge) => {
          const board = leaderboard(results, spot.id, challenge, now);
          const leader = board[0];
          return (
            <Pressable
              key={challenge.id}
              onPress={() => onChallenge(challenge.id)}
              style={({ pressed }) => [styles.challenge, pressed && styles.challengePressed]}
              accessibilityRole="button"
            >
              <View style={styles.challengeMain}>
                <Text style={styles.challengeName}>{challenge.name}</Text>
                <Text style={styles.challengeSummary}>{challenge.summary}</Text>
                <Text style={styles.challengeLeader}>
                  {leader
                    ? `👑 ${leader.nickname} · ${formatValue(challenge, leader.value)}`
                    : 'Zatím bez výsledku. Buď první.'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  status: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  statusHere: { backgroundColor: colors.accent },
  statusText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  statusTextHere: { color: colors.accentText, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginHorizontal: -3 },
  chip: { backgroundColor: colors.cardAlt, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, margin: 3 },
  chipText: { color: colors.text, fontSize: 13 },
  noteText: { color: colors.muted, fontSize: 13, marginTop: 8 },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  heading: { color: colors.text, fontSize: 17, fontWeight: '800' },
  seasonLeft: { color: colors.muted, fontSize: 12 },
  challenge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginVertical: 5,
  },
  challengePressed: { backgroundColor: colors.cardAlt },
  challengeMain: { flex: 1 },
  challengeName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  challengeSummary: { color: colors.muted, fontSize: 13, marginTop: 3 },
  challengeLeader: { color: colors.gold, fontSize: 13, marginTop: 8, fontWeight: '600' },
  chevron: { color: colors.muted, fontSize: 26, marginLeft: 8 },
});
