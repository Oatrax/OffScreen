import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, Spacing } from '@/constants/theme';
import { describeRecurrence } from '@/data/dates';
import { addTask, archiveTask, updateTask, type TaskInput } from '@/data/repositories';
import type { Task } from '@/data/types';
import { TaskEditor } from '@/features/tasks/task-editor';
import { describeKind } from '@/features/tasks/rules';
import { useTaskState } from '@/features/tasks/use-tasks';
import { useTheme } from '@/hooks/use-theme';

export default function PlannerScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { tasks, steps, loaded, reload } = useTaskState();
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (t: Task) => {
    setEditing(t);
    setOpen(true);
  };

  const save = async (draft: TaskInput) => {
    if (editing) await updateTask(db, editing.id, draft);
    else await addTask(db, draft);
    setOpen(false);
    await reload();
  };

  const remove = async () => {
    if (editing) await archiveTask(db, editing.id);
    setOpen(false);
    await reload();
  };

  return (
    <ThemedView style={styles.root}>
      <FlatList
        data={tasks}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loaded ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No tasks yet. Tap + to add your first routine.
            </ThemedText>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEdit(item)}
            style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {[
                  describeKind(item, steps.filter((s) => s.task_id === item.id).length),
                  describeRecurrence(item.recurrence),
                  item.required ? null : 'optional',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      />

      <Pressable onPress={openNew} style={[styles.fab, { backgroundColor: theme.accent }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <TaskEditor
        visible={open}
        task={editing}
        steps={steps.filter((s) => s.task_id === editing?.id)}
        onSave={save}
        onDelete={remove}
        onClose={() => setOpen(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 96 },
  empty: { textAlign: 'center', marginTop: Spacing.six },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
    gap: Spacing.two,
    ...CardShadow,
  },
  flex: { flex: 1 },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...CardShadow,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.45,
    elevation: 8,
  },
});
