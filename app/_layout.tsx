import { Stack } from 'expo-router';
import '@/global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { colorScheme, useColorScheme } from 'nativewind';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <React.Fragment>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{headerShown: false}} />
        <Stack.Screen name="createCustomerModal"
                      options={{
                        presentation: "formSheet",
                        title: "Opret kunde"}} />
      </Stack>
    </React.Fragment>
  );
}
