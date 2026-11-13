import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ALL_DAYS, WEEKDAY_LABELS } from '@/data/dates';
import type { Task } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

export type TaskDraft = { title: string; recurrence: number; required: boolean };

type Props = {
  visible: boolean;
  /** null = creating a new task. */
  task: Task | null;
  onSave: (draft: TaskDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
};

export function TaskEditor(props: Props) {
  // The form mounts fresh each time the modal opens, so state starts from `task`.
  return (
    <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose}>
      {props.visible && <EditorForm {...props} />}
    </Modal>
  );
}

function EditorForm({ task, onSave, onDelete, onClose }: Props) {
  const theme = useTheme();
  const [title, setTitle] = useState(task?.title ?? '');
  const [recurrence, setRecurrence] = useState(task?.recurrence ?? ALL_DAYS);
  const [required, setRequired] = useState(task ? task.required === 1 : true);

  const canSave = title.trim().length > 0 && recurrence !== 0;

  return (
    <>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <ThemedText themeColor="textSecondary">Cancel</ThemedText>
          </Pressable>
          <ThemedText type="smallBold">{task ? 'Edit task' : 'New task'}</ThemedText>
          <Pressable
            onPress={() => canSave && onSave({ title: title.trim(), recurrence, required })}
            disabled={!canSave}
            hitSlop={12}>
            <ThemedText themeColor={canSave ? 'accent' : 'textSecondary'}>Save</ThemedText>
          </Pressable>
        </View>

        <View style={styles.body}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Workout 45 min"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            autoFocus
            maxLength={80}
          />

          <ThemedText type="smallBold">Repeats on</ThemedText>
          <View style={styles.days}>
            {WEEKDAY_LABELS.map((label, i) => {
              const on = (recurrence & (1 << i)) !== 0;
              return (
                <Pressable
                  key={i}
                  onPress={() => setRecurrence(recurrence ^ (1 << i))}
                  style={[
                    styles.day,
                    { backgroundColor: on ? theme.accent : theme.backgroundElement },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: on ? '#fff' : theme.text }}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">Required to unlock</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Your apps stay locked until all required tasks are done.
              </ThemedText>
            </View>
            <Switch value={required} onValueChange={setRequired} />
          </View>

          {task && onDelete && (
            <Pressable onPress={onDelete} style={styles.delete}>
              <ThemedText themeColor="danger">Delete task</ThemedText>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  body: { padding: Spacing.three, gap: Spacing.three },
  input: { borderRadius: 12, padding: Spacing.three, fontSize: 16 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  delete: { alignItems: 'center', padding: Spacing.three, marginTop: Spacing.three },
});
