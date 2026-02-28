import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveScheme = 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  scheme: EffectiveScheme;
  setPreference: (pref: ThemePreference) => void;
}

const STORAGE_KEY = 'theme_preference';

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  scheme: 'light',
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setPreferenceState(val);
      }
      setLoaded(true);
    });
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  }, []);

  const scheme: EffectiveScheme =
    preference === 'system'
      ? (systemScheme ?? 'light')
      : preference;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ preference, scheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppColorScheme(): EffectiveScheme {
  return useContext(ThemeContext).scheme;
}

export function useThemePreference() {
  return useContext(ThemeContext);
}
