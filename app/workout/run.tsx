import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Workout, CompletedExercise, CompletedSet } from '@/data/types';
import { loadWorkouts } from '@/data/storage';
import { saveWorkoutLog } from '@/data/storage';
import { getExerciseById } from '@/data/exercises';
import { GlassCard } from '@/components/glass-card';
import { Button } from '@/components/button';
import { ExerciseIcon } from '@/components/exercise-icons';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { PlayIcon, PauseIcon, TimerIcon } from '@/components/exercise-icons';
import {
  FadeInView,
  ScalePressable,
  ProgressRing,
  AnimatedCounter,
  PulseView,
  ShimmerGlow,
} from '@/components/animated-components';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

type Phase = 'exercise' | 'rest' | 'done';

export default function RunWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('exercise');
  const [restTime, setRestTime] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [completedData, setCompletedData] = useState<CompletedExercise[]>([]);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadWorkouts().then((all) => {
      const found = all.find((w) => w.id === id);
      if (found) {
        setWorkout(found);
        setCompletedData(
          found.exercises.map((we) => ({
            exerciseId: we.exerciseId,
            targetSets: we.sets,
            targetReps: we.reps,
            restSeconds: we.restSeconds,
            sets: [],
          }))
        );
      }
    });
  }, [id]);

  useEffect(() => {
    if (isRestRunning && restTime > 0) {
      timerRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsRestRunning(false);
            Vibration.vibrate(500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRestRunning, restTime]);

  if (!workout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  const currentWe = workout.exercises[currentExIndex];
  const currentExercise = currentWe ? getExerciseById(currentWe.exerciseId) : null;
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = completedData.reduce((s, e) => s + e.sets.length, 0);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  const handleCompleteSet = () => {
    const newData = [...completedData];
    newData[currentExIndex].sets.push({
      reps: currentWe.reps,
      completed: true,
    });
    setCompletedData(newData);

    const setsForExercise = newData[currentExIndex].sets.length;
    if (setsForExercise >= currentWe.sets) {
      if (currentExIndex >= workout.exercises.length - 1) {
        setPhase('done');
        return;
      }
      setCurrentExIndex(currentExIndex + 1);
      setCurrentSetIndex(0);
      setRestTime(currentWe.restSeconds);
      setPhase('rest');
      setIsRestRunning(true);
    } else {
      setCurrentSetIndex(setsForExercise);
      setRestTime(currentWe.restSeconds);
      setPhase('rest');
      setIsRestRunning(true);
    }
  };

  const handleSkipRest = () => {
    setIsRestRunning(false);
    setRestTime(0);
    setPhase('exercise');
  };

  const handleSkipSet = () => {
    const newData = [...completedData];
    newData[currentExIndex].sets.push({
      reps: 0,
      completed: false,
    });
    setCompletedData(newData);

    const setsForExercise = newData[currentExIndex].sets.length;
    if (setsForExercise >= currentWe.sets) {
      if (currentExIndex >= workout.exercises.length - 1) {
        setPhase('done');
        return;
      }
      setCurrentExIndex(currentExIndex + 1);
      setCurrentSetIndex(0);
      setPhase('exercise');
    } else {
      setCurrentSetIndex(setsForExercise);
    }
  };

  const handleFinish = async () => {
    const now = Date.now();
    const durationMinutes = Math.round((now - startTime) / 60000);
    const today = new Date().toISOString().split('T')[0];

    await saveWorkoutLog({
      id: generateId(),
      workoutId: workout.id,
      workoutName: workout.name,
      date: today,
      startedAt: startTime,
      completedAt: now,
      exercises: completedData,
      durationMinutes: Math.max(1, durationMinutes),
    });
    router.back();
  };

  const handleQuit = () => {
    Alert.alert('Завершить тренировку?', 'Прогресс будет потерян', [
      { text: 'Продолжить', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const elapsed = Math.round((Date.now() - startTime) / 60000);

  if (phase === 'done') {
    const completedSets = completedData.reduce((s, e) => s + e.sets.filter((set) => set.completed).length, 0);
    const totalReps = completedData.reduce((s, e) => s + e.sets.reduce((r, set) => r + set.reps, 0), 0);
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.doneContent}>
          <FadeInView delay={0} duration={600}>
            <ShimmerGlow>
              <View style={[styles.doneIcon, { backgroundColor: colors.successLight }]}>
                <CheckIcon size={48} color={colors.success} />
              </View>
            </ShimmerGlow>
          </FadeInView>
          <FadeInView delay={200} direction="up">
            <Text style={[styles.doneTitle, { color: colors.text }]}>Тренировка завершена!</Text>
          </FadeInView>
          <FadeInView delay={300} direction="up">
            <Text style={[styles.doneSub, { color: colors.textSecondary }]}>{workout.name}</Text>
          </FadeInView>

          <FadeInView delay={500} direction="up">
            <View style={styles.statsRow}>
              <GlassCard style={styles.statCard} elevated>
                <AnimatedCounter value={elapsed} style={[styles.statValue, { color: colors.tint }]} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>мин</Text>
              </GlassCard>
              <GlassCard style={styles.statCard} elevated>
                <AnimatedCounter value={completedSets} style={[styles.statValue, { color: colors.tint }]} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>подходов</Text>
              </GlassCard>
              <GlassCard style={styles.statCard} elevated>
                <AnimatedCounter value={totalReps} style={[styles.statValue, { color: colors.tint }]} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>повторов</Text>
              </GlassCard>
            </View>
          </FadeInView>

          <FadeInView delay={700} direction="up">
            <Button title="Сохранить" onPress={handleFinish} style={styles.finishBtn} />
          </FadeInView>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'rest') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={handleQuit} hitSlop={12}>
            <CloseIcon size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.topTitle, { color: colors.text }]}>Отдых</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.centered}>
          <ProgressRing
            progress={currentWe ? restTime / currentWe.restSeconds : 0}
            size={180}
            strokeWidth={6}
            color={colors.tint}
            trackColor={colors.tintLight}
          >
            <TimerIcon size={24} color={colors.tint} />
            <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(restTime)}</Text>
          </ProgressRing>

          <Text style={[styles.restHint, { color: colors.textSecondary }]}>
            Следующий: подход {currentSetIndex + 1} / {workout.exercises[currentExIndex].sets}
          </Text>
          {currentExercise && (
            <Text style={[styles.nextExName, { color: colors.text }]}>
              {currentExercise.name}
            </Text>
          )}

          <Button title="Пропустить отдых" onPress={handleSkipRest} variant="secondary" style={styles.skipBtn} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={handleQuit} hitSlop={12}>
          <CloseIcon size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.text }]}>{workout.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.inputBackground }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.tint }]} />
      </View>


      <ScrollView contentContainerStyle={styles.exerciseContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.exerciseCounter, { color: colors.textSecondary }]}>
          Упражнение {currentExIndex + 1} из {workout.exercises.length}
        </Text>

        {currentExercise && (
          <>
            <View style={[styles.exIconWrap, { backgroundColor: colors.tintLight }]}>
              <ExerciseIcon exerciseId={currentExercise.id} size={40} color={colors.tint} />
            </View>
            <Text style={[styles.exName, { color: colors.text }]}>{currentExercise.name}</Text>
          </>
        )}

        <GlassCard style={styles.setInfo}>
          <Text style={[styles.setTitle, { color: colors.text }]}>
            Подход {currentSetIndex + 1} из {currentWe.sets}
          </Text>
          <View style={styles.setDetails}>
            <View style={styles.setDetail}>
              <Text style={[styles.setDetailValue, { color: colors.tint }]}>{currentWe.reps}</Text>
              <Text style={[styles.setDetailLabel, { color: colors.textSecondary }]}>повторений</Text>
            </View>
            <View style={[styles.setDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.setDetail}>
              <Text style={[styles.setDetailValue, { color: colors.tint }]}>{currentWe.restSeconds}с</Text>
              <Text style={[styles.setDetailLabel, { color: colors.textSecondary }]}>отдых</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.setDots}>
          {Array.from({ length: currentWe.sets }).map((_, i) => {
            const setData = completedData[currentExIndex]?.sets[i];
            let dotColor = colors.inputBorder;
            if (setData?.completed) dotColor = colors.success;
            else if (setData && !setData.completed) dotColor = colors.danger;
            else if (i === currentSetIndex) dotColor = colors.tint;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: dotColor,
                    width: i === currentSetIndex ? 14 : 10,
                    height: i === currentSetIndex ? 14 : 10,
                  },
                ]}
              />
            );
          })}
        </View>

        <PulseView active>
          <Button title="Выполнено" onPress={handleCompleteSet} style={styles.completeBtn} />
        </PulseView>
        <Button title="Пропустить" onPress={handleSkipSet} variant="ghost" style={styles.skipSetBtn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    marginHorizontal: Spacing.xl,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  exerciseContent: {
    padding: Spacing.xl,
    alignItems: 'center',
    paddingBottom: 40,
  },
  exerciseCounter: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  exIconWrap: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  exName: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  setInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  setTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  setDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  setDetail: {
    alignItems: 'center',
  },
  setDetailValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  setDetailLabel: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  setDivider: {
    width: 1,
    height: 40,
  },
  setDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  dot: {
    borderRadius: BorderRadius.full,
  },
  completeBtn: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  skipSetBtn: {
    width: '100%',
  },
  timerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  timerText: {
    fontSize: 36,
    fontWeight: '800',
  },
  restHint: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  nextExName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xl,
  },
  skipBtn: {
    marginTop: Spacing.md,
  },
  doneContent: {
    padding: Spacing.xl,
    alignItems: 'center',
    paddingTop: 60,
  },
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  doneSub: {
    fontSize: 16,
    marginBottom: Spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
    width: '100%',
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
  finishBtn: {
    width: '100%',
  },
});
