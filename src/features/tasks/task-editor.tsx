import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ALL_DAYS, DAYS, WEEKDAYS, WEEKEND } from '@/data/dates';
import type { TaskInput } from '@/data/repositories';
import type { Task, TaskKind, TaskStep } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  /** null = creating a new task. */
  task: Task | null;
  /** Existing steps of `task` (ignored when creating). */
  steps: TaskStep[];
  onSave: (draft: TaskInput) => void;
  onDelete?: () => void;
  onClose: () => void;
};

const KINDS: { kind: TaskKind; label: string }[] = [
  { kind: 'simple', label: 'Simple' },
  { kind: 'timed', label: 'Timed' },
  { kind: 'steps', label: 'Steps' },
];

const PRESETS = [
  { label: 'Every day', value: ALL_DAYS },
  { label: 'Weekdays', value: WEEKDAYS },
  { label: 'Weekend', value: WEEKEND },
];

const MAX_DURATION_MIN = 600;

export function TaskEditor(props: Props) {
  // The form mounts fresh each time the modal opens, so state starts from `task`.
  return (
    <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose}>
      {props.visible && <EditorForm {...props} />}
    </Modal>
  );
}

type StepDraft = { key: number; id?: number; title: string };

let stepKeyCounter = 0;
const nextStepKey = () => stepKeyCounter++;

function EditorForm({ task, steps, onSave, onDelete, onClose }: Props) {
  const theme = useTheme();
  const [title, setTitle] = useState(task?.title ?? '');
  const [recurrence, setRecurrence] = useState(task?.recurrence ?? 0); // new tasks: no days preselected
  const [required, setRequired] = useState(task ? task.required === 1 : true);
  const [kind, setKind] = useState<TaskKind>(task?.kind ?? 'simple');
  const [duration, setDuration] = useState(task?.duration_min ? String(task.duration_min) : '30');
  const [stepDrafts, setStepDrafts] = useState<StepDraft[]>(() =>
    steps.map((s) => ({ key: nextStepKey(), id: s.id, title: s.title })),
  );

  const durationMin = Number.parseInt(duration, 10);
  const cleanSteps = stepDrafts.filter((s) => s.title.trim().length > 0);
  const kindValid =
    kind === 'simple' ||
    (kind === 'timed' && durationMin >= 1 && durationMin <= MAX_DURATION_MIN) ||
    (kind === 'steps' && cleanSteps.length > 0);
  const canSave = title.trim().length > 0 && recurrence !== 0 && kindValid;

  const save = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      recurrence,
      required,
      kind,
      durationMin: kind === 'timed' ? durationMin : null,
      steps: cleanSteps.map((s) => ({ id: s.id, title: s.title.trim() })),
    });
  };

  const addStep = () =>
    setStepDrafts((prev) => [...prev, { key: nextStepKey(), title: '' }]);
  const editStep = (key: number, text: string) =>
    setStepDrafts((prev) => prev.map((s) => (s.key === key ? { ...s, title: text } : s)));
  const removeStep = (key: number) => setStepDrafts((prev) => prev.filter((s) => s.key !== key));

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <ThemedText themeColor="textSecondary">Cancel</ThemedText>
        </Pressable>
        <ThemedText type="smallBold">{task ? 'Edit task' : 'New task'}</ThemedText>
        <Pressable onPress={save} disabled={!canSave} hitSlop={12}>
          <ThemedText themeColor={canSave ? 'accent' : 'textSecondary'}>Save</ThemedText>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Workout"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
            maxLength={80}
          />

          <ThemedText type="smallBold">Type</ThemedText>
          <View style={styles.segment}>
            {KINDS.map((k) => {
              const on = kind === k.kind;
              return (
                <Pressable
                  key={k.kind}
                  onPress={() => setKind(k.kind)}
                  style={[
                    styles.segmentItem,
                    { backgroundColor: on ? theme.accent : theme.backgroundElement },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: on ? '#fff' : theme.text }}>
                    {k.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {kind === 'timed' && (
            <View style={styles.block}>
              <ThemedText type="small" themeColor="textSecondary">
                You start the timer on the Today tab, and can only finish the task once this much
                time has passed.
              </ThemedText>
              <View style={styles.durationRow}>
                <TextInput
                  value={duration}
                  onChangeText={(v) => setDuration(v.replace(/[^0-9]/g, '').slice(0, 3))}
                  keyboardType="number-pad"
                  style={[inputStyle, styles.durationInput]}
                />
                <ThemedText>minutes</ThemedText>
              </View>
            </View>
          )}

          {kind === 'steps' && (
            <View style={styles.block}>
              <ThemedText type="small" themeColor="textSecondary">
                Each step is checked off separately. The task can be finished once all steps are
                done.
              </ThemedText>
              {stepDrafts.map((s, i) => (
                <View key={s.key} style={styles.stepRow}>
                  <TextInput
                    value={s.title}
                    onChangeText={(v) => editStep(s.key, v)}
                    placeholder={`Step ${i + 1}`}
                    placeholderTextColor={theme.textSecondary}
                    style={[inputStyle, styles.flex]}
                    maxLength={80}
                  />
                  <Pressable onPress={() => removeStep(s.key)} hitSlop={8}>
                    <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={addStep} style={styles.addStep}>
                <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
                <ThemedText themeColor="accent">Add step</ThemedText>
              </Pressable>
            </View>
          )}

          <ThemedText type="smallBold">Repeats on</ThemedText>
          <View style={styles.presets}>
            {PRESETS.map((p) => {
              const on = recurrence === p.value;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => setRecurrence(p.value)}
                  style={[
                    styles.preset,
                    { backgroundColor: on ? theme.accent : theme.backgroundElement },
                  ]}>
                  <ThemedText type="small" style={{ color: on ? '#fff' : theme.text }}>
                    {p.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.days}>
            {DAYS.map((d) => {
              const on = (recurrence & (1 << d.bit)) !== 0;
              return (
                <Pressable
                  key={d.bit}
                  onPress={() => setRecurrence(recurrence ^ (1 << d.bit))}
                  style={[styles.day, { backgroundColor: on ? theme.accent : theme.backgroundElement }]}>
                  <ThemedText type="small" style={{ color: on ? '#fff' : theme.text }}>
                    {d.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          {recurrence === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Pick at least one day.
            </ThemedText>
          )}

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  body: { padding: Spacing.three, gap: Spacing.three },
  block: { gap: Spacing.two },
  input: { borderRadius: 12, padding: Spacing.three, fontSize: 16 },
  segment: { flexDirection: 'row', gap: Spacing.two },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  durationInput: { width: 90, textAlign: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  addStep: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  presets: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  preset: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  days: { flexDirection: 'row', gap: Spacing.one },
  day: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  delete: { alignItems: 'center', padding: Spacing.three, marginTop: Spacing.three },
});
