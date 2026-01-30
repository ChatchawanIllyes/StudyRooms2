import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
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

export default function TimerWidget({
  size,
  isEditMode,
  onNavigateToTimer,
  isPreview = false,
}: TimerWidgetProps) {
  const { colors, accentColor, isDark } = useTheme();
  const {
    elapsedMs,
    isRunning,
    isPaused,
    start,
    stopAndSave,
    currentSubject,
    showSubjectModal,
    startWithSubject,
    changeSubject,
  } = useStudyTimer();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showChangeSubjectModal, setShowChangeSubjectModal] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const loadedSubjects = await StorageService.getSubjects();
    setSubjects(loadedSubjects);
  };

  const handleSubjectSelect = async (subject: Subject) => {
    await startWithSubject(subject);
  };

  const handleChangeSubject = async (subject: Subject) => {
    await changeSubject(subject);
    setShowChangeSubjectModal(false);
  };

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
  const is1x1 = size === "1x1";
  const is2x1 = size === "2x1";
  const is1x2 = size === "1x2";
  const is2x2 = size === "2x2";

  const displayElapsedMs = isPreview ? 0 : elapsedMs;
  const displayIsRunning = isPreview ? false : isRunning;
  const displayIsPaused = isPreview ? false : isPaused;

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
      start();
    } else {
      await stopAndSave();
    }
  };

  const handleTilePress = () => {
    if (!isEditMode && !isPreview) {
      onNavigateToTimer();
    }
  };

  const getStatusInfo = () => {
    if (displayIsRunning) return { text: "Studying", color: accentColor };
    if (displayIsPaused) return { text: "Paused", color: "#FF9500" };
    return { text: "Ready", color: colors.textSecondary };
  };

  const statusInfo = getStatusInfo();

  // Simplified balanced layout for all sizes
  const renderSimplifiedContent = () => {
    if (is1x1) {
      // 1x1: New simple layout - Timer at top, status bar, buttons at bottom
      return (
        <View style={styles.grid1x1New}>
          {/* Timer Display - Large at top */}
          <TouchableOpacity
            style={styles.timerSection}
            onPress={handleTilePress}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <Text style={[styles.timerValue, { color: colors.text }]}>
              {formatTime(displayElapsedMs)}
            </Text>
          </TouchableOpacity>

          {/* Status Bar - Thin in middle */}
          <View style={styles.statusBar}>
            <View
              style={[
                styles.statusDot1x1,
                { backgroundColor: statusInfo.color },
              ]}
            />
            <Text
              style={[styles.statusText, { color: statusInfo.color }]}
              numberOfLines={1}
            >
              {statusInfo.text}
            </Text>
          </View>

          {/* Buttons Row - Study and Subject side by side */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  borderColor: isEditMode ? `${accentColor}40` : accentColor,
                  opacity: isEditMode ? 0.4 : 1,
                },
              ]}
              onPress={handlePrimaryControl}
              disabled={isEditMode || isPreview}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  !isRunning && !isPaused && elapsedMs === 0 ? "play" : "stop"
                }
                size={18}
                color={accentColor}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  borderColor:
                    !isPreview && currentSubject
                      ? isEditMode
                        ? `${currentSubject.color}40`
                        : currentSubject.color
                      : isEditMode
                      ? `${colors.border}40`
                      : colors.border,
                  opacity: isEditMode ? 0.4 : 1,
                },
              ]}
              onPress={() =>
                !isPreview && (isRunning || isPaused) && currentSubject
                  ? setShowChangeSubjectModal(true)
                  : handleTilePress()
              }
              disabled={isEditMode || isPreview}
              activeOpacity={0.7}
            >
              {!isPreview && currentSubject ? (
                <Ionicons
                  name={currentSubject.icon}
                  size={18}
                  color={currentSubject.color}
                />
              ) : (
                <Ionicons name="book-outline" size={18} color={colors.border} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (is2x1) {
      // 2x1: Horizontal row of 4 equal boxes
      return (
        <View style={styles.row2x1}>
          {/* Timer Display */}
          <TouchableOpacity
            style={styles.box2x1}
            onPress={handleTilePress}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={22} color={accentColor} />
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>
              Time
            </Text>
            <Text
              style={[styles.boxValue, { color: colors.text, fontSize: 15 }]}
            >
              {formatTime(displayElapsedMs)}
            </Text>
          </TouchableOpacity>

          {/* Status */}
          <TouchableOpacity
            style={styles.box2x1}
            onPress={handleTilePress}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.statusDotLarge,
                { backgroundColor: statusInfo.color },
              ]}
            />
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>
              Status
            </Text>
            <Text
              style={[
                styles.boxValue,
                { color: statusInfo.color, fontSize: 13 },
              ]}
            >
              {statusInfo.text}
            </Text>
          </TouchableOpacity>

          {/* Subject */}
          <TouchableOpacity
            style={styles.box2x1}
            onPress={() =>
              !isPreview && (isRunning || isPaused) && currentSubject
                ? setShowChangeSubjectModal(true)
                : handleTilePress()
            }
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            {!isPreview && currentSubject ? (
              <Ionicons
                name={currentSubject.icon}
                size={22}
                color={currentSubject.color}
              />
            ) : (
              <Ionicons name="book-outline" size={22} color={colors.border} />
            )}
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>
              Subject
            </Text>
            <Text
              style={[
                styles.boxValue,
                {
                  color:
                    !isPreview && currentSubject
                      ? currentSubject.color
                      : colors.textSecondary,
                  fontSize: 11,
                },
              ]}
              numberOfLines={1}
            >
              {!isPreview && currentSubject ? currentSubject.name : "None"}
            </Text>
          </TouchableOpacity>

          {/* Study Button */}
          <TouchableOpacity
            style={[
              styles.box2x1,
              styles.outlinedButton,
              {
                borderColor: isEditMode ? `${accentColor}40` : accentColor,
                opacity: isEditMode ? 0.4 : 1,
              },
            ]}
            onPress={handlePrimaryControl}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                !isRunning && !isPaused && elapsedMs === 0
                  ? "play-circle"
                  : "stop-circle"
              }
              size={32}
              color={accentColor}
            />
          </TouchableOpacity>
        </View>
      );
    }

    if (is1x2) {
      // 1x2: Vertical stack of 4 equal boxes
      return (
        <View style={styles.column1x2}>
          {/* Timer Display */}
          <TouchableOpacity
            style={styles.box1x2}
            onPress={handleTilePress}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={24} color={accentColor} />
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>
              Time
            </Text>
            <Text
              style={[styles.boxValue, { color: colors.text, fontSize: 18 }]}
            >
              {formatTime(displayElapsedMs)}
            </Text>
          </TouchableOpacity>

          {/* Status */}
          <TouchableOpacity
            style={styles.box1x2}
            onPress={handleTilePress}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.statusDotLarge,
                { backgroundColor: statusInfo.color },
              ]}
            />
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>
              Status
            </Text>
            <Text style={[styles.boxValue, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </TouchableOpacity>

          {/* Subject */}
          <TouchableOpacity
            style={styles.box1x2}
            onPress={() =>
              !isPreview && (isRunning || isPaused) && currentSubject
                ? setShowChangeSubjectModal(true)
                : handleTilePress()
            }
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            {!isPreview && currentSubject ? (
              <Ionicons
                name={currentSubject.icon}
                size={24}
                color={currentSubject.color}
              />
            ) : (
              <Ionicons name="book-outline" size={24} color={colors.border} />
            )}
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>
              Subject
            </Text>
            <Text
              style={[
                styles.boxValue,
                {
                  color:
                    !isPreview && currentSubject
                      ? currentSubject.color
                      : colors.textSecondary,
                  fontSize: 12,
                },
              ]}
              numberOfLines={1}
            >
              {!isPreview && currentSubject ? currentSubject.name : "None"}
            </Text>
          </TouchableOpacity>

          {/* Study Button */}
          <TouchableOpacity
            style={[
              styles.box1x2,
              styles.outlinedButton,
              {
                borderColor: isEditMode ? `${accentColor}40` : accentColor,
                opacity: isEditMode ? 0.4 : 1,
              },
            ]}
            onPress={handlePrimaryControl}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                !isRunning && !isPaused && elapsedMs === 0
                  ? "play-circle"
                  : "stop-circle"
              }
              size={36}
              color={accentColor}
            />
          </TouchableOpacity>
        </View>
      );
    }

    // 2x2: Proper 2x2 grid using nested flex rows (like 1x2 but with 2 columns)
    return (
      <View style={styles.grid2x2}>
        {/* Top Row */}
        <View style={styles.row2x2}>
          {/* Timer Display */}
          <TouchableOpacity
            style={styles.box2x2}
            onPress={handleTilePress}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={28} color={accentColor} />
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>
              Time
            </Text>
            <Text style={[styles.boxValue2x2, { color: colors.text }]}>
              {formatTime(displayElapsedMs)}
            </Text>
          </TouchableOpacity>

          {/* Status */}
          <TouchableOpacity
            style={styles.box2x2}
            onPress={handleTilePress}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.statusDotLarge,
                { backgroundColor: statusInfo.color, width: 10, height: 10 },
              ]}
            />
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>
              Status
            </Text>
            <Text style={[styles.boxValue2x2, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Row */}
        <View style={styles.row2x2}>
          {/* Subject */}
          <TouchableOpacity
            style={styles.box2x2}
            onPress={() =>
              !isPreview && (isRunning || isPaused) && currentSubject
                ? setShowChangeSubjectModal(true)
                : handleTilePress()
            }
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            {!isPreview && currentSubject ? (
              <Ionicons
                name={currentSubject.icon}
                size={28}
                color={currentSubject.color}
              />
            ) : (
              <Ionicons name="book-outline" size={28} color={colors.border} />
            )}
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>
              Subject
            </Text>
            <Text
              style={[
                styles.boxValue2x2,
                {
                  color:
                    !isPreview && currentSubject
                      ? currentSubject.color
                      : colors.textSecondary,
                  fontSize: 13,
                },
              ]}
              numberOfLines={1}
            >
              {!isPreview && currentSubject ? currentSubject.name : "None"}
            </Text>
          </TouchableOpacity>

          {/* Study Button */}
          <TouchableOpacity
            style={[
              styles.box2x2,
              styles.outlinedButton,
              {
                borderColor: isEditMode ? `${accentColor}40` : accentColor,
                opacity: isEditMode ? 0.4 : 1,
              },
            ]}
            onPress={handlePrimaryControl}
            disabled={isEditMode || isPreview}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                !isRunning && !isPaused && elapsedMs === 0
                  ? "play-circle"
                  : "stop-circle"
              }
              size={40}
              color={accentColor}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: colors.background,
            borderColor: colors.border,
            overflow: isPreview ? "visible" : "hidden",
          },
        ]}
      >
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

        {renderSimplifiedContent()}
      </View>

      {/* Subject Selection Modal - First Start */}
      {!isPreview && showSubjectModal && (
        <Modal
          visible={showSubjectModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
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

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
    justifyContent: "flex-start",
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

  // Outlined button style
  outlinedButton: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },

  // New 1x1 Layout - Simple stacked design
  grid1x1New: {
    flex: 1,
    justifyContent: "space-between",
    gap: 8,
  },
  timerSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  timerValue: {
    fontSize: 28,
    fontWeight: "400",
    letterSpacing: -1,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 44,
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusDot1x1: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Old 1x1 Grid (keeping for compatibility, but not used)
  grid1x1: {
    flex: 1,
    gap: 8,
  },
  gridItem1x1: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 0,
  },
  gridLabel1x1: {
    fontSize: 8,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  gridValue1x1: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // 2x1 Row layout
  row2x1: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  box2x1: {
    flex: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 0,
  },

  // 1x2 Column layout
  column1x2: {
    flex: 1,
    gap: 12,
  },
  box1x2: {
    flex: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  // 2x2 Grid layout - proper 2x2 using nested flex
  grid2x2: {
    flex: 1,
    gap: 12,
  },
  box2x2: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 0,
  },
  row2x2: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  boxValue2x2: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  // Shared box styles
  boxLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  boxValue: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statusDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Modal Styles
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
