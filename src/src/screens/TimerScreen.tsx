import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";

type TimerMode = "focus" | "break";
type TimerState = "idle" | "running" | "paused";

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

  useFocusEffect(
    React.useCallback(() => {
      loadDailyGoal();
      loadBreakDuration();
    }, [])
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === "running") {
      interval = setInterval(() => {
        setSeconds((s) => {
          if (mode === "focus") {
            // Focus mode: count up
            return s + 1;
          } else {
            // Break mode: count down
            if (s <= 1) {
              // Timer finished
              setState("idle");
              return 0;
            }
            return s - 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state, mode]);

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
      setTodayMinutes((prev) => prev + Math.floor(seconds / 60));
    }
    setState("idle");
    if (mode === "break") {
      setSeconds(breakDuration);
    } else {
      setSeconds(0);
    }
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
      </View>
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
    marginBottom: 40,
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
});
