import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { describeRecurrence } from '@/data/dates';
import { addTask, archiveTask, updateTask } from '@/data/repositories';
import type { Task } from '@/data/types';
import { TaskEditor, type TaskDraft } from '@/features/tasks/task-editor';
import { useTaskState } from '@/features/tasks/use-tasks';
import { useTheme } from '@/hooks/use-theme';

export default function PlannerScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { tasks, loaded, reload } = useTaskState();
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

  const save = async (draft: TaskDraft) => {
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
                {describeRecurrence(item.recurrence)}
                {item.required ? '' : ' · optional'}
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
    borderRadius: 12,
    gap: Spacing.two,
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
    elevation: 4,
  },
});
