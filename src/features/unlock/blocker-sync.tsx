import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncBlocker } from '.';

/** Renders nothing. Re-syncs the native blocker on launch and whenever the app returns to the foreground. */
export function BlockerSync() {
  const db = useSQLiteContext();
  useEffect(() => {
    const run = () => void syncBlocker(db).catch(() => {});
    run();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') run();
    });
    return () => sub.remove();
  }, [db]);
  return null;
}
