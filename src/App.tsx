// Initialize reanimated before anything else
import "react-native-reanimated";

import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";

import FocusNavigator from "./src/screens/FocusNavigator";
import RoomsNavigator from "./src/screens/RoomsNavigator";
import SettingsScreen from "./src/screens/SettingsScreen";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { WidgetProvider } from "./src/context/WidgetContext";

const Tab = createBottomTabNavigator();

function AppContent() {
  const { isDark, accentColor } = useTheme();
  const colorScheme = isDark ? "dark" : "light";

  const colors = {
    background: isDark ? "#000000" : "#ffffff",
    card: isDark ? "#1c1c1e" : "#f2f2f7",
    text: isDark ? "#ffffff" : "#000000",
    textSecondary: isDark ? "#8e8e93" : "#8e8e93",
    border: isDark ? "#38383a" : "#c6c6c8",
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: accentColor,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            notification: accentColor,
          },
        }}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = "grid-outline";

              if (route.name === "Focus") {
                iconName = focused ? "grid" : "grid-outline";
              } else if (route.name === "Rooms") {
                iconName = focused ? "people" : "people-outline";
              } else if (route.name === "Settings") {
                iconName = focused ? "settings" : "settings-outline";
              }

              return <Ionicons name={iconName} size={24} color={color} />;
            },
            tabBarActiveTintColor: accentColor,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              borderTopWidth: 0.5,
              paddingBottom: 25,
              paddingTop: 12,
              height: 85,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "500",
              marginBottom: 4,
            },
          })}
        >
          <Tab.Screen
            name="Focus"
            component={FocusNavigator}
            options={{
              tabBarLabel: "Focus",
            }}
          />
          <Tab.Screen name="Rooms" component={RoomsNavigator} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WidgetProvider>
        <AppContent />
      </WidgetProvider>
    </ThemeProvider>
  );
}
