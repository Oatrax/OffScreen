import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getThemePreference, setThemePreference, type ThemePreference } from '@/features/appearance';
import { PermissionList } from '@/features/permissions/permission-list';
import { getLockSettings, setLockSettings, type LockSettings } from '@/features/unlock';
import { useTheme } from '@/hooks/use-theme';

const THEMES = [
  { value: 'light', label: 'Light', icon: 'sunny' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
] as const;

const MODES = [
  {
    value: 'pin',
    label: 'Hidden PIN',
    hint: "Finish tasks, reveal today's PIN, type it on the lock screen.",
  },
  { value: 'auto', label: 'Automatic', hint: 'Locked apps open by themselves once tasks are done.' },
] as const;

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [appearance, setAppearance] = useState<ThemePreference>('light');

  useEffect(() => {
    void getLockSettings(db).then(setSettings);
    void getThemePreference(db).then(setAppearance);
  }, [db]);

  const update = async (patch: Partial<LockSettings>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s));
    await setLockSettings(db, patch);
  };

  const chooseTheme = async (pref: ThemePreference) => {
    setAppearance(pref);
    await setThemePreference(db, pref);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Appearance</ThemedText>
        <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
          {THEMES.map((t) => {
            const selected = appearance === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => chooseTheme(t.value)}
                style={[styles.segmentItem, selected && { backgroundColor: theme.accent }]}>
                <Ionicons name={t.icon} size={18} color={selected ? '#fff' : theme.textSecondary} />
                <ThemedText type="smallBold" style={{ color: selected ? '#fff' : theme.text }}>
                  {t.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText type="subtitle">Unlock method</ThemedText>
        <View style={styles.group}>
          {MODES.map((m) => {
            const selected = settings?.mode === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => update({ mode: m.value })}
                style={[
                  styles.option,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: selected ? theme.accent : 'transparent',
                  },
                ]}>
                <ThemedText type="smallBold">{m.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {m.hint}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText type="subtitle">Strictness</ThemedText>
        <View style={[styles.option, styles.switchRow, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.flex}>
            <ThemedText type="smallBold">Strict mode</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Locks can only be removed after today&apos;s required tasks are done.
            </ThemedText>
          </View>
          <Switch
            trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
            thumbColor="#fff"
            value={settings?.strict ?? true} onValueChange={(v) => update({ strict: v })} />
        </View>

        <ThemedText type="subtitle">Permissions</ThemedText>
        <ThemedText themeColor="textSecondary">
          OffScreen needs these to detect and block locked apps.
        </ThemedText>
        <PermissionList />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  group: { gap: Spacing.two },
  segment: { flexDirection: 'row', padding: 4, borderRadius: 16, gap: 4 },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two + 2,
    borderRadius: 12,
  },
  option: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: Spacing.half,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
