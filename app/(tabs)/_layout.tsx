import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, radii } from '@/src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: '#A8B7B2',
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          borderTopLeftRadius: radii.lg,
          borderTopRightRadius: radii.lg,
          height: 84,
          paddingTop: 10,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
            index: 'home',
            checkins: 'plus-square',
            insights: 'bar-chart-2',
            notifications: 'bell',
            profile: 'user',
          };

          return <Feather color={color} name={iconMap[route.name] ?? 'circle'} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="checkins" options={{ title: 'Assess' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

