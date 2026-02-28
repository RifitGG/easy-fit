import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { GlassCard } from '@/components/glass-card';
import {
  ScalePressable,
  FadeInView,
  AnimatedCounter,
  ProgressRing,
} from '@/components/animated-components';
import {
  FlameIcon,
  ClockIcon,
  DumbbellIcon,
  ClipboardIcon,
  CheckCircleIcon,
  DropletIcon,
  DropletFilledIcon,
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from '@/components/icons';
import { TrophyIcon, ExerciseMuscleIcon } from '@/components/exercise-icons';
import { loadWorkoutLogs, loadScheduledWorkouts, loadWorkouts } from '@/data/storage';
import { runSync } from '@/data/sync';
import { ensureExercisesLoaded } from '@/data/exercises';
import { getTotalCalories, getWorkoutCalories } from '@/data/calories';
import {
  WorkoutLog,
  ScheduledWorkout,
  Workout,
  MuscleGroup,
  MUSCLE_GROUP_LABELS,
  Exercise,
} from '@/data/types';
import { useAuth } from '@/data/auth-context';
import { apiGetStats, BASE_URL } from '@/data/api';
import {
  calculateDailyWaterMl,
  getGlassCount,
  getGlassMl,
  getWaterIntake,
  addGlass,
  removeGlass,
  getWaterIntakeMulti,
} from '@/data/water';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function getTodayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
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
    dates.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
  }
  return dates;
}

function getDateLabel(): string {
  const d = new Date();
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ];
  const weekDays = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  return weekDays[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()];
}

function getMuscleStats(logs: WorkoutLog[], exercisesList: Exercise[]): { group: MuscleGroup; count: number }[] {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    for (const ce of log.exercises) {
      const exercise = exercisesList.find((e) => e.id === ce.exerciseId);
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
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
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

function getBmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Недостаточный вес', color: '#60A5FA' };
  if (bmi < 25) return { label: 'Норма', color: '#34D399' };
  if (bmi < 30) return { label: 'Избыточный вес', color: '#FBBF24' };
  return { label: 'Ожирение', color: '#F87171' };
}

const BAR_COLORS = [
  '#8B83FF', '#FF6B9D', '#34D399', '#FBBF24', '#60A5FA',
  '#F87171', '#A78BFA', '#F59E0B', '#4ADE80', '#FB923C',
];

const WEEK_DAY_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const SLIDER_TABS = ['Активность', 'Калории', 'Вода', 'Прогресс', 'Тренировки'];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { user, login, register, loading } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const SLIDER_WIDTH = screenWidth - Spacing.xl * 2 - 2;

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledWorkout[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [todayScheduled, setTodayScheduled] = useState<ScheduledWorkout[]>([]);
  const [todayLogs, setTodayLogs] = useState<WorkoutLog[]>([]);
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalMinutes: 0, weekWorkouts: 0, weekMinutes: 0 });
  const [sliderPage, setSliderPage] = useState(0);
  const sliderRef = useRef<ScrollView>(null);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [weekWater, setWeekWater] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  const [showAuthCard, setShowAuthCard] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isImageUrl = (url: string | null | undefined) =>
    !!url && (url.startsWith('/uploads/') || url.startsWith('http'));

  const handleAuth = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    try {
      if (isRegisterMode) {
        if (!authName.trim()) { Alert.alert('Ошибка', 'Введите имя'); setAuthLoading(false); return; }
        await register(authEmail.trim(), authPassword, authName.trim());
      } else {
        await login(authEmail.trim(), authPassword);
      }
      setAuthEmail(''); setAuthPassword(''); setAuthName('');
      setShowAuthCard(false);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось выполнить действие');
    } finally { setAuthLoading(false); }
  };

  const loadData = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setScheduled([]);
      setWorkouts([]);
      setTodayScheduled([]);
      setTodayLogs([]);
      setStats({ totalWorkouts: 0, totalMinutes: 0, weekWorkouts: 0, weekMinutes: 0 });
      setWaterGlasses(0);
      setWeekWater([0, 0, 0, 0, 0, 0, 0]);
      try { 
        const exs = await ensureExercisesLoaded();
        setExercisesList(exs);
      } catch (e: any) {
        console.error('[Home] exercises load error:', e?.message || e);
      }
      return;
    }

    try {
      const exs = await ensureExercisesLoaded();
      setExercisesList(exs);
    } catch (e: any) {
      console.error('[Home] exercises error:', e?.message || e);
    }

    try {
      await Promise.race([
        runSync(),
        new Promise((_, reject) => setTimeout(() => reject('timeout'), 5000)),
      ]);
    } catch {}

    try {
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
    } catch (e: any) {
      console.error('[Home] data load error:', e?.message || e);
    }
    if (user) {
      apiGetStats().then(setStats).catch((e) => console.warn('[Home] stats error:', e?.message));
    }
    getWaterIntake().then(setWaterGlasses).catch(() => {});
    getWaterIntakeMulti(getWeekDates()).then(setWeekWater).catch(() => {});
  }, [user]);

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
    0,
  );
  const streak = getStreak(logs);
  const muscleStats = getMuscleStats(logs, exercisesList);
  const maxMuscle = muscleStats[0]?.count || 1;

  const weekActivity = weekDates.map((date) => {
    const dayLogs = logs.filter((l) => l.date === date);
    return dayLogs.length;
  });
  const maxWeekActivity = Math.max(...weekActivity, 1);

  const todayCalories = getTotalCalories(todayLogs);
  const weekCalories = getTotalCalories(weekLogs);
  const totalCalories = getTotalCalories(logs);
  const avgDailyCalories = weekDates.filter((d) => logs.some((l) => l.date === d)).length > 0
    ? Math.round(weekCalories / weekDates.filter((d) => logs.some((l) => l.date === d)).length)
    : 0;
  const weekCaloriesByDay = weekDates.map((date) => {
    const dayLogs = logs.filter((l) => l.date === date);
    return getTotalCalories(dayLogs);
  });
  const maxDayCal = Math.max(...weekCaloriesByDay, 1);

  const todayTotal = Math.max(todayScheduled.length, todayLogs.length);
  const todayDone = todayLogs.length;
  const todayProgress = todayTotal > 0 ? Math.min(todayDone / todayTotal, 1) : 0;

  const bmi = user?.height_cm && user?.weight_kg
    ? user.weight_kg / ((user.height_cm / 100) ** 2)
    : null;
  const bmiInfo = bmi ? getBmiCategory(bmi) : null;

  const waterTargetMl = (user?.weight_kg && user?.height_cm && bmi)
    ? calculateDailyWaterMl(user.weight_kg, user.height_cm, bmi)
    : 2000;
  const waterTargetGlasses = getGlassCount(waterTargetMl);
  const waterProgress = Math.min(waterGlasses / waterTargetGlasses, 1);
  const waterConsumedMl = waterGlasses * getGlassMl();
  const maxWeekWater = Math.max(...weekWater, 1);

  const handleAddGlass = async () => {
    const next = await addGlass(undefined, waterTargetMl);
    setWaterGlasses(next);
    getWaterIntakeMulti(getWeekDates()).then(setWeekWater).catch(() => {});
  };
  const handleRemoveGlass = async () => {
    const next = await removeGlass(undefined, waterTargetMl);
    setWaterGlasses(next);
    getWaterIntakeMulti(getWeekDates()).then(setWeekWater).catch(() => {});
  };

  const onSliderScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SLIDER_WIDTH);
    setSliderPage(page);
  };

  const goToSliderPage = (page: number) => {
    sliderRef.current?.scrollTo({ x: page * SLIDER_WIDTH, animated: true });
    setSliderPage(page);
  };

  const renderActivityPage = () => (
    <View style={{ width: SLIDER_WIDTH, paddingHorizontal: Spacing.md }}>
      <View style={styles.miniStatsRow}>
        <View style={styles.miniStat}>
          <View style={[styles.miniStatIcon, { backgroundColor: colors.tintLight }]}>
            <DumbbellIcon size={16} color={colors.tint} />
          </View>
          <AnimatedCounter value={user ? stats.weekWorkouts : weekLogs.length} style={[styles.miniStatValue, { color: colors.text }]} />
          <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Тренировок</Text>
        </View>
        <View style={styles.miniStat}>
          <View style={[styles.miniStatIcon, { backgroundColor: colors.warningLight }]}>
            <ClockIcon size={16} color={colors.warning} />
          </View>
          <AnimatedCounter value={user ? stats.weekMinutes : totalWeekMinutes} style={[styles.miniStatValue, { color: colors.text }]} suffix=" м" />
          <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Время</Text>
        </View>
        <View style={styles.miniStat}>
          <View style={[styles.miniStatIcon, { backgroundColor: colors.successLight }]}>
            <FlameIcon size={16} color={colors.success} />
          </View>
          <AnimatedCounter value={streak} style={[styles.miniStatValue, { color: colors.text }]} />
          <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Дней подряд</Text>
        </View>
      </View>
      <View style={styles.weekChart}>
        {weekActivity.map((count, i) => {
          const isToday = weekDates[i] === getTodayStr();
          const barHeight = Math.max((count / maxWeekActivity) * 70, 4);
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
    </View>
  );

  const renderCaloriesPage = () => (
    <View style={{ width: SLIDER_WIDTH, paddingHorizontal: Spacing.md }}>
      <View style={styles.calorieBigRow}>
        <View style={[styles.calorieBigIcon, { backgroundColor: colors.warningLight }]}>
          <FlameIcon size={24} color={colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.calorieBigLabel, { color: colors.textSecondary }]}>Сегодня</Text>
          <Text style={[styles.calorieBigValue, { color: colors.warning }]}>
            {todayCalories} <Text style={styles.calorieBigUnit}>ккал</Text>
          </Text>
        </View>
      </View>
      <View style={styles.calorieStatsRow}>
        <View style={styles.calorieStatItem}>
          <AnimatedCounter value={weekCalories} style={[styles.calorieStatVal, { color: colors.tint }]} />
          <Text style={[styles.calorieStatLabel, { color: colors.textSecondary }]}>За неделю</Text>
        </View>
        <View style={[styles.calorieStatDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.calorieStatItem}>
          <AnimatedCounter value={avgDailyCalories} style={[styles.calorieStatVal, { color: colors.success }]} />
          <Text style={[styles.calorieStatLabel, { color: colors.textSecondary }]}>Средн. / день</Text>
        </View>
        <View style={[styles.calorieStatDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.calorieStatItem}>
          <AnimatedCounter value={totalCalories} style={[styles.calorieStatVal, { color: colors.text }]} />
          <Text style={[styles.calorieStatLabel, { color: colors.textSecondary }]}>Всего</Text>
        </View>
      </View>
      <View style={styles.calorieChartRow}>
        {weekCaloriesByDay.map((cal, i) => {
          const isToday = weekDates[i] === getTodayStr();
          const barH = Math.max((cal / maxDayCal) * 56, 3);
          return (
            <View key={i} style={styles.calorieChartCol}>
              {cal > 0 && (
                <Text style={[styles.calorieChartVal, { color: isToday ? colors.warning : colors.textSecondary }]}>
                  {cal}
                </Text>
              )}
              <View
                style={[
                  styles.calorieChartBar,
                  {
                    height: barH,
                    backgroundColor: isToday ? colors.warning : cal > 0 ? colors.warningLight : colors.divider,
                  },
                ]}
              />
              <Text
                style={[
                  styles.calorieChartDay,
                  { color: isToday ? colors.warning : colors.textSecondary, fontWeight: isToday ? '700' : '500' },
                ]}
              >
                {WEEK_DAY_SHORT[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderWaterPage = () => (
    <View style={{ width: SLIDER_WIDTH, paddingHorizontal: Spacing.md }}>
      <View style={styles.waterTopRow}>
        <ProgressRing
          progress={waterProgress}
          size={80}
          strokeWidth={7}
          color="#60A5FA"
          trackColor="rgba(96,165,250,0.15)"
        >
          <DropletFilledIcon size={22} color="#60A5FA" />
        </ProgressRing>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={[styles.waterConsumed, { color: colors.text }]}>
            {waterConsumedMl} <Text style={styles.waterUnit}>мл</Text>
          </Text>
          <Text style={[styles.waterTarget, { color: colors.textSecondary }]}>
            из {waterTargetMl} мл ({waterGlasses}/{waterTargetGlasses} стаканов)
          </Text>
          <View style={styles.waterBtns}>
            <ScalePressable onPress={handleRemoveGlass} style={[styles.waterBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Text style={[styles.waterBtnText, { color: colors.danger }]}>−</Text>
            </ScalePressable>
            <ScalePressable onPress={handleAddGlass} style={[styles.waterBtn, { backgroundColor: 'rgba(96,165,250,0.12)', borderColor: '#60A5FA' }]}>
              <Text style={[styles.waterBtnText, { color: '#60A5FA' }]}>+</Text>
            </ScalePressable>
          </View>
        </View>
      </View>
      <View style={styles.waterGlassGrid}>
        {Array.from({ length: waterTargetGlasses }).map((_, i) => (
          <View key={i} style={styles.waterGlassItem}>
            {i < waterGlasses ? (
              <DropletFilledIcon size={18} color="#60A5FA" />
            ) : (
              <DropletIcon size={18} color={colors.divider} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.waterWeekChart}>
        {weekWater.map((glasses, i) => {
          const isToday = weekDates[i] === getTodayStr();
          const barH = Math.max((glasses / maxWeekWater) * 40, 3);
          return (
            <View key={i} style={styles.waterWeekCol}>
              <View
                style={[
                  styles.waterWeekBar,
                  {
                    height: barH,
                    backgroundColor: isToday ? '#60A5FA' : glasses > 0 ? 'rgba(96,165,250,0.25)' : colors.divider,
                  },
                ]}
              />
              <Text
                style={[
                  styles.waterWeekDay,
                  { color: isToday ? '#60A5FA' : colors.textSecondary, fontWeight: isToday ? '700' : '500' },
                ]}
              >
                {WEEK_DAY_SHORT[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderMusclePage = () => (
    <View style={{ width: SLIDER_WIDTH, paddingHorizontal: Spacing.md, justifyContent: 'center' }}>
      {muscleStats.length === 0 ? (
        <View style={styles.emptySlide}>
          <TrophyIcon size={36} color={colors.textSecondary} />
          <Text style={[styles.emptySlideText, { color: colors.textSecondary }]}>
            Выполните тренировку, чтобы увидеть статистику
          </Text>
        </View>
      ) : (
        muscleStats.slice(0, 5).map((item, i) => {
          const pct = Math.round((item.count / maxMuscle) * 100);
          return (
            <View key={item.group} style={styles.muscleRow}>
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
                      width: (pct + '%') as any,
                      backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                    },
                  ]}
                />
              </View>
              <Text style={[styles.muscleCount, { color: colors.textSecondary }]}>{item.count}</Text>
            </View>
          );
        })
      )}
    </View>
  );

  const renderWorkoutsPage = () => (
    <View style={{ width: SLIDER_WIDTH, paddingHorizontal: Spacing.md }}>
      <View style={styles.workoutsSummary}>
        <View style={styles.workoutSummaryItem}>
          <AnimatedCounter value={user ? stats.totalWorkouts : logs.length} style={[styles.workoutsBigNum, { color: colors.tint }]} />
          <Text style={[styles.workoutsBigLabel, { color: colors.textSecondary }]}>Всего тренировок</Text>
        </View>
        <View style={[styles.workoutSummaryDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.workoutSummaryItem}>
          <AnimatedCounter value={totalWeekSets} style={[styles.workoutsBigNum, { color: colors.success }]} />
          <Text style={[styles.workoutsBigLabel, { color: colors.textSecondary }]}>Подходов за неделю</Text>
        </View>
      </View>
      {logs.length > 0 ? (
        logs.slice(0, 3).map((log, i) => {
          const totalSets = log.exercises.reduce(
            (s, e) => s + e.sets.filter((st) => st.completed).length, 0,
          );
          return (
            <View
              key={log.id}
              style={[
                styles.recentRow,
                i < Math.min(logs.length, 3) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
              ]}
            >
              <View>
                <Text style={[styles.recentName, { color: colors.text }]}>{log.workoutName}</Text>
                <Text style={[styles.recentDetails, { color: colors.textSecondary }]}>
                  {log.date.split('-').reverse().join('.')}  {log.durationMinutes} мин  {totalSets} подх.  {getWorkoutCalories(log)} ккал
                </Text>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptySlide}>
          <Text style={[styles.emptySlideText, { color: colors.textSecondary }]}>
            Нет завершённых тренировок
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FadeInView delay={0} direction="down">
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.greeting, { color: colors.tint }]}>{getGreeting()}</Text>
                <Text style={[styles.title, { color: colors.text }]}>
                  {user ? user.name : 'Новичок'}
                </Text>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{getDateLabel()}</Text>
              </View>
              {user ? (
                <Pressable onPress={() => router.push('/profile' as any)}>
                  <View style={[styles.headerAvatar, { backgroundColor: colors.tintLight }]}>
                    {isImageUrl(user.avatar_url) ? (
                      <Image
                        source={{ uri: user.avatar_url!.startsWith('http') ? user.avatar_url! : `${BASE_URL}${user.avatar_url}` }}
                        style={styles.headerAvatarImage}
                      />
                    ) : (
                      <Text style={[styles.headerAvatarText, { color: colors.tint }]}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ) : (
                <ScalePressable onPress={() => setShowAuthCard(true)} style={[styles.loginBtnSmall, { backgroundColor: colors.tint }]}>
                  <UserIcon size={16} color="#FFF" />
                  <Text style={styles.loginBtnSmallText}>Войти</Text>
                </ScalePressable>
              )}
            </View>
          </View>
        </FadeInView>

        {!user && showAuthCard && (
          <FadeInView delay={0} direction="up">
            <GlassCard style={[styles.section, { marginHorizontal: Spacing.xl }]} elevated>
              <View style={styles.authCardHeader}>
                <Text style={[styles.authCardTitle, { color: colors.text }]}>
                  {isRegisterMode ? 'Регистрация' : 'Вход'}
                </Text>
                <Pressable onPress={() => setShowAuthCard(false)}>
                  <Text style={{ color: colors.textSecondary, fontSize: 22, lineHeight: 22 }}>✕</Text>
                </Pressable>
              </View>
              {isRegisterMode && (
                <View style={styles.authInputGroup}>
                  <Text style={[styles.authLabel, { color: colors.textSecondary }]}>Имя</Text>
                  <View style={[styles.authInputWrap, { borderColor: colors.divider, backgroundColor: colors.surface }]}>
                    <UserIcon size={18} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.authInput, { color: colors.text }]}
                      placeholder="Ваше имя"
                      placeholderTextColor={colors.textSecondary}
                      value={authName}
                      onChangeText={setAuthName}
                    />
                  </View>
                </View>
              )}
              <View style={styles.authInputGroup}>
                <Text style={[styles.authLabel, { color: colors.textSecondary }]}>Email</Text>
                <View style={[styles.authInputWrap, { borderColor: colors.divider, backgroundColor: colors.surface }]}>
                  <MailIcon size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.authInput, { color: colors.text }]}
                    placeholder="email@example.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={authEmail}
                    onChangeText={setAuthEmail}
                  />
                </View>
              </View>
              <View style={styles.authInputGroup}>
                <Text style={[styles.authLabel, { color: colors.textSecondary }]}>Пароль</Text>
                <View style={[styles.authInputWrap, { borderColor: colors.divider, backgroundColor: colors.surface }]}>
                  <LockIcon size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.authInput, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    value={authPassword}
                    onChangeText={setAuthPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOffIcon size={18} color={colors.textSecondary} /> : <EyeIcon size={18} color={colors.textSecondary} />}
                  </Pressable>
                </View>
              </View>
              <ScalePressable onPress={handleAuth} style={[styles.authSubmitBtn, { backgroundColor: colors.tint }]}>
                {authLoading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.authSubmitBtnText}>{isRegisterMode ? 'Создать аккаунт' : 'Войти'}</Text>
                )}
              </ScalePressable>
              <View style={styles.authSwitchRow}>
                <Text style={[styles.authSwitchText, { color: colors.textSecondary }]}>
                  {isRegisterMode ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
                </Text>
                <Pressable onPress={() => setIsRegisterMode(!isRegisterMode)}>
                  <Text style={[styles.authSwitchText, { color: colors.tint, fontWeight: '700' }]}>
                    {isRegisterMode ? ' Войти' : ' Создать'}
                  </Text>
                </Pressable>
              </View>
            </GlassCard>
          </FadeInView>
        )}

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
                        (s) => !todayLogs.some((l) => l.workoutId === s.workoutId),
                      );
                      if (sw) router.push(('/workout/' + sw.workoutId) as any);
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
          <GlassCard style={styles.sliderCard} elevated noPadding>
            <View style={[styles.sliderTabs, { backgroundColor: colors.inputBackground }]}>
              {SLIDER_TABS.map((tab, i) => (
                <Pressable
                  key={tab}
                  onPress={() => goToSliderPage(i)}
                  style={[
                    styles.sliderTab,
                    sliderPage === i && { backgroundColor: colors.tint },
                  ]}
                >
                  <Text
                    style={[
                      styles.sliderTabText,
                      { color: sliderPage === i ? '#FFF' : colors.textSecondary },
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </View>
            <ScrollView
              ref={sliderRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onSliderScroll}
              style={styles.sliderScroll}
              contentContainerStyle={{ width: SLIDER_WIDTH * 5 }}
              bounces={false}
              nestedScrollEnabled
            >
              {renderActivityPage()}
              {renderCaloriesPage()}
              {renderWaterPage()}
              {renderMusclePage()}
              {renderWorkoutsPage()}
            </ScrollView>
            <View style={styles.dotsRow}>
              {SLIDER_TABS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: sliderPage === i ? colors.tint : colors.divider,
                      width: sliderPage === i ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </GlassCard>
        </FadeInView>

        {user && bmi && bmiInfo && (
          <FadeInView delay={300} direction="up">
            <GlassCard style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Индекс массы тела</Text>
              <View style={styles.bmiRow}>
                <View style={styles.bmiLeft}>
                  <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>{bmi.toFixed(1)}</Text>
                  <Text style={[styles.bmiCategory, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
                </View>
                <View style={styles.bmiRight}>
                  <View style={styles.bmiScale}>
                    <View style={[styles.bmiSegment, { backgroundColor: '#60A5FA', flex: 18.5 }]} />
                    <View style={[styles.bmiSegment, { backgroundColor: '#34D399', flex: 6.5 }]} />
                    <View style={[styles.bmiSegment, { backgroundColor: '#FBBF24', flex: 5 }]} />
                    <View style={[styles.bmiSegment, { backgroundColor: '#F87171', flex: 10 }]} />
                  </View>
                  <View style={[styles.bmiMarker, { left: `${Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100)}%` as any }]}>
                    <View style={[styles.bmiDot, { backgroundColor: bmiInfo.color }]} />
                  </View>
                  <View style={styles.bmiLabels}>
                    <Text style={[styles.bmiLabelText, { color: colors.textSecondary }]}>15</Text>
                    <Text style={[styles.bmiLabelText, { color: colors.textSecondary }]}>25</Text>
                    <Text style={[styles.bmiLabelText, { color: colors.textSecondary }]}>40</Text>
                  </View>
                </View>
              </View>
              {user.height_cm && user.weight_kg && (
                <View style={styles.bodyParamsRow}>
                  <View style={styles.bodyParamItem}>
                    <Text style={[styles.bodyParamValue, { color: colors.text }]}>{user.height_cm}</Text>
                    <Text style={[styles.bodyParamLabel, { color: colors.textSecondary }]}>см</Text>
                  </View>
                  <View style={styles.bodyParamItem}>
                    <Text style={[styles.bodyParamValue, { color: colors.text }]}>{user.weight_kg}</Text>
                    <Text style={[styles.bodyParamLabel, { color: colors.textSecondary }]}>кг</Text>
                  </View>
                </View>
              )}
            </GlassCard>
          </FadeInView>
        )}

        <FadeInView delay={400} direction="up">
          <GlassCard style={[styles.section, { marginBottom: 40 }]}>
            <View style={styles.sectionHeader}>
              <FlameIcon size={20} color={colors.warning} />
              <Text style={[styles.sectionTitleInline, { color: colors.text }]}>Тренировки на сегодня</Text>
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
              todayScheduled.map((sw) => {
                const done = todayLogs.some((l) => l.workoutId === sw.workoutId);
                const workout = workouts.find((w) => w.id === sw.workoutId);
                const exerciseCount = workout?.exercises.length ?? 0;
                return (
                  <ScalePressable
                    key={sw.id}
                    onPress={() => router.push(('/workout/' + sw.workoutId) as any)}
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
                        {exerciseCount} упр.  {done ? 'Выполнено' : 'Не выполнено'}
                      </Text>
                    </View>
                  </ScalePressable>
                );
              })
            )}
          </GlassCard>
        </FadeInView>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 110 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: Spacing.xs },
  title: { fontSize: 32, fontWeight: '800' },
  dateLabel: { fontSize: 15, marginTop: Spacing.xs },
  headerAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  headerAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  headerAvatarText: { fontSize: 22, fontWeight: '800' },

  progressCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  progressInfo: { flex: 1 },
  progressTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  progressSub: { fontSize: 14, marginBottom: Spacing.md },
  progressPercent: { fontSize: 18, fontWeight: '800' },
  startBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  startBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  sliderCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' },
  sliderTabs: { flexDirection: 'row', borderRadius: BorderRadius.md, margin: Spacing.md, padding: 3 },
  sliderTab: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.sm, alignItems: 'center' },
  sliderTabText: { fontSize: 10, fontWeight: '700' },
  sliderScroll: { minHeight: 280 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: Spacing.md, paddingTop: Spacing.xs },
  dot: { height: 6, borderRadius: 3 },

  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: Spacing.sm },
  miniStat: { alignItems: 'center', gap: 4 },
  miniStatIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  miniStatValue: { fontSize: 20, fontWeight: '800' },
  miniStatLabel: { fontSize: 11 },
  weekChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90, paddingTop: Spacing.sm },
  weekBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.sm },
  weekBar: { width: 24, minHeight: 4 },
  weekDayLabel: { fontSize: 12 },

  calorieBigRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  calorieBigIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  calorieBigLabel: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  calorieBigValue: { fontSize: 30, fontWeight: '800' },
  calorieBigUnit: { fontSize: 16, fontWeight: '600' },
  calorieStatsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  calorieStatItem: { flex: 1, alignItems: 'center' },
  calorieStatVal: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  calorieStatLabel: { fontSize: 11 },
  calorieStatDivider: { width: 1, height: 32 },
  calorieChartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90, paddingTop: Spacing.xs },
  calorieChartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  calorieChartBar: { width: 20, borderRadius: 5, minHeight: 3 },
  calorieChartVal: { fontSize: 9, fontWeight: '700' },
  calorieChartDay: { fontSize: 11 },

  waterTopRow: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  waterConsumed: { fontSize: 28, fontWeight: '800' },
  waterUnit: { fontSize: 14, fontWeight: '600' },
  waterTarget: { fontSize: 12, marginTop: 2 },
  waterBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  waterBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  waterBtnText: { fontSize: 22, fontWeight: '700', lineHeight: 24 },
  waterGlassGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: Spacing.xs, justifyContent: 'center' },
  waterGlassItem: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  waterWeekChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 60, paddingTop: Spacing.xs },
  waterWeekCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  waterWeekBar: { width: 18, borderRadius: 4, minHeight: 3 },
  waterWeekDay: { fontSize: 10 },

  muscleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  muscleIconWrap: { width: 28, alignItems: 'center' },
  muscleLabel: { fontSize: 13, fontWeight: '600', width: 80 },
  muscleBarTrack: { flex: 1, height: 10, backgroundColor: 'rgba(128,128,128,0.1)', borderRadius: 5, overflow: 'hidden' },
  muscleBarFill: { height: '100%', borderRadius: 5 },
  muscleCount: { fontSize: 13, fontWeight: '600', width: 30, textAlign: 'right' },
  emptySlide: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptySlideText: { fontSize: 14, textAlign: 'center', paddingHorizontal: Spacing.xl },

  workoutsSummary: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  workoutSummaryItem: { flex: 1, alignItems: 'center' },
  workoutSummaryDivider: { width: 1, height: 40 },
  workoutsBigNum: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  workoutsBigLabel: { fontSize: 12, textAlign: 'center' },
  recentRow: { paddingVertical: Spacing.sm },
  recentName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  recentDetails: { fontSize: 13 },

  section: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.md },
  sectionTitleInline: { fontSize: 17, fontWeight: '700' },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  bmiLeft: { alignItems: 'center', width: 80 },
  bmiValue: { fontSize: 32, fontWeight: '800' },
  bmiCategory: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  bmiRight: { flex: 1, position: 'relative' },
  bmiScale: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  bmiSegment: { height: '100%' },
  bmiMarker: { position: 'absolute', top: -4, marginLeft: -6 },
  bmiDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#FFF' },
  bmiLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  bmiLabelText: { fontSize: 10 },
  bodyParamsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.md },
  bodyParamItem: { alignItems: 'center' },
  bodyParamValue: { fontSize: 28, fontWeight: '800' },
  bodyParamLabel: { fontSize: 13, marginTop: 2 },

  emptyChart: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyChartText: { fontSize: 14, textAlign: 'center' },
  planBtn: { marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  planBtnText: { fontWeight: '700', fontSize: 14 },
  todayWorkoutCard: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.sm, gap: Spacing.md,
  },
  todayWorkoutIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  todayWorkoutInfo: { flex: 1 },
  todayWorkoutName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  todayWorkoutSub: { fontSize: 13 },

  loginBtnSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  loginBtnSmallText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  authCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  authCardTitle: { fontSize: 20, fontWeight: '800' },
  authInputGroup: { marginBottom: Spacing.md },
  authLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  authInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  authInput: { flex: 1, fontSize: 15, paddingVertical: 4 },
  authSubmitBtn: {
    paddingVertical: Spacing.md, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm,
  },
  authSubmitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  authSwitchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  authSwitchText: { fontSize: 14 },
});
