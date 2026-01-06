import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  AppState,
  AppStateStatus,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import * as StorageService from "../services/storage";
import { StudySession } from "../types";

type TimerMode = "focus" | "break";
type TimerState = "idle" | "running" | "paused";

interface Subject {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "math", name: "Math", icon: "calculator", color: "#5b9bd5" },
  { id: "science", name: "Science", icon: "flask", color: "#34c759" },
  { id: "english", name: "English", icon: "book", color: "#ff9500" },
  { id: "history", name: "History", icon: "time", color: "#af52de" },
  {
    id: "programming",
    name: "Programming",
    icon: "code-slash",
    color: "#5ac8fa",
  },
  { id: "art", name: "Art", icon: "color-palette", color: "#ff2d55" },
  { id: "music", name: "Music", icon: "musical-notes", color: "#ff3b30" },
  { id: "language", name: "Language", icon: "language", color: "#5856d6" },
  { id: "business", name: "Business", icon: "briefcase", color: "#ffcc00" },
  { id: "engineering", name: "Engineering", icon: "build", color: "#007aff" },
  { id: "medicine", name: "Medicine", icon: "medical", color: "#ff3b30" },
  { id: "law", name: "Law", icon: "hammer", color: "#8e8e93" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal", color: "#8e8e93" },
];

interface TimerScreenProps {
  navigation?: any;
}

export default function TimerScreen({ navigation }: TimerScreenProps) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<TimerMode>("focus");
  const [state, setState] = useState<TimerState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(68);
  const [dailyGoal, setDailyGoal] = useState(120);
  const [breakDuration, setBreakDuration] = useState(5 * 60); // Default: 5 minutes
  const [modeAnimation] = useState(new Animated.Value(0));
  const [selectedSubject, setSelectedSubject] = useState<Subject>(
    DEFAULT_SUBJECTS[0]
  );
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [focusDurations] = useState([15, 25, 45, 60, 90]); // minutes
  const [selectedDuration, setSelectedDuration] = useState(25); // default 25 min
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const [appStateValue, setAppStateValue] = useState<AppStateStatus>('active');
  const backgroundTimeRef = useRef<number>(0);
  const notificationIdRef = useRef<string | null>(null);

  const loadDailyGoal = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem("dailyStudyGoal");
      if (savedGoal) {
        setDailyGoal(parseInt(savedGoal));
      }
    } catch (error) {
      console.error("Error loading daily goal:", error);
    }
  };

  const loadBreakDuration = async () => {
    try {
      const savedBreak = await AsyncStorage.getItem("breakDuration");
      if (savedBreak) {
        setBreakDuration(parseInt(savedBreak) * 60); // Convert minutes to seconds
      }
    } catch (error) {
      console.error("Error loading break duration:", error);
    }
  };

  const playCompletionSound = async () => {
    try {
      const settings = await StorageService.getUserSettings();
      if (!settings.soundEnabled) return;

      // Audio functionality removed - expo-av deprecated
      // TODO: Implement with expo-audio when needed
      console.log('Timer completed!');
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadDailyGoal();
      loadBreakDuration();
      loadRecentSessions();
    }, [])
  );

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }
  };

  const loadRecentSessions = async () => {
    try {
      const sessions = await AsyncStorage.getItem("studySessions");
      if (sessions) {
        const allSessions: StudySession[] = JSON.parse(sessions);
        // Get last 5 sessions
        setRecentSessions(allSessions.slice(-5).reverse());
      }
    } catch (error) {
      console.error("Error loading recent sessions:", error);
    }
  };

  // Background timer support
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [state, mode, seconds]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateValue.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // App has come to foreground
      if (state === "running" && backgroundTimeRef.current > 0) {
        const elapsedSeconds = Math.floor(
          (Date.now() - backgroundTimeRef.current) / 1000
        );

        setSeconds((prev) => {
          if (mode === "focus") {
            return prev + elapsedSeconds;
          } else {
            // Break mode: count down
            const newTime = prev - elapsedSeconds;
            if (newTime <= 0) {
              setState("idle");
              return 0;
            }
            return newTime;
          }
        });
        backgroundTimeRef.current = 0;
      }
    } else if (
      appStateValue === "active" &&
      nextAppState.match(/inactive|background/)
    ) {
      // App has gone to background
      if (state === "running") {
        backgroundTimeRef.current = Date.now();
      }
    }

    setAppStateValue(nextAppState);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === "running") {
      interval = setInterval(() => {
        setSeconds((s) => {
          if (mode === "focus") {
            // Focus mode: count up
            const newTime = s + 1;
            // Check if focus session is complete
            if (newTime >= selectedDuration * 60) {
              setState("idle");
              playCompletionSound();
              handleStop();
              return newTime;
            }
            return newTime;
          } else {
            // Break mode: count down
            if (s <= 1) {
              // Timer finished
              setState("idle");
              playCompletionSound();
              return 0;
            }
            return s - 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state, mode, selectedDuration]);

  useEffect(() => {
    Animated.spring(modeAnimation, {
      toValue: mode === "focus" ? 0 : 1,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();

    // Reset timer when switching modes
    setState("idle");
    if (mode === "break") {
      setSeconds(breakDuration);
    } else {
      setSeconds(0);
    }
  }, [mode]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const handlePrimaryAction = () => {
    if (state === "idle") {
      setState("running");
    } else if (state === "running") {
      setState("paused");
    } else if (state === "paused") {
      setState("running");
    }
  };

  const handleStop = () => {
    // Only add to study time if in Focus mode
    if (seconds > 0 && mode === "focus") {
      const minutesStudied = Math.floor(seconds / 60);
      setTodayMinutes((prev) => prev + minutesStudied);

      // Save study session with subject
      saveStudySession(selectedSubject.id, seconds);
    }
    setState("idle");
    if (mode === "break") {
      setSeconds(breakDuration);
    } else {
      setSeconds(0);
    }
  };

  const saveStudySession = async (subjectId: string, duration: number) => {
    try {
      const session: StudySession = {
        subject: subjectId,
        duration: duration,
        date: new Date().toISOString(),
      };

      // Use storage service to add session
      await StorageService.addSession(session);

      // Reload recent sessions
      loadRecentSessions();
    } catch (error) {
      console.error("Error saving study session:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSubjectByIdName = (id: string) => {
    return DEFAULT_SUBJECTS.find((s) => s.id === id) || DEFAULT_SUBJECTS[0];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const progress = Math.min((todayMinutes / dailyGoal) * 100, 100);

  const getButtonText = () => {
    if (state === "idle") return "Start";
    if (state === "running") return "Pause";
    return "Resume";
  };

  const getButtonColor = () => {
    if (mode === "break") {
      // Break mode uses green/teal colors
      if (state === "idle") return "#34c759";
      if (state === "running") return "#ff9500";
      return "#34c759";
    } else {
      // Focus mode uses accent/standard colors
      if (state === "idle") return colors.accent;
      if (state === "running") return "#ff9500";
      return "#34c759";
    }
  };

  const getButtonIcon = () => {
    if (state === "running") return "pause";
    return "play";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Mode Selector */}
        <View style={[styles.modeSelector, { backgroundColor: colors.card }]}>
          <Animated.View
            style={[
              styles.modeSelectorIndicator,
              { backgroundColor: colors.background },
              {
                left: modeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["2%", "50%"],
                }),
                right: modeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["50%", "2%"],
                }),
              },
            ]}
          />
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => setMode("focus")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeText,
                {
                  color: mode === "focus" ? colors.text : colors.textSecondary,
                },
              ]}
            >
              Focus
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => setMode("break")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeText,
                {
                  color: mode === "break" ? colors.text : colors.textSecondary,
                },
              ]}
            >
              Break
            </Text>
          </TouchableOpacity>
        </View>

        {/* Focus Duration Selector (Only in Focus mode) */}
        {mode === "focus" && (
          <TouchableOpacity
            style={[styles.durationButton, { backgroundColor: colors.card }]}
            onPress={() => setShowDurationPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={[styles.durationText, { color: colors.text }]}>
              {selectedDuration} minutes
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <Text
            style={[
              styles.timerText,
              { color: mode === "break" ? "#34c759" : colors.text },
            ]}
          >
            {formatTime(seconds)}
          </Text>
          {mode === "break" && state === "idle" && (
            <Text style={[styles.breakHint, { color: colors.textSecondary }]}>
              Take a {Math.floor(breakDuration / 60)} minute break
            </Text>
          )}
          {mode === "focus" && state === "idle" && (
            <Text style={[styles.breakHint, { color: colors.textSecondary }]}>
              Ready to focus
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: getButtonColor() },
            ]}
            onPress={handlePrimaryAction}
            activeOpacity={0.8}
          >
            <Ionicons name={getButtonIcon()} size={24} color="white" />
            <Text style={styles.primaryButtonText}>{getButtonText()}</Text>
          </TouchableOpacity>
          {state !== "idle" && (
            <TouchableOpacity
              style={[
                styles.stopButton,
                { backgroundColor: colors.destructive },
              ]}
              onPress={handleStop}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Subject Selector (Only in Focus mode) */}
        {mode === "focus" && (
          <View style={styles.subjectContainer}>
            <Text
              style={[styles.subjectLabel, { color: colors.textSecondary }]}
            >
              Subject
            </Text>
            <TouchableOpacity
              style={[styles.subjectSelector, { backgroundColor: colors.card }]}
              onPress={() => setShowSubjectPicker(true)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.subjectIconContainer,
                  { backgroundColor: selectedSubject.color },
                ]}
              >
                <Ionicons name={selectedSubject.icon} size={20} color="white" />
              </View>
              <Text style={[styles.subjectText, { color: colors.text }]}>
                {selectedSubject.name}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Progress */}
        {mode === "focus" && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                {todayMinutes} min studied today
              </Text>
              <Text
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                Goal: {dailyGoal} min
              </Text>
            </View>
            <View
              style={[styles.progressBar, { backgroundColor: colors.card }]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: colors.accent },
                ]}
              />
            </View>
          </View>
        )}

        {/* Recent Sessions */}
        {mode === "focus" && recentSessions.length > 0 && (
          <View style={styles.historyContainer}>
            <TouchableOpacity
              style={styles.historyHeader}
              onPress={() => setShowHistory(!showHistory)}
              activeOpacity={0.7}
            >
              <Text style={[styles.historyTitle, { color: colors.text }]}>
                Recent Sessions
              </Text>
              <Ionicons
                name={showHistory ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showHistory && (
              <View style={styles.sessionsList}>
                {recentSessions.map((session, index) => {
                  const subject = getSubjectByIdName(session.subject);
                  const date = new Date(session.date);
                  const timeAgo = formatTimeAgo(date);

                  return (
                    <View
                      key={index}
                      style={[
                        styles.sessionItem,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <View
                        style={[
                          styles.sessionIconSmall,
                          { backgroundColor: subject.color },
                        ]}
                      >
                        <Ionicons name={subject.icon} size={16} color="white" />
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text
                          style={[
                            styles.sessionSubject,
                            { color: colors.text },
                          ]}
                        >
                          {subject.name}
                        </Text>
                        <Text
                          style={[
                            styles.sessionTime,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {timeAgo}
                        </Text>
                      </View>
                      <Text
                        style={[styles.sessionDuration, { color: colors.text }]}
                      >
                        {formatDuration(session.duration)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Duration Picker Modal */}
      <Modal
        visible={showDurationPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDurationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Focus Duration
              </Text>
              <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.durationOptions}>
              {focusDurations.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationOption,
                    { backgroundColor: colors.background },
                    selectedDuration === duration && {
                      backgroundColor: colors.accent + "20",
                      borderColor: colors.accent,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedDuration(duration);
                    setShowDurationPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="timer-outline"
                    size={32}
                    color={
                      selectedDuration === duration
                        ? colors.accent
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.durationOptionText,
                      {
                        color:
                          selectedDuration === duration
                            ? colors.accent
                            : colors.text,
                      },
                    ]}
                  >
                    {duration}
                  </Text>
                  <Text
                    style={[
                      styles.durationOptionLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    minutes
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Subject Picker Modal */}
      <Modal
        visible={showSubjectPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Subject
              </Text>
              <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.subjectList}>
              {DEFAULT_SUBJECTS.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectOption,
                    { backgroundColor: colors.background },
                    selectedSubject.id === subject.id && {
                      backgroundColor: subject.color + "20",
                      borderColor: subject.color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedSubject(subject);
                    setShowSubjectPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.subjectOptionLeft}>
                    <View
                      style={[
                        styles.subjectIconContainer,
                        { backgroundColor: subject.color },
                      ]}
                    >
                      <Ionicons name={subject.icon} size={24} color="white" />
                    </View>
                    <Text
                      style={[styles.subjectOptionText, { color: colors.text }]}
                    >
                      {subject.name}
                    </Text>
                  </View>
                  {selectedSubject.id === subject.id && (
                    <Ionicons
                      name="checkmark"
                      size={24}
                      color={subject.color}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: "center",
  },
  modeSelector: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 25,
    padding: 4,
    flexDirection: "row",
    position: "relative",
  },
  modeSelectorIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 21,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  durationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "600",
  },
  durationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  durationOption: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  durationOptionText: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  durationOptionLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  timerContainer: {
    marginTop: 80,
    marginBottom: 80,
    alignItems: "center",
  },
  timerText: {
    fontSize: 72,
    fontWeight: "200",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  breakHint: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    maxWidth: 400,
    marginBottom: 24,
  },
  subjectContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 32,
  },
  subjectLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subjectSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  stopButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  progressContainer: {
    width: "100%",
    maxWidth: 400,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  historyContainer: {
    width: "100%",
    maxWidth: 400,
    marginTop: 24,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  sessionsList: {
    gap: 8,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  sessionIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionSubject: {
    fontSize: 15,
    fontWeight: "600",
  },
  sessionTime: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  subjectList: {
    paddingHorizontal: 24,
  },
  subjectOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  subjectOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subjectIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectOptionText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
