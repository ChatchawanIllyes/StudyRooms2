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

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>
): Promise<void> => {
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
  let sessions = await getSessions();
  sessions.push(session);

  // Clean up sessions older than 90 days
  sessions = await cleanupOldSessions(sessions);

  await saveSessions(sessions);

  // Update daily stats
  await updateDailyStats(session);
};

// Clean up sessions older than 90 days
const cleanupOldSessions = async (
  sessions: StudySession[]
): Promise<StudySession[]> => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  return sessions.filter((session) => new Date(session.date) >= ninetyDaysAgo);
};

export const getRecentSessions = async (
  limit: number = 10
): Promise<StudySession[]> => {
  const sessions = await getSessions();
  return sessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

// Get sessions for a specific date range
export const getSessionsForPeriod = async (
  startDate: Date,
  endDate: Date
): Promise<StudySession[]> => {
  const sessions = await getSessions();
  const start = startDate.toISOString();
  const end = endDate.toISOString();

  return sessions.filter((s) => s.date >= start && s.date <= end);
};

// Get sessions by subject
export const getSessionsBySubject = async (
  subjectId: string,
  limit?: number
): Promise<StudySession[]> => {
  const sessions = await getSessions();
  const filtered = sessions
    .filter((s) => s.subjectId === subjectId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return limit ? filtered.slice(0, limit) : filtered;
};

// Get total study time by subject for a date range
export const getSubjectTimeForPeriod = async (
  subjectId: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const sessions = await getSessionsForPeriod(startDate, endDate);
  return sessions
    .filter((s) => s.subjectId === subjectId)
    .reduce((total, s) => total + s.duration, 0);
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

// Get total study time for today in seconds
export const getTodayTotalTime = async (): Promise<number> => {
  const todayStats = await getTodayStats();
  return todayStats ? todayStats.totalMinutes * 60 : 0;
};

// Get weekly summary (last 7 days)
export const getWeeklySummary = async (): Promise<{
  totalMinutes: number;
  totalSessions: number;
  dailyBreakdown: DailyStats[];
  topSubjects: { subjectId: string; minutes: number }[];
}> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6); // Last 7 days including today

  const dailyStats = await getStatsForPeriod(startDate, endDate);

  const totalMinutes = dailyStats.reduce((sum, s) => sum + s.totalMinutes, 0);
  const totalSessions = dailyStats.reduce((sum, s) => sum + s.sessions, 0);

  // Aggregate subjects across the week
  const subjectTotals: { [key: string]: number } = {};
  dailyStats.forEach((day) => {
    Object.entries(day.subjectBreakdown).forEach(([subjectId, minutes]) => {
      subjectTotals[subjectId] = (subjectTotals[subjectId] || 0) + minutes;
    });
  });

  const topSubjects = Object.entries(subjectTotals)
    .map(([subjectId, minutes]) => ({ subjectId, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    totalMinutes,
    totalSessions,
    dailyBreakdown: dailyStats,
    topSubjects,
  };
};

// ============ USER SETTINGS ============
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_SETTINGS);
    return data
      ? JSON.parse(data)
      : {
          dailyGoal: 120,
          dailyGoalMinutes: 120,
          breakDuration: 5,
          focusDuration: 25,
          soundEnabled: true,
        };
  } catch (error) {
    console.error("Error loading settings:", error);
    return {
      dailyGoal: 120,
      dailyGoalMinutes: 120,
      breakDuration: 5,
      focusDuration: 25,
      soundEnabled: true,
    };
  }
};

export const saveUserSettings = async (
  settings: Partial<UserSettings>
): Promise<void> => {
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

// Add a new subject
export const addSubject = async (subject: Subject): Promise<void> => {
  const subjects = await getSubjects();

  // Check if subject with same ID already exists
  const exists = subjects.some((s) => s.id === subject.id);
  if (!exists) {
    subjects.push(subject);
    await saveSubjects(subjects);
  }
};

// Update an existing subject
export const updateSubject = async (
  subjectId: string,
  updates: Partial<Subject>
): Promise<void> => {
  const subjects = await getSubjects();
  const index = subjects.findIndex((s) => s.id === subjectId);

  if (index !== -1) {
    subjects[index] = { ...subjects[index], ...updates };
    await saveSubjects(subjects);
  }
};

// Delete a subject (optional - you might want to keep subjects for historical data)
export const deleteSubject = async (subjectId: string): Promise<void> => {
  const subjects = await getSubjects();
  const filtered = subjects.filter((s) => s.id !== subjectId);
  await saveSubjects(filtered);
};

const getDefaultSubjects = (): Subject[] => [
  {
    id: "general",
    name: "General Study",
    icon: "book-outline",
    color: "#8e8e93",
  },
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

// ============ UTILITY ============
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (error) {
    console.error("Error clearing data:", error);
  }
};

// ============ DUMMY DATA FOR TESTING ============
export const addDummyStudySessions = async (): Promise<number> => {
  try {
    // Get existing subjects
    const subjects = await getSubjects();

    // Select 6 subjects for varied data
    const selectedSubjects = [
      subjects.find(s => s.id === "math") || subjects[0],
      subjects.find(s => s.id === "science") || subjects[1],
      subjects.find(s => s.id === "history") || subjects[2],
      subjects.find(s => s.id === "programming") || subjects[3],
      subjects.find(s => s.id === "english") || subjects[4],
      subjects.find(s => s.id === "art") || subjects[5],
    ];

    // Define study time patterns (in minutes) for each subject over 7 days
    const subjectTimePatterns = [
      [45, 60, 30, 90, 45, 60, 75],  // Math - consistent heavy study
      [30, 45, 30, 60, 45, 30, 40],  // Science - moderate
      [20, 15, 30, 25, 20, 15, 30],  // History - light but consistent
      [60, 90, 75, 120, 60, 90, 80], // Programming - heavy, most studied
      [30, 20, 25, 30, 15, 20, 25],  // English - light/moderate
      [15, 10, 20, 15, 10, 15, 20],  // Art - lightest
    ];

    const now = new Date();
    let sessionsAdded = 0;

    // Create sessions for each day
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() - (6 - dayOffset)); // Start from 6 days ago
      sessionDate.setHours(10 + (dayOffset % 12), 0, 0, 0); // Vary time slightly

      for (let subjectIndex = 0; subjectIndex < selectedSubjects.length; subjectIndex++) {
        const subject = selectedSubjects[subjectIndex];
        const studyMinutes = subjectTimePatterns[subjectIndex][dayOffset];

        // Create 1-2 sessions per subject per day based on duration
        const numSessions = studyMinutes > 60 ? 2 : 1;
        const minutesPerSession = Math.floor(studyMinutes / numSessions);

        for (let sessionNum = 0; sessionNum < numSessions; sessionNum++) {
          const sessionTime = new Date(sessionDate);
          sessionTime.setHours(sessionTime.getHours() + sessionNum * 2);

          const session: StudySession = {
            id: `dummy_${subject.id}_${dayOffset}_${sessionNum}_${Date.now()}`,
            subject: subject.name,
            subjectId: subject.id,
            duration: minutesPerSession * 60, // Convert to seconds
            date: sessionTime.toISOString(),
            notes: "Sample study session for preview",
            pauseCount: Math.floor(Math.random() * 3),
          };

          await addSession(session);
          sessionsAdded++;
        }
      }
    }

    console.log(`Added ${sessionsAdded} dummy study sessions`);
    return sessionsAdded;
  } catch (error) {
    console.error("Error adding dummy sessions:", error);
    return 0;
  }
};
