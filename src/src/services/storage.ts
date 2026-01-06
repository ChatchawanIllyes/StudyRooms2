// Data Service Layer - Easy to swap AsyncStorage for Supabase
// All data operations go through this service
// To migrate to Supabase: Replace AsyncStorage calls with Supabase client calls

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Task,
  StudySession,
  DailyStats,
  UserSettings,
  Subject,
} from "../types";

const KEYS = {
  TASKS: "@study_app/tasks",
  SESSIONS: "@study_app/sessions",
  DAILY_STATS: "@study_app/daily_stats",
  USER_SETTINGS: "@study_app/settings",
  SUBJECTS: "@study_app/subjects",
};

// ============ TASKS ============
export const getTasks = async (): Promise<Task[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading tasks:", error);
    return [];
  }
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
};

export const addTask = async (task: Task): Promise<void> => {
  const tasks = await getTasks();
  tasks.push(task);
  await saveTasks(tasks);
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const tasks = await getTasks();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    await saveTasks(tasks);
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const tasks = await getTasks();
  const filtered = tasks.filter((t) => t.id !== taskId);
  await saveTasks(filtered);
};

// ============ STUDY SESSIONS ============
export const getSessions = async (): Promise<StudySession[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading sessions:", error);
    return [];
  }
};

export const saveSessions = async (sessions: StudySession[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving sessions:", error);
  }
};

export const addSession = async (session: StudySession): Promise<void> => {
  const sessions = await getSessions();
  sessions.push(session);
  await saveSessions(sessions);
  
  // Update daily stats
  await updateDailyStats(session);
};

export const getRecentSessions = async (limit: number = 10): Promise<StudySession[]> => {
  const sessions = await getSessions();
  return sessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

// ============ DAILY STATS ============
export const getDailyStats = async (): Promise<DailyStats[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.DAILY_STATS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading daily stats:", error);
    return [];
  }
};

export const saveDailyStats = async (stats: DailyStats[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.DAILY_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error("Error saving daily stats:", error);
  }
};

const updateDailyStats = async (session: StudySession): Promise<void> => {
  const stats = await getDailyStats();
  const dateKey = new Date(session.date).toISOString().split("T")[0];
  
  let dayStats = stats.find((s) => s.date === dateKey);
  
  if (!dayStats) {
    dayStats = {
      date: dateKey,
      totalMinutes: 0,
      sessions: 0,
      subjectBreakdown: {},
    };
    stats.push(dayStats);
  }
  
  const minutes = Math.floor(session.duration / 60);
  dayStats.totalMinutes += minutes;
  dayStats.sessions += 1;
  
  if (!dayStats.subjectBreakdown[session.subjectId]) {
    dayStats.subjectBreakdown[session.subjectId] = 0;
  }
  dayStats.subjectBreakdown[session.subjectId] += minutes;
  
  await saveDailyStats(stats);
};

export const getTodayStats = async (): Promise<DailyStats | null> => {
  const stats = await getDailyStats();
  const today = new Date().toISOString().split("T")[0];
  return stats.find((s) => s.date === today) || null;
};

export const getStatsForPeriod = async (
  startDate: Date,
  endDate: Date
): Promise<DailyStats[]> => {
  const stats = await getDailyStats();
  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];
  
  return stats.filter((s) => s.date >= start && s.date <= end);
};

// ============ USER SETTINGS ============
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_SETTINGS);
    return data
      ? JSON.parse(data)
      : {
          dailyGoal: 120,
          breakDuration: 5,
          focusDuration: 25,
          soundEnabled: true,
        };
  } catch (error) {
    console.error("Error loading settings:", error);
    return {
      dailyGoal: 120,
      breakDuration: 5,
      focusDuration: 25,
      soundEnabled: true,
    };
  }
};

export const saveUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
  try {
    const current = await getUserSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(KEYS.USER_SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

// ============ SUBJECTS ============
export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SUBJECTS);
    if (data) {
      return JSON.parse(data);
    }
    // Return default subjects if none saved
    return getDefaultSubjects();
  } catch (error) {
    console.error("Error loading subjects:", error);
    return getDefaultSubjects();
  }
};

export const saveSubjects = async (subjects: Subject[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (error) {
    console.error("Error saving subjects:", error);
  }
};

const getDefaultSubjects = (): Subject[] => [
  { id: "math", name: "Math", icon: "calculator", color: "#5b9bd5" },
  { id: "science", name: "Science", icon: "flask", color: "#34c759" },
  { id: "english", name: "English", icon: "book", color: "#ff9500" },
  { id: "history", name: "History", icon: "time", color: "#af52de" },
  { id: "programming", name: "Programming", icon: "code-slash", color: "#5ac8fa" },
  { id: "art", name: "Art", icon: "color-palette", color: "#ff2d55" },
  { id: "music", name: "Music", icon: "musical-notes", color: "#ff3b30" },
  { id: "language", name: "Language", icon: "language", color: "#5856d6" },
  { id: "business", name: "Business", icon: "briefcase", color: "#ffcc00" },
  { id: "engineering", name: "Engineering", icon: "build", color: "#007aff" },
  { id: "medicine", name: "Medicine", icon: "medical", color: "#ff3b30" },
  { id: "law", name: "Law", icon: "hammer", color: "#8e8e93" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal", color: "#8e8e93" },
];

// ============ UTILITY ============
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (error) {
    console.error("Error clearing data:", error);
  }
};
