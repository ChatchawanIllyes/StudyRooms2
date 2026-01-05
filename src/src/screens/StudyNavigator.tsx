import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import TimerScreen from './TimerScreen';
import StatsScreen from './StatsScreen';
import TasksScreen from './TasksScreen';

const Tab = createMaterialTopTabNavigator();

export default function StudyNavigator() {
  const { colors, accentColor } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.card,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
          },
          tabBarActiveTintColor: accentColor,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIndicatorStyle: {
            backgroundColor: accentColor,
            height: 2,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarItemStyle: {
            flexDirection: 'row',
          },
          tabBarShowIcon: true,
        }}
      >
        <Tab.Screen
          name="Timer"
          component={TimerScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="timer-outline" size={20} color={color} style={{ marginRight: 4 }} />
            ),
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="bar-chart-outline" size={20} color={color} style={{ marginRight: 4 }} />
            ),
          }}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="checkbox-outline" size={20} color={color} style={{ marginRight: 4 }} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
