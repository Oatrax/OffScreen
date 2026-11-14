import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, Gradients, Spacing } from '@/constants/theme';
import { StatTile, tileStyles } from '@/features/stats/stat-tile';
import { useStats } from '@/features/stats/use-stats';
import { useTheme } from '@/hooks/use-theme';

function levelFor(streak: number) {
  if (streak >= 30) return 'Unshakeable';
  if (streak >= 14) return 'Locked in';
  if (streak >= 7) return 'On a roll';
  if (streak >= 3) return 'Building momentum';
  return 'Getting started';
}

export default function ProfileScreen() {
  const data = useStats();
  const theme = useTheme();
  if (!data) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  const { stats, lockedApps, firstDay } = data;
  const rate = stats.completionRate === null ? '—' : `${Math.round(stats.completionRate * 100)}%`;
  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={Gradients.profile}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <Ionicons name="flame" size={56} color={stats.streak > 0 ? '#FFE066' : 'rgba(255,255,255,0.6)'} />
          <ThemedText type="title" style={styles.heroText}>
            {stats.streak}
          </ThemedText>
          <ThemedText style={styles.heroSub}>day streak · {levelFor(stats.streak)}</ThemedText>
        </LinearGradient>
        <View style={tileStyles.grid}>
          <StatTile tint={theme.warning} label="Best streak" value={`${stats.bestStreak} d`} />
          <StatTile tint={theme.success} label="Discipline (30 d)" value={rate} hint="Required tasks completed" />
          <StatTile tint={theme.accent} label="Apps locked" value={String(lockedApps)} />
          <StatTile
            tint={theme.pink}
            label="Using OffScreen since"
            value={firstDay ? new Date(firstDay).toLocaleDateString() : '—'}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three },
  hero: { alignItems: 'center', padding: Spacing.five, borderRadius: 28, gap: Spacing.one, ...CardShadow },
  heroText: { color: '#fff' },
  heroSub: { color: 'rgba(255,255,255,0.92)', fontWeight: '600' },
});
