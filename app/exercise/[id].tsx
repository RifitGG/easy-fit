import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { loadExercise } from '@/data/exercises';
import { getCaloriesPerSet } from '@/data/calories';
import { Exercise } from '@/data/types';
import { GlassCard } from '@/components/glass-card';
import { MuscleGroupBadge, EquipmentBadge, DifficultyBadge } from '@/components/badge';
import { ChevronLeftIcon } from '@/components/icons';
import { FlameIcon } from '@/components/icons';
import { ExerciseIcon } from '@/components/exercise-icons';
import { FadeInView, ShimmerGlow } from '@/components/animated-components';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const [exercise, setExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (id) loadExercise(id).then(setExercise);
  }, [id]);

  if (!exercise) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.text }]}>Упражнение не найдено</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <ChevronLeftIcon size={24} color={colors.tint} />
          <Text style={[styles.backText, { color: colors.tint }]}>Назад</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={0} direction="down">
          <Text style={[styles.title, { color: colors.text }]}>{exercise.name}</Text>
        </FadeInView>

        <FadeInView delay={100}>
          <ShimmerGlow>
            <View style={[styles.iconBlock, { backgroundColor: colors.tintLight }]}>
              <ExerciseIcon exerciseId={exercise.id} size={48} color={colors.tint} />
            </View>
          </ShimmerGlow>
        </FadeInView>

        <FadeInView delay={200} direction="up">
          <View style={styles.badges}>
            {exercise.muscleGroups.map((mg) => (
              <MuscleGroupBadge key={mg} group={mg} />
            ))}
            <EquipmentBadge equipment={exercise.equipment} />
            <DifficultyBadge difficulty={exercise.difficulty} />
          </View>
        </FadeInView>

        <FadeInView delay={250} direction="up">
          <GlassCard style={styles.calorieCard}>
            <View style={styles.calorieRow}>
              <View style={[styles.calorieIconWrap, { backgroundColor: colors.warningLight }]}>
                <FlameIcon size={20} color={colors.warning} />
              </View>
              <View>
                <Text style={[styles.calorieValue, { color: colors.text }]}>~{getCaloriesPerSet(exercise.id)} ккал</Text>
                <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>за один подход</Text>
              </View>
            </View>
          </GlassCard>
        </FadeInView>

        <FadeInView delay={300} direction="up">
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Описание</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {exercise.description}
            </Text>
          </GlassCard>
        </FadeInView>

        <FadeInView delay={400} direction="up">
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Как выполнять</Text>
            {exercise.steps.map((step, index) => (
              <FadeInView key={index} delay={450 + index * 80} direction="right">
                <View style={styles.stepRow}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.tintLight }]}>
                    <Text style={[styles.stepNumberText, { color: colors.tint }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
                </View>
              </FadeInView>
            ))}
          </GlassCard>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  iconBlock: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  calorieCard: {
    marginBottom: Spacing.lg,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  calorieIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  calorieLabel: {
    fontSize: 13,
    marginTop: 2,
  },
});
