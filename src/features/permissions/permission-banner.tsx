import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { blocker } from '@/blocker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { PERMISSIONS, usePermissions } from './use-permissions';

/** Shown on Today until every permission needed for blocking is granted. */
export function PermissionBanner() {
  const theme = useTheme();
  const router = useRouter();
  const { status, allGranted } = usePermissions();

  if (!blocker.isNativeAvailable || status === null || allGranted) return null;
  const missing = PERMISSIONS.filter((p) => p.required && !status[p.kind]).length;

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      style={[styles.banner, { borderColor: theme.danger, backgroundColor: theme.backgroundElement }]}>
      <Ionicons name="alert-circle-outline" size={22} color={theme.danger} />
      <ThemedText type="small" style={styles.text}>
        {missing} permission{missing === 1 ? '' : 's'} missing — locks will not work until granted. Tap to set up.
      </ThemedText>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  text: { flex: 1 },
});
