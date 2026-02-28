import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing } from '@/constants/theme';
import { MoonIcon, SunIcon, SunsetIcon, DumbbellIcon } from '@/components/icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const MOTIVATIONAL_QUOTES = [
  'Каждое повторение делает тебя сильнее',
  'Дисциплина — мост между целями и достижениями',
  'Твоё тело может больше, чем ты думаешь',
  'Начни сейчас — через месяц скажешь себе спасибо',
  'Сильнее каждый день, увереннее каждый шаг',
  'Боль временна, гордость — навсегда',
  'Не останавливайся, пока не станешь гордиться собой',
  'Тренировка — это инвестиция в себя',
  'Маленькие шаги ведут к большим результатам',
  'Сегодня — идеальный день стать лучше',
  'Трудности закаляют характер и тело',
  'Упорство побеждает талант, когда талант не работает',
];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 6) return { greeting: 'Доброй ночи', sub: 'Отличное время для восстановления', emoji: '🌙' };
  if (h < 12) return { greeting: 'Доброе утро', sub: 'Отличный день чтобы заняться физкультурой', emoji: '☀️' };
  if (h < 18) return { greeting: 'Добрый день', sub: 'Самое время для хорошей тренировки', emoji: '💪' };
  return { greeting: 'Добрый вечер', sub: 'Время для вечерней тренировки', emoji: '🌆' };
}

function TimeIcon({ size, color }: { size: number; color: string }) {
  const h = new Date().getHours();
  if (h < 6) return <MoonIcon size={size} color={color} />;
  if (h < 12) return <SunIcon size={size} color={color} />;
  if (h < 18) return <DumbbellIcon size={size} color={color} />;
  return <SunsetIcon size={size} color={color} />;
}

interface IntroScreenProps {
  onFinish: () => void;
}

export function IntroScreen({ onFinish }: IntroScreenProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const { greeting, sub, emoji } = useMemo(() => getTimeOfDay(), []);
  const quote = useMemo(
    () => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
    []
  );

  
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(-30);
  const greetingOpacity = useSharedValue(0);
  const greetingY = useSharedValue(30);
  const emojiOpacity = useSharedValue(0);
  const emojiScale = useSharedValue(0.5);
  const subOpacity = useSharedValue(0);
  const subY = useSharedValue(20);
  const quoteOpacity = useSharedValue(0);
  const quoteY = useSharedValue(20);
  const lineWidth = useSharedValue(0);
  const overallOpacity = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    iconRotate.value = withDelay(200, withSpring(0, { damping: 14, stiffness: 80 }));

    
    greetingOpacity.value = withDelay(500, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    greetingY.value = withDelay(500, withSpring(0, { damping: 16, stiffness: 120 }));

    emojiOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    emojiScale.value = withDelay(700, withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 150 }),
    ));

    lineWidth.value = withDelay(900, withTiming(80, { duration: 500, easing: Easing.out(Easing.cubic) }));

    subOpacity.value = withDelay(1100, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    subY.value = withDelay(1100, withSpring(0, { damping: 16, stiffness: 120 }));

 
    quoteOpacity.value = withDelay(1500, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    quoteY.value = withDelay(1500, withSpring(0, { damping: 16, stiffness: 120 }));


    overallOpacity.value = withDelay(3500, withTiming(0, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(onFinish)();
      }
    }));
  }, []);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const greetingAnim = useAnimatedStyle(() => ({
    opacity: greetingOpacity.value,
    transform: [{ translateY: greetingY.value }],
  }));

  const emojiAnim = useAnimatedStyle(() => ({
    opacity: emojiOpacity.value,
    transform: [{ scale: emojiScale.value }],
  }));

  const lineAnim = useAnimatedStyle(() => ({
    width: lineWidth.value,
    opacity: lineWidth.value > 0 ? 1 : 0,
  }));

  const subAnim = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
    transform: [{ translateY: subY.value }],
  }));

  const quoteAnim = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
    transform: [{ translateY: quoteY.value }],
  }));

  const overallAnim = useAnimatedStyle(() => ({
    opacity: overallOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
        overallAnim,
      ]}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { backgroundColor: colors.tintLight }, iconAnim]}>
          <TimeIcon size={48} color={colors.tint} />
        </Animated.View>

        <View style={styles.greetingRow}>
          <Animated.Text style={[styles.greeting, { color: colors.text }, greetingAnim]}>
            {greeting}
          </Animated.Text>
          <Animated.Text style={[styles.emoji, emojiAnim]}>
            {emoji}
          </Animated.Text>
        </View>

        <Animated.View style={[styles.line, { backgroundColor: colors.tint }, lineAnim]} />

        <Animated.Text style={[styles.subText, { color: colors.textSecondary }, subAnim]}>
          {sub}
        </Animated.Text>

        <Animated.View style={[styles.quoteWrap, quoteAnim]}>
          <Text style={[styles.quoteIcon, { color: colors.tint }]}>«</Text>
          <Text style={[styles.quote, { color: colors.text }]}>{quote}</Text>
          <Text style={[styles.quoteIcon, { color: colors.tint }]}>»</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
  },
  emoji: {
    fontSize: 32,
  },
  line: {
    height: 3,
    borderRadius: 2,
    marginBottom: Spacing.lg,
  },
  subText: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    lineHeight: 24,
  },
  quoteWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  quoteIcon: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
  },
  quote: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    flex: 1,
  },
});
