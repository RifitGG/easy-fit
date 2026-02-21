import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { exercises } from '@/data/exercises';
import { WorkoutExercise } from '@/data/types';
import { addWorkout } from '@/data/storage';
import { GlassCard } from '@/components/glass-card';
import { Button } from '@/components/button';
import { ExerciseCard } from '@/components/exercise-card';
import { SearchBar } from '@/components/search-bar';
import { CloseIcon, PlusIcon, MinusIcon, CheckIcon, TrashIcon } from '@/components/icons';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [name, setName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const filteredExercises = exercises.filter((ex) => {
    const alreadySelected = selectedExercises.some((se) => se.exerciseId === ex.id);
    const matchesSearch =
      !search || ex.name.toLowerCase().includes(search.toLowerCase());
    return !alreadySelected && matchesSearch;
  });

  const addExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => [
      ...prev,
      { exerciseId, sets: 3, reps: 10, restSeconds: 60 },
    ]);
    setShowPicker(false);
    setSearch('');
  };

  const removeExercise = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof WorkoutExercise, delta: number) => {
    setSelectedExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== index) return ex;
        const val = (ex[field] as number) + delta;
        if (field === 'sets' && val < 1) return ex;
        if (field === 'reps' && val < 1) return ex;
        if (field === 'restSeconds' && val < 0) return ex;
        return { ...ex, [field]: val };
      })
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название тренировки');
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы одно упражнение');
      return;
    }
    await addWorkout({
      id: generateId(),
      name: name.trim(),
      exercises: selectedExercises,
      createdAt: Date.now(),
    });
    router.back();
  };

  const getExerciseName = (id: string) =>
    exercises.find((e) => e.id === id)?.name ?? 'Unknown';

  if (showPicker) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.pickerHeader}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>Добавить упражнение</Text>
          <Pressable onPress={() => { setShowPicker(false); setSearch(''); }} hitSlop={12}>
            <CloseIcon size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        <ScrollView contentContainerStyle={styles.pickerList} showsVerticalScrollIndicator={false}>
          {filteredExercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onPress={() => addExercise(ex.id)}
              rightElement={<PlusIcon size={20} color={colors.tint} />}
            />
          ))}
          {filteredExercises.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Больше нет упражнений для добавления
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <CloseIcon size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.text }]}>Новая тренировка</Text>
          <Pressable onPress={handleSave} hitSlop={12}>
            <CheckIcon size={24} color={colors.tint} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.nameCard}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Название</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[
                styles.nameInput,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                },
              ]}
              placeholder="Например: День ног, День груди..."
              placeholderTextColor={colors.textSecondary}
            />
          </GlassCard>

          <View style={styles.exercisesHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Упражнения ({selectedExercises.length})
            </Text>
            <Button
              title="Добавить"
              onPress={() => setShowPicker(true)}
              icon={<PlusIcon size={16} color={colors.tint} />}
              variant="secondary"
              compact
            />
          </View>

          {selectedExercises.map((we, index) => (
            <GlassCard key={`${we.exerciseId}-${index}`} style={styles.exerciseItem}>
              <View style={styles.exerciseItemHeader}>
                <Text style={[styles.exerciseItemName, { color: colors.text }]}>
                  {getExerciseName(we.exerciseId)}
                </Text>
                <Pressable
                  onPress={() => removeExercise(index)}
                  hitSlop={8}
                  style={[styles.removeBtn, { backgroundColor: colors.dangerLight }]}
                >
                  <TrashIcon size={14} color={colors.danger} />
                </Pressable>
              </View>

              <View style={styles.controls}>
                <View style={styles.controlGroup}>
                  <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Подходы</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => updateExercise(index, 'sets', -1)}
                      style={[styles.stepperBtn, { backgroundColor: colors.tintLight }]}
                    >
                      <MinusIcon size={14} color={colors.tint} />
                    </Pressable>
                    <Text style={[styles.stepperValue, { color: colors.text }]}>{we.sets}</Text>
                    <Pressable
                      onPress={() => updateExercise(index, 'sets', 1)}
                      style={[styles.stepperBtn, { backgroundColor: colors.tintLight }]}
                    >
                      <PlusIcon size={14} color={colors.tint} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Повторы</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => updateExercise(index, 'reps', -1)}
                      style={[styles.stepperBtn, { backgroundColor: colors.tintLight }]}
                    >
                      <MinusIcon size={14} color={colors.tint} />
                    </Pressable>
                    <Text style={[styles.stepperValue, { color: colors.text }]}>{we.reps}</Text>
                    <Pressable
                      onPress={() => updateExercise(index, 'reps', 1)}
                      style={[styles.stepperBtn, { backgroundColor: colors.tintLight }]}
                    >
                      <PlusIcon size={14} color={colors.tint} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Отдых</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => updateExercise(index, 'restSeconds', -15)}
                      style={[styles.stepperBtn, { backgroundColor: colors.tintLight }]}
                    >
                      <MinusIcon size={14} color={colors.tint} />
                    </Pressable>
                    <Text style={[styles.stepperValue, { color: colors.text }]}>{we.restSeconds}s</Text>
                    <Pressable
                      onPress={() => updateExercise(index, 'restSeconds', 15)}
                      style={[styles.stepperBtn, { backgroundColor: colors.tintLight }]}
                    >
                      <PlusIcon size={14} color={colors.tint} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </GlassCard>
          ))}

          {selectedExercises.length === 0 && (
            <View style={styles.emptyExercises}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Нажмите "Добавить" чтобы добавить упражнения
              </Text>
            </View>
          )}

          <Button
            title="Сохранить"
            onPress={handleSave}
            style={styles.saveBtn}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  nameCard: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  exerciseItem: {
    marginBottom: Spacing.md,
  },
  exerciseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  removeBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  controlGroup: {
    flex: 1,
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  emptyExercises: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: Spacing.xl,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchRow: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  pickerList: {
    padding: Spacing.xl,
    paddingTop: 0,
  },
});
