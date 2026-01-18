import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface ChartData {
  day: string;
  minutes: number;
}

interface FocusTimeChartProps {
  data: ChartData[];
  goalMinutes?: number;
}

export default function FocusTimeChart({
  data,
  goalMinutes,
}: FocusTimeChartProps) {
  const { colors, accentColor } = useTheme();

  const maxMinutes = Math.max(
    ...data.map((d) => d.minutes),
    goalMinutes || 0,
    1
  );

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins > 0 ? ` ${mins}m` : ""}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Focus Time (Last 7 Days)
      </Text>

      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {data.map((item, index) => (
            <ChartBar
              key={index}
              day={item.day}
              minutes={item.minutes}
              maxMinutes={maxMinutes}
              accentColor={accentColor}
              colors={colors}
              delay={index * 100}
              formatTime={formatTime}
            />
          ))}
        </View>

        {/* Goal line */}
        {goalMinutes && goalMinutes > 0 && (
          <View
            style={[
              styles.goalLine,
              {
                bottom: `${(goalMinutes / maxMinutes) * 100}%`,
                borderColor: colors.textSecondary,
              },
            ]}
          >
            <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>
              Goal
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface ChartBarProps {
  day: string;
  minutes: number;
  maxMinutes: number;
  accentColor: string;
  colors: any;
  delay: number;
  formatTime: (minutes: number) => string;
}

function ChartBar({
  day,
  minutes,
  maxMinutes,
  accentColor,
  colors,
  delay,
  formatTime,
}: ChartBarProps) {
  const height = useSharedValue(0);
  const [showTooltip, setShowTooltip] = React.useState(false);

  useEffect(() => {
    height.value = withDelay(
      delay,
      withTiming(maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0, {
        duration: 400,
      })
    );
  }, [minutes, maxMinutes]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${Math.max(height.value, 5)}%`,
  }));

  // Create gradient colors from light (40% opacity) to saturated
  const gradientColors: [string, string, string] = [
    `${accentColor}40`,
    `${accentColor}80`,
    accentColor,
  ];

  return (
    <View style={styles.barContainer}>
      {showTooltip && minutes > 0 && (
        <View
          style={[
            styles.tooltip,
            { backgroundColor: colors.text },
          ]}
        >
          <Text style={[styles.tooltipText, { color: colors.background }]}>
            {formatTime(minutes)}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.barTouchable}
        onPress={() => setShowTooltip(!showTooltip)}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.bar,
            animatedStyle,
            {
              opacity: minutes > 0 ? 1 : 0.3,
            },
          ]}
        >
          <LinearGradient
            colors={gradientColors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
        {day}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  chartContainer: {
    height: 180,
    position: "relative",
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: 24,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  barTouchable: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    minHeight: 4,
  },
  gradient: {
    flex: 1,
    borderRadius: 6,
  },
  dayLabel: {
    fontSize: 12,
    marginTop: 8,
    position: "absolute",
    bottom: 0,
  },
  goalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 10,
    position: "absolute",
    right: 0,
    top: -8,
  },
  tooltip: {
    position: "absolute",
    top: -30,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
