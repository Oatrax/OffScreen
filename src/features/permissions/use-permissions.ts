import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { blocker, type PermissionKind, type PermissionStatus } from '@/blocker';

export const PERMISSIONS: readonly {
  kind: PermissionKind;
  title: string;
  why: string;
  required: boolean;
}[] = [
  {
    kind: 'usageAccess',
    title: 'Usage access',
    why: 'Lets OffScreen see which app is in the foreground so it can block locked ones.',
    required: true,
  },
  {
    kind: 'overlay',
    title: 'Display over other apps',
    why: 'Lets the lock screen appear on top of a locked app.',
    required: true,
  },
  {
    kind: 'notifications',
    title: 'Notifications',
    why: 'Shows the notification that keeps the blocking service alive.',
    required: true,
  },
  {
    kind: 'battery',
    title: 'Unrestricted battery (recommended)',
    why: 'Stops the phone from stopping OffScreen in the background. Choose OffScreen, then "Don\'t optimize".',
    required: false,
  },
];

/** Permission status that re-checks on screen focus and when returning from system Settings. */
export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus | null>(null);

  const refresh = useCallback(async () => {
    setStatus(await blocker.getPermissionStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const allGranted = status !== null && PERMISSIONS.every((p) => !p.required || status[p.kind]);
  return { status, allGranted, refresh };
}
