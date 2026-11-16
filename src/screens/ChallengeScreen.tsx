import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Stopwatch from '../components/Stopwatch';
import { EXERCISES } from '../data/challenges';
import { isOnline } from '../lib/backend';
import { isAtSpot } from '../lib/geo';
import { formatValue, leaderboard, seasonLabel } from '../lib/results';
import type { LocationState } from '../lib/useLocation';
import { colors } from '../theme';
import type { Challenge, Result, Spot } from '../types';

type Props = {
  spot: Spot;
  challenge: Challenge;
  results: Result[];
  location: LocationState;
  nickname: string;
  onNickname: (nickname: string) => void;
  onSave: (value: number, verified: boolean) => Promise<void>;
  onBack: () => void;
};

export default function ChallengeScreen({
  spot,
  challenge,
  results,
  location,
  nickname,
  onNickname,
  onSave,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const [openExercise, setOpenExercise] = useState<string | null>(null);
  const [timeMs, setTimeMs] = useState<number | null>(null);
  const [reps, setReps] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedValue, setSavedValue] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Po uložení se stopky založí znovu, aby šel hned další pokus.
  const [attempt, setAttempt] = useState(0);

  const now = new Date();
  const board = leaderboard(results, spot.id, challenge, now);
  const here = isAtSpot(location.coords, spot);
  const exercises = EXERCISES.filter((e) => challenge.exercises.includes(e.id));

  const repsNumber = /^\d{1,4}$/.test(reps) ? Number(reps) : null;
  const value = challenge.kind === 'time' ? timeMs : repsNumber;
  const name = nickname.trim();
  const canSave = value != null && value > 0 && name.length >= 2 && !saving;

  const hint =
    value == null || value <= 0
      ? challenge.kind === 'time'
        ? 'Změř čas stopkami.'
        : 'Zadej počet opakování.'
      : name.length < 2
        ? 'Doplň přezdívku (aspoň 2 znaky).'
        : here
          ? 'Uloží se jako ověřené polohou.'
          : 'Nejsi na hřišti, výsledek se uloží jako neověřený.';

  const save = async () => {
    if (!canSave || value == null) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(value, here);
      setSavedValue(value);
      setTimeMs(null);
      setReps('');
      setAttempt((n) => n + 1);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Výsledek se nepodařilo uložit.');
    } finally {
      setSaving(false);
    }
  };

  const changeReps = (delta: number) => {
    const next = Math.max(0, Math.min(9999, (repsNumber ?? 0) + delta));
    setReps(next === 0 ? '' : String(next));
    setSavedValue(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title={challenge.name} subtitle={spot.name} onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>Pravidla</Text>
          {challenge.rules.map((rule) => (
            <View key={rule} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{rule}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Jak na to</Text>
          {exercises.map((exercise) => {
            const open = openExercise === exercise.id;
            return (
              <View key={exercise.id}>
                <Pressable
                  onPress={() => setOpenExercise(open ? null : exercise.id)}
                  style={styles.exerciseHead}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                >
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseToggle}>{open ? '−' : '+'}</Text>
                </Pressable>
                {open && (
                  <View style={styles.exerciseBody}>
                    {exercise.steps.map((step, i) => (
                      <View key={step} style={styles.bulletRow}>
                        <Text style={styles.stepNumber}>{i + 1}.</Text>
                        <Text style={styles.bulletText}>{step}</Text>
                      </View>
                    ))}
                    <Text style={styles.mistakesLabel}>Časté chyby</Text>
                    {exercise.mistakes.map((mistake) => (
                      <View key={mistake} style={styles.bulletRow}>
                        <Text style={[styles.bullet, { color: colors.danger }]}>✕</Text>
                        <Text style={styles.bulletText}>{mistake}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{challenge.kind === 'time' ? 'Tvůj pokus' : 'Stopky'}</Text>
          <View style={{ marginTop: 6 }}>
            <Stopwatch
              key={attempt}
              onChange={(ms) => {
                if (challenge.kind === 'time') setTimeMs(ms);
                if (ms == null) setSavedValue(null);
              }}
            />
          </View>

          {challenge.kind === 'reps' && (
            <>
              <Text style={[styles.label, { marginTop: 20 }]}>Počet opakování</Text>
              <View style={styles.repsRow}>
                <Pressable
                  onPress={() => changeReps(-1)}
                  style={styles.repsButton}
                  accessibilityRole="button"
                  accessibilityLabel="Ubrat opakování"
                >
                  <Text style={styles.repsButtonText}>−</Text>
                </Pressable>
                <TextInput
                  value={reps}
                  onChangeText={(text) => {
                    setReps(text.replace(/\D/g, '').slice(0, 4));
                    setSavedValue(null);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  style={styles.repsInput}
                  accessibilityLabel="Počet opakování"
                />
                <Pressable
                  onPress={() => changeReps(1)}
                  style={styles.repsButton}
                  accessibilityRole="button"
                  accessibilityLabel="Přidat opakování"
                >
                  <Text style={styles.repsButtonText}>+</Text>
                </Pressable>
              </View>
            </>
          )}

          <Text style={[styles.label, { marginTop: 20 }]}>Přezdívka</Text>
          <TextInput
            value={nickname}
            onChangeText={(text) => onNickname(text.slice(0, 20))}
            placeholder="Jak ti máme říkat?"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.nickInput}
            accessibilityLabel="Přezdívka"
          />

          <Pressable
            onPress={save}
            disabled={!canSave}
            style={[styles.save, !canSave && styles.saveDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
              {saving ? 'Ukládám…' : value != null && value > 0 ? `Uložit ${formatValue(challenge, value)}` : 'Uložit výsledek'}
            </Text>
          </Pressable>
          <Text style={[styles.hint, saveError != null && styles.hintError]}>
            {saveError != null
              ? saveError
              : savedValue != null && value == null
              ? `Uloženo: ${formatValue(challenge, savedValue)}. Můžeš zkusit další pokus.`
              : hint}
          </Text>
        </View>

        <View style={styles.boardHead}>
          <Text style={styles.heading}>Žebříček · {seasonLabel(now)}</Text>
        </View>
        <Text style={styles.boardNote}>
          {isOnline
            ? 'Společný žebříček všech hráčů. Každý je v něm se svým nejlepším výsledkem.'
            : 'Ukládá se jen v tomto zařízení, společný žebříček není nastavený.'}
        </Text>

        {board.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.empty}>Tady zatím nikdo necvičil. První místo je volné.</Text>
          </View>
        ) : (
          board.map((result, index) => (
            <View key={result.id} style={styles.boardRow}>
              <Text style={[styles.rank, index === 0 && { color: colors.gold }]}>{index + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.boardName} numberOfLines={1}>
                  {result.nickname}
                </Text>
                <Text style={styles.boardMeta}>
                  {new Date(result.at).toLocaleDateString('cs-CZ')}
                  {result.verified ? ' · ověřeno polohou' : ' · neověřeno'}
                </Text>
              </View>
              <Text style={styles.boardValue}>{formatValue(challenge, result.value)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  bulletRow: { flexDirection: 'row', marginTop: 8 },
  bullet: { color: colors.accent, width: 18, fontSize: 14, lineHeight: 20 },
  stepNumber: { color: colors.accent, width: 22, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  bulletText: { color: colors.text, fontSize: 14, lineHeight: 20, flex: 1 },
  exerciseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginTop: 4,
  },
  exerciseName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  exerciseToggle: { color: colors.accent, fontSize: 24, width: 28, textAlign: 'center' },
  exerciseBody: { paddingBottom: 8 },
  mistakesLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 12 },
  repsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  repsButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repsButtonText: { color: colors.text, fontSize: 26, lineHeight: 30 },
  repsInput: {
    width: 120,
    height: 60,
    marginHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  nickInput: {
    height: 48,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  save: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveDisabled: { backgroundColor: colors.cardAlt },
  saveText: { color: colors.accentText, fontSize: 17, fontWeight: '800' },
  saveTextDisabled: { color: colors.muted },
  hint: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 10 },
  hintError: { color: colors.danger },
  boardHead: { marginTop: 10, paddingHorizontal: 4 },
  heading: { color: colors.text, fontSize: 17, fontWeight: '800' },
  boardNote: { color: colors.muted, fontSize: 12, paddingHorizontal: 4, marginTop: 3, marginBottom: 8 },
  empty: { color: colors.muted, fontSize: 14 },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginVertical: 4,
  },
  rank: { color: colors.muted, fontSize: 18, fontWeight: '800', width: 36 },
  boardName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  boardMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  boardValue: { color: colors.text, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'], marginLeft: 10 },
});
