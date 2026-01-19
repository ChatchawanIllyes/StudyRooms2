import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

interface EmptyStateProps {
  type: "no-data" | "no-period-data";
  periodLabel?: string;
  onStartTimer?: () => void;
}

export default function EmptyState({
  type,
  periodLabel,
  onStartTimer,
}: EmptyStateProps) {
  const { colors, accentColor } = useTheme();

  // Floating animation for book icon (moves up and down gently)
  const translateY = useSharedValue(0);

  // Breathing animation for chart icon (scales in and out gently)
  const scale = useSharedValue(1);

  useEffect(() => {
    if (type === "no-data") {
      // Floating animation
      translateY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1, // infinite
        false
      );
    } else {
      // Breathing animation
      scale.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1500 }),
          withTiming(1.05, { duration: 1500 })
        ),
        -1,
        false
      );
    }
  }, [type]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (type === "no-data") {
    return (
      <View style={styles.container}>
        <AnimatedIonicons
          name="book-outline"
          size={64}
          color={accentColor}
          style={floatingStyle}
        />
        <Text style={[styles.title, { color: colors.text }]}>
          Start Your Study Journey
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Track your study time to see{"\n"}insights and progress here
        </Text>
        {onStartTimer && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: accentColor }]}
            onPress={onStartTimer}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Start Timer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedIonicons
        name="analytics-outline"
        size={64}
        color={accentColor}
        style={breathingStyle}
      />
      <Text style={[styles.title, { color: colors.text }]}>
        No study time recorded
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Start a session to begin tracking{"\n"}
        {periodLabel ? `for ${periodLabel}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
