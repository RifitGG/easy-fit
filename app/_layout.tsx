import React, { useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IntroScreen } from '@/components/intro-screen';
import { AuthProvider } from '@/data/auth-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [showIntro, setShowIntro] = useState(true);

  const bgColor = colors.background;

  return (
    <AuthProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: bgColor },
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen
          name="exercise/[id]"
          options={{
            presentation: 'card',
            contentStyle: { backgroundColor: bgColor },
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="workout/create" options={{ presentation: 'modal', contentStyle: { backgroundColor: bgColor } }} />
        <Stack.Screen name="workout/[id]" options={{ presentation: 'card', contentStyle: { backgroundColor: bgColor } }} />
        <Stack.Screen name="workout/run" options={{ presentation: 'fullScreenModal', gestureEnabled: false, contentStyle: { backgroundColor: bgColor } }} />
      </Stack>
      <StatusBar style="auto" />
      {showIntro && <IntroScreen onFinish={() => setShowIntro(false)} />}
    </ThemeProvider>
    </AuthProvider>
  );
}
