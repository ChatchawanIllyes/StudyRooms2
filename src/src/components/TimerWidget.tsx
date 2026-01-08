import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
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
import * as StorageService from "../services/storage";
import { Subject } from "../types";

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
  const {
    elapsedMs,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stopAndSave,
    currentSubject,
    showSubjectModal,
    setShowSubjectModal,
    startWithSubject,
    changeSubject,
  } = useStudyTimer();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showChangeSubjectModal, setShowChangeSubjectModal] = useState(false);

  // Load subjects
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const loadedSubjects = await StorageService.getSubjects();
    setSubjects(loadedSubjects);
  };

  const handleSubjectSelect = (subject: Subject) => {
    startWithSubject(subject);
  };

  const handleChangeSubject = async (subject: Subject) => {
    await changeSubject(subject);
    setShowChangeSubjectModal(false);
  };

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

  const handlePrimaryControl = async () => {
    if (isEditMode || isPreview) return;

    if (!isRunning && !isPaused && elapsedMs === 0) {
      // Starting fresh - show subject modal
      start();
    } else {
      // Running or paused - stop and save
      await stopAndSave();
    }
  };

  const handleTilePress = () => {
    if (!isEditMode && !isPreview) {
      onNavigateToTimer();
    }
  };

  const getPrimaryControlLabel = () => {
    if (!isRunning && !isPaused && elapsedMs === 0) return "Study";
    return "Stop";
  };

  const getPrimaryControlIcon = () => {
    if (!isRunning && !isPaused && elapsedMs === 0) return "play";
    return "stop";
  };

  return (
    <>
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
              flex: is2x2 ? 6 : is1x1 ? 2.5 : size === "2x1" ? 2 : 5,
              justifyContent: is1x1 || size === "2x1" ? "flex-start" : "center",
              paddingTop: size === "2x1" ? 4 : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.timeText,
              {
                color: colors.text,
                fontSize: is2x2
                  ? 48
                  : size === "1x2"
                  ? 32
                  : size === "2x1"
                  ? 20
                  : 28,
                letterSpacing: is2x2 ? 3 : 2,
                marginBottom: size === "2x1" ? 16 : 0,
                lineHeight: size === "2x1" ? 20 : undefined,
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
          <View
            style={[
              styles.beadsContainer,
              {
                marginBottom: is2x2 ? 8 : size === "1x2" ? 6 : 4,
              },
            ]}
          >
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

          {/* Status text above controls for 1x1 and 2x1 */}
          {(is1x1 || size === "2x1") && (
            <Text
              style={[
                styles.statusTextAboveButtons,
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

          {/* Controls */}
          <View
            style={[
              styles.controlsRow,
              {
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: isEditMode
                    ? `${accentColor}20`
                    : accentColor,
                  opacity: isEditMode ? 0.4 : 1,
                  paddingHorizontal: is1x1 || size === "1x2" ? 12 : 16,
                },
              ]}
              onPress={handlePrimaryControl}
              disabled={isEditMode}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.controlButtonText,
                  {
                    fontSize: is2x2 ? 14 : is1x1 || size === "1x2" ? 12 : 12,
                  },
                ]}
              >
                {getPrimaryControlLabel()}
              </Text>
            </TouchableOpacity>

            {/* Change Subject Button - Show when timer is running/paused */}
            {!isPreview && (isRunning || isPaused) && currentSubject && (
              <TouchableOpacity
                style={[
                  styles.changeSubjectButton,
                  {
                    backgroundColor: `${accentColor}15`,
                    borderColor: accentColor,
                    paddingHorizontal: is1x1 || size === "1x2" ? 10 : 14,
                    borderRadius: is1x1 || size === "1x2" ? 10 : 20,
                  },
                ]}
                onPress={() => setShowChangeSubjectModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={currentSubject.icon}
                  size={is1x1 || size === "1x2" ? 16 : 16}
                  color={accentColor}
                />
                {(size === "2x2" || size === "2x1") && (
                  <>
                    <Text
                      style={[styles.changeSubjectText, { color: accentColor }]}
                      numberOfLines={1}
                    >
                      {currentSubject.name}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={accentColor}
                    />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Subject Selection Modal - First Start */}
      {!isPreview && showSubjectModal && (
        <Modal
          visible={showSubjectModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            // Use default subject if closed without selection
            const defaultSubject =
              subjects.find((s) => s.id === "general") || subjects[0];
            if (defaultSubject) {
              handleSubjectSelect(defaultSubject);
            }
          }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              // Use default subject if tapped outside
              const defaultSubject =
                subjects.find((s) => s.id === "general") || subjects[0];
              if (defaultSubject) {
                handleSubjectSelect(defaultSubject);
              }
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.modalContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  const defaultSubject =
                    subjects.find((s) => s.id === "general") || subjects[0];
                  if (defaultSubject) {
                    handleSubjectSelect(defaultSubject);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.modalTitle, { color: colors.text }]}>
                What are you studying?
              </Text>
              <Text
                style={[styles.modalSubtitle, { color: colors.textSecondary }]}
              >
                Select a subject to track your study time
              </Text>

              <ScrollView
                style={styles.subjectsList}
                showsVerticalScrollIndicator={false}
              >
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectOption,
                      { backgroundColor: `${subject.color}10` },
                    ]}
                    onPress={() => handleSubjectSelect(subject)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.subjectIconContainer,
                        { backgroundColor: subject.color },
                      ]}
                    >
                      <Ionicons name={subject.icon} size={20} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.subjectText, { color: colors.text }]}>
                      {subject.name}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.skipButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  const defaultSubject =
                    subjects.find((s) => s.id === "general") || subjects[0];
                  if (defaultSubject) {
                    handleSubjectSelect(defaultSubject);
                  }
                }}
              >
                <Text style={[styles.skipButtonText, { color: colors.text }]}>
                  Skip (General Study)
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Change Subject Modal */}
      {!isPreview && showChangeSubjectModal && (
        <Modal
          visible={showChangeSubjectModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowChangeSubjectModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowChangeSubjectModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.modalContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowChangeSubjectModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Change Subject
              </Text>
              <Text
                style={[styles.modalSubtitle, { color: colors.textSecondary }]}
              >
                Previous study time will be saved
              </Text>

              <ScrollView
                style={styles.subjectsList}
                showsVerticalScrollIndicator={false}
              >
                {subjects
                  .filter((s) => s.id !== currentSubject?.id)
                  .map((subject) => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectOption,
                        { backgroundColor: `${subject.color}10` },
                      ]}
                      onPress={() => handleChangeSubject(subject)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.subjectIconContainer,
                          { backgroundColor: subject.color },
                        ]}
                      >
                        <Ionicons
                          name={subject.icon}
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text
                        style={[styles.subjectText, { color: colors.text }]}
                      >
                        {subject.name}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.skipButton, { backgroundColor: colors.border }]}
                onPress={() => setShowChangeSubjectModal(false)}
              >
                <Text style={[styles.skipButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </>
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
    marginTop: 4,
    marginBottom: 6,
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
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  controlButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  controlButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  changeSubjectButton: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  changeSubjectText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  subjectsList: {
    maxHeight: 400,
  },
  subjectOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  subjectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  skipButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
