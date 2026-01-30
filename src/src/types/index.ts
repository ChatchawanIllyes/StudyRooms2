// Shared TypeScript interfaces for data models
// Easy to swap AsyncStorage for Supabase by changing the storage service only

import { Ionicons } from "@expo/vector-icons";

export interface Subject {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export interface StudySession {
  id: string;
  subject: string;
  subjectId: string;
  duration: number; // in seconds
  date: string; // ISO string
  notes?: string;
  pauseCount?: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  dueDate?: string; // ISO string
  priority: "low" | "medium" | "high";
  category?: string; // Subject ID
  subtasks?: SubTask[];
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyStats {
  date: string; // ISO string (date only, no time)
  totalMinutes: number;
  sessions: number;
  subjectBreakdown: {
    [subjectId: string]: number; // minutes per subject
  };
}

export interface UserSettings {
  dailyGoal: number; // minutes (legacy, keep for compatibility)
  dailyGoalMinutes: number; // minutes - primary daily study goal
  breakDuration?: number; // deprecated, kept for backward compatibility
  focusDuration: number; // minutes (default 25)
  soundEnabled: boolean;
}
