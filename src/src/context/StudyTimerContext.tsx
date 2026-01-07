import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import * as StorageService from "../services/storage";
import { StudySession } from "../types";

interface StudyTimerState {
  isRunning: boolean;
  isPaused: boolean;
  segmentStartedAt: number | null; // timestamp when current segment began
  accumulatedMs: number; // total elapsed from previous segments
  elapsedMs: number; // current total elapsed (computed)
  sessionStartedAt: number | null; // timestamp when the entire session started
}

interface StudyTimerContextType extends StudyTimerState {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stopAndSave: () => Promise<void>;
}

const StudyTimerContext = createContext<StudyTimerContextType | undefined>(
  undefined
);

const STORAGE_KEY = "studyapp_timer_state";

export function StudyTimerProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [segmentStartedAt, setSegmentStartedAt] = useState<number | null>(null);
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Load persisted state on mount
  useEffect(() => {
    loadState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    saveState();
  }, [isRunning, isPaused, segmentStartedAt, accumulatedMs, sessionStartedAt]);

  // Update elapsed time every second when running
  useEffect(() => {
    if (isRunning && segmentStartedAt !== null) {
      // Immediately update
      updateElapsed();

      // Then update every second
      intervalRef.current = setInterval(() => {
        updateElapsed();
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else if (isPaused) {
      // When paused, elapsed = accumulated
      setElapsedMs(accumulatedMs);
    } else {
      // Idle state
      setElapsedMs(0);
    }
  }, [isRunning, isPaused, segmentStartedAt, accumulatedMs]);

  // Handle app backgrounding/foregrounding
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [isRunning, segmentStartedAt, accumulatedMs]);

  const updateElapsed = () => {
    if (segmentStartedAt !== null) {
      const now = Date.now();
      const currentSegmentMs = now - segmentStartedAt;
      setElapsedMs(accumulatedMs + currentSegmentMs);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // App came to foreground - recalculate elapsed if running
      if (isRunning && segmentStartedAt !== null) {
        updateElapsed();
      }
    }
    appState.current = nextAppState;
  };

  const saveState = async () => {
    try {
      const state = {
        isRunning,
        isPaused,
        segmentStartedAt,
        accumulatedMs,
        sessionStartedAt,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save timer state:", error);
    }
  };

  const loadState = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);

        // If was running, recalculate elapsed based on saved timestamp
        if (state.isRunning && state.segmentStartedAt) {
          const now = Date.now();
          const segmentElapsed = now - state.segmentStartedAt;
          const totalAccumulated = state.accumulatedMs + segmentElapsed;

          // Resume with corrected accumulated time
          setAccumulatedMs(totalAccumulated);
          setSegmentStartedAt(now);
          setIsRunning(true);
          setIsPaused(false);
        } else if (state.isPaused) {
          // Was paused, restore accumulated time
          setAccumulatedMs(state.accumulatedMs);
          setIsPaused(true);
          setIsRunning(false);
          setSegmentStartedAt(null);
        } else {
          // Was idle
          setIsRunning(false);
          setIsPaused(false);
          setSegmentStartedAt(null);
          setAccumulatedMs(0);
        }
      }
    } catch (error) {
      console.error("Failed to load timer state:", error);
    }
  };

  const start = () => {
    if (!isRunning && !isPaused) {
      const now = Date.now();
      setSegmentStartedAt(now);
      setSessionStartedAt(now);
      setIsRunning(true);
      setIsPaused(false);
      setAccumulatedMs(0);
    }
  };

  const pause = () => {
    if (isRunning && segmentStartedAt !== null) {
      const now = Date.now();
      const segmentElapsed = now - segmentStartedAt;
      const newAccumulated = accumulatedMs + segmentElapsed;

      setAccumulatedMs(newAccumulated);
      setSegmentStartedAt(null);
      setIsRunning(false);
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (isPaused) {
      setSegmentStartedAt(Date.now());
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setSegmentStartedAt(null);
    setAccumulatedMs(0);
    setElapsedMs(0);
    setSessionStartedAt(null);
  };

  const stopAndSave = async () => {
    // Only save if there's actual elapsed time
    if (elapsedMs === 0) {
      reset();
      return;
    }

    // Calculate final elapsed time
    let finalElapsed = accumulatedMs;
    if (isRunning && segmentStartedAt !== null) {
      const now = Date.now();
      const segmentElapsed = now - segmentStartedAt;
      finalElapsed = accumulatedMs + segmentElapsed;
    }

    // Create session record
    const endTime = Date.now();
    const startTime = sessionStartedAt || endTime - finalElapsed;

    const session: StudySession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime,
      endTime,
      duration: Math.floor(finalElapsed / 1000), // in seconds
      subject: "General Study", // Default subject
      date: new Date(startTime).toISOString().split("T")[0],
      createdAt: Date.now(),
    };

    try {
      // Save to study sessions
      await StorageService.saveStudySession(session);
    } catch (error) {
      console.error("Failed to save study session:", error);
    }

    // Reset everything
    reset();
  };

  return (
    <StudyTimerContext.Provider
      value={{
        isRunning,
        isPaused,
        segmentStartedAt,
        accumulatedMs,
        elapsedMs,
        sessionStartedAt,
        start,
        pause,
        resume,
        reset,
        stopAndSave,
      }}
    >
      {children}
    </StudyTimerContext.Provider>
  );
}

export function useStudyTimer() {
  const context = useContext(StudyTimerContext);
  if (context === undefined) {
    throw new Error("useStudyTimer must be used within a StudyTimerProvider");
  }
  return context;
}
