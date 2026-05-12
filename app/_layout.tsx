import { Stack } from 'expo-router';
import '@/global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { colorScheme, useColorScheme } from 'nativewind';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <React.Fragment>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaProvider style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="createCustomerModal"
            options={{
              presentation: 'transparentModal',
              animation: 'fade_from_bottom',
              title: 'Opret kunde',
            }}
          />
          <Stack.Screen
            name="createBikeModal"
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              title: 'Opret Cykel',
            }}
          />
          <Stack.Screen
            name="createRepairModal"
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              title: 'Reperation',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </React.Fragment>
  );
}
