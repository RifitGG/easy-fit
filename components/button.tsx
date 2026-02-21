import React from 'react';
import { StyleSheet, Text, ViewStyle, ActivityIndicator, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { ScalePressable } from './animated-components';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  compact?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  compact,
}: ButtonProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const bgColors = {
    primary: colors.tint,
    secondary: colors.tintLight,
    danger: colors.dangerLight,
    ghost: 'transparent',
  };

  const textColors = {
    primary: '#FFFFFF',
    secondary: colors.tint,
    danger: colors.danger,
    ghost: colors.tint,
  };

  return (
    <ScalePressable
      onPress={onPress}
      disabled={disabled || loading}
      scaleDown={0.95}
      style={[
        styles.button,
        compact && styles.compact,
        {
          backgroundColor: bgColors[variant],
          opacity: disabled ? 0.5 : 1,
        },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              compact && styles.compactText,
              { color: textColors[variant] },
              icon ? { marginLeft: Spacing.sm } : undefined,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  compact: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 36,
  },
  ghost: {
    paddingHorizontal: Spacing.sm,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactText: {
    fontSize: 14,
  },
});
