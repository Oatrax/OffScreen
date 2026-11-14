import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, Spacing } from '@/constants/theme';
import { StatTile, tileStyles } from '@/features/stats/stat-tile';
import { formatMinutes, MINUTES_SAVED_PER_BLOCK, useStats } from '@/features/stats/use-stats';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StatsScreen() {
  const data = useStats();
  const theme = useTheme();
  if (!data) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  const { stats, blocks } = data;
  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Screen time saved</ThemedText>
        <View style={tileStyles.grid}>
          <StatTile
            tint={theme.success}
            label="Estimated saved"
            value={formatMinutes(blocks.total * MINUTES_SAVED_PER_BLOCK)}
            hint={`≈${MINUTES_SAVED_PER_BLOCK} min per block`}
          />
          <StatTile tint={theme.pink} label="Blocked opens" value={String(blocks.total)} hint={`${blocks.today} today`} />
        </View>

        <ThemedText type="subtitle">Tasks</ThemedText>
        <View style={tileStyles.grid}>
          <StatTile tint={theme.success} label="Done · last 7 days" value={String(stats.week.completed)} />
          <StatTile tint={theme.danger} label="Missed · last 7 days" value={String(stats.week.missed)} />
          <StatTile tint={theme.sky} label="Done · last 30 days" value={String(stats.month.completed)} />
          <StatTile tint={theme.warning} label="Missed · last 30 days" value={String(stats.month.missed)} />
        </View>

        <ThemedText type="subtitle">Last 7 days</ThemedText>
        <View style={[styles.chart, { backgroundColor: theme.backgroundElement }]}>
          {stats.last7.map((d) => {
            const pct = d.scheduled === 0 ? 0 : d.completed / d.scheduled;
            const [y, m, day] = d.day.split('-').map(Number);
            return (
              <View key={d.day} style={styles.barCol}>
                <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
                  <View
                    style={[styles.barFill, { height: `${pct * 100}%`, backgroundColor: theme.success }]}
                  />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {WEEKDAY[new Date(y, m - 1, day).getDay()]}
                </ThemedText>
              </View>
            );
          })}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Bars show the share of required tasks completed each day.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.two,
    ...CardShadow,
  },
  barCol: { flex: 1, alignItems: 'center', gap: Spacing.one },
  barTrack: { width: '60%', height: 90, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%' },
});
