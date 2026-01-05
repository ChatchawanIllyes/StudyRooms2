import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface StudyFABProps {
  navigation: any;
  currentScreen?: string;
}

export default function StudyFAB({ navigation, currentScreen }: StudyFABProps) {
  const { colors } = useTheme();
  const [showMenuButtons, setShowMenuButtons] = useState(false);

  // Animation values
  const rotation = useSharedValue(0);
  const button1Opacity = useSharedValue(0);
  const button1TranslateY = useSharedValue(20);
  const button2Opacity = useSharedValue(0);
  const button2TranslateY = useSharedValue(20);
  const button3Opacity = useSharedValue(0);
  const button3TranslateY = useSharedValue(20);

  const toggleMenuButtons = () => {
    if (showMenuButtons) {
      // Hide buttons
      rotation.value = withSpring(0);
      button1Opacity.value = withTiming(0, { duration: 150 });
      button1TranslateY.value = withTiming(20, { duration: 150 });
      button2Opacity.value = withTiming(0, { duration: 150 });
      button2TranslateY.value = withTiming(20, { duration: 150 });
      button3Opacity.value = withTiming(0, { duration: 150 });
      button3TranslateY.value = withTiming(20, { duration: 150 });
      setTimeout(() => setShowMenuButtons(false), 150);
    } else {
      // Show buttons
      setShowMenuButtons(true);
      rotation.value = withSpring(45);
      button1Opacity.value = withTiming(1, { duration: 200 });
      button1TranslateY.value = withSpring(0);
      setTimeout(() => {
        button2Opacity.value = withTiming(1, { duration: 200 });
        button2TranslateY.value = withSpring(0);
      }, 50);
      setTimeout(() => {
        button3Opacity.value = withTiming(1, { duration: 200 });
        button3TranslateY.value = withSpring(0);
      }, 100);
    }
  };

  const handleNavigate = (screen: string) => {
    if (screen === currentScreen) {
      toggleMenuButtons();
      return;
    }
    toggleMenuButtons();
    setTimeout(() => navigation.navigate(screen), 200);
  };

  // Animated styles
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const button1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: button1Opacity.value,
    transform: [{ translateY: button1TranslateY.value }],
  }));

  const button2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: button2Opacity.value,
    transform: [{ translateY: button2TranslateY.value }],
  }));

  const button3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: button3Opacity.value,
    transform: [{ translateY: button3TranslateY.value }],
  }));

  return (
    <>
      {/* Menu Buttons */}
      {showMenuButtons && (
        <>
          <Animated.View
            style={[
              styles.menuButton1,
              { backgroundColor: colors.card },
              button1AnimatedStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.menuButtonInner}
              onPress={() => handleNavigate("Timer")}
              activeOpacity={0.7}
            >
              <Ionicons name="timer-outline" size={20} color={colors.accent} />
              <Text style={[styles.menuButtonText, { color: colors.text }]}>
                Timer
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.menuButton2,
              { backgroundColor: colors.card },
              button2AnimatedStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.menuButtonInner}
              onPress={() => handleNavigate("Tasks")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="checkbox-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.menuButtonText, { color: colors.text }]}>
                Tasks
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.menuButton3,
              { backgroundColor: colors.card },
              button3AnimatedStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.menuButtonInner}
              onPress={() => handleNavigate("Stats")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="bar-chart-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.menuButtonText, { color: colors.text }]}>
                Stats
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={toggleMenuButtons}
        activeOpacity={0.8}
      >
        <Animated.View style={fabAnimatedStyle}>
          <Ionicons name="apps" size={28} color="#ffffff" />
        </Animated.View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton1: {
    position: "absolute",
    right: 16,
    bottom: 195,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuButton2: {
    position: "absolute",
    right: 16,
    bottom: 140,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuButton3: {
    position: "absolute",
    right: 16,
    bottom: 85,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
