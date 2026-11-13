import { navIcon } from '@/components/nav-icon';
import { Tabs } from 'expo-router';


// The parent Drawer renders the header (with the menu button), so tabs hide theirs.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: navIcon('today-outline') }} />
      <Tabs.Screen name="app-lock" options={{ title: 'App Lock', tabBarIcon: navIcon('lock-closed-outline') }} />
      <Tabs.Screen name="planner" options={{ title: 'Planner', tabBarIcon: navIcon('calendar-outline') }} />
    </Tabs>
  );
}
