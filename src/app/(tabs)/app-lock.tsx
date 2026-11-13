import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Switch, TextInput, View } from 'react-native';

import { blocker, type InstalledApp } from '@/blocker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { listLockedApps, setAppLocked } from '@/data/repositories';
import { AppIcon } from '@/features/apps/app-icon';
import { useTheme } from '@/hooks/use-theme';

export default function AppLockScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const installed = await blocker.listInstalledApps();
      let lockedRows = await listLockedApps(db);

      // Drop locks for apps that were uninstalled (real device only; demo apps aren't real).
      if (blocker.isNativeAvailable) {
        const present = new Set(installed.map((a) => a.packageName));
        for (const row of lockedRows.filter((r) => !present.has(r.package_name))) {
          await setAppLocked(db, { packageName: row.package_name, label: row.label }, false);
        }
        lockedRows = lockedRows.filter((r) => present.has(r.package_name));
      }

      setApps(installed);
      setLocked(new Set(lockedRows.map((r) => r.package_name)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load apps');
      setApps([]);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggle = async (app: InstalledApp, value: boolean) => {
    // Optimistic update so the switch feels instant.
    setLocked((prev) => {
      const next = new Set(prev);
      if (value) next.add(app.packageName);
      else next.delete(app.packageName);
      return next;
    });
    await setAppLocked(db, app, value);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (apps ?? []).filter((a) => !q || a.label.toLowerCase().includes(q));
    // Locked apps first, then alphabetical (apps already arrive sorted).
    return [...list].sort((a, b) => Number(locked.has(b.packageName)) - Number(locked.has(a.packageName)));
  }, [apps, query, locked]);

  return (
    <ThemedView style={styles.root}>
      {!blocker.isNativeAvailable && (
        <View style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.accent} />
          <ThemedText type="small" style={styles.flex}>
            Demo apps shown. Real installed apps need the development build (not Expo Go).
          </ThemedText>
        </View>
      )}

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search apps"
        placeholderTextColor={theme.textSecondary}
        style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      <ThemedText type="small" themeColor="textSecondary" style={styles.count}>
        {locked.size} locked · {apps?.length ?? 0} apps
      </ThemedText>

      {apps === null ? (
        <ActivityIndicator style={styles.loading} color={theme.accent} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(a) => a.packageName}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={14}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {error ?? (query ? 'No apps match your search.' : 'No apps found.')}
            </ThemedText>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <AppIcon packageName={item.packageName} />
              <View style={styles.flex}>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {item.label}
                </ThemedText>
                {item.isSystem && (
                  <ThemedText type="small" themeColor="textSecondary">
                    System app
                  </ThemedText>
                )}
              </View>
              <Switch
                value={locked.has(item.packageName)}
                onValueChange={(v) => toggle(item, v)}
              />
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    margin: Spacing.three,
    marginBottom: 0,
    padding: Spacing.three,
    borderRadius: 12,
  },
  search: {
    margin: Spacing.three,
    marginBottom: Spacing.one,
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
  },
  count: { marginHorizontal: Spacing.three, marginBottom: Spacing.one },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  loading: { marginTop: Spacing.six },
  empty: { textAlign: 'center', marginTop: Spacing.five },
});
