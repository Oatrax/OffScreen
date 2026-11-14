import { Tabs } from 'expo-router';

import { navIcon } from '@/components/nav-icon';
import { useTheme } from '@/hooks/use-theme';

// The parent Drawer renders the header (with the menu button), so tabs hide theirs.
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontWeight: '600' },
        tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopWidth: 0, elevation: 12 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: navIcon('sunny-outline') }} />
      <Tabs.Screen name="app-lock" options={{ title: 'App Lock', tabBarIcon: navIcon('lock-closed-outline') }} />
      <Tabs.Screen name="planner" options={{ title: 'Planner', tabBarIcon: navIcon('calendar-outline') }} />
    </Tabs>
  );
}
