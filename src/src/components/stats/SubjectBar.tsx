import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";

interface SubjectBarProps {
  name: string;
  icon: string;
  color: string;
  minutes: number;
  maxMinutes: number;
  delay: number;
}

export default function SubjectBar({
  name,
  icon,
  color,
  minutes,
  maxMinutes,
  delay,
}: SubjectBarProps) {
  const { colors } = useTheme();

  const width = useSharedValue(0);

  useEffect(() => {
    const percentage = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;
    width.value = withDelay(
      delay,
      withTiming(percentage, { duration: 600 })
    );
  }, [minutes, maxMinutes]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon as any} size={18} color={color} />
          </View>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.text }]}>
          {formatTime(minutes)}
        </Text>
      </View>

      <View style={styles.barContainer}>
        {/* Background bar */}
        <View
          style={[
            styles.barBackground,
            { backgroundColor: colors.border },
          ]}
        />
        {/* Progress bar */}
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: `${color}CC` }, // 80% opacity
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  time: {
    fontSize: 15,
    fontWeight: "600",
  },
  barContainer: {
    height: 8,
    position: "relative",
    borderRadius: 4,
    overflow: "hidden",
  },
  barBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    minWidth: 4,
  },
});
