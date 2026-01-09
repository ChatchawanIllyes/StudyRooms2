import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { WidgetType, WidgetSize, useWidgets } from "../context/WidgetContext";
import TimerWidget from "./TimerWidget";
import TaskWidget from "./TaskWidget";
import StatsHeatmapWidget from "./StatsHeatmapWidget";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const PADDING = 20;
const GAP = 16;
const GRID_WIDTH = width - PADDING * 2;
const SLOT_SIZE = (GRID_WIDTH - GAP) / 2;

interface WidgetTileProps {
  type: WidgetType;
  size: WidgetSize;
  position?: number;
  onPress?: () => void;
  onRemove?: () => void;
  onResize?: () => void;
  isEditMode?: boolean;
  widgetId?: string;
  isPreview?: boolean;
}

const getWidgetInfo = (type: WidgetType) => {
  switch (type) {
    case "timer":
      return {
        name: "Timer",
        icon: "timer-outline" as const,
        preview: "Focus",
        subtext: "25:00",
      };
    case "tasks":
      return {
        name: "Tasks",
        icon: "checkbox-outline" as const,
        preview: "No tasks",
        subtext: "",
      };
    case "stats":
      return {
        name: "Stats",
        icon: "bar-chart-outline" as const,
        preview: "Today",
        subtext: "0 min",
      };
    case "stats-heatmap":
      return {
        name: "Study Heatmap",
        icon: "grid-outline" as const,
        preview: "Activity",
        subtext: "",
      };
  }
};

export default function WidgetTile({
  type,
  size,
  position,
  onPress,
  onRemove,
  onResize,
  isEditMode = false,
  widgetId,
  isPreview = false,
}: WidgetTileProps) {
  const { colors, accentColor } = useTheme();
  const { resizeState, setResizeState } = useWidgets();
  const info = getWidgetInfo(type);

  // Only in resize mode if this specific widget (with a valid ID) is being resized
  const isInResizeMode = widgetId ? resizeState?.widgetId === widgetId : false;

  // Simple shared values - no refs needed
  const scale = useSharedValue(1);
  const breathingOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (isEditMode) {
      breathingOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1500 }),
          withTiming(0.6, { duration: 1500 })
        ),
        -1,
        false
      );
    } else {
      breathingOpacity.value = withTiming(0);
    }
  }, [isEditMode]);

  const getDimensions = () => {
    switch (size) {
      case "1x1":
        return { width: SLOT_SIZE, height: SLOT_SIZE };
      case "2x1":
        return { width: GRID_WIDTH, height: SLOT_SIZE };
      case "1x2":
        return { width: SLOT_SIZE, height: SLOT_SIZE * 2 + GAP };
      case "2x2":
        return { width: GRID_WIDTH, height: SLOT_SIZE * 2 + GAP };
    }
  };

  const dimensions = getDimensions();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: breathingOpacity.value,
  }));

  const handlePressIn = () => {
    if (!isEditMode && !isInResizeMode) {
      scale.value = withSpring(0.96);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleResizePress = () => {
    if (!widgetId) return;
    setResizeState({ widgetId });
  };

  // If timer widget, render TimerWidget component instead
  if (type === "timer") {
    return (
      <Animated.View style={[animatedStyle]}>
        <View
          style={[
            {
              width: dimensions.width,
              height: dimensions.height,
              backgroundColor: colors.card,
              borderColor:
                isEditMode || isInResizeMode ? accentColor : "transparent",
              borderWidth: 2,
              borderRadius: 16,
              overflow: "visible",
            },
          ]}
        >
          {/* Edit Mode Controls */}
          {isEditMode && !isInResizeMode && (
            <>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: "#ff3b30" }]}
                onPress={onRemove}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resizeButton,
                  {
                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                    borderWidth: 2,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                ]}
                onPress={handleResizePress}
              >
                <Ionicons name="expand-outline" size={14} color="#ffffff" />
              </TouchableOpacity>
            </>
          )}

          <TimerWidget
            size={size}
            isEditMode={isEditMode || isInResizeMode}
            onNavigateToTimer={() => onPress?.()}
            isPreview={isPreview}
          />
        </View>
      </Animated.View>
    );
  }

  // If tasks widget, render TaskWidget component instead
  if (type === "tasks") {
    return (
      <Animated.View style={[animatedStyle]}>
        <View
          style={[
            {
              width: dimensions.width,
              height: dimensions.height,
              backgroundColor: colors.card,
              borderColor:
                isEditMode || isInResizeMode ? accentColor : "transparent",
              borderWidth: 2,
              borderRadius: 16,
              overflow: "visible",
            },
          ]}
        >
          {/* Edit Mode Controls */}
          {isEditMode && !isInResizeMode && (
            <>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: "#ff3b30" }]}
                onPress={onRemove}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resizeButton,
                  {
                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                    borderWidth: 2,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                ]}
                onPress={handleResizePress}
              >
                <Ionicons name="expand-outline" size={14} color="#ffffff" />
              </TouchableOpacity>
            </>
          )}

          <TaskWidget
            size={size}
            isEditMode={isEditMode || isInResizeMode}
            onNavigateToTasks={() => onPress?.()}
            isPreview={isPreview}
          />
        </View>
      </Animated.View>
    );
  }

  // If stats-heatmap widget, render StatsHeatmapWidget component instead
  if (type === "stats-heatmap") {
    return (
      <Animated.View style={[animatedStyle]}>
        <View
          style={[
            {
              width: dimensions.width,
              height: dimensions.height,
              backgroundColor: colors.card,
              borderColor:
                isEditMode || isInResizeMode ? accentColor : "transparent",
              borderWidth: 2,
              borderRadius: 16,
              overflow: "visible",
            },
          ]}
        >
          {/* Edit Mode Controls */}
          {isEditMode && !isInResizeMode && (
            <>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: "#ff3b30" }]}
                onPress={onRemove}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resizeButton,
                  {
                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                    borderWidth: 2,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                ]}
                onPress={handleResizePress}
              >
                <Ionicons name="expand-outline" size={14} color="#ffffff" />
              </TouchableOpacity>
            </>
          )}

          <StatsHeatmapWidget
            size={size}
            isEditMode={isEditMode || isInResizeMode}
            isPreview={isPreview}
            onNavigateToStats={() => onPress?.()}
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[animatedStyle]}
      pointerEvents={isPreview ? "none" : "auto"}
    >
      <TouchableOpacity
        activeOpacity={isEditMode || isInResizeMode ? 1 : 0.7}
        onPress={isEditMode || isInResizeMode ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: colors.card,
            borderColor:
              isEditMode || isInResizeMode ? accentColor : "transparent",
            borderWidth: 2,
          },
        ]}
      >
        {/* Widget Title Badge for Preview */}
        {isPreview && (
          <View
            style={[
              styles.titleBadge,
              {
                backgroundColor: accentColor,
                borderWidth: 2,
                borderColor: colors.background,
              },
            ]}
          >
            <Text style={styles.titleBadgeText}>{info.name}</Text>
          </View>
        )}

        {/* Edit Mode Controls */}
        {isEditMode && !isInResizeMode && (
          <>
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: "#ff3b30" }]}
              onPress={onRemove}
            >
              <Ionicons name="close" size={16} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resizeButton,
                {
                  backgroundColor: "rgba(0, 0, 0, 0.75)",
                  borderWidth: 2,
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
              ]}
              onPress={handleResizePress}
            >
              <Ionicons name="expand-outline" size={14} color="#ffffff" />
            </TouchableOpacity>
          </>
        )}

        {/* Widget Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name={info.icon} size={24} color={accentColor} />
            <Text style={[styles.name, { color: colors.text }]}>
              {info.name}
            </Text>
          </View>
          <View style={styles.preview}>
            <Text style={[styles.previewText, { color: colors.textSecondary }]}>
              {info.preview}
            </Text>
            {info.subtext && (
              <Text style={[styles.subtextText, { color: colors.text }]}>
                {info.subtext}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleBadge: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  titleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  preview: {
    flex: 1,
    justifyContent: "center",
  },
  previewText: {
    fontSize: 15,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  subtextText: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  resizeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
