import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IntroScreen } from '@/components/intro-screen';
import { AuthProvider } from '@/data/auth-context';
import { ThemeProvider as AppThemeProvider } from '@/data/theme-context';

const origConsoleError = console.error;
const errorLog: string[] = [];
console.error = (...args: any[]) => {
  origConsoleError(...args);
  const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  errorLog.push(msg);
};

if (typeof globalThis !== 'undefined' && !(globalThis as any).__errorHandlerSet) {
  (globalThis as any).__errorHandlerSet = true;
  const origHandler = (globalThis as any).ErrorUtils?.getGlobalHandler?.();
  (globalThis as any).ErrorUtils?.setGlobalHandler?.((error: any, isFatal: boolean) => {
    const msg = error?.message || String(error);
    errorLog.push(`[FATAL=${isFatal}] ${msg}`);
    Alert.alert(
      isFatal ? 'Критическая ошибка' : 'Ошибка',
      msg,
      [{ text: 'OK' }]
    );
    origHandler?.(error, isFatal);
  });
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootInner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [showIntro, setShowIntro] = useState(true);

  const bgColor = colors.background;

  return (
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
        <Stack.Screen name="profile" options={{ presentation: 'card', contentStyle: { backgroundColor: bgColor }, animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {showIntro && <IntroScreen onFinish={() => setShowIntro(false)} />}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <RootInner />
      </AuthProvider>
    </AppThemeProvider>
  );
}
