import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import * as StorageService from "../services/storage";
import { DailyStats, StudySession, Subject } from "../types";
import CalendarView from "../components/CalendarView";
import DayDetailSheet from "../components/DayDetailSheet";

// Import new stats components
import PeriodSelector, { Period } from "../components/stats/PeriodSelector";
import DailyProgressRing from "../components/stats/DailyProgressRing";
import QuickStatsRow from "../components/stats/QuickStatsRow";
import FocusTimeChart from "../components/stats/FocusTimeChart";
import SubjectBreakdown from "../components/stats/SubjectBreakdown";
import RecentSessionsList from "../components/stats/RecentSessionsList";
import InsightsCard from "../components/stats/InsightsCard";
import EmptyState from "../components/stats/EmptyState";

interface StatsScreenProps {
  navigation?: any;
  route?: any;
}

interface StatsData {
  totalMinutes: number;
  sessionCount: number;
  subjectBreakdown: Array<{ subject: Subject; minutes: number }>;
  weeklyChart: Array<{ day: string; minutes: number }>;
}

export default function StatsScreen({ navigation, route }: StatsScreenProps) {
  const { colors, accentColor } = useTheme();
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "calendar">("overview");

  // Period selector state for Overview tab
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("today");

  // Stats state
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [streak, setStreak] = useState(0);
  const [weekTrend, setWeekTrend] = useState(0);
  const [recentSessions, setRecentSessions] = useState<
    Array<{ session: StudySession; subject: Subject | null; timeAgo: string }>
  >([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120);

  // Day detail sheet state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<StudySession[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadAllData();
      // Check if navigating from widget with tab param
      if (route?.params?.tab === "calendar") {
        setActiveTab("calendar");
        // Clear the param so it doesn't persist
        navigation?.setParams({ tab: undefined });
      }
    }, [route?.params?.tab])
  );

  // Reload data when period changes
  useEffect(() => {
    if (!loading) {
      calculateStatsForPeriod();
    }
  }, [selectedPeriod, dailyStats, subjects, sessions]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stats, subs, allSessions, settings, streakVal, trendVal, recentSessionsData] =
        await Promise.all([
          StorageService.getDailyStats(),
          StorageService.getSubjects(),
          StorageService.getSessions(),
          StorageService.getUserSettings(),
          StorageService.calculateStreak(),
          StorageService.getWeekTrend(),
          StorageService.getRecentSessionsWithDetails(5),
        ]);

      setDailyStats(stats);
      setSubjects(subs);
      setSessions(allSessions);
      setDailyGoalMinutes(settings.dailyGoalMinutes);
      setStreak(streakVal);
      setWeekTrend(trendVal);
      setRecentSessions(recentSessionsData);

      // Generate insights
      await generateInsights(allSessions);
    } catch (error) {
      console.error("Error loading stats data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatsForPeriod = () => {
    const now = new Date();
    let startDate = new Date();
    let totalMinutes = 0;
    let sessionCount = 0;
    const subjectMinutes: { [key: string]: number } = {};

    // Determine date range based on period
    switch (selectedPeriod) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6); // Last 7 days
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
    }

    const startDateStr = startDate.toISOString().split("T")[0];

    // Calculate totals
    dailyStats.forEach((stat) => {
      if (stat.date >= startDateStr) {
        totalMinutes += stat.totalMinutes;
        sessionCount += stat.sessions;

        Object.entries(stat.subjectBreakdown || {}).forEach(([subjectId, minutes]) => {
          subjectMinutes[subjectId] = (subjectMinutes[subjectId] || 0) + minutes;
        });
      }
    });

    // Build subject breakdown with full subject data
    const subjectBreakdown = Object.entries(subjectMinutes)
      .map(([subjectId, minutes]) => {
        const subject = subjects.find((s) => s.id === subjectId);
        return subject ? { subject, minutes } : null;
      })
      .filter((item): item is { subject: Subject; minutes: number } => item !== null);

    // Get last 7 days for chart
    const weeklyChart = getLast7DaysChart();

    setStatsData({
      totalMinutes,
      sessionCount,
      subjectBreakdown,
      weeklyChart,
    });
  };

  const getLast7DaysChart = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayStat = dailyStats.find((s) => s.date === dateStr);
      days.push({
        day: ["S", "M", "T", "W", "T", "F", "S"][date.getDay()],
        minutes: dayStat?.totalMinutes || 0,
      });
    }
    return days;
  };

  const generateInsights = async (allSessions: StudySession[]) => {
    const insightsList: string[] = [];

    try {
      // Most productive hour
      const productiveHour = await StorageService.getMostProductiveHour();
      if (productiveHour >= 0) {
        const hourStr = productiveHour === 0 ? "12am" :
                       productiveHour < 12 ? `${productiveHour}am` :
                       productiveHour === 12 ? "12pm" :
                       `${productiveHour - 12}pm`;
        insightsList.push(`You're most productive at ${hourStr}`);
      }

      // Week trend
      if (weekTrend !== 0) {
        if (weekTrend > 0) {
          insightsList.push(`Up ${weekTrend}% from last week - keep it up!`);
        } else {
          insightsList.push(`Down ${Math.abs(weekTrend)}% from last week`);
        }
      }

      // Longest streak
      const longestStreak = await StorageService.getLongestStreak();
      if (longestStreak > streak && longestStreak > 1) {
        insightsList.push(`Your longest streak was ${longestStreak} days`);
      }

      // Average session duration
      const avgDuration = await StorageService.getAverageSessionDuration();
      if (avgDuration > 0) {
        insightsList.push(`Your average session is ${avgDuration} minutes`);
      }

      // Current streak encouragement
      if (streak >= 3) {
        insightsList.push(`${streak} day streak - you're on fire!`);
      }

      setInsights(insightsList);
    } catch (error) {
      console.error("Error generating insights:", error);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Handle day press from calendar
  const handleDayPress = (date: Date, daySessions: StudySession[]) => {
    setSelectedDate(date);
    setSelectedSessions(daySessions);
    setSheetVisible(true);
  };

  // Close day detail sheet
  const handleCloseSheet = () => {
    setSheetVisible(false);
    setTimeout(() => {
      setSelectedDate(null);
      setSelectedSessions([]);
    }, 300);
  };

  const handleStartTimer = () => {
    navigation?.navigate("Focus", { screen: "HomeScreen" });
  };

  // Check if we have any data at all
  const hasAnyData = dailyStats.length > 0 && dailyStats.some((s) => s.totalMinutes > 0);
  const hasPeriodData = statsData && statsData.totalMinutes > 0;

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "today":
        return "today";
      case "week":
        return "this week";
      case "month":
        return "this month";
      case "all":
        return "all time";
    }
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      {/* Header with title and tab selector */}
      <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Your Stats</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your study progress
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "overview" && {
                backgroundColor: accentColor,
              },
            ]}
            onPress={() => setActiveTab("overview")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "overview"
                      ? "#FFFFFF"
                      : colors.textSecondary,
                },
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "calendar" && {
                backgroundColor: accentColor,
              },
            ]}
            onPress={() => setActiveTab("calendar")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "calendar"
                      ? "#FFFFFF"
                      : colors.textSecondary,
                },
              ]}
            >
              Calendar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === "overview" ? (
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : !hasAnyData ? (
          <EmptyState type="no-data" onStartTimer={handleStartTimer} />
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Period Selector */}
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />

            {!hasPeriodData ? (
              <EmptyState
                type="no-period-data"
                periodLabel={getPeriodLabel()}
              />
            ) : (
              <>
                {/* Daily Progress Ring - Only show for "today" period */}
                {selectedPeriod === "today" && (
                  <DailyProgressRing
                    currentMinutes={statsData.totalMinutes}
                    goalMinutes={dailyGoalMinutes}
                  />
                )}

                {/* Quick Stats Row */}
                <QuickStatsRow
                  weeklyTotal={formatTime(
                    selectedPeriod === "week"
                      ? statsData.totalMinutes
                      : dailyStats
                          .filter((s) => {
                            const date = new Date(s.date);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 6);
                            return date >= weekAgo;
                          })
                          .reduce((sum, s) => sum + s.totalMinutes, 0)
                  )}
                  weekTrend={weekTrend}
                  streak={streak}
                  sessionCount={statsData.sessionCount}
                />

                {/* Focus Time Chart */}
                <FocusTimeChart
                  data={statsData.weeklyChart}
                  goalMinutes={selectedPeriod === "today" ? dailyGoalMinutes : undefined}
                />

                {/* Subject Breakdown */}
                {statsData.subjectBreakdown.length > 0 && (
                  <SubjectBreakdown
                    subjects={statsData.subjectBreakdown}
                    maxDisplay={5}
                  />
                )}

                {/* Recent Sessions */}
                {recentSessions.length > 0 && (
                  <RecentSessionsList
                    sessions={recentSessions}
                    maxDisplay={5}
                  />
                )}

                {/* Insights Card */}
                {insights.length > 0 && <InsightsCard insights={insights} />}
              </>
            )}
          </ScrollView>
        )
      ) : (
        <CalendarView sessions={sessions} onDayPress={handleDayPress} />
      )}

      {/* Day Detail Sheet */}
      <DayDetailSheet
        visible={sheetVisible}
        date={selectedDate}
        sessions={selectedSessions}
        onClose={handleCloseSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
