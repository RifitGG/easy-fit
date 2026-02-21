import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Workout } from '@/data/types';
import { loadWorkouts } from '@/data/storage';
import { getExerciseById } from '@/data/exercises';
import { GlassCard } from '@/components/glass-card';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { ChevronLeftIcon } from '@/components/icons';
import { PlayIcon, ExerciseIcon } from '@/components/exercise-icons';
import { FadeInView, ScalePressable, AnimatedCounter, PulseView } from '@/components/animated-components';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [workout, setWorkout] = useState<Workout | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts().then((all) => {
        const found = all.find((w) => w.id === id);
        setWorkout(found ?? null);
      });
    }, [id])
  );

  if (!workout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ChevronLeftIcon size={24} color={colors.tint} />
            <Text style={[styles.backText, { color: colors.tint }]}>Назад</Text>
          </Pressable>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Тренировка не найдена</Text>
        </View>
      </View>
    );
  }

  const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets, 0);
  const totalReps = workout.exercises.reduce((sum, e) => sum + e.sets * e.reps, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <ChevronLeftIcon size={24} color={colors.tint} />
          <Text style={[styles.backText, { color: colors.tint }]}>Назад</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0} direction="down">
          <Text style={[styles.title, { color: colors.text }]}>{workout.name}</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            Создано {new Date(workout.createdAt).toLocaleDateString()}
          </Text>
        </FadeInView>

        <FadeInView delay={100} direction="up">
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard} elevated>
              <AnimatedCounter value={workout.exercises.length} style={[styles.statValue, { color: colors.tint }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Упражнения</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} elevated>
              <AnimatedCounter value={totalSets} style={[styles.statValue, { color: colors.tint }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Подходы</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} elevated>
              <AnimatedCounter value={totalReps} style={[styles.statValue, { color: colors.tint }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Повторения</Text>
            </GlassCard>
          </View>
        </FadeInView>

        <FadeInView delay={200} direction="up">
          <PulseView active>
            <Button
              title="Начать тренировку"
              onPress={() => router.push(`/workout/run?id=${workout.id}` as any)}
              icon={<PlayIcon size={18} color="#FFF" />}
              style={styles.startBtn}
            />
          </PulseView>
        </FadeInView>

        {workout.exercises.map((we, index) => {
          const exercise = getExerciseById(we.exerciseId);
          if (!exercise) return null;

          return (
            <FadeInView key={`${we.exerciseId}-${index}`} delay={300 + index * 80} direction="up">
              <ScalePressable
                onPress={() => router.push(`/exercise/${exercise.id}` as any)}
                scaleDown={0.97}
              >
                <GlassCard style={styles.exerciseRow}>
                  <View style={styles.exerciseHeader}>
                    <View style={[styles.indexBadge, { backgroundColor: colors.tintLight }]}>
                      <ExerciseIcon exerciseId={exercise.id} size={18} color={colors.tint} />
                    </View>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                  </View>

                  <View style={styles.detailsRow}>
                    <Badge label={`${we.sets} подх.`} variant="tint" />
                    <Badge label={`${we.reps} повт.`} variant="tint" />
                    <Badge label={`${we.restSeconds}с отдых`} variant="default" />
                  </View>
                </GlassCard>
              </ScalePressable>
            </FadeInView>
          );
        })}
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
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  startBtn: {
    marginBottom: Spacing.xl,
  },
  exerciseRow: {
    marginBottom: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
