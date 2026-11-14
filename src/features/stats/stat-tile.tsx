import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function StatTile({
  label,
  value,
  hint,
  tint,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Hex colour (#RRGGBB) used for the soft tile background and the value. */
  tint?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: tint ? `${tint}22` : theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="subtitle" style={tint ? { color: tint } : undefined}>
        {value}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

export const tileStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});

const styles = StyleSheet.create({
  tile: { flexGrow: 1, flexBasis: '45%', padding: Spacing.three, borderRadius: 20, gap: Spacing.half },
});
