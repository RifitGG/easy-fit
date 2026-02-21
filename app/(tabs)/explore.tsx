import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Text, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Workout } from '@/data/types';
import { loadWorkouts, deleteWorkout } from '@/data/storage';
import { getExerciseById } from '@/data/exercises';
import { GlassCard } from '@/components/glass-card';
import { PlusIcon, TrashIcon, DumbbellIcon } from '@/components/icons';
import { PlayIcon } from '@/components/exercise-icons';
import { Button } from '@/components/button';
import {
  FadeInView,
  StaggeredItem,
  ScalePressable,
  PulseView,
} from '@/components/animated-components';

export default function WorkoutsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts().then(setWorkouts);
    }, [])
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Удалить тренировку', `Удалить "${name}"?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteWorkout(id);
          setWorkouts(updated);
        },
      },
    ]);
  };

  const renderWorkout = ({ item, index }: { item: Workout; index: number }) => {
    const exerciseNames = item.exercises
      .map((we) => getExerciseById(we.exerciseId)?.name ?? 'Unknown')
      .join(', ');

    const totalSets = item.exercises.reduce((sum, we) => sum + we.sets, 0);

    return (
      <StaggeredItem index={index}>
        <ScalePressable
          onPress={() => router.push(`/workout/${item.id}`)}
          scaleDown={0.97}
        >
          <GlassCard style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.workoutName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.workoutMeta, { color: colors.textSecondary }]}>
                  {item.exercises.length} упр. / {totalSets} подх.
                </Text>
              </View>
              <Pressable
                onPress={() => handleDelete(item.id, item.name)}
                hitSlop={12}
                style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}
              >
                <TrashIcon size={16} color={colors.danger} />
              </Pressable>
            </View>
            <Text style={[styles.exerciseList, { color: colors.textSecondary }]} numberOfLines={2}>
              {exerciseNames}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <View style={styles.cardFooter}>
              <PulseView active>
                <Pressable
                  onPress={() => router.push(`/workout/run?id=${item.id}` as any)}
                  style={[styles.playBtn, { backgroundColor: colors.tintLight }]}
                >
                  <PlayIcon size={14} color={colors.tint} />
                  <Text style={[styles.playText, { color: colors.tint }]}>Начать</Text>
                </Pressable>
              </PulseView>
            </View>
          </GlassCard>
        </ScalePressable>
      </StaggeredItem>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FadeInView delay={0} direction="down">
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Мои тренировки</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {workouts.length} {workouts.length === 1 ? 'тренировка' : 'тренировок'}
            </Text>
          </View>
          <Button
            title="Новая"
            onPress={() => router.push('/workout/create')}
            icon={<PlusIcon size={18} color="#FFF" />}
            compact
          />
        </View>
      </FadeInView>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderWorkout}
        ListEmptyComponent={
          <FadeInView delay={200}>
            <View style={styles.empty}>
              <DumbbellIcon size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text, marginTop: Spacing.md }]}>Тренировок пока нет</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Создайте свою первую тренировку
              </Text>
              <Button
                title="Создать"
                onPress={() => router.push('/workout/create')}
                icon={<PlusIcon size={18} color="#FFF" />}
                style={{ marginTop: Spacing.lg }}
              />
            </View>
          </FadeInView>
        }
      />
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
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    marginTop: Spacing.xs,
  },
  list: {
    padding: Spacing.xl,
    paddingTop: 0,
    paddingBottom: 110,
  },
  workoutCard: {
    marginBottom: Spacing.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
  },
  workoutMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  exerciseList: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  date: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  playText: {
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
