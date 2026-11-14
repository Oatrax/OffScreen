import * as Clipboard from 'expo-clipboard';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { getLockSettings, revealPinIfEarned } from '.';

/** Shown on Today once all required tasks are done and locked apps need a PIN. */
export function PinCard({ unlocked, lockedAppCount }: { unlocked: boolean; lockedAppCount: number }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [revealed, setPin] = useState<string | null>(null);
  const pin = unlocked ? revealed : null; // hidden again if a task is un-done
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'pin' | 'auto'>('pin');

  useEffect(() => {
    void getLockSettings(db).then((s) => setMode(s.mode));
  }, [db]);

  if (lockedAppCount === 0 || !unlocked) return null;

  if (mode === 'auto') {
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold" style={{ color: theme.success }}>
          Your apps are unlocked for today
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">Today&apos;s PIN</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Type it on the lock screen to open a locked app. It changes every day.
      </ThemedText>
      {pin ? (
        <ThemedText type="title" style={styles.pin} selectable>
          {pin}
        </ThemedText>
      ) : null}
      <View style={styles.buttons}>
        <Pressable
          onPress={async () => setPin(pin ? null : await revealPinIfEarned(db))}
          style={[styles.button, styles.flex, { backgroundColor: theme.accent }]}>
          <ThemedText style={styles.buttonText}>{pin ? 'Hide PIN' : 'Reveal PIN'}</ThemedText>
        </Pressable>
        {pin ? (
          <Pressable
            onPress={async () => {
              await Clipboard.setStringAsync(pin);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={[styles.button, styles.flex, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={styles.copyText}>{copied ? 'Copied!' : 'Copy PIN'}</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: 20, gap: Spacing.two, marginBottom: Spacing.two, ...CardShadow },
  pin: { letterSpacing: 6, textAlign: 'center', color: '#6C5CE7' },
  flex: { flex: 1 },
  buttons: { flexDirection: 'row', gap: Spacing.two },
  copyText: { fontWeight: '600' },
  button: { paddingVertical: Spacing.two, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
