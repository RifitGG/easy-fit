import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemePreference, ThemePreference } from '@/data/theme-context';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { GlassCard } from '@/components/glass-card';
import {
  FadeInView,
  ScalePressable,
} from '@/components/animated-components';
import {
  LogOutIcon,
  LockIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  CameraIcon,
  SettingsIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MoonIcon,
  SunIcon,
} from '@/components/icons';
import { useAuth } from '@/data/auth-context';
import { apiUpdateProfile, apiChangePassword, apiUploadAvatar, apiCropAvatar, BASE_URL } from '@/data/api';
import { AvatarCropModal } from '@/components/avatar-crop-modal';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { preference, setPreference } = useThemePreference();
  const { user, logout, refreshUser, loading } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropImageUri, setCropImageUri] = useState('');
  const [cropMode, setCropMode] = useState<'new' | 'recrop'>('new');

  const isImageUrl = (url: string | null | undefined) =>
    !!url && (url.startsWith('/uploads/') || url.startsWith('http'));

  const startEditing = () => {
    setEditName(user?.name || '');
    setEditGoal(user?.goal || '');
    setEditHeight(user?.height_cm ? String(user.height_cm) : '');
    setEditWeight(user?.weight_kg ? String(user.weight_kg) : '');
    setEditing(true);
  };

  const saveProfile = async () => {
    try {
      await apiUpdateProfile({
        name: editName.trim() || undefined,
        goal: editGoal.trim() || undefined,
        height_cm: editHeight ? parseInt(editHeight) : undefined,
        weight_kg: editWeight ? parseFloat(editWeight) : undefined,
      });
      await refreshUser();
      setEditing(false);
    } catch (err: any) {
      console.error('saveProfile error:', err);
      Alert.alert('Ошибка', err.message || 'Не удалось сохранить');
    }
  };

  const pickAvatar = async () => {
    const hasOriginal = isImageUrl(user?.avatar_original_url);
    if (hasOriginal) {
      if (Platform.OS === 'web') {
        const choice = window.prompt('Аватар:\n1 — Новое фото\n2 — Изменить кадрирование\n\nВведите 1 или 2:');
        if (choice === '1') pickNewPhoto();
        else if (choice === '2') openRecrop();
      } else {
        Alert.alert('Аватар', 'Выберите действие', [
          { text: 'Новое фото', onPress: pickNewPhoto },
          { text: 'Изменить кадрирование', onPress: openRecrop },
          { text: 'Отмена', style: 'cancel' },
        ]);
      }
    } else {
      pickNewPhoto();
    }
  };

  const pickNewPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setCropMode('new');
      setCropImageUri(result.assets[0].uri);
      setCropModalVisible(true);
    } catch (err: any) {
      console.error('pickNewPhoto error:', err);
      Alert.alert('Ошибка', err.message || 'Не удалось выбрать фото');
    }
  };

  const openRecrop = () => {
    if (!user?.avatar_original_url) return;
    const uri = user.avatar_original_url.startsWith('http')
      ? user.avatar_original_url
      : `${BASE_URL}${user.avatar_original_url}`;
    setCropMode('recrop');
    setCropImageUri(uri);
    setCropModalVisible(true);
  };

  const handleCropConfirm = async (cropData: { cropX: number; cropY: number; cropWidth: number; cropHeight: number }) => {
    setCropModalVisible(false);
    setAvatarUploading(true);
    try {
      if (cropMode === 'new') {
        await apiUploadAvatar(cropImageUri, cropData);
      } else {
        await apiCropAvatar(cropData);
      }
      await refreshUser();
    } catch (err: any) {
      console.error('handleCropConfirm error:', err);
      Alert.alert('Ошибка', err.message || 'Не удалось обработать фото');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      Alert.alert('Ошибка', 'Заполните оба поля');
      return;
    }
    try {
      await apiChangePassword(currentPwd, newPwd);
      Alert.alert('Готово', 'Пароль изменён');
      setChangingPassword(false);
      setCurrentPwd('');
      setNewPwd('');
    } catch (err: any) {
      console.error('handleChangePassword error:', err);
      Alert.alert('Ошибка', err.message || 'Не удалось сменить пароль');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('logout error:', err);
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)' as any);
      }
    }
  }, [user, loading]);

  if (!user) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FadeInView delay={0} direction="down">
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
                <ChevronLeftIcon size={24} color={colors.tint} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <View style={styles.headerIconRow}>
                  <SettingsIcon size={20} color={colors.tint} />
                  <Text style={[styles.headerLabel, { color: colors.tint }]}>НАСТРОЙКИ</Text>
                </View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Профиль</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={100} direction="up">
          <GlassCard style={styles.userCard} elevated>
            <View style={styles.userRow}>
              <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: colors.tintLight }]}>
                  {avatarUploading ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : isImageUrl(user.avatar_url) ? (
                    <Image
                      source={{ uri: user.avatar_url!.startsWith('http') ? user.avatar_url! : `${BASE_URL}${user.avatar_url}` }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={[styles.avatarText, { color: colors.tint }]}>
                      {user.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={[styles.cameraOverlay, { backgroundColor: colors.tint }]}>
                  <CameraIcon size={12} color="#FFF" />
                </View>
              </Pressable>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                {user.goal && (
                  <Text style={[styles.userGoal, { color: colors.tint }]}>🎯 {user.goal}</Text>
                )}
              </View>
            </View>
          </GlassCard>
        </FadeInView>

        {(user.height_cm || user.weight_kg) && (
          <FadeInView delay={150} direction="up">
            <GlassCard style={styles.section}>
              <View style={styles.bodyParamsRow}>
                {user.height_cm && (
                  <View style={styles.bodyParamItem}>
                    <Text style={[styles.bodyParamValue, { color: colors.text }]}>{user.height_cm}</Text>
                    <Text style={[styles.bodyParamLabel, { color: colors.textSecondary }]}>Рост, см</Text>
                  </View>
                )}
                {user.weight_kg && (
                  <View style={styles.bodyParamItem}>
                    <Text style={[styles.bodyParamValue, { color: colors.text }]}>{user.weight_kg}</Text>
                    <Text style={[styles.bodyParamLabel, { color: colors.textSecondary }]}>Вес, кг</Text>
                  </View>
                )}
                {user.height_cm && user.weight_kg && (
                  <View style={styles.bodyParamItem}>
                    <Text style={[styles.bodyParamValue, { color: colors.tint }]}>
                      {(user.weight_kg / ((user.height_cm / 100) ** 2)).toFixed(1)}
                    </Text>
                    <Text style={[styles.bodyParamLabel, { color: colors.textSecondary }]}>ИМТ</Text>
                  </View>
                )}
              </View>
            </GlassCard>
          </FadeInView>
        )}

        <FadeInView delay={200} direction="up">
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>АККАУНТ</Text>
            <ScalePressable onPress={startEditing} style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.tintLight }]}>
                <EditIcon size={18} color={colors.tint} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Редактировать профиль</Text>
              <ChevronRightIcon size={18} color={colors.textSecondary} />
            </ScalePressable>

            <ScalePressable
              onPress={() => setChangingPassword(!changingPassword)}
              style={styles.menuRow}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.warningLight }]}>
                <LockIcon size={18} color={colors.warning} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Сменить пароль</Text>
              <ChevronRightIcon size={18} color={colors.textSecondary} />
            </ScalePressable>
          </GlassCard>
        </FadeInView>

        <FadeInView delay={250} direction="up">
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ОФОРМЛЕНИЕ</Text>
            <View style={styles.themeRow}>
              {([
                { key: 'system' as ThemePreference, label: 'Авто', icon: <SettingsIcon size={16} color={preference === 'system' ? '#FFF' : colors.textSecondary} /> },
                { key: 'light' as ThemePreference, label: 'Светлая', icon: <SunIcon size={16} color={preference === 'light' ? '#FFF' : colors.textSecondary} /> },
                { key: 'dark' as ThemePreference, label: 'Тёмная', icon: <MoonIcon size={16} color={preference === 'dark' ? '#FFF' : colors.textSecondary} /> },
              ]).map((opt) => (
                <ScalePressable
                  key={opt.key}
                  onPress={() => setPreference(opt.key)}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: preference === opt.key ? colors.tint : colors.cardBackground,
                      borderColor: preference === opt.key ? colors.tint : colors.cardBorder,
                    },
                  ]}
                >
                  {opt.icon}
                  <Text
                    style={[
                      styles.themeBtnText,
                      { color: preference === opt.key ? '#FFF' : colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </ScalePressable>
              ))}
            </View>
          </GlassCard>
        </FadeInView>

        {editing && (
          <FadeInView delay={0} direction="up">
            <GlassCard style={styles.section} elevated>
              <View style={styles.editHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Редактировать</Text>
                <Pressable onPress={() => setEditing(false)} hitSlop={8}>
                  <CloseIcon size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Имя</Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Цель</Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={editGoal}
                  onChangeText={setEditGoal}
                  placeholder="Например: Набрать массу"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.editRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Рост (см)</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                    value={editHeight}
                    onChangeText={setEditHeight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Вес (кг)</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                    value={editWeight}
                    onChangeText={setEditWeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <ScalePressable onPress={saveProfile} style={[styles.saveBtn, { backgroundColor: colors.tint }]}>
                <CheckIcon size={18} color="#FFF" />
                <Text style={styles.btnText}>Сохранить</Text>
              </ScalePressable>
            </GlassCard>
          </FadeInView>
        )}

        {changingPassword && (
          <FadeInView delay={0} direction="up">
            <GlassCard style={styles.section} elevated>
              <View style={styles.editHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Сменить пароль</Text>
                <Pressable onPress={() => setChangingPassword(false)} hitSlop={8}>
                  <CloseIcon size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Текущий пароль</Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={currentPwd}
                  onChangeText={setCurrentPwd}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Новый пароль</Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={newPwd}
                  onChangeText={setNewPwd}
                  secureTextEntry
                />
              </View>
              <ScalePressable onPress={handleChangePassword} style={[styles.saveBtn, { backgroundColor: colors.tint }]}>
                <Text style={styles.btnText}>Изменить</Text>
              </ScalePressable>
            </GlassCard>
          </FadeInView>
        )}

        <FadeInView delay={300} direction="up">
          <GlassCard style={[styles.section, { marginBottom: 40 }]}>
            <ScalePressable onPress={handleLogout} style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.dangerLight }]}>
                <LogOutIcon size={18} color={colors.danger} />
              </View>
              <Text style={[styles.menuText, { color: colors.danger }]}>Выйти из аккаунта</Text>
            </ScalePressable>
          </GlassCard>
        </FadeInView>
      </ScrollView>

      <AvatarCropModal
        visible={cropModalVisible}
        imageUri={cropImageUri}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 110 },

  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backBtn: { padding: 4, marginLeft: -4 },
  headerIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  headerLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, fontWeight: '800' },

  userCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatarWrap: { position: 'relative' },
  avatar: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: 68, height: 68, borderRadius: 34 },
  avatarText: { fontSize: 28, fontWeight: '800' },
  cameraOverlay: {
    position: 'absolute', bottom: -2, right: -2,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  userEmail: { fontSize: 13 },
  userGoal: { fontSize: 13, fontWeight: '600', marginTop: 4 },

  bodyParamsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  bodyParamItem: { alignItems: 'center' },
  bodyParamValue: { fontSize: 28, fontWeight: '800' },
  bodyParamLabel: { fontSize: 13, marginTop: 2 },

  section: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.md },

  menuRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuText: { fontSize: 15, fontWeight: '600', flex: 1 },

  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  editRow: { flexDirection: 'row', gap: Spacing.md },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  editInput: {
    paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: BorderRadius.md, borderWidth: 1, fontSize: 15,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: BorderRadius.full, marginTop: Spacing.sm,
  },

  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
