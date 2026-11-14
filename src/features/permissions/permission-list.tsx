import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { blocker } from '@/blocker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { PERMISSIONS, usePermissions } from './use-permissions';

export function PermissionList() {
  const theme = useTheme();
  const { status } = usePermissions();

  return (
    <View style={styles.list}>
      {!blocker.isNativeAvailable && (
        <ThemedText themeColor="textSecondary">
          Permissions can only be checked in the development build, not Expo Go.
        </ThemedText>
      )}
      {PERMISSIONS.map((p) => {
        const granted = status?.[p.kind] ?? false;
        return (
          <View key={p.kind} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons
              name={granted ? 'checkmark-circle' : 'alert-circle-outline'}
              size={26}
              color={granted ? theme.success : theme.danger}
            />
            <View style={styles.text}>
              <ThemedText type="smallBold">{p.title}</ThemedText>
              <ThemedText themeColor="textSecondary">{p.why}</ThemedText>
            </View>
            {!granted && blocker.isNativeAvailable && (
              <Pressable
                onPress={() => void blocker.openPermissionSettings(p.kind)}
                style={[styles.button, { backgroundColor: theme.accent }]}>
                <ThemedText style={styles.buttonText}>Grant</ThemedText>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: 12 },
  text: { flex: 1, gap: Spacing.half },
  button: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
