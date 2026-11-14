import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { navIcon } from '@/components/nav-icon';
import { Colors } from '@/constants/theme';
import { DATABASE_NAME, migrateDb } from '@/data/schema';
import { applyStoredTheme } from '@/features/appearance';
import { BlockerSync } from '@/features/unlock/blocker-sync';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

async function initDb(db: SQLiteDatabase) {
  await migrateDb(db);
  await applyStoredTheme(db);
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.background,
      card: c.backgroundElement,
      text: c.text,
      border: c.backgroundSelected,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDb}>
          <BlockerSync />
          <Drawer
            screenOptions={{
              drawerType: 'front',
              headerStyle: { backgroundColor: theme.accent },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              drawerActiveTintColor: theme.accent,
              drawerActiveBackgroundColor: theme.accentSoft,
              drawerInactiveTintColor: theme.textSecondary,
              drawerLabelStyle: { fontWeight: '600' },
              drawerStyle: { backgroundColor: theme.backgroundElement },
            }}>
            <Drawer.Screen
              name="(tabs)"
              options={{ title: 'OffScreen', drawerLabel: 'Home', drawerIcon: navIcon('home-outline') }}
            />
            <Drawer.Screen name="profile" options={{ title: 'Profile', drawerIcon: navIcon('person-outline') }} />
            <Drawer.Screen name="stats" options={{ title: 'Stats', drawerIcon: navIcon('stats-chart-outline') }} />
            <Drawer.Screen name="settings" options={{ title: 'Settings', drawerIcon: navIcon('settings-outline') }} />
          </Drawer>
          {/* Header is a solid accent colour in both themes, so the status bar text stays light. */}
          <StatusBar style="light" />
        </SQLiteProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
