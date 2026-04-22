import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: 'hsl(160 60% 45%)',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: 'Forside',
            tabBarIcon: ({ color, size }) => <AntDesign name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="customers"
          options={{
            popToTopOnBlur: true,
            headerShown: false,
            tabBarLabel: 'Kunder',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome6 name="people-group" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="repairs"
          options={{
            popToTopOnBlur: true,
            headerShown: false,
            tabBarLabel: 'Reperationer',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome6 name="clipboard-list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="createCustomerModal"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <PortalHost />
    </ThemeProvider>
  );
}
