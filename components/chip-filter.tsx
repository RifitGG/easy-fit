import React from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { ScalePressable } from './animated-components';

interface ChipFilterProps {
  options: { label: string; value: string }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function ChipFilter({ options, selected, onSelect }: ChipFilterProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        style={styles.scroll}
      >
      <ScalePressable
        onPress={() => onSelect(null)}
        scaleDown={0.92}
      >
        <View
          style={[
            styles.chip,
            {
              backgroundColor: !selected ? colors.tint : colors.cardBackground,
              borderColor: !selected ? colors.tint : colors.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              { color: !selected ? '#FFF' : colors.textSecondary },
            ]}
          >
            Все
          </Text>
        </View>
      </ScalePressable>
      {options.map((opt) => (
        <ScalePressable
          key={opt.value}
          onPress={() => onSelect(selected === opt.value ? null : opt.value)}
          scaleDown={0.92}
        >
          <View
            style={[
              styles.chip,
              {
                backgroundColor: selected === opt.value ? colors.tint : colors.cardBackground,
                borderColor: selected === opt.value ? colors.tint : colors.cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: selected === opt.value ? '#FFF' : colors.textSecondary },
              ]}
            >
              {opt.label}
            </Text>
          </View>
        </ScalePressable>
      ))}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 52,
    marginBottom: Spacing.sm,
  },
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'center',
    height: 52,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
