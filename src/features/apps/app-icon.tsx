import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { blocker } from '@/blocker';
import { useTheme } from '@/hooks/use-theme';

const cache = new Map<string, string | null>();

/** Loads an app icon lazily so the list renders immediately. */
export function AppIcon({ packageName, size = 44 }: { packageName: string; size?: number }) {
  const theme = useTheme();
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apply = (b64: string | null) => {
      if (!cancelled) setUri(b64 ? `data:image/png;base64,${b64}` : null);
    };
    if (cache.has(packageName)) {
      apply(cache.get(packageName) ?? null);
    } else {
      blocker
        .getAppIcon(packageName)
        .then((b64) => {
          cache.set(packageName, b64);
          apply(b64);
        })
        .catch(() => apply(null));
    }
    return () => {
      cancelled = true;
    };
  }, [packageName]);

  const box = { width: size, height: size, borderRadius: size / 4 };
  return uri ? (
    <Image source={{ uri }} style={box} />
  ) : (
    <View style={[box, styles.placeholder, { backgroundColor: theme.backgroundSelected }]} />
  );
}

const styles = StyleSheet.create({ placeholder: {} });
