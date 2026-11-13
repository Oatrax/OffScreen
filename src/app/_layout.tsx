import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { navIcon } from '@/components/nav-icon';
import { DATABASE_NAME, migrateDb } from '@/data/schema';


export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDb}>
          <Drawer screenOptions={{ drawerType: 'front' }}>
            <Drawer.Screen
              name="(tabs)"
              options={{ title: 'OffScreen', drawerLabel: 'Home', drawerIcon: navIcon('home-outline') }}
            />
            <Drawer.Screen name="profile" options={{ title: 'Profile', drawerIcon: navIcon('person-outline') }} />
            <Drawer.Screen name="stats" options={{ title: 'Stats', drawerIcon: navIcon('stats-chart-outline') }} />
            <Drawer.Screen name="settings" options={{ title: 'Settings', drawerIcon: navIcon('settings-outline') }} />
          </Drawer>
          <StatusBar style="auto" />
        </SQLiteProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
