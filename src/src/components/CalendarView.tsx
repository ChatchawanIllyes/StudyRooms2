import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { StudySession } from "../types";
import {
  getDailyTotals,
  getIntensityLevel,
  getIntensityColor,
  formatLocalDate,
} from "../utils/statsHelpers";

interface CalendarViewProps {
  sessions: StudySession[];
  onDayPress: (date: Date, sessions: StudySession[]) => void;
}

// Calculate cell width for 7-column grid with gaps
// Screen width - horizontal padding - gaps between cells
const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = 32; // 16px on each side
const GAP_SIZE = 4;
const COLUMNS = 7;
const TOTAL_GAP_WIDTH = (COLUMNS - 1) * GAP_SIZE;
const AVAILABLE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING - TOTAL_GAP_WIDTH;
const CELL_WIDTH = AVAILABLE_WIDTH / COLUMNS;

export default function CalendarView({
  sessions,
  onDayPress,
}: CalendarViewProps) {
  const { colors, accentColor } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days for current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month and its day of week
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get previous month's last days for padding
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDay.getDate();

    // Build calendar grid
    const days: (Date | null)[] = [];

    // Add previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Add next month's leading days to complete the grid (6 rows * 7 days = 42 cells)
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  }, [currentMonth]);

  // Calculate daily totals for the entire range
  const dailyTotals = useMemo(() => {
    if (calendarDays.length === 0) return {};
    const firstDate = calendarDays[0]!;
    const lastDate = calendarDays[calendarDays.length - 1]!;
    return getDailyTotals(sessions, firstDate, lastDate);
  }, [sessions, calendarDays]);

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date): StudySession[] => {
    const dateKey = formatLocalDate(date);
    return sessions.filter((session) => {
      const sessionDate = new Date(session.date);
      return formatLocalDate(sessionDate) === dateKey;
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Format month/year header
  const monthYearText = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Check if a date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Render calendar day
  const renderDay = (date: Date | null, index: number) => {
    if (!date) {
      return <View key={index} style={styles.dayCell} />;
    }

    const dateKey = formatLocalDate(date);
    const minutes = dailyTotals[dateKey] || 0;
    const level = getIntensityLevel(minutes);
    const intensityColor = getIntensityColor(level, accentColor, colors.card);
    const inCurrentMonth = isCurrentMonth(date);
    const today = isToday(date);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          {
            backgroundColor: inCurrentMonth ? intensityColor : "transparent",
            borderWidth: today ? 2 : 0,
            borderColor: today ? accentColor : "transparent",
          },
        ]}
        onPress={() => onDayPress(date, getSessionsForDate(date))}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dayText,
            {
              color: inCurrentMonth ? colors.text : colors.textSecondary,
              opacity: inCurrentMonth ? 1 : 0.3,
              fontWeight: today ? "700" : "400",
            },
          ]}
        >
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} activeOpacity={0.7}>
          <Text style={[styles.monthYearText, { color: colors.text }]}>
            {monthYearText}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNextMonth}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Day of week headers */}
        <View style={styles.weekDaysRow}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text
                  style={[styles.weekDayText, { color: colors.textSecondary }]}
                >
                  {day}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Calendar days grid */}
        <View style={styles.daysGrid}>
          {calendarDays.map((date, index) => renderDay(date, index))}
        </View>

        {/* Legend */}
        <View style={[styles.legend, { borderTopColor: colors.border }]}>
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
            Less
          </Text>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[
                styles.legendBox,
                {
                  backgroundColor: getIntensityColor(
                    level,
                    accentColor,
                    colors.card
                  ),
                  borderColor: colors.border,
                },
              ]}
            />
          ))}
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
            More
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  weekDaysRow: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 4,
  },
  weekDayCell: {
    width: CELL_WIDTH,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  dayCell: {
    width: CELL_WIDTH,
    height: CELL_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    textAlign: "center",
    textAlignVertical: "center",
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 6,
  },
  legendLabel: {
    fontSize: 11,
    marginHorizontal: 4,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
  },
});
