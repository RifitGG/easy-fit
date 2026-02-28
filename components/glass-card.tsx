import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  noPadding?: boolean;
  elevated?: boolean;
}

export function GlassCard({ style, children, intensity = 40, noPadding, elevated, ...props }: GlassCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.cardBorder,
          backgroundColor: colors.cardBackground,
        },
        elevated && styles.elevated,
        style,
      ]}
      {...props}
    >
      <BlurView
        intensity={intensity}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={[styles.blur, !noPadding && styles.padding]}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  blur: {
    overflow: 'hidden',
  },
  padding: {
    padding: Spacing.lg,
  },
});
