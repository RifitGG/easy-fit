import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { WorkoutLog, Workout, ScheduledWorkout } from '@/data/types';
import {
  loadWorkoutLogs,
  loadWorkouts,
  loadScheduledWorkouts,
  addScheduledWorkout,
  deleteScheduledWorkout,
} from '@/data/storage';
import { GlassCard } from '@/components/glass-card';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon, CheckIcon, ClipboardIcon } from '@/components/icons';
import { TimerIcon, TrophyIcon, CalendarPlusIcon, PlayIcon } from '@/components/exercise-icons';
import {
  FadeInView,
  ScalePressable,
  AnimatedCounter,
  ProgressRing,
  PulseView,
} from '@/components/animated-components';

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateStr(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledWorkout[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadWorkoutLogs().then(setLogs);
      loadWorkouts().then(setWorkouts);
      loadScheduledWorkouts().then(setScheduled);
    }, [])
  );

  const logDates = new Set(logs.map((l) => l.date));
  const scheduledDates = new Set(scheduled.map((s) => s.date));
  const selectedLogs = logs.filter((l) => l.date === selectedDate);
  const selectedScheduled = scheduled.filter((s) => s.date === selectedDate);

  const days = getMonthDays(year, month);
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const totalThisMonth = logs.filter((l) => l.date.startsWith(monthPrefix)).length;
  const totalMinutesMonth = logs
    .filter((l) => l.date.startsWith(monthPrefix))
    .reduce((s, l) => s + l.durationMinutes, 0);

  const handleScheduleWorkout = async (workout: Workout) => {
    const item: ScheduledWorkout = {
      id: generateId(),
      workoutId: workout.id,
      workoutName: workout.name,
      date: selectedDate,
    };
    const updated = await addScheduledWorkout(item);
    setScheduled(updated);
    setShowPicker(false);
  };

  const handleDeleteScheduled = async (id: string) => {
    const updated = await deleteScheduledWorkout(id);
    setScheduled(updated);
  };

  const handleStartScheduled = (sw: ScheduledWorkout) => {
    router.push(`/workout/run?workoutId=${sw.workoutId}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FadeInView delay={0} direction="down">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Календарь</Text>
        </View>
      </FadeInView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FadeInView delay={100}>
        <GlassCard style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <Pressable onPress={prevMonth} hitSlop={12}>
              <ChevronLeftIcon size={22} color={colors.tint} />
            </Pressable>
            <Text style={[styles.monthText, { color: colors.text }]}>
              {MONTHS_RU[month]} {year}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={12}>
              <ChevronRightIcon size={22} color={colors.tint} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {DAYS_RU.map((d) => (
              <View key={d} style={styles.dayCell}>
                <Text style={[styles.weekDay, { color: colors.textSecondary }]}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, i) => {
              if (day === null) {
                return <View key={`empty-${i}`} style={styles.dayCell} />;
              }

              const dateStr = toDateStr(year, month, day);
              const hasLog = logDates.has(dateStr);
              const hasScheduled = scheduledDates.has(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <Pressable
                  key={dateStr}
                  style={styles.dayCell}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <View
                    style={[
                      styles.dayInner,
                      isSelected && { backgroundColor: colors.tint },
                      isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.tint },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: isSelected ? '#FFF' : colors.text },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  <View style={styles.dotsRow}>
                    {hasScheduled && (
                      <View style={[styles.logDot, { backgroundColor: isSelected ? '#FFF' : colors.tint }]} />
                    )}
                    {hasLog && (
                      <View style={[styles.logDot, { backgroundColor: isSelected ? '#FFF' : colors.success }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Запланировано</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Выполнено</Text>
            </View>
          </View>
        </GlassCard>
        </FadeInView>

        <FadeInView delay={200} direction="up">
        <View style={styles.monthStats}>
          <GlassCard style={styles.miniStat}>
            <ProgressRing
              progress={Math.min(totalThisMonth / 20, 1)}
              size={48}
              strokeWidth={4}
              color={colors.tint}
              trackColor={colors.tintLight}
            >
              <TrophyIcon size={18} color={colors.tint} />
            </ProgressRing>
            <View>
              <AnimatedCounter value={totalThisMonth} style={[styles.miniStatValue, { color: colors.text }]} />
              <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>тренировок</Text>
            </View>
          </GlassCard>
          <GlassCard style={styles.miniStat}>
            <ProgressRing
              progress={Math.min(totalMinutesMonth / 600, 1)}
              size={48}
              strokeWidth={4}
              color={colors.success}
              trackColor={colors.successLight}
            >
              <TimerIcon size={18} color={colors.success} />
            </ProgressRing>
            <View>
              <AnimatedCounter value={totalMinutesMonth} style={[styles.miniStatValue, { color: colors.text }]} />
              <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>минут</Text>
            </View>
          </GlassCard>
        </View>
        </FadeInView>

        <FadeInView delay={300} direction="up">
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedDate === todayStr ? 'Сегодня' : selectedDate}
          </Text>
          <ScalePressable
            onPress={() => setShowPicker(true)}
          >
            <View style={[styles.addBtn, { backgroundColor: colors.tintLight }]}>
              <CalendarPlusIcon size={18} color={colors.tint} />
              <Text style={[styles.addBtnText, { color: colors.tint }]}>Назначить</Text>
            </View>
          </ScalePressable>
        </View>
        </FadeInView>

      
        {selectedScheduled.map((sw, idx) => (
          <FadeInView key={sw.id} delay={350 + idx * 80} direction="right">
          <GlassCard style={styles.scheduledCard}>
            <View style={styles.scheduledRow}>
              <View style={[styles.scheduledIconWrap, { backgroundColor: colors.tintLight }]}>
                <CalendarPlusIcon size={18} color={colors.tint} />
              </View>
              <View style={styles.scheduledInfo}>
                <Text style={[styles.scheduledLabel, { color: colors.textSecondary }]}>Запланировано</Text>
                <Text style={[styles.scheduledName, { color: colors.text }]}>{sw.workoutName}</Text>
              </View>
              <View style={styles.scheduledActions}>
                <ScalePressable
                  onPress={() => handleStartScheduled(sw)}
                  scaleDown={0.85}
                >
                  <View style={[styles.actionBtn, { backgroundColor: colors.success + '22' }]}>
                    <PlayIcon size={14} color={colors.success} />
                  </View>
                </ScalePressable>
                <ScalePressable
                  onPress={() => handleDeleteScheduled(sw.id)}
                  scaleDown={0.85}
                >
                  <View style={[styles.actionBtn, { backgroundColor: colors.danger + '22' }]}>
                    <TrashIcon size={14} color={colors.danger} />
                  </View>
                </ScalePressable>
              </View>
            </View>
          </GlassCard>
          </FadeInView>
        ))}

        
        {selectedLogs.map((log, idx) => {
          const completedSets = log.exercises.reduce(
            (s, e) => s + e.sets.filter((set) => set.completed).length,
            0
          );
          const totalReps = log.exercises.reduce(
            (s, e) => s + e.sets.reduce((r, set) => r + set.reps, 0),
            0
          );

          return (
            <FadeInView key={log.id} delay={400 + idx * 80} direction="right">
            <GlassCard style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={[styles.logIconWrap, { backgroundColor: colors.success + '22' }]}>
                  <CheckIcon size={16} color={colors.success} />
                </View>
                <Text style={[styles.logLabel, { color: colors.success }]}>Выполнено</Text>
              </View>
              <Text style={[styles.logName, { color: colors.text }]}>{log.workoutName}</Text>
              <View style={styles.logMeta}>
                <View style={styles.logMetaItem}>
                  <TimerIcon size={14} color={colors.textSecondary} />
                  <Text style={[styles.logMetaText, { color: colors.textSecondary }]}>
                    {log.durationMinutes} мин
                  </Text>
                </View>
                <View style={styles.logMetaItem}>
                  <Text style={[styles.logMetaText, { color: colors.textSecondary }]}>
                    {completedSets} подх.
                  </Text>
                </View>
                <View style={styles.logMetaItem}>
                  <Text style={[styles.logMetaText, { color: colors.textSecondary }]}>
                    {totalReps} повт.
                  </Text>
                </View>
              </View>
              <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </GlassCard>
            </FadeInView>
          );
        })}

        {selectedScheduled.length === 0 && selectedLogs.length === 0 && (
          <FadeInView delay={400}>
          <View style={styles.emptyDay}>
            <ClipboardIcon size={36} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
              Нет тренировок в этот день
            </Text>
            <ScalePressable onPress={() => setShowPicker(true)}>
              <View style={[styles.emptyAddBtn, { borderColor: colors.tint }]}>
                <PlusIcon size={16} color={colors.tint} />
                <Text style={[styles.emptyAddText, { color: colors.tint }]}>Назначить тренировку</Text>
              </View>
            </ScalePressable>
          </View>
          </FadeInView>
        )}
      </ScrollView>

      
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Выберите тренировку</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {selectedDate === todayStr ? 'Назначить на сегодня' : `Назначить на ${selectedDate}`}
            </Text>

            {workouts.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Нет созданных тренировок
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {workouts.map((w) => (
                  <Pressable
                    key={w.id}
                    style={({ pressed }) => [
                      styles.workoutOption,
                      { backgroundColor: pressed ? colors.tintLight : colors.inputBackground },
                    ]}
                    onPress={() => handleScheduleWorkout(w)}
                  >
                    <View style={styles.workoutOptionInfo}>
                      <Text style={[styles.workoutOptionName, { color: colors.text }]}>{w.name}</Text>
                      <Text style={[styles.workoutOptionMeta, { color: colors.textSecondary }]}>
                        {w.exercises.length} упр. ·{' '}
                        {w.exercises.reduce((s, e) => s + e.sets, 0)} подх.
                      </Text>
                    </View>
                    <PlusIcon size={18} color={colors.tint} />
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Pressable
              onPress={() => setShowPicker(false)}
              style={[styles.modalCancel, { borderColor: colors.surfaceBorder }]}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Отмена</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 110,
  },
  calendarCard: {
    marginBottom: Spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 2,
  },
  weekDay: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    height: 6,
    alignItems: 'center',
  },
  logDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  monthStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  miniStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  miniStatLabel: {
    fontSize: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scheduledCard: {
    marginBottom: Spacing.md,
  },
  scheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scheduledIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduledInfo: {
    flex: 1,
  },
  scheduledLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  scheduledName: {
    fontSize: 16,
    fontWeight: '700',
  },
  scheduledActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logCard: {
    marginBottom: Spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  logIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  logMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  logMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logMetaText: {
    fontSize: 14,
  },
  logTime: {
    fontSize: 12,
  },
  emptyDay: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: 15,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyAddText: {
    fontSize: 14,
    fontWeight: '600',
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#999',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  modalList: {
    marginBottom: Spacing.md,
  },
  modalEmpty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  workoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  workoutOptionInfo: {
    flex: 1,
  },
  workoutOptionName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  workoutOptionMeta: {
    fontSize: 13,
  },
  modalCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
