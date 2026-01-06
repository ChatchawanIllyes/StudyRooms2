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
}: WidgetTileProps) {
  const { colors, accentColor } = useTheme();
  const { resizeState, setResizeState, getValidAdjacentSizes, resizeWidget } =
    useWidgets();
  const info = getWidgetInfo(type);

  const isInResizeMode = resizeState?.widgetId === widgetId;
  const validSizes = isInResizeMode ? getValidAdjacentSizes(widgetId!) : [];

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

  const handleSizeSelect = (newSize: WidgetSize) => {
    if (!resizeState) return;
    setResizeState({ ...resizeState, previewSize: newSize });
  };

  const handleConfirmResize = () => {
    if (!resizeState?.previewSize || !widgetId) return;
    resizeWidget(widgetId, resizeState.previewSize);
    setResizeState(null);
  };

  const handleCancelResize = () => {
    setResizeState(null);
  };

  const getSizeLabel = (widgetSize: WidgetSize): string => {
    return widgetSize.replace("x", "×");
  };

  return (
    <Animated.View style={[animatedStyle]}>
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

        {/* Resize Mode UI */}
        {isInResizeMode && (
          <>
            <View style={styles.resizeModeOverlay}>
              <View
                style={[
                  styles.sizeOptionsContainer,
                  { backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.sizeOptionsTitle, { color: colors.text }]}>
                  Resize to:
                </Text>
                <View style={styles.sizeOptions}>
                  {validSizes.map((validSize) => (
                    <TouchableOpacity
                      key={validSize}
                      style={[
                        styles.sizeOption,
                        {
                          backgroundColor:
                            resizeState?.previewSize === validSize
                              ? accentColor
                              : colors.background,
                          borderColor:
                            resizeState?.previewSize === validSize
                              ? accentColor
                              : colors.border,
                        },
                      ]}
                      onPress={() => handleSizeSelect(validSize)}
                    >
                      <Text
                        style={[
                          styles.sizeOptionText,
                          {
                            color:
                              resizeState?.previewSize === validSize
                                ? "#ffffff"
                                : colors.text,
                          },
                        ]}
                      >
                        {getSizeLabel(validSize)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.resizeActions}>
                  <TouchableOpacity
                    style={[
                      styles.resizeActionButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={handleCancelResize}
                  >
                    <Text
                      style={[styles.resizeActionText, { color: colors.text }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.resizeActionButton,
                      {
                        backgroundColor: resizeState?.previewSize
                          ? accentColor
                          : colors.border,
                      },
                    ]}
                    onPress={handleConfirmResize}
                    disabled={!resizeState?.previewSize}
                  >
                    <Text
                      style={[
                        styles.resizeActionText,
                        {
                          color: resizeState?.previewSize
                            ? "#ffffff"
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
  resizeModeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    padding: 16,
  },
  sizeOptionsContainer: {
    borderRadius: 12,
    padding: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  sizeOptionsTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  sizeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  sizeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 50,
    alignItems: "center",
  },
  sizeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  resizeActions: {
    flexDirection: "row",
    gap: 8,
  },
  resizeActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  resizeActionText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
