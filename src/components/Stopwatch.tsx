import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatTime } from '../lib/results';
import { colors } from '../theme';

type Props = {
  /** Zavolá se při zastavení s naměřeným časem, při vynulování s null. */
  onChange: (elapsedMs: number | null) => void;
};

export default function Stopwatch({ onChange }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  // Čas se počítá z rozdílu časových značek, ne z počtu tiků,
  // takže je přesný i když se obrazovka na chvíli zasekne.
  const startedAt = useRef(0);
  const base = useRef(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setElapsed(base.current + (Date.now() - startedAt.current));
    }, 33);
    return () => clearInterval(timer);
  }, [running]);

  const start = () => {
    startedAt.current = Date.now();
    onChange(null);
    setRunning(true);
  };

  const stop = () => {
    const total = base.current + (Date.now() - startedAt.current);
    base.current = total;
    setElapsed(total);
    setRunning(false);
    onChange(total);
  };

  const reset = () => {
    base.current = 0;
    setElapsed(0);
    onChange(null);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.time} accessibilityLabel={`Čas ${formatTime(elapsed)}`}>
        {formatTime(elapsed)}
      </Text>
      <View style={styles.buttons}>
        {running ? (
          <Pressable onPress={stop} style={[styles.button, styles.stop]} accessibilityRole="button">
            <Text style={styles.stopText}>Stop</Text>
          </Pressable>
        ) : elapsed === 0 ? (
          <Pressable onPress={start} style={[styles.button, styles.start]} accessibilityRole="button">
            <Text style={styles.startText}>Start</Text>
          </Pressable>
        ) : (
          // Po zastavení nejde pokračovat, aby se čas nedal pozastavit při odpočinku.
          <Pressable onPress={reset} style={[styles.button, styles.reset]} accessibilityRole="button">
            <Text style={styles.resetText}>Vynulovat</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  time: {
    color: colors.text,
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  buttons: { flexDirection: 'row', marginTop: 12 },
  button: {
    minWidth: 130,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    marginHorizontal: 6,
  },
  start: { backgroundColor: colors.accent },
  startText: { color: colors.accentText, fontSize: 17, fontWeight: '800' },
  stop: { backgroundColor: colors.danger },
  stopText: { color: '#2a0703', fontSize: 17, fontWeight: '800' },
  reset: { backgroundColor: colors.cardAlt },
  resetText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
