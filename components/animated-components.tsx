import React, { useEffect, useRef } from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  FadeInDown,
  FadeInUp,
  FadeIn,
  SlideInRight,
  interpolate,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalePressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleDown?: number;
  disabled?: boolean;
}

export function ScalePressable({
  children,
  onPress,
  style,
  scaleDown = 0.96,
  disabled,
}: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(scaleDown, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({
  children,
  delay = 0,
  direction = 'up',
  duration = 500,
  style,
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(direction === 'up' ? 20 : direction === 'down' ? -20 : 0);
  const translateX = useSharedValue(direction === 'right' ? 30 : direction === 'left' ? -30 : 0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120 }));
    translateX.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  style?: StyleProp<ViewStyle>;
}

export function StaggeredItem({ children, index, style }: StaggeredItemProps) {
  return (
    <FadeInView delay={index * 80} direction="up" style={style}>
      {children}
    </FadeInView>
  );
}

interface PulseViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
}

export function PulseView({ children, style, active = true }: PulseViewProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

import { Text, TextStyle } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, style, suffix = '', duration = 800 }: AnimatedCounterProps) {
  const animValue = useSharedValue(0);
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    animValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    const steps = Math.max(20, Math.abs(diff));
    const stepDuration = duration / steps;
    let step = 0;
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress >= 1 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, stepDuration);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [value]);

  return <Text style={style}>{display}{suffix}</Text>;
}

import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { View } from 'react-native';

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = '#8B83FF',
  trackColor = 'rgba(139, 131, 255, 0.15)',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const animProgress = useSharedValue(0);
  
  useEffect(() => {
    animProgress.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedStyle(() => {
    const dashOffset = circumference * (1 - animProgress.value);
    return {
      strokeDashoffset: dashOffset,
    } as any;
  });

  
  const [displayProgress, setDisplayProgress] = React.useState(0);
  
  useEffect(() => {
    const start = displayProgress;
    const diff = progress - start;
    const steps = 30;
    const stepDuration = 1000 / steps;
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      const p = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayProgress(start + diff * eased);
      if (p >= 1) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [progress]);

  const dashOffset = circumference * (1 - displayProgress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}


interface ShimmerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ShimmerGlow({ children, style }: ShimmerProps) {
  const glow = useSharedValue(0.6);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}


interface AnimatedTabIconProps {
  children: React.ReactNode;
  focused: boolean;
}

export function AnimatedTabIcon({ children, focused }: AnimatedTabIconProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.25, { damping: 8, stiffness: 300 }),
        withSpring(1.1, { damping: 12, stiffness: 200 })
      );
      translateY.value = withSpring(-2, { damping: 12, stiffness: 200 });
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 200 });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}


export { FadeInDown, FadeInUp, FadeIn, SlideInRight };
export { default as Animated } from 'react-native-reanimated';
