import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { GlassCard } from '@/components/glass-card';
import {
  FadeInView,
  ScalePressable,
  AnimatedCounter,
} from '@/components/animated-components';
import {
  UserIcon,
  LogOutIcon,
  MailIcon,
  LockIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  DumbbellIcon,
  ClockIcon,
  FlameIcon,
  EyeIcon,
  EyeOffIcon,
} from '@/components/icons';
import { useAuth } from '@/data/auth-context';
import { apiUpdateProfile, apiChangePassword, apiGetStats } from '@/data/api';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { user, login, register, logout, refreshUser, loading } = useAuth();

  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');

  
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

 
  const [stats, setStats] = useState({ totalWorkouts: 0, totalMinutes: 0, weekWorkouts: 0, weekMinutes: 0 });

  useFocusEffect(
    useCallback(() => {
      if (user) {
        apiGetStats()
          .then(setStats)
          .catch(() => {});
      }
    }, [user])
  );

  
  const handleAuth = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    try {
      if (isRegisterMode) {
        if (!authName.trim()) {
          Alert.alert('Ошибка', 'Введите имя');
          return;
        }
        await register(authEmail.trim(), authPassword, authName.trim());
      } else {
        await login(authEmail.trim(), authPassword);
      }
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось выполнить действие');
    } finally {
      setAuthLoading(false);
    }
  };

  
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
      Alert.alert('Ошибка', err.message);
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
      Alert.alert('Ошибка', err.message);
    }
  };

  
  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };


  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
            <FadeInView delay={0} direction="down">
              <View style={styles.authHeader}>
                <View style={[styles.authAvatar, { backgroundColor: colors.tintLight }]}>
                  <UserIcon size={48} color={colors.tint} />
                </View>
                <Text style={[styles.authTitle, { color: colors.text }]}>
                  {isRegisterMode ? 'Создать аккаунт' : 'Войти'}
                </Text>
                <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
                  {isRegisterMode
                    ? 'Зарегистрируйтесь для синхронизации данных'
                    : 'Войдите для доступа к личному кабинету'}
                </Text>
              </View>
            </FadeInView>

            <FadeInView delay={100} direction="up">
              <GlassCard style={styles.authCard} elevated>
                {isRegisterMode && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Имя</Text>
                    <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                      <UserIcon size={18} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Ваше имя"
                        placeholderTextColor={colors.textSecondary}
                        value={authName}
                        onChangeText={setAuthName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <MailIcon size={18} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="email@example.com"
                      placeholderTextColor={colors.textSecondary}
                      value={authEmail}
                      onChangeText={setAuthEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Пароль</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <LockIcon size={18} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.text, flex: 1 }]}
                      placeholder="Минимум 6 символов"
                      placeholderTextColor={colors.textSecondary}
                      value={authPassword}
                      onChangeText={setAuthPassword}
                      secureTextEntry={!showPassword}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                      {showPassword
                        ? <EyeOffIcon size={18} color={colors.textSecondary} />
                        : <EyeIcon size={18} color={colors.textSecondary} />}
                    </Pressable>
                  </View>
                </View>

                <ScalePressable
                  onPress={handleAuth}
                  style={[styles.authBtn, { backgroundColor: colors.tint, opacity: authLoading ? 0.6 : 1 }]}
                >
                  <Text style={styles.authBtnText}>
                    {authLoading ? 'Загрузка...' : isRegisterMode ? 'Зарегистрироваться' : 'Войти'}
                  </Text>
                </ScalePressable>

                <Pressable onPress={() => setIsRegisterMode(!isRegisterMode)} style={styles.switchAuth}>
                  <Text style={[styles.switchAuthText, { color: colors.tint }]}>
                    {isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                  </Text>
                </Pressable>
              </GlassCard>
            </FadeInView>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }


  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <FadeInView delay={0} direction="down">
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: colors.tint }]}>ЛИЧНЫЙ КАБИНЕТ</Text>
            <Text style={[styles.title, { color: colors.text }]}>Профиль</Text>
          </View>
        </FadeInView>

        
        <FadeInView delay={100} direction="up">
          <GlassCard style={styles.userCard} elevated>
            <View style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: colors.tintLight }]}>
                <Text style={[styles.avatarText, { color: colors.tint }]}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                {user.goal && (
                  <Text style={[styles.userGoal, { color: colors.tint }]}>🎯 {user.goal}</Text>
                )}
              </View>
              <ScalePressable onPress={startEditing} style={[styles.editBtn, { backgroundColor: colors.tintLight }]}>
                <EditIcon size={18} color={colors.tint} />
              </ScalePressable>
            </View>
          </GlassCard>
        </FadeInView>

        
        <FadeInView delay={200} direction="up">
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.tintLight }]}>
                <DumbbellIcon size={18} color={colors.tint} />
              </View>
              <AnimatedCounter value={stats.totalWorkouts} style={[styles.statValue, { color: colors.text }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Всего{'\n'}тренировок</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.warningLight }]}>
                <ClockIcon size={18} color={colors.warning} />
              </View>
              <AnimatedCounter value={stats.totalMinutes} style={[styles.statValue, { color: colors.text }]} suffix=" м" />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Всего{'\n'}минут</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.successLight }]}>
                <FlameIcon size={18} color={colors.success} />
              </View>
              <AnimatedCounter value={stats.weekWorkouts} style={[styles.statValue, { color: colors.text }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>За{'\n'}неделю</Text>
            </GlassCard>
          </View>
        </FadeInView>

        
        {(user.height_cm || user.weight_kg) && (
          <FadeInView delay={250} direction="up">
            <GlassCard style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Параметры тела</Text>
              <View style={styles.bodyRow}>
                {user.height_cm && (
                  <View style={styles.bodyItem}>
                    <Text style={[styles.bodyValue, { color: colors.text }]}>{user.height_cm}</Text>
                    <Text style={[styles.bodyLabel, { color: colors.textSecondary }]}>см</Text>
                  </View>
                )}
                {user.weight_kg && (
                  <View style={styles.bodyItem}>
                    <Text style={[styles.bodyValue, { color: colors.text }]}>{user.weight_kg}</Text>
                    <Text style={[styles.bodyLabel, { color: colors.textSecondary }]}>кг</Text>
                  </View>
                )}
                {user.height_cm && user.weight_kg && (
                  <View style={styles.bodyItem}>
                    <Text style={[styles.bodyValue, { color: colors.tint }]}>
                      {(user.weight_kg / ((user.height_cm / 100) ** 2)).toFixed(1)}
                    </Text>
                    <Text style={[styles.bodyLabel, { color: colors.textSecondary }]}>ИМТ</Text>
                  </View>
                )}
              </View>
            </GlassCard>
          </FadeInView>
        )}

        
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

              <ScalePressable onPress={saveProfile} style={[styles.authBtn, { backgroundColor: colors.tint }]}>
                <CheckIcon size={18} color="#FFF" />
                <Text style={styles.authBtnText}>Сохранить</Text>
              </ScalePressable>
            </GlassCard>
          </FadeInView>
        )}

        
        <FadeInView delay={300} direction="up">
          <GlassCard style={styles.section}>
            <ScalePressable
              onPress={() => setChangingPassword(!changingPassword)}
              style={styles.menuRow}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.warningLight }]}>
                <LockIcon size={18} color={colors.warning} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Сменить пароль</Text>
            </ScalePressable>

            {changingPassword && (
              <View style={{ marginTop: Spacing.md }}>
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
                <ScalePressable onPress={handleChangePassword} style={[styles.savePasswordBtn, { backgroundColor: colors.tint }]}>
                  <Text style={styles.authBtnText}>Изменить</Text>
                </ScalePressable>
              </View>
            )}
          </GlassCard>
        </FadeInView>

        
        <FadeInView delay={400} direction="up">
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 110 },

  
  authScroll: { paddingBottom: 60, justifyContent: 'center', flexGrow: 1 },
  authHeader: { alignItems: 'center', paddingTop: Spacing.xxl, marginBottom: Spacing.xxl },
  authAvatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  authTitle: { fontSize: 28, fontWeight: '800', marginBottom: Spacing.sm },
  authSubtitle: { fontSize: 15, textAlign: 'center', paddingHorizontal: Spacing.xl },
  authCard: { marginHorizontal: Spacing.xl },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  authBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  switchAuth: { alignItems: 'center', marginTop: Spacing.lg },
  switchAuthText: { fontSize: 14, fontWeight: '600' },

 
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  greeting: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: Spacing.xs },
  title: { fontSize: 32, fontWeight: '800' },

  
  userCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  userEmail: { fontSize: 13 },
  userGoal: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  editBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, marginTop: Spacing.lg, gap: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, textAlign: 'center', lineHeight: 14 },

 
  section: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.md },

 
  bodyRow: { flexDirection: 'row', justifyContent: 'space-around' },
  bodyItem: { alignItems: 'center' },
  bodyValue: { fontSize: 28, fontWeight: '800' },
  bodyLabel: { fontSize: 13, marginTop: 2 },

  
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  editRow: { flexDirection: 'row', gap: Spacing.md },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15 },
  editInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 15,
  },

  
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 4 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuText: { fontSize: 15, fontWeight: '600' },

  savePasswordBtn: {
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});
