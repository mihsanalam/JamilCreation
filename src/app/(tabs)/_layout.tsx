import { Tabs } from 'expo-router';
import BottomNav from '../../components/BottomNav';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => null} // We are temporarily hiding the default tab bar because each screen has its own <BottomNav> imported right now, or we can refactor BottomNav to be a custom tabBar here.
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
