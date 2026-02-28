import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Vibration,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Workout, CompletedExercise, CompletedSet } from '@/data/types';
import { loadWorkouts, loadWorkoutsLocal } from '@/data/storage';
import { saveWorkoutLog } from '@/data/storage';
import { ensureExercisesLoaded, getExerciseFromCache } from '@/data/exercises';
import { getCaloriesPerSet } from '@/data/calories';
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
import { v4 as uuidv4 } from 'uuid';

function generateId(): string {
  return uuidv4();
}

type Phase = 'exercise' | 'rest' | 'done';

export default function RunWorkoutScreen() {
  const params = useLocalSearchParams<{ id?: string; workoutId?: string }>();
  const id = params.id || params.workoutId;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('exercise');
  const [restTime, setRestTime] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [completedData, setCompletedData] = useState<CompletedExercise[]>([]);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await ensureExercisesLoaded();
      const local = await loadWorkoutsLocal();
      let found = local.find((w) => String(w.id) === String(id));
      if (!found) {
        try {
          const all = await loadWorkouts();
          found = all.find((w) => String(w.id) === String(id));
        } catch {}
      }
      if (!active) return;
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
      } else {
        setNotFound(true);
      }
    };
    load();
    return () => { active = false; };
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
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {notFound ? 'Тренировка не найдена' : 'Загрузка...'}
          </Text>
          {notFound && (
            <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
              <Text style={{ color: colors.tint, fontSize: 16, fontWeight: '600' }}>Назад</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const currentWe = workout.exercises[currentExIndex];
  const currentExercise = currentWe ? getExerciseFromCache(currentWe.exerciseId) ?? null : null;
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
    setShowQuitModal(true);
  };

  const confirmQuit = () => {
    setShowQuitModal(false);
    router.back();
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
    const totalCalories = completedData.reduce((s, e) => {
      const perSet = getCaloriesPerSet(e.exerciseId);
      return s + e.sets.filter(set => set.completed).length * perSet;
    }, 0);
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

          <FadeInView delay={600} direction="up">
            <GlassCard style={styles.calorieCard} elevated>
              <View style={styles.calorieRow}>
                <View style={[styles.calorieIcon, { backgroundColor: colors.warningLight }]}>
                  <Text style={{ fontSize: 24 }}>🔥</Text>
                </View>
                <View>
                  <AnimatedCounter value={totalCalories} style={[styles.calorieValue, { color: colors.warning }]} suffix=" ккал" />
                  <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>Сожжено калорий</Text>
                </View>
              </View>
            </GlassCard>
          </FadeInView>

          <FadeInView delay={800} direction="up">
            <Button title="Сохранить" onPress={handleFinish} style={styles.finishBtn} />
          </FadeInView>
        </ScrollView>
      </View>
    );
  }

  const quitModal = (
    <Modal visible={showQuitModal} transparent animationType="fade" onRequestClose={() => setShowQuitModal(false)}>
      <Pressable style={styles.quitOverlay} onPress={() => setShowQuitModal(false)}>
        <Pressable style={[styles.quitModal, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.quitEmoji}>🏋️</Text>
          <Text style={[styles.quitTitle, { color: colors.text }]}>Завершить тренировку?</Text>
          <Text style={[styles.quitDesc, { color: colors.textSecondary }]}>Весь прогресс будет потерян.{"\n"}Вы уверены, что хотите выйти?</Text>
          <View style={styles.quitBtns}>
            <Pressable onPress={() => setShowQuitModal(false)} style={[styles.quitBtn, { backgroundColor: colors.tintLight }]}>
              <Text style={[styles.quitBtnText, { color: colors.tint }]}>Продолжить</Text>
            </Pressable>
            <Pressable onPress={confirmQuit} style={[styles.quitBtn, { backgroundColor: colors.dangerLight }]}>
              <Text style={[styles.quitBtnText, { color: colors.danger }]}>Выйти</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (phase === 'rest') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {quitModal}
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
      {quitModal}
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
  quitOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  quitModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  quitEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  quitTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  quitDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  quitBtns: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  quitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  quitBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  calorieCard: {
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  calorieIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  calorieLabel: {
    fontSize: 13,
    marginTop: 2,
  },
});
