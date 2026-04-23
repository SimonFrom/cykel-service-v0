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
                        presentation: "transparentModal",
                        animation: "fade_from_bottom",
                        title: "Opret kunde"}} />
        <Stack.Screen name="createBikeModal"
                      options={{
                        presentation: "transparentModal",
                        animation: 'fade',
                        title: "Opret Cykel",
                      }} />
      </Stack>
    </React.Fragment>
  );
}
