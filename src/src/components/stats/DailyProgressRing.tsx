import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DailyProgressRingProps {
  currentMinutes: number;
  goalMinutes: number;
}

export default function DailyProgressRing({
  currentMinutes,
  goalMinutes,
}: DailyProgressRingProps) {
  const { colors, accentColor } = useTheme();

  const percentage = goalMinutes > 0 ? (currentMinutes / goalMinutes) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);

  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  // Animated value for progress
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clampedPercentage / 100, { duration: 1000 });
  }, [clampedPercentage]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.ringContainer}>
        <Svg width={200} height={200}>
          {/* Background circle */}
          <Circle
            cx={100}
            cy={100}
            r={radius}
            stroke={`${accentColor}20`}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={100}
            cy={100}
            r={radius}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            fill="none"
            strokeLinecap="round"
            rotation="-90"
            origin="100, 100"
          />
        </Svg>

        {/* Center text */}
        <View style={styles.centerText}>
          <Text style={[styles.currentTime, { color: colors.text }]}>
            {formatTime(currentMinutes)}
          </Text>
          <Text style={[styles.goalText, { color: colors.textSecondary }]}>
            of {formatTime(goalMinutes)}
          </Text>
          <Text
            style={[
              styles.percentage,
              { color: accentColor, marginTop: 4 },
            ]}
          >
            {Math.round(clampedPercentage)}%
          </Text>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>
        Daily Progress
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  ringContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  centerText: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  currentTime: {
    fontSize: 32,
    fontWeight: "600",
  },
  goalText: {
    fontSize: 13,
    marginTop: 2,
  },
  percentage: {
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
  },
});
