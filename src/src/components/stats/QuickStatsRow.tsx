import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import StatCard from "./StatCard";

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

interface QuickStatsRowProps {
  weeklyTotal: string;
  weekTrend: number;
  streak: number;
  sessionCount: number;
}

export default function QuickStatsRow({
  weeklyTotal,
  weekTrend,
  streak,
  sessionCount,
}: QuickStatsRowProps) {
  // Pulse animation for flame icon
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1.0, { duration: 800 })
      ),
      -1, // infinite
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flameIcon = (
    <AnimatedIonicons
      name="flame"
      size={24}
      color="#ff6b35"
      style={pulseStyle}
    />
  );

  return (
    <View style={styles.container}>
      <StatCard
        label="Weekly Total"
        value={weeklyTotal}
        trend={weekTrend}
      />
      <View style={styles.spacer} />
      <StatCard
        label="Streak"
        value={`${streak}`}
        icon={flameIcon}
      />
      <View style={styles.spacer} />
      <StatCard
        label="Sessions"
        value={`${sessionCount}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 24,
  },
  spacer: {
    width: 12,
  },
});
