import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Text, Pressable, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Workout, Difficulty, DIFFICULTY_LABELS } from '@/data/types';
import { loadWorkouts, deleteWorkout } from '@/data/storage';
import { ensureExercisesLoaded, getExerciseFromCache } from '@/data/exercises';
import { apiPublishWorkout, apiGetMyPublished } from '@/data/api';
import { useAuth } from '@/data/auth-context';
import { GlassCard } from '@/components/glass-card';
import { PlusIcon, TrashIcon, DumbbellIcon, ShareIcon, CloseIcon, GlobeIcon } from '@/components/icons';
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
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [publishModal, setPublishModal] = useState(false);
  const [publishTarget, setPublishTarget] = useState<Workout | null>(null);
  const [pubTitle, setPubTitle] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubDiff, setPubDiff] = useState<Difficulty>('intermediate');
  const [publishing, setPublishing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      ensureExercisesLoaded().then(() => loadWorkouts()).then(setWorkouts);
      if (user) {
        apiGetMyPublished()
          .then(list => setPublishedIds(new Set(list.map((p: any) => p.workoutId))))
          .catch(() => {});
      }
    }, [user])
  );

  const openPublishModal = (w: Workout) => {
    if (!user) {
      Alert.alert('Авторизация', 'Войдите в аккаунт, чтобы публиковать тренировки');
      return;
    }
    setPublishTarget(w);
    setPubTitle(w.name);
    setPubDesc('');
    setPubDiff('intermediate');
    setPublishModal(true);
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    setPublishing(true);
    try {
      await apiPublishWorkout(publishTarget.id, pubTitle, pubDesc, pubDiff);
      setPublishedIds(prev => new Set(prev).add(publishTarget.id));
      setPublishModal(false);
      Alert.alert('Опубликовано!', 'Ваша тренировка появилась в сообществе');
    } catch (err: any) {
      Alert.alert('Ошибка', err.message);
    }
    setPublishing(false);
  };

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
      .map((we) => getExerciseFromCache(we.exerciseId)?.name ?? 'Unknown')
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
              {publishedIds.has(item.id) ? (
                <View style={[styles.playBtn, { backgroundColor: '#34D39922' }]}>
                  <GlobeIcon size={14} color="#34D399" />
                  <Text style={[styles.playText, { color: '#34D399' }]}>Опубликовано</Text>
                </View>
              ) : user ? (
                <Pressable
                  onPress={() => openPublishModal(item)}
                  style={[styles.playBtn, { backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.cardBorder }]}
                >
                  <ShareIcon size={14} color={colors.tint} />
                  <Text style={[styles.playText, { color: colors.tint }]}>Опубликовать</Text>
                </Pressable>
              ) : null}
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
        extraData={publishedIds}
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

      <Modal visible={publishModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.background + 'F2' }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Опубликовать</Text>
              <Pressable onPress={() => setPublishModal(false)} hitSlop={10}>
                <CloseIcon size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Название</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.inputBorder }]}
                value={pubTitle}
                onChangeText={setPubTitle}
                placeholder="Название тренировки"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Описание (необязательно)</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldMulti, { color: colors.text, backgroundColor: colors.background, borderColor: colors.inputBorder }]}
                value={pubDesc}
                onChangeText={setPubDesc}
                placeholder="Расскажите о тренировке..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Сложность</Text>
              <View style={styles.diffRow}>
                {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map(d => {
                  const active = pubDiff === d;
                  const c = d === 'beginner' ? '#34D399' : d === 'advanced' ? '#F87171' : '#FBBF24';
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setPubDiff(d)}
                      style={[styles.diffChip, { backgroundColor: active ? c + '22' : colors.background, borderColor: active ? c : colors.cardBorder }]}
                    >
                      <Text style={[styles.diffChipText, { color: active ? c : colors.textSecondary }]}>
                        {DIFFICULTY_LABELS[d]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <Pressable
              onPress={handlePublish}
              disabled={publishing || !pubTitle.trim()}
              style={[styles.publishBtn, { backgroundColor: colors.tint, opacity: publishing || !pubTitle.trim() ? 0.5 : 1 }]}
            >
              <ShareIcon size={18} color="#FFF" />
              <Text style={styles.publishBtnText}>{publishing ? 'Публикуем...' : 'Опубликовать'}</Text>
            </Pressable>
          </View>
        </View>
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
    gap: Spacing.sm,
    flexWrap: 'wrap',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  fieldInput: {
    fontSize: 15,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  fieldMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  diffRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  diffChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  diffChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  publishBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
