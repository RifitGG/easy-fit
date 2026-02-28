import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { Exercise } from '@/data/types';
import { getCaloriesPerSet } from '@/data/calories';
import { GlassCard } from './glass-card';
import { MuscleGroupBadge, DifficultyBadge, EquipmentBadge } from './badge';
import { ChevronRightIcon, FlameIcon } from './icons';
import { ExerciseIcon } from './exercise-icons';
import { ScalePressable } from './animated-components';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
  rightElement?: React.ReactNode;
}

export function ExerciseCard({ exercise, onPress, rightElement }: ExerciseCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <ScalePressable onPress={onPress} scaleDown={0.97}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.tintLight }]}>
              <ExerciseIcon exerciseId={exercise.id} size={22} color={colors.tint} />
            </View>
            <View style={styles.titleContent}>
              <Text style={[styles.name, { color: colors.text }]}>{exercise.name}</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                {exercise.description}
              </Text>
            </View>
            {rightElement || <ChevronRightIcon size={20} color={colors.textSecondary} />}
          </View>
        </View>
        <View style={styles.badges}>
          {exercise.muscleGroups.slice(0, 3).map((mg) => (
            <MuscleGroupBadge key={mg} group={mg} />
          ))}
          <EquipmentBadge equipment={exercise.equipment} />
          <DifficultyBadge difficulty={exercise.difficulty} />
          <View style={[styles.calorieBadge, { backgroundColor: colors.warningLight }]}>
            <FlameIcon size={12} color={colors.warning} />
            <Text style={[styles.calorieText, { color: colors.warning }]}>~{getCaloriesPerSet(exercise.id)} ккал/подход</Text>
          </View>
        </View>
      </GlassCard>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContent: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  calorieText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
