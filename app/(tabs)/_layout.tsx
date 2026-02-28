import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { DumbbellIcon, ListIcon, HomeIcon, GlobeIcon } from '@/components/icons';
import { CalendarIcon } from '@/components/exercise-icons';
import { AnimatedTabIcon } from '@/components/animated-components';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const tabBarBg = colorScheme === 'dark' ? '#1E1E32' : '#FFFFFF';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
          backgroundColor: tabBarBg,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarBackground: () => null,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главное',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <HomeIcon size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Упражнения',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <DumbbellIcon size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Тренировки',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <ListIcon size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Календарь',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <CalendarIcon size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Сообщество',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <GlobeIcon size={24} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
    </Tabs>
  );
}
