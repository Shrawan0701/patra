import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { SHADOWS } from '../../src/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bottomPad = Math.max(12, insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.vermilion,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.border,
          height: 58 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
          ...SHADOWS.paperCard,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Studio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="exports"
        options={{
          title: 'Downloads',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="film-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="refer"
        options={{
          title: 'Refer',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
