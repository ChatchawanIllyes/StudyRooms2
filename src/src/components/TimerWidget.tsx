import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useStudyTimer } from "../context/StudyTimerContext";
import { useTheme } from "../context/ThemeContext";
import { WidgetSize } from "../context/WidgetContext";

interface TimerWidgetProps {
  size: WidgetSize;
  isEditMode: boolean;
  onNavigateToTimer: () => void;
  isPreview?: boolean;
}

const SEGMENT_MS = 5 * 60 * 1000; // 5 minutes per bead
const CYCLE_MS = 12 * SEGMENT_MS; // 60 minutes per cycle

export default function TimerWidget({
  size,
  isEditMode,
  onNavigateToTimer,
  isPreview = false,
}: TimerWidgetProps) {
  const { colors, accentColor } = useTheme();
  const { elapsedMs, isRunning, isPaused, start, pause, resume, stopAndSave } =
    useStudyTimer();

  // Calculate widget dimensions based on size
  const getDimensions = () => {
    const { width } = Dimensions.get("window");
    const PADDING = 20;
    const GAP = 16;
    const GRID_WIDTH = width - PADDING * 2;
    const SLOT_SIZE = (GRID_WIDTH - GAP) / 2;

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
  const is2x2 = size === "2x2";
  const is1x1 = size === "1x1";

  // Use default state for preview, otherwise use actual timer state
  const displayElapsedMs = isPreview ? 0 : elapsedMs;
  const displayIsRunning = isPreview ? false : isRunning;
  const displayIsPaused = isPreview ? false : isPaused;

  // Calculate beads state
  const activeDots = Math.floor((displayElapsedMs % CYCLE_MS) / SEGMENT_MS); // 0..11
  const cycleIndex = Math.floor(displayElapsedMs / CYCLE_MS) + 1; // Hour 1, Hour 2, ...

  // Format elapsed time for display
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePrimaryControl = () => {
    if (isEditMode || isPreview) return;

    if (!isRunning && !isPaused && elapsedMs === 0) {
      start();
    } else if (isRunning) {
      pause();
    } else if (isPaused) {
      resume();
    }
  };

  const handleStopAndSave = async () => {
    if (isEditMode || isPreview) return;
    await stopAndSave();
  };

  const handleTilePress = () => {
    if (!isEditMode && !isPreview) {
      onNavigateToTimer();
    }
  };

  const getPrimaryControlLabel = () => {
    if (!isRunning && !isPaused && elapsedMs === 0) return "Start";
    if (isRunning) return "Pause";
    if (isPaused) return "Resume";
    return "Start";
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: "transparent",
        },
      ]}
      activeOpacity={isEditMode ? 1 : 0.9}
      onPress={handleTilePress}
      disabled={isEditMode || isPreview}
    >
      {/* Widget Title */}
      {isPreview && (
        <View
          style={[
            styles.titleContainer,
            {
              backgroundColor: accentColor,
              borderWidth: 2,
              borderColor: colors.background,
            },
          ]}
        >
          <Text style={[styles.widgetTitle, { color: "#FFFFFF" }]}>
            Study Timer
          </Text>
        </View>
      )}

      {/* Top Section: Digital Time Display (60%) */}
      <View
        style={[
          styles.topSection,
          {
            flex: is2x2 ? 6 : is1x1 ? 2.5 : size === "2x1" ? 4 : 5,
            justifyContent: is1x1 ? "flex-start" : "center",
          },
        ]}
      >
        {is2x2 && (
          <Text
            style={[
              styles.studyingLabel,
              { color: colors.textSecondary, opacity: 0.6 },
            ]}
          >
            CURRENTLY STUDYING
          </Text>
        )}
        <Text
          style={[
            styles.timeText,
            {
              color: colors.text,
              fontSize: is2x2 ? 48 : size === "1x2" ? 32 : 28,
              letterSpacing: is2x2 ? 3 : 2,
            },
          ]}
        >
          {formatTime(displayElapsedMs)}
        </Text>
        {!is1x1 && size !== "2x1" && (
          <Text
            style={[
              styles.statusText,
              {
                color: displayIsRunning
                  ? accentColor
                  : displayIsPaused
                  ? colors.textSecondary
                  : colors.textSecondary,
              },
            ]}
          >
            {displayIsRunning
              ? "● Active"
              : displayIsPaused
              ? "◐ Paused"
              : "○ Ready"}
          </Text>
        )}
      </View>

      {/* Bottom Section: Beads Grid (40%) */}
      <View style={[styles.bottomSection, { flex: is2x2 ? 4 : 3 }]}>
        {/* Beads Grid: 2 rows × 6 columns */}
        <View style={styles.beadsContainer}>
          {/* Row 1 (beads 0-5) */}
          <View style={styles.beadsRow}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Bead
                key={`bead-${i}`}
                isActive={i < activeDots}
                size={is2x2 ? 14 : size === "1x2" ? 10 : 8}
                activeColor="#FFFFFF"
                inactiveColor={colors.border}
              />
            ))}
          </View>

          {/* Row 2 (beads 6-11) */}
          <View style={styles.beadsRow}>
            {[6, 7, 8, 9, 10, 11].map((i) => (
              <Bead
                key={`bead-${i}`}
                isActive={i < activeDots}
                size={is2x2 ? 14 : size === "1x2" ? 10 : 8}
                activeColor="#FFFFFF"
                inactiveColor={colors.border}
              />
            ))}
          </View>
        </View>

        {/* Hour Indicator below beads */}
        {elapsedMs > 0 && (
          <Text
            style={[
              styles.hourIndicator,
              { color: colors.textSecondary, opacity: 0.5 },
            ]}
          >
            {is2x2 ? `HOUR ${cycleIndex}` : `×${cycleIndex}`}
          </Text>
        )}

        {/* Status text above controls for 1x1 and 2x1 */}
        {(is1x1 || size === "2x1") && (
          <Text
            style={[
              styles.statusTextAboveButtons,
              {
                color: isRunning
                  ? accentColor
                  : displayIsPaused
                  ? colors.textSecondary
                  : colors.textSecondary,
              },
            ]}
          >
            {displayIsRunning
              ? "● Active"
              : displayIsPaused
              ? "◐ Paused"
              : "○ Ready"}
          </Text>
        )}

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                backgroundColor: isEditMode ? `${accentColor}20` : accentColor,
                opacity: isEditMode ? 0.4 : 1,
                flex: 1,
                paddingVertical: is1x1 || size === "1x2" ? 8 : 10,
                paddingHorizontal: is1x1 || size === "1x2" ? 12 : 16,
              },
            ]}
            onPress={handlePrimaryControl}
            disabled={isEditMode}
            activeOpacity={0.8}
          >
            {is1x1 || size === "1x2" ? (
              <Ionicons
                name={
                  displayIsRunning ? "pause" : displayIsPaused ? "play" : "play"
                }
                size={16}
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={[
                  styles.controlButtonText,
                  { fontSize: is2x2 ? 14 : 12 },
                ]}
              >
                {getPrimaryControlLabel()}
              </Text>
            )}
          </TouchableOpacity>

          {displayElapsedMs > 0 && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: isEditMode
                    ? `${colors.border}20`
                    : colors.border,
                  opacity: isEditMode ? 0.4 : 0.8,
                  flex: 1,
                  marginLeft: 8,
                  paddingVertical: is1x1 || size === "1x2" ? 8 : 10,
                  paddingHorizontal: is1x1 || size === "1x2" ? 12 : 16,
                },
              ]}
              onPress={handleStopAndSave}
              disabled={isEditMode}
              activeOpacity={0.8}
            >
              {is1x1 || size === "1x2" ? (
                <Ionicons name="save-outline" size={15} color={colors.text} />
              ) : (
                <>
                  <Ionicons
                    name="stop"
                    size={is2x2 ? 16 : 14}
                    color={colors.text}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.controlButtonText,
                      { color: colors.text, fontSize: is2x2 ? 14 : 12 },
                    ]}
                  >
                    Save
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Animated Bead Component
interface BeadProps {
  isActive: boolean;
  size: number;
  activeColor: string;
  inactiveColor: string;
}

function Bead({ isActive, size, activeColor, inactiveColor }: BeadProps) {
  const scale = useSharedValue(isActive ? 1 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.3);

  useEffect(() => {
    if (isActive) {
      // Subtle pop animation when becoming active
      scale.value = withSequence(
        withTiming(1.3, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) })
      );
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bead,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isActive ? activeColor : inactiveColor,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  titleContainer: {
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
  widgetTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  topSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  studyingLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  timeText: {
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({
      ios: "Courier New",
      default: "monospace",
    }),
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  bottomSection: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  hourIndicator: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  statusTextAboveButtons: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 10,
  },
  beadsContainer: {
    marginBottom: 8,
    gap: 8,
  },
  beadsRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  bead: {
    // Dynamic styles applied in component
  },
  controlsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  controlButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
