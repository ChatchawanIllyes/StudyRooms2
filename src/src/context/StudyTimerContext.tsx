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
import { StudySession, Subject } from "../types";

interface StudyTimerState {
  isRunning: boolean;
  isPaused: boolean;
  segmentStartedAt: number | null; // timestamp when current segment began
  accumulatedMs: number; // total elapsed from previous segments
  elapsedMs: number; // current total elapsed (computed)
  sessionStartedAt: number | null; // timestamp when the entire session started
  currentSubject: Subject | null; // current study subject
  showSubjectModal: boolean; // show subject selection modal
}

interface StudyTimerContextType extends StudyTimerState {
  start: () => void;
  pause: () => Promise<void>;
  resume: () => void;
  reset: () => void;
  stopAndSave: () => Promise<void>;
  startWithSubject: (subject: Subject) => void;
  changeSubject: (subject: Subject) => Promise<void>;
  setShowSubjectModal: (show: boolean) => void;
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
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Load persisted state on mount
  useEffect(() => {
    loadState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    saveState();
  }, [
    isRunning,
    isPaused,
    segmentStartedAt,
    accumulatedMs,
    sessionStartedAt,
    currentSubject,
  ]);

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
        currentSubject,
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

        // Restore subject if it exists
        if (state.currentSubject) {
          setCurrentSubject(state.currentSubject);
        }

        // Restore session start time
        if (state.sessionStartedAt) {
          setSessionStartedAt(state.sessionStartedAt);
        }

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
      // Show subject modal first
      setShowSubjectModal(true);
    }
  };

  const startWithSubject = (subject: Subject) => {
    if (!isRunning && !isPaused) {
      const now = Date.now();
      setCurrentSubject(subject);
      setSegmentStartedAt(now);
      setSessionStartedAt(now);
      setIsRunning(true);
      setIsPaused(false);
      setAccumulatedMs(0);
      setShowSubjectModal(false);
    }
  };

  const pause = async () => {
    if (isRunning && segmentStartedAt !== null) {
      const now = Date.now();
      const segmentElapsed = now - segmentStartedAt;
      const newAccumulated = accumulatedMs + segmentElapsed;

      // Save partial session
      await savePartialSession(newAccumulated);

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
    setCurrentSubject(null);
  };

  const changeSubject = async (newSubject: Subject) => {
    // Save current session with old subject
    if (currentSubject && (isRunning || isPaused)) {
      let finalElapsed = accumulatedMs;
      if (isRunning && segmentStartedAt !== null) {
        const now = Date.now();
        const segmentElapsed = now - segmentStartedAt;
        finalElapsed = accumulatedMs + segmentElapsed;
      }

      if (finalElapsed > 0) {
        await savePartialSession(finalElapsed);
      }
    }

    // Start new session with new subject
    const now = Date.now();
    setCurrentSubject(newSubject);
    setSessionStartedAt(now);
    setAccumulatedMs(0);

    if (isRunning) {
      setSegmentStartedAt(now);
    } else if (isPaused) {
      setSegmentStartedAt(null);
    }
  };

  const savePartialSession = async (durationMs: number) => {
    if (!currentSubject || durationMs === 0) return;

    const endTime = Date.now();
    const startTime = sessionStartedAt || endTime - durationMs;

    const session: StudySession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subject: currentSubject.name,
      subjectId: currentSubject.id,
      duration: Math.floor(durationMs / 1000), // in seconds
      date: new Date(startTime).toISOString(),
      pauseCount: isPaused ? 1 : 0,
    };

    try {
      await StorageService.addSession(session);
    } catch (error) {
      console.error("Failed to save study session:", error);
    }
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

    // Save final session
    await savePartialSession(finalElapsed);

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
        currentSubject,
        showSubjectModal,
        start,
        pause,
        resume,
        reset,
        stopAndSave,
        startWithSubject,
        changeSubject,
        setShowSubjectModal,
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
