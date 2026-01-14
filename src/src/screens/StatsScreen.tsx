import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import * as StorageService from "../services/storage";
import { DailyStats } from "../types";

interface StatsScreenProps {
  navigation?: any;
}

export default function StatsScreen({ navigation }: StatsScreenProps) {
  const { colors } = useTheme();
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    const stats = await StorageService.getDailyStats();
    const subs = await StorageService.getSubjects();
    setDailyStats(stats);
    setSubjects(subs);
  };

  // Calculate stats
  const calculateStats = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;
    let totalMinutes = 0;
    const subjectMinutes: { [key: string]: number } = {};

    dailyStats.forEach((stat) => {
      const statDate = new Date(stat.date);
      const minutes = stat.totalMinutes || 0;

      totalMinutes += minutes;

      if (stat.date === todayStr) {
        todayMinutes += minutes;
      }

      if (statDate >= startOfWeek) {
        weekMinutes += minutes;
      }

      if (statDate >= startOfMonth) {
        monthMinutes += minutes;
      }

      // Subject breakdown - aggregate by subject ID
      Object.entries(stat.subjectBreakdown || {}).forEach(([subjectId, minutes]) => {
        // Find subject name by ID for display
        const subjectData = subjects.find((s) => s.id === subjectId);
        const subjectName = subjectData?.name || subjectId || "Other";

        subjectMinutes[subjectName] =
          (subjectMinutes[subjectName] || 0) + minutes;
      });
    });

    return {
      today: todayMinutes,
      week: weekMinutes,
      month: monthMinutes,
      total: totalMinutes,
      subjects: subjectMinutes,
    };
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const statsData = calculateStats();

  const stats = [
    {
      label: "Today",
      value: formatTime(statsData.today),
      color: colors.accent,
    },
    { label: "This Week", value: formatTime(statsData.week), color: "#34c759" },
    {
      label: "This Month",
      value: formatTime(statsData.month),
      color: "#ff9500",
    },
    { label: "Total", value: formatTime(statsData.total), color: "#af52de" },
  ];

  // Get last 7 days for chart
  const getLast7Days = () => {
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

  const last7Days = getLast7Days();
  const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), 1);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: colors.text }]}>Your Stats</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Track your study progress
        </Text>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[styles.statCard, { backgroundColor: colors.card }]}
            >
              <View
                style={[styles.statIndicator, { backgroundColor: stat.color }]}
              />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Weekly Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Weekly Activity
          </Text>
          <View style={styles.chartPlaceholder}>
            {last7Days.map((dayData, index) => {
              const height =
                maxMinutes > 0 ? (dayData.minutes / maxMinutes) * 100 : 0;
              return (
                <View key={index} style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${Math.max(height, 5)}%`,
                        backgroundColor: colors.accent,
                        opacity: dayData.minutes > 0 ? 0.8 : 0.2,
                      },
                    ]}
                  />
                  <Text
                    style={[styles.chartDay, { color: colors.textSecondary }]}
                  >
                    {dayData.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Subject Breakdown */}
        {Object.keys(statsData.subjects).length > 0 && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.card, marginTop: 16 },
            ]}
          >
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Subject Breakdown
            </Text>
            <View style={styles.subjectList}>
              {Object.entries(statsData.subjects)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([subject, minutes]) => {
                  const subjectData = subjects.find((s) => s.name === subject);
                  const color = subjectData?.color || colors.accent;
                  const percentage =
                    statsData.total > 0
                      ? (((minutes as number) / statsData.total) * 100).toFixed(
                          1
                        )
                      : 0;

                  return (
                    <View key={subject} style={styles.subjectRow}>
                      <View style={styles.subjectInfo}>
                        <View
                          style={[
                            styles.subjectDot,
                            { backgroundColor: color },
                          ]}
                        />
                        <Text
                          style={[styles.subjectName, { color: colors.text }]}
                        >
                          {subject}
                        </Text>
                      </View>
                      <View style={styles.subjectStats}>
                        <Text
                          style={[styles.subjectTime, { color: colors.text }]}
                        >
                          {formatTime(minutes as number)}
                        </Text>
                        <Text
                          style={[
                            styles.subjectPercent,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {percentage}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  chartPlaceholder: {
    flexDirection: "row",
    height: 150,
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 4,
    marginBottom: 8,
  },
  chartDay: {
    fontSize: 12,
  },
  subjectList: {
    gap: 12,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  subjectInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subjectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: "500",
  },
  subjectStats: {
    alignItems: "flex-end",
  },
  subjectTime: {
    fontSize: 15,
    fontWeight: "600",
  },
  subjectPercent: {
    fontSize: 12,
    marginTop: 2,
  },
});
