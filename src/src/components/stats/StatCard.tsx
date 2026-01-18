import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  trend?: number; // percentage, positive = up, negative = down
  onPress?: () => void;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  onPress,
}: StatCardProps) {
  const { colors, accentColor } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getTrendColor = () => {
    if (!trend) return colors.textSecondary;
    return trend > 0 ? "#34c759" : "#ff3b30";
  };

  const getTrendIcon = () => {
    if (!trend) return "";
    return trend > 0 ? "↑" : "↓";
  };

  const content = (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.card },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
          {icon && <Text style={styles.icon}>{icon}</Text>}
        </View>
        {trend !== undefined && trend !== 0 && (
          <View style={styles.trendContainer}>
            <Text style={[styles.trend, { color: getTrendColor() }]}>
              {getTrendIcon()} {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 100,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 36, // Fixed height ensures alignment
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28, // Explicit line height for consistent baseline
  },
  icon: {
    fontSize: 24,
    lineHeight: 28, // Match value line height
    marginLeft: 6,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 18, // Fixed height for trend area
  },
  trend: {
    fontSize: 12,
    fontWeight: "600",
  },
});
