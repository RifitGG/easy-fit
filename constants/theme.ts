import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    background: '#F0F4F8',
    surface: 'rgba(255, 255, 255, 0.65)',
    surfaceBorder: 'rgba(255, 255, 255, 0.3)',
    tint: '#6C63FF',
    tintLight: 'rgba(108, 99, 255, 0.12)',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#6C63FF',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.1)',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.12)',
    cardBackground: 'rgba(255, 255, 255, 0.55)',
    cardBorder: 'rgba(255, 255, 255, 0.25)',
    divider: 'rgba(0, 0, 0, 0.06)',
    inputBackground: 'rgba(255, 255, 255, 0.7)',
    inputBorder: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#0F0F1A',
    surface: 'rgba(30, 30, 50, 0.7)',
    surfaceBorder: 'rgba(255, 255, 255, 0.08)',
    tint: '#8B83FF',
    tintLight: 'rgba(139, 131, 255, 0.15)',
    icon: '#9CA3AF',
    tabIconDefault: '#A0A8B8',
    tabIconSelected: '#8B83FF',
    danger: '#F87171',
    dangerLight: 'rgba(248, 113, 113, 0.12)',
    success: '#34D399',
    successLight: 'rgba(52, 211, 153, 0.12)',
    warning: '#FBBF24',
    warningLight: 'rgba(251, 191, 36, 0.12)',
    cardBackground: 'rgba(30, 30, 50, 0.6)',
    cardBorder: 'rgba(255, 255, 255, 0.06)',
    divider: 'rgba(255, 255, 255, 0.06)',
    inputBackground: 'rgba(30, 30, 50, 0.6)',
    inputBorder: 'rgba(255, 255, 255, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
