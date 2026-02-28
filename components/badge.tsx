import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { MuscleGroup, Equipment, Difficulty, MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS, DIFFICULTY_LABELS } from '@/data/types';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'tint' | 'success' | 'danger';
  style?: TextStyle;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const bgColor = {
    default: colors.cardBackground,
    tint: colors.tintLight,
    success: colors.successLight,
    danger: colors.dangerLight,
  }[variant];

  const textColor = {
    default: colors.textSecondary,
    tint: colors.tint,
    success: colors.success,
    danger: colors.danger,
  }[variant];

  return (
    <Text style={[styles.badge, { backgroundColor: bgColor, color: textColor }, style]}>
      {label}
    </Text>
  );
}

export function MuscleGroupBadge({ group }: { group: MuscleGroup }) {
  return <Badge label={MUSCLE_GROUP_LABELS[group]} variant="tint" />;
}

export function EquipmentBadge({ equipment }: { equipment: Equipment }) {
  return <Badge label={EQUIPMENT_LABELS[equipment]} variant="default" />;
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const variant = difficulty === 'beginner' ? 'success' : difficulty === 'advanced' ? 'danger' : 'tint';
  return <Badge label={DIFFICULTY_LABELS[difficulty]} variant={variant} />;
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
});
