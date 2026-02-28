import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, TextInputProps, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { SearchIcon, CloseIcon } from './icons';

interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

export function SearchBar({ value, onChangeText, onClear, style, ...props }: SearchBarProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [focused, setFocused] = useState(false);

  const borderScale = useSharedValue(0);

  useEffect(() => {
    borderScale.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: focused
      ? colors.tint
      : colors.inputBorder,
    transform: [{ scale: 1 + borderScale.value * 0.01 }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.inputBackground,
        },
        animatedStyle,
      ]}
    >
      <SearchIcon size={20} color={focused ? colors.tint : colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { color: colors.text }]}
        placeholderTextColor={colors.textSecondary}
        placeholder="Поиск упражнений..."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {value.length > 0 && (
        <Pressable onPress={() => { onChangeText(''); onClear?.(); }}>
          <CloseIcon size={18} color={colors.textSecondary} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
});
