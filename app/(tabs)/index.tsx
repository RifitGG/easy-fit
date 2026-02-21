import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { GlassCard } from '@/components/glass-card';
import { ScalePressable, FadeInView, AnimatedCounter, ProgressRing } from '@/components/animated-components';
import { FlameIcon, ClockIcon, BarChartIcon, DumbbellIcon, ClipboardIcon, CheckCircleIcon } from '@/components/icons';
import { TrophyIcon } from '@/components/exercise-icons';
import { ExerciseMuscleIcon } from '@/components/exercise-icons';
import { loadWorkoutLogs, loadScheduledWorkouts, loadWorkouts } from '@/data/storage';
import { WorkoutLog, ScheduledWorkout, Workout, MuscleGroup, MUSCLE_GROUP_LABELS } from '@/data/types';
import { exercises as allExercises } from '@/data/exercises';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function getDateLabel(): string {
  const d = new Date();
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ];
  const weekDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return `${weekDays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}


function getMuscleStats(logs: WorkoutLog[]): { group: MuscleGroup; count: number }[] {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    for (const ce of log.exercises) {
      const exercise = allExercises.find((e) => e.id === ce.exerciseId);
      if (exercise) {
        for (const mg of exercise.muscleGroups) {
          counts[mg] = (counts[mg] || 0) + ce.sets.filter((s) => s.completed).length;
        }
      }
    }
  }
  return Object.entries(counts)
    .map(([group, count]) => ({ group: group as MuscleGroup, count }))
    .sort((a, b) => b.count - a.count);
}


function getStreak(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0;
  const uniqueDates = [...new Set(logs.map((l) => l.date))].sort().reverse();
  const today = getTodayStr();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const curr = new Date(uniqueDates[i]);
    const prev = new Date(uniqueDates[i + 1]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

const BAR_COLORS = [
  '#8B83FF', '#FF6B9D', '#34D399', '#FBBF24', '#60A5FA',
  '#F87171', '#A78BFA', '#F59E0B', '#4ADE80', '#FB923C',
];

const WEEK_DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledWorkout[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [todayScheduled, setTodayScheduled] = useState<ScheduledWorkout[]>([]);
  const [todayLogs, setTodayLogs] = useState<WorkoutLog[]>([]);

  const loadData = useCallback(async () => {
    const [allLogs, allScheduled, allWorkouts] = await Promise.all([
      loadWorkoutLogs(),
      loadScheduledWorkouts(),
      loadWorkouts(),
    ]);
    setLogs(allLogs);
    setScheduled(allScheduled);
    setWorkouts(allWorkouts);
    const today = getTodayStr();
    setTodayScheduled(allScheduled.filter((s) => s.date === today));
    setTodayLogs(allLogs.filter((l) => l.date === today));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

 
  const weekDates = getWeekDates();
  const weekLogs = logs.filter((l) => weekDates.includes(l.date));
  const totalWeekMinutes = weekLogs.reduce((s, l) => s + l.durationMinutes, 0);
  const totalWeekSets = weekLogs.reduce(
    (s, l) => s + l.exercises.reduce((es, e) => es + e.sets.filter((st) => st.completed).length, 0),
    0
  );
  const streak = getStreak(logs);
  const muscleStats = getMuscleStats(logs);
  const maxMuscle = muscleStats[0]?.count || 1;


  const weekActivity = weekDates.map((date) => {
    const dayLogs = logs.filter((l) => l.date === date);
    return dayLogs.length;
  });
  const maxWeekActivity = Math.max(...weekActivity, 1);

  
  const todayTotal = todayScheduled.length;
  const todayDone = todayLogs.length;
  const todayProgress = todayTotal > 0 ? Math.min(todayDone / todayTotal, 1) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        
        <FadeInView delay={0} direction="down">
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: colors.tint }]}>{getGreeting()}</Text>
            <Text style={[styles.title, { color: colors.text }]}>Главное</Text>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{getDateLabel()}</Text>
          </View>
        </FadeInView>

       
        <FadeInView delay={100} direction="up">
          <GlassCard style={styles.progressCard} elevated>
            <View style={styles.progressRow}>
              <ProgressRing
                progress={todayProgress}
                size={90}
                strokeWidth={8}
                color={colors.tint}
                trackColor={colors.tintLight}
              >
                <Text style={[styles.progressPercent, { color: colors.text }]}>
                  {Math.round(todayProgress * 100)}%
                </Text>
              </ProgressRing>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressTitle, { color: colors.text }]}>Прогресс дня</Text>
                <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                  {todayDone} из {todayTotal} тренировок
                </Text>
                {todayScheduled.length > 0 && todayDone < todayTotal && (
                  <ScalePressable
                    onPress={() => {
                      const sw = todayScheduled.find(
                        (s) => !todayLogs.some((l) => l.workoutId === s.workoutId)
                      );
                      if (sw) router.push(`/workout/${sw.workoutId}` as any);
                    }}
                    style={[styles.startBtn, { backgroundColor: colors.tint }]}
                  >
                    <Text style={styles.startBtnText}>Начать</Text>
                  </ScalePressable>
                )}
              </View>
            </View>
          </GlassCard>
        </FadeInView>

       
        <FadeInView delay={200} direction="up">
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.tintLight }]}>
                <DumbbellIcon size={20} color={colors.tint} />
              </View>
              <AnimatedCounter value={weekLogs.length} style={[styles.statValue, { color: colors.text }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Тренировок{'\n'}за неделю</Text>
            </GlassCard>

            <GlassCard style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.warningLight }]}>
                <ClockIcon size={20} color={colors.warning} />
              </View>
              <AnimatedCounter value={totalWeekMinutes} style={[styles.statValue, { color: colors.text }]} suffix=" мин" />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Время{'\n'}за неделю</Text>
            </GlassCard>

            <GlassCard style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.successLight }]}>
                <FlameIcon size={20} color={colors.success} />
              </View>
              <AnimatedCounter value={streak} style={[styles.statValue, { color: colors.text }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Дней{'\n'}подряд</Text>
            </GlassCard>
          </View>
        </FadeInView>

       
        <FadeInView delay={300} direction="up">
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChartIcon size={20} color={colors.tint} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Активность за неделю</Text>
            </View>
            <View style={styles.weekChart}>
              {weekActivity.map((count, i) => {
                const isToday = weekDates[i] === getTodayStr();
                const barHeight = Math.max((count / maxWeekActivity) * 80, 4);
                return (
                  <View key={i} style={styles.weekBarCol}>
                    <View
                      style={[
                        styles.weekBar,
                        {
                          height: barHeight,
                          backgroundColor: isToday ? colors.tint : count > 0 ? colors.tintLight : colors.divider,
                          borderRadius: 6,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.weekDayLabel,
                        { color: isToday ? colors.tint : colors.textSecondary, fontWeight: isToday ? '700' : '500' },
                      ]}
                    >
                      {WEEK_DAY_SHORT[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        </FadeInView>

       
        <FadeInView delay={400} direction="up">
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrophyIcon size={20} color={colors.tint} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Нагрузка по мышцам</Text>
            </View>
            {muscleStats.length === 0 ? (
              <View style={styles.emptyChart}>
                <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                  Завершите тренировку, чтобы увидеть статистику
                </Text>
              </View>
            ) : (
              muscleStats.slice(0, 6).map((item, i) => {
                const pct = Math.round((item.count / maxMuscle) * 100);
                return (
                  <FadeInView key={item.group} delay={450 + i * 60} direction="right">
                    <View style={styles.muscleRow}>
                      <View style={styles.muscleIconWrap}>
                        <ExerciseMuscleIcon muscleGroup={item.group} size={18} color={colors.tint} />
                      </View>
                      <Text style={[styles.muscleLabel, { color: colors.text }]} numberOfLines={1}>
                        {MUSCLE_GROUP_LABELS[item.group]}
                      </Text>
                      <View style={styles.muscleBarTrack}>
                        <View
                          style={[
                            styles.muscleBarFill,
                            {
                              width: `${pct}%`,
                              backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.muscleCount, { color: colors.textSecondary }]}>{item.count}</Text>
                    </View>
                  </FadeInView>
                );
              })
            )}
          </GlassCard>
        </FadeInView>

        
        <FadeInView delay={500} direction="up">
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <FlameIcon size={20} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Тренировки на сегодня</Text>
            </View>
            {todayScheduled.length === 0 ? (
              <View style={styles.emptyChart}>
                <View style={{ marginBottom: 8 }}>
                  <ClipboardIcon size={36} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                  На сегодня нет запланированных тренировок
                </Text>
                <ScalePressable
                  onPress={() => router.push('/(tabs)/calendar' as any)}
                  style={[styles.planBtn, { borderColor: colors.tint }]}
                >
                  <Text style={[styles.planBtnText, { color: colors.tint }]}>Запланировать</Text>
                </ScalePressable>
              </View>
            ) : (
              todayScheduled.map((sw, i) => {
                const done = todayLogs.some((l) => l.workoutId === sw.workoutId);
                const workout = workouts.find((w) => w.id === sw.workoutId);
                const exerciseCount = workout?.exercises.length ?? 0;
                return (
                  <FadeInView key={sw.id} delay={550 + i * 80} direction="right">
                    <ScalePressable
                      onPress={() => router.push(`/workout/${sw.workoutId}` as any)}
                      style={[
                        styles.todayWorkoutCard,
                        {
                          backgroundColor: done ? colors.successLight : colors.tintLight,
                          borderColor: done ? colors.success : colors.tint,
                        },
                      ]}
                    >
                      <View style={[styles.todayWorkoutIcon, { backgroundColor: done ? colors.successLight : colors.tintLight }]}>
                        {done ? (
                          <CheckCircleIcon size={20} color={colors.success} />
                        ) : (
                          <DumbbellIcon size={20} color={colors.tint} />
                        )}
                      </View>
                      <View style={styles.todayWorkoutInfo}>
                        <Text style={[styles.todayWorkoutName, { color: colors.text }]}>{sw.workoutName}</Text>
                        <Text style={[styles.todayWorkoutSub, { color: colors.textSecondary }]}>
                          {exerciseCount} упр. • {done ? 'Выполнено' : 'Не выполнено'}
                        </Text>
                      </View>
                    </ScalePressable>
                  </FadeInView>
                );
              })
            )}
          </GlassCard>
        </FadeInView>

       
        {logs.length > 0 && (
          <FadeInView delay={600} direction="up">
            <GlassCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <ClockIcon size={20} color={colors.textSecondary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Последние тренировки</Text>
              </View>
              {logs.slice(0, 5).map((log, i) => {
                const totalSets = log.exercises.reduce(
                  (s, e) => s + e.sets.filter((st) => st.completed).length, 0
                );
                return (
                  <FadeInView key={log.id} delay={650 + i * 60} direction="right">
                    <View style={[styles.recentRow, i < Math.min(logs.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
                      <View>
                        <Text style={[styles.recentName, { color: colors.text }]}>{log.workoutName}</Text>
                        <Text style={[styles.recentDetails, { color: colors.textSecondary }]}>
                          {log.date.split('-').reverse().join('.')} • {log.durationMinutes} мин • {totalSets} подх.
                        </Text>
                      </View>
                    </View>
                  </FadeInView>
                );
              })}
            </GlassCard>
          </FadeInView>
        )}

      
        <FadeInView delay={700} direction="up">
          <View style={styles.totalRow}>
            <GlassCard style={styles.totalCard}>
              <Text style={[styles.totalValue, { color: colors.tint }]}>
                <AnimatedCounter value={logs.length} style={[styles.totalValue, { color: colors.tint }]} />
              </Text>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Всего тренировок</Text>
            </GlassCard>
            <GlassCard style={styles.totalCard}>
              <Text style={[styles.totalValue, { color: colors.success }]}>
                <AnimatedCounter value={totalWeekSets} style={[styles.totalValue, { color: colors.success }]} />
              </Text>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Подходов за неделю</Text>
            </GlassCard>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 110,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  dateLabel: {
    fontSize: 15,
    marginTop: Spacing.xs,
  },

  
  progressCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressSub: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '800',
  },
  startBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  startBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },

  
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },

 
  section: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },

  
  weekChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingTop: Spacing.md,
  },
  weekBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  weekBar: {
    width: 28,
    minHeight: 4,
  },
  weekDayLabel: {
    fontSize: 12,
  },

  
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  muscleIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  muscleLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 80,
  },
  muscleBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  muscleBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  muscleCount: {
    fontSize: 13,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },

 
  emptyChart: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyChartText: {
    fontSize: 14,
    textAlign: 'center',
  },
  planBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  planBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },

 
  todayWorkoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  todayWorkoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayWorkoutInfo: {
    flex: 1,
  },
  todayWorkoutName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  todayWorkoutSub: {
    fontSize: 13,
  },

  
  recentRow: {
    paddingVertical: Spacing.md,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentDetails: {
    fontSize: 13,
  },

 
  totalRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  totalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
