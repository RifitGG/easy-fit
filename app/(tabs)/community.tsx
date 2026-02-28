import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { PublishedWorkout, PublishedWorkoutDetail, DIFFICULTY_LABELS, Difficulty } from '@/data/types';
import {
  apiGetCommunity,
  apiGetCommunityDetail,
  apiToggleLike,
  apiCopyWorkout,
} from '@/data/api';
import { useAuth } from '@/data/auth-context';
import { GlassCard } from '@/components/glass-card';
import {
  HeartIcon,
  GlobeIcon,
  CloseIcon,
  CopyIcon,
  SearchIcon,
} from '@/components/icons';
import { DumbbellIcon } from '@/components/icons';
import {
  FadeInView,
  ScalePressable,
  StaggeredItem,
} from '@/components/animated-components';

type SortMode = 'recent' | 'popular' | 'views';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { user } = useAuth();

  const [items, setItems] = useState<PublishedWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortMode>('recent');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<PublishedWorkoutDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetCommunity({
        sort: sort === 'recent' ? undefined : sort,
        search: search || undefined,
        limit: 30,
      });
      setItems(data);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [sort, search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleLike = async (id: string) => {
    if (!user) {
      Alert.alert('Авторизация', 'Войдите в аккаунт, чтобы ставить лайки');
      return;
    }
    try {
      const result = await apiToggleLike(id);
      setItems(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, liked: result.liked, likesCount: p.likesCount + (result.liked ? 1 : -1) }
            : p
        )
      );
      if (detail && detail.id === id) {
        setDetail(prev =>
          prev ? { ...prev, liked: result.liked, likesCount: prev.likesCount + (result.liked ? 1 : -1) } : prev
        );
      }
    } catch {}
  };

  const handleOpenDetail = async (id: string) => {
    try {
      const data = await apiGetCommunityDetail(id);
      setDetail(data);
      setModalVisible(true);
      setItems(prev =>
        prev.map(p => (p.id === id ? { ...p, views: p.views + 1 } : p))
      );
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить тренировку');
    }
  };

  const handleCopy = async (id: string) => {
    if (!user) {
      Alert.alert('Авторизация', 'Войдите, чтобы скопировать тренировку');
      return;
    }
    try {
      await apiCopyWorkout(id);
      Alert.alert('Готово', 'Тренировка добавлена в «Мои тренировки»');
    } catch (err: any) {
      Alert.alert('Ошибка', err.message);
    }
  };

  const sortOptions: { key: SortMode; label: string }[] = [
    { key: 'recent', label: 'Новые' },
    { key: 'popular', label: 'Популярные' },
    { key: 'views', label: 'Просмотры' },
  ];

  const renderItem = ({ item, index }: { item: PublishedWorkout; index: number }) => {
    const diffColor =
      item.difficulty === 'beginner' ? '#34D399' : item.difficulty === 'advanced' ? '#F87171' : '#FBBF24';

    return (
      <StaggeredItem index={index}>
        <ScalePressable onPress={() => handleOpenDetail(item.id)} scaleDown={0.97}>
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.cardAuthor, { color: colors.textSecondary }]}>
                  {item.authorName}
                </Text>
              </View>
              <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
                <Text style={[styles.diffText, { color: diffColor }]}>
                  {DIFFICULTY_LABELS[item.difficulty]}
                </Text>
              </View>
            </View>

            {item.description ? (
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.cardMeta}>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.exerciseCount} упр.
              </Text>
              <View style={styles.metaRight}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {item.views}
                </Text>
                <Pressable
                  onPress={() => handleLike(item.id)}
                  hitSlop={8}
                  style={styles.likeBtn}
                >
                  <HeartIcon
                    size={16}
                    color={item.liked ? '#F87171' : colors.textSecondary}
                    fill={item.liked ? '#F87171' : undefined}
                  />
                  <Text
                    style={[
                      styles.likeCount,
                      { color: item.liked ? '#F87171' : colors.textSecondary },
                    ]}
                  >
                    {item.likesCount}
                  </Text>
                </Pressable>
              </View>
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
          <View style={styles.headerRow}>
            <GlobeIcon size={24} color={colors.tint} />
            <Text style={[styles.title, { color: colors.text }]}>Сообщество</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Тренировки от других пользователей
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={50} direction="down">
        <View style={styles.filterRow}>
          <View style={[styles.searchWrap, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <SearchIcon size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Поиск..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={load}
              returnKeyType="search"
            />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={styles.sortContent}>
          {sortOptions.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setSort(opt.key)}
              style={[
                styles.sortChip,
                {
                  backgroundColor: sort === opt.key ? colors.tint : colors.cardBackground,
                  borderColor: sort === opt.key ? colors.tint : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: sort === opt.key ? '#FFF' : colors.text },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FadeInView>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={load}
        refreshing={loading}
        ListEmptyComponent={
          <FadeInView delay={200}>
            <View style={styles.empty}>
              <GlobeIcon size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Пока пусто</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Станьте первым! Опубликуйте тренировку из своего списка
              </Text>
            </View>
          </FadeInView>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.background + 'F2' }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={2}>
                {detail?.title}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <CloseIcon size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={[styles.modalAuthor, { color: colors.textSecondary }]}>
                {detail?.authorName}
              </Text>

              {detail?.description ? (
                <Text style={[styles.modalDesc, { color: colors.text }]}>
                  {detail.description}
                </Text>
              ) : null}

              <View style={styles.modalStats}>
                <StatPill label="Просмотры" value={String(detail?.views ?? 0)} color={colors} />
                <StatPill label="Лайки" value={String(detail?.likesCount ?? 0)} color={colors} />
                <StatPill label="Упражнений" value={String(detail?.exercises?.length ?? 0)} color={colors} />
              </View>

              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Упражнения</Text>
              {detail?.exercises?.map((ex, i) => (
                <View key={i} style={[styles.exRow, { borderBottomColor: colors.cardBorder }]}>
                  <View style={[styles.exNum, { backgroundColor: colors.tintLight }]}>
                    <Text style={[styles.exNumText, { color: colors.tint }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.exName, { color: colors.text }]}>{ex.exerciseName}</Text>
                    <Text style={[styles.exMeta, { color: colors.textSecondary }]}>
                      {ex.sets} x {ex.reps} · отдых {ex.restSeconds}с
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => detail && handleLike(detail.id)}
                style={[styles.modalActionBtn, { backgroundColor: detail?.liked ? '#F8717122' : colors.background }]}
              >
                <HeartIcon
                  size={20}
                  color={detail?.liked ? '#F87171' : colors.textSecondary}
                  fill={detail?.liked ? '#F87171' : undefined}
                />
                <Text style={[styles.modalActionText, { color: detail?.liked ? '#F87171' : colors.text }]}>
                  {detail?.likesCount}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (detail) {
                    handleCopy(detail.id);
                    setModalVisible(false);
                  }
                }}
                style={[styles.modalActionBtn, { backgroundColor: colors.tint, flex: 1 }]}
              >
                <CopyIcon size={18} color="#FFF" />
                <Text style={[styles.modalActionText, { color: '#FFF', fontWeight: '700' }]}>
                  Добавить к себе
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: any }) {
  return (
    <View style={[styles.statPill, { backgroundColor: color.background }]}>
      <Text style={[styles.statPillValue, { color: color.text }]}>{value}</Text>
      <Text style={[styles.statPillLabel, { color: color.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: Spacing.xs },
  filterRow: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  sortRow: { paddingBottom: Spacing.sm },
  sortContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sortChipText: { fontSize: 13, fontWeight: '600' },
  list: { padding: Spacing.xl, paddingTop: 0, paddingBottom: 110 },
  card: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardAuthor: { fontSize: 13, marginTop: 2 },
  diffBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  diffText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: Spacing.sm },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: { fontSize: 13 },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 13, fontWeight: '600' },
  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: Spacing.md, marginBottom: Spacing.sm },
  emptyText: { fontSize: 15, textAlign: 'center', paddingHorizontal: Spacing.xl },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', flex: 1, marginRight: Spacing.md },
  modalAuthor: { fontSize: 14, marginBottom: Spacing.md },
  modalDesc: { fontSize: 15, lineHeight: 22, marginBottom: Spacing.lg },
  modalStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statPillValue: { fontSize: 18, fontWeight: '800' },
  statPillLabel: { fontSize: 11, marginTop: 2 },
  modalSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  exNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumText: { fontSize: 13, fontWeight: '700' },
  exName: { fontSize: 15, fontWeight: '600' },
  exMeta: { fontSize: 12, marginTop: 2 },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  modalActionText: { fontSize: 15 },
});
