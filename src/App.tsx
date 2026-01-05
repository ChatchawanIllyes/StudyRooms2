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

import StudyNavigator from "./src/screens/StudyNavigator";
import RoomsNavigator from "./src/screens/RoomsNavigator";
import SettingsScreen from "./src/screens/SettingsScreen";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { useNavigation, useNavigationState } from "@react-navigation/native";

const Tab = createBottomTabNavigator();

// Custom Study Tab Button Component
function StudyTabButton({ onPress, focused }: any) {
  const { isDark, accentColor } = useTheme();
  const navigation = useNavigation<any>();
  const navigationState = useNavigationState((state) => state);

  const colors = {
    text: isDark ? "#ffffff" : "#000000",
    textSecondary: isDark ? "#8e8e93" : "#8e8e93",
  };

  // Get current Study screen
  const getCurrentStudyScreen = () => {
    const studyRoute = navigationState?.routes?.find((r) => r.name === "Study");
    if (studyRoute && studyRoute.state) {
      const studyState = studyRoute.state as any;
      return studyState.routes?.[studyState.index]?.name || "Timer";
    }
    return "Timer";
  };

  const currentScreen = focused ? getCurrentStudyScreen() : null;

  if (!focused) {
    // Normal button when not on Study tab
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="book-outline" size={24} color={colors.textSecondary} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "500",
            marginTop: 4,
            marginBottom: 4,
            color: colors.textSecondary,
          }}
        >
          Study
        </Text>
      </TouchableOpacity>
    );
  }

  // Three mini buttons when on Study tab
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginBottom: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Study", { screen: "Timer" })}
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="timer-outline"
            size={20}
            color={
              currentScreen === "Timer" ? accentColor : colors.textSecondary
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Study", { screen: "Tasks" })}
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="checkbox-outline"
            size={20}
            color={
              currentScreen === "Tasks" ? accentColor : colors.textSecondary
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Study", { screen: "Stats" })}
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="bar-chart-outline"
            size={20}
            color={
              currentScreen === "Stats" ? accentColor : colors.textSecondary
            }
          />
        </TouchableOpacity>
      </View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "500",
          marginBottom: 4,
          color: accentColor,
        }}
      >
        Study
      </Text>
    </View>
  );
}

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
              let iconName: keyof typeof Ionicons.glyphMap = "book-outline";

              if (route.name === "Study") {
                iconName = focused ? "book" : "book-outline";
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
            name="Study"
            component={StudyNavigator}
            options={{
              tabBarButton: (props) => (
                <StudyTabButton
                  onPress={props.onPress}
                  focused={props.accessibilityState?.selected}
                />
              ),
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
      <AppContent />
    </ThemeProvider>
  );
}
