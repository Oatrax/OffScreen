import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Task, TaskStep } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

import { formatRemaining, readiness } from './rules';

type Props = {
  task: Task;
  steps: TaskStep[];
  done: boolean;
  doneStepIds: Set<number>;
  startedAt: number | undefined;
  now: number;
  onToggleDone: () => void;
  onStart: () => void;
  onCancelTimer: () => void;
  onToggleStep: (step: TaskStep) => void;
};

export function TaskCard({
  task,
  steps,
  done,
  doneStepIds,
  startedAt,
  now,
  onToggleDone,
  onStart,
  onCancelTimer,
  onToggleStep,
}: Props) {
  const theme = useTheme();
  const ready = readiness(task, steps, doneStepIds, startedAt, now);
  // Simple tasks toggle from the whole row; others can only be undone once finished.
  const headerPressable = task.kind === 'simple' || done;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        onPress={onToggleDone}
        disabled={!headerPressable}
        style={styles.header}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}>
        <Ionicons
          name={done ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={done ? theme.success : theme.textSecondary}
        />
        <View style={styles.flex}>
          <ThemedText
            type="smallBold"
            style={done ? styles.doneText : undefined}
            themeColor={done ? 'textSecondary' : 'text'}>
            {task.title}
          </ThemedText>
          {(task.kind === 'timed' || !task.required) && (
            <ThemedText type="small" themeColor="textSecondary">
              {[task.kind === 'timed' ? `${task.duration_min} min timer` : null, task.required ? null : 'Optional']
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
          )}
        </View>
      </Pressable>

      {task.kind === 'steps' && (
        <View style={styles.steps}>
          {steps.map((s) => {
            const checked = doneStepIds.has(s.id);
            return (
              <Pressable key={s.id} onPress={() => onToggleStep(s)} style={styles.step}>
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={checked ? theme.success : theme.textSecondary}
                />
                <ThemedText
                  style={checked ? styles.doneText : undefined}
                  themeColor={checked ? 'textSecondary' : 'text'}>
                  {s.title}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}

      {!done && task.kind === 'timed' && (
        <View style={styles.action}>
          {ready.state === 'running' && (
            <>
              <ThemedText type="subtitle" style={styles.countdown}>
                {formatRemaining(ready.remainingMs)}
              </ThemedText>
              <Pressable onPress={onCancelTimer} hitSlop={8}>
                <ThemedText type="small" themeColor="textSecondary">
                  Cancel timer
                </ThemedText>
              </Pressable>
            </>
          )}
          {ready.state === 'not-started' && (
            <ActionButton label={`Start ${task.duration_min} min timer`} onPress={onStart} />
          )}
          {ready.state === 'ready' && <ActionButton label="Finish task" onPress={onToggleDone} />}
        </View>
      )}

      {!done && task.kind === 'steps' && (
        <View style={styles.action}>
          <ActionButton
            label={ready.state === 'steps-left' ? `${ready.left} step${ready.left === 1 ? '' : 's'} left` : 'Mark task done'}
            onPress={onToggleDone}
            disabled={ready.state !== 'ready'}
          />
        </View>
      )}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: disabled ? theme.backgroundSelected : theme.accent }]}>
      <ThemedText type="smallBold" style={{ color: disabled ? theme.textSecondary : '#fff' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: 12, gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  doneText: { textDecorationLine: 'line-through' },
  steps: { gap: Spacing.two, paddingLeft: Spacing.five },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  action: { alignItems: 'center', gap: Spacing.two },
  countdown: { fontVariant: ['tabular-nums'] },
  button: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
});
