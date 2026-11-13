import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { setTaskDone } from '@/data/repositories';
import { tasksForToday, unlockProgress, useTaskState } from '@/features/tasks/use-tasks';
import { useTheme } from '@/hooks/use-theme';

export default function TodayScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { tasks, doneIds, lockedAppCount, loaded, reload } = useTaskState();

  const today = tasksForToday(tasks);
  const { done, total, unlocked } = unlockProgress(today, doneIds);
  const pct = total === 0 ? 1 : done / total;

  const toggle = async (id: number) => {
    await setTaskDone(db, id, !doneIds.has(id));
    await reload();
  };

  const status = unlocked
    ? total === 0
      ? 'No required tasks today'
      : 'All required tasks done'
    : `${total - done} required task${total - done === 1 ? '' : 's'} left`;

  return (
    <ThemedView style={styles.root}>
      <FlatList
        data={today}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={[styles.summary, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.statusRow}>
              <Ionicons
                name={unlocked ? 'lock-open-outline' : 'lock-closed-outline'}
                size={22}
                color={unlocked ? theme.success : theme.danger}
              />
              <ThemedText type="smallBold" style={{ color: unlocked ? theme.success : theme.danger }}>
                {unlocked ? 'Apps unlockable' : 'Apps locked'}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {status} · {lockedAppCount} app{lockedAppCount === 1 ? '' : 's'} selected
            </ThemedText>
            <View style={[styles.bar, { backgroundColor: theme.backgroundSelected }]}>
              <View
                style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: theme.success }]}
              />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {done}/{total} required done
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          loaded ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Nothing scheduled today. Add tasks in the Planner tab.
            </ThemedText>
          ) : undefined
        }
        renderItem={({ item }) => {
          const isDone = doneIds.has(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons
                name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={isDone ? theme.success : theme.textSecondary}
              />
              <View style={styles.flex}>
                <ThemedText
                  type="smallBold"
                  style={isDone ? styles.doneText : undefined}
                  themeColor={isDone ? 'textSecondary' : 'text'}>
                  {item.title}
                </ThemedText>
                {!item.required && (
                  <ThemedText type="small" themeColor="textSecondary">
                    Optional
                  </ThemedText>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.two },
  summary: { padding: Spacing.three, borderRadius: 16, gap: Spacing.two, marginBottom: Spacing.two },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  empty: { textAlign: 'center', marginTop: Spacing.five },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.three,
  },
  flex: { flex: 1 },
  doneText: { textDecorationLine: 'line-through' },
});
