import React from 'react';
import { Tabs } from 'expo-router';
import { Church, Mic, BookOpen, Calendar, Settings } from 'lucide-react-native';
import { useAccessibility } from '../../src/context/AccessibilityContext';
import { useLanguage } from '../../src/i18n';

export default function TabsLayout() {
  const { colors, scaledFontSize } = useAccessibility();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.thumbZoneBackground,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: scaledFontSize(11),
          fontWeight: '600'
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.worships,
          tabBarLabel: t.tabs.worships,
          tabBarIcon: ({ color }) => <Church size={22} color={color} />
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: t.tabs.live,
          tabBarLabel: t.tabs.live,
          tabBarIcon: ({ color }) => <Mic size={22} color={color} />
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: t.tabs.book,
          tabBarLabel: t.tabs.book,
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.tabs.calendar,
          tabBarLabel: t.tabs.calendar,
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />
        }}
      />
      <Tabs.Screen
        name="accessibility"
        options={{
          title: t.tabs.accessibility,
          tabBarLabel: t.tabs.accessibility,
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />
        }}
      />
    </Tabs>
  );
}

