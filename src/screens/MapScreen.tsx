import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SpotMap from '../components/SpotMap';
import { equipmentLabel } from '../data/challenges';
import { distanceM, formatDistance, isAtSpot } from '../lib/geo';
import type { LocationState } from '../lib/useLocation';
import { colors } from '../theme';
import type { Spot } from '../types';

// Výchozí střed mapy: Nymburk.
const HOME = { lat: 50.186, lon: 15.0416 };

type Props = {
  spots: Spot[];
  location: LocationState;
  onSelect: (spotId: string) => void;
};

export default function MapScreen({ spots, location, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const position = location.coords;

  const sorted = useMemo(() => {
    const from = position ?? HOME;
    return spots
      .map((spot) => ({ spot, distance: distanceM(from, spot) }))
      .sort((a, b) => a.distance - b.distance);
  }, [spots, position]);

  const locationNote =
    location.status === 'loading'
      ? 'Zjišťuji polohu…'
      : location.status === 'denied'
        ? 'Poloha je vypnutá. Vzdálenosti se počítají od centra Nymburka.'
        : location.status === 'error'
          ? 'Polohu se nepodařilo zjistit. Vzdálenosti se počítají od centra Nymburka.'
          : null;

  return (
    <View style={styles.root}>
      <View style={styles.map}>
        <SpotMap spots={spots} center={HOME} position={position} onSelect={onSelect} />
        <View style={[styles.title, { top: insets.top + 10 }]} pointerEvents="none">
          <Text style={styles.titleText}>Workout hřiště</Text>
          <Text style={styles.titleSub}>Nymburk a okolí · {spots.length} hřišť</Text>
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
        {locationNote && <Text style={styles.note}>{locationNote}</Text>}
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.spot.id}
          renderItem={({ item: { spot, distance } }) => {
            const here = isAtSpot(position, spot);
            return (
              <Pressable
                onPress={() => onSelect(spot.id)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowName}>{spot.name}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {spot.equipment.length > 0
                      ? spot.equipment.map(equipmentLabel).join(', ')
                      : `${spot.stationCount} ${spot.stationCount === 1 ? 'prvek' : 'prvků'}`}
                  </Text>
                </View>
                {here ? (
                  <View style={styles.hereBadge}>
                    <Text style={styles.hereText}>Jsi tady</Text>
                  </View>
                ) : (
                  <Text style={styles.rowDistance}>{formatDistance(distance)}</Text>
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1.1 },
  title: {
    position: 'absolute',
    left: 12,
    backgroundColor: colors.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    zIndex: 1000,
  },
  titleText: { color: colors.text, fontSize: 18, fontWeight: '800' },
  titleSub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -18,
    paddingTop: 10,
    zIndex: 1000,
  },
  note: { color: colors.muted, fontSize: 12, paddingHorizontal: 18, paddingBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 5,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.card,
    minHeight: 64,
  },
  rowPressed: { backgroundColor: colors.cardAlt },
  rowMain: { flex: 1, paddingRight: 10 },
  rowName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  rowMeta: { color: colors.muted, fontSize: 13, marginTop: 3 },
  rowDistance: { color: colors.text, fontSize: 14, fontWeight: '600' },
  hereBadge: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  hereText: { color: colors.accentText, fontSize: 12, fontWeight: '800' },
});
