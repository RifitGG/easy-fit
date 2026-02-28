import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing } from '@/constants/theme';
import { loadExercises } from '@/data/exercises';
import { Exercise, MUSCLE_GROUP_LABELS, MuscleGroup } from '@/data/types';
import { SearchBar } from '@/components/search-bar';
import { ChipFilter } from '@/components/chip-filter';
import { ExerciseCard } from '@/components/exercise-card';
import { FadeInView, StaggeredItem } from '@/components/animated-components';
import { SearchEmptyIcon } from '@/components/icons';

const muscleGroupOptions = Object.entries(MUSCLE_GROUP_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function CatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadExercises().then(setExercises);
    }, [])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExercises({ search: search || undefined, muscle: selectedMuscle || undefined }).then(setExercises);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedMuscle]);

  const renderItem = useCallback(({ item, index }: { item: Exercise; index: number }) => (
    <StaggeredItem index={index}>
      <ExerciseCard
        exercise={item}
        onPress={() => router.push(`/exercise/${item.id}` as any)}
      />
    </StaggeredItem>
  ), [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FadeInView delay={0} direction="down">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Упражнения</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {exercises.length} упражнений в каталоге
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={100} direction="up">
        <View style={styles.searchRow}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
      </FadeInView>

      <FadeInView delay={200} direction="up">
        <ChipFilter
          options={muscleGroupOptions}
          selected={selectedMuscle}
          onSelect={setSelectedMuscle}
        />
      </FadeInView>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={
          <FadeInView delay={0}>
            <View style={styles.empty}>
              <SearchEmptyIcon size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                Упражнения не найдены
              </Text>
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
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    marginTop: Spacing.xs,
  },
  searchRow: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  list: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 110,
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
});
