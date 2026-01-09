import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import * as StorageService from "../services/storage";
import { StudySession, UserSettings } from "../types";
import {
  getDailyTotals,
  getIntensityLevel,
  getIntensityColor,
  getLastNDays,
  getCurrentMonthDays,
  getCurrentMonthName,
  getMonthName,
  getLastNMonths,
  getLastNMonthsDates,
  getCalendarYearMonths,
  getTotalMinutesForRange,
  formatDuration,
  formatLocalDate,
  organizeIntoWeeks,
  getMonthLabels,
} from "../utils/statsHelpers";

interface StatsHeatmapWidgetProps {
  size: "1x1" | "2x1" | "1x2" | "2x2";
  isEditMode?: boolean;
  isPreview?: boolean;
  onNavigateToStats?: () => void;
}

const DEFAULT_DAILY_GOAL = 120; // 2 hours

export default function StatsHeatmapWidget({
  size,
  isEditMode = false,
  isPreview = false,
  onNavigateToStats,
}: StatsHeatmapWidgetProps) {
  const { colors, accentColor } = useTheme();

  const [sessions, setSessions] = useState<StudySession[]>([]);

  // Load sessions
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loadedSessions = await StorageService.getSessions();
      setSessions(loadedSessions);
    } catch (error) {
      console.error("Error loading stats data:", error);
    }
  };

  // Calculate daily totals with memoization
  const {
    dailyTotals,
    dates,
    weeks,
    monthLabels,
    weeksTop,
    weeksMiddle,
    weeksBottom,
    monthLabelsTop,
    monthLabelsMiddle,
    monthLabelsBottom,
  } = useMemo(() => {
    let dates: Date[];
    let weeksTop: (Date | null)[][] = [];
    let weeksMiddle: (Date | null)[][] = [];
    let weeksBottom: (Date | null)[][] = [];
    let monthLabelsTop: { month: string; colIndex: number }[] = [];
    let monthLabelsMiddle: { month: string; colIndex: number }[] = [];
    let monthLabelsBottom: { month: string; colIndex: number }[] = [];

    if (size === "1x1") {
      // 1x1: Current month only
      dates = getCurrentMonthDays();
    } else if (size === "2x1") {
      // 2x1: Jan-Jun (first 6 months of year)
      dates = getCalendarYearMonths(0, 5);
    } else if (size === "1x2") {
      // 1x2: 3 months stacked (Jan, Feb, Mar)
      const month1 = getCalendarYearMonths(0, 0); // Jan
      const month2 = getCalendarYearMonths(1, 1); // Feb
      const month3 = getCalendarYearMonths(2, 2); // Mar
      dates = [...month1, ...month2, ...month3];
      weeksTop = organizeIntoWeeks(month1);
      weeksMiddle = organizeIntoWeeks(month2);
      weeksBottom = organizeIntoWeeks(month3);
      monthLabelsTop = getMonthLabels(weeksTop);
      monthLabelsMiddle = getMonthLabels(weeksMiddle);
      monthLabelsBottom = getMonthLabels(weeksBottom);
    } else {
      // 2x2: Jan-Jun top, Jul-Dec bottom
      const topDates = getCalendarYearMonths(0, 5); // Jan-Jun
      const bottomDates = getCalendarYearMonths(6, 11); // Jul-Dec
      dates = [...topDates, ...bottomDates];
      weeksTop = organizeIntoWeeks(topDates);
      weeksBottom = organizeIntoWeeks(bottomDates);
      monthLabelsTop = getMonthLabels(weeksTop);
      monthLabelsBottom = getMonthLabels(weeksBottom);
    }

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    const dailyTotals = getDailyTotals(sessions, startDate, endDate);

    // Organize into weeks for GitHub-style layout
    const weeks =
      size === "1x1" || size === "2x1" ? organizeIntoWeeks(dates) : [];
    const monthLabels = size === "2x1" ? getMonthLabels(weeks) : [];

    return {
      dailyTotals,
      dates,
      weeks,
      monthLabels,
      weeksTop,
      weeksMiddle,
      weeksBottom,
      monthLabelsTop,
      monthLabelsMiddle,
      monthLabelsBottom,
    };
  }, [sessions, size]);

  // Handle navigation
  const handlePress = () => {
    if (isEditMode || isPreview) return;
    onNavigateToStats?.();
  };

  // Render day square (can be null for padding)
  const renderDaySquare = (
    date: Date | null,
    squareSize: number,
    key: string
  ) => {
    if (!date) {
      return (
        <View
          key={key}
          style={[
            styles.daySquare,
            {
              width: squareSize,
              height: squareSize,
              backgroundColor: "transparent",
            },
          ]}
        />
      );
    }

    const dateKey = formatLocalDate(date);
    const minutes = dailyTotals[dateKey] || 0;
    const level = getIntensityLevel(minutes);
    const color = getIntensityColor(level, accentColor, colors.card);

    return (
      <View
        key={key}
        style={[
          styles.daySquare,
          {
            width: squareSize,
            height: squareSize,
            backgroundColor: color,
            borderRadius: 2,
          },
        ]}
      />
    );
  };

  // 1x1 Layout: Current month horizontal rows (7 days per row)
  const render1x1 = () => {
    const squareSize = 9;
    const allDays = weeks.flat().filter((d) => d !== null) as Date[];
    const rows: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7));
    }

    return (
      <View style={styles.container1x1}>
        <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
          {getCurrentMonthName()}
        </Text>
        <View style={styles.horizontalGrid}>
          {rows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.horizontalRow}>
              {row.map((date, dayIndex) =>
                renderDaySquare(date, squareSize, `r${rowIndex}-d${dayIndex}`)
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 2x1 Layout: Past 6 months GitHub-style (horizontal)
  const render2x1 = () => {
    const squareSize = 7; // Larger squares for 2x1

    return (
      <View style={styles.container2x1}>
        <View style={styles.heatmapWrapper}>
          {/* Month labels at top */}
          <View style={styles.monthLabelsRow}>
            {monthLabels.map((label, index) => (
              <Text
                key={`month-${index}`}
                style={[
                  styles.monthLabel2x1,
                  {
                    color: colors.textSecondary,
                    left: label.colIndex * (squareSize + 2),
                  },
                ]}
              >
                {label.month}
              </Text>
            ))}
          </View>

          {/* GitHub-style grid: 7 rows (days), weeks as columns */}
          <View style={styles.githubGrid}>
            {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
              <View key={`day-${dayOfWeek}`} style={styles.githubRow}>
                {weeks.map((week, weekIndex) => {
                  const date = week[dayOfWeek];
                  return renderDaySquare(
                    date,
                    squareSize,
                    `w${weekIndex}-d${dayOfWeek}`
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // 1x2 Layout: 3 months stacked vertically
  const render1x2 = () => {
    const squareSize = 8; // Larger squares for fewer months

    return (
      <View style={styles.container1x2}>
        {/* Month 1 */}
        <View style={styles.stackedSection}>
          <View style={styles.heatmapWrapper}>
            <View style={styles.monthLabelsRow}>
              {monthLabelsTop.map((label, index) => (
                <Text
                  key={`month-top-${index}`}
                  style={[
                    styles.monthLabel1x2,
                    {
                      color: colors.textSecondary,
                      left: label.colIndex * (squareSize + 2),
                    },
                  ]}
                >
                  {label.month}
                </Text>
              ))}
            </View>
            <View style={styles.githubGrid}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                <View key={`top-day-${dayOfWeek}`} style={styles.githubRow}>
                  {weeksTop.map((week, weekIndex) => {
                    const date = week[dayOfWeek];
                    return renderDaySquare(
                      date,
                      squareSize,
                      `top-w${weekIndex}-d${dayOfWeek}`
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Month 2 */}
        <View style={styles.stackedSection}>
          <View style={styles.heatmapWrapper}>
            <View style={styles.monthLabelsRow}>
              {monthLabelsMiddle.map((label, index) => (
                <Text
                  key={`month-middle-${index}`}
                  style={[
                    styles.monthLabel1x2,
                    {
                      color: colors.textSecondary,
                      left: label.colIndex * (squareSize + 2),
                    },
                  ]}
                >
                  {label.month}
                </Text>
              ))}
            </View>
            <View style={styles.githubGrid}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                <View key={`middle-day-${dayOfWeek}`} style={styles.githubRow}>
                  {weeksMiddle.map((week, weekIndex) => {
                    const date = week[dayOfWeek];
                    return renderDaySquare(
                      date,
                      squareSize,
                      `middle-w${weekIndex}-d${dayOfWeek}`
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Month 3 */}
        <View style={styles.stackedSection}>
          <View style={styles.heatmapWrapper}>
            <View style={styles.monthLabelsRow}>
              {monthLabelsBottom.map((label, index) => (
                <Text
                  key={`month-bottom-${index}`}
                  style={[
                    styles.monthLabel1x2,
                    {
                      color: colors.textSecondary,
                      left: label.colIndex * (squareSize + 2),
                    },
                  ]}
                >
                  {label.month}
                </Text>
              ))}
            </View>
            <View style={styles.githubGrid}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                <View key={`bottom-day-${dayOfWeek}`} style={styles.githubRow}>
                  {weeksBottom.map((week, weekIndex) => {
                    const date = week[dayOfWeek];
                    return renderDaySquare(
                      date,
                      squareSize,
                      `bottom-w${weekIndex}-d${dayOfWeek}`
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // 2x2 Layout: Past 12 months vertical (stacked 6+6 months)
  const render2x2 = () => {
    const squareSize = 7; // Larger squares for 2x2

    return (
      <View style={styles.container2x2}>
        {/* Top 6 months */}
        <View style={styles.stackedSection}>
          <View style={styles.heatmapWrapper}>
            <View style={styles.monthLabelsRow}>
              {monthLabelsTop.map((label, index) => (
                <Text
                  key={`month-top-${index}`}
                  style={[
                    styles.monthLabel2x2,
                    {
                      color: colors.textSecondary,
                      left: label.colIndex * (squareSize + 2),
                    },
                  ]}
                >
                  {label.month}
                </Text>
              ))}
            </View>
            <View style={styles.githubGrid}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                <View key={`top-day-${dayOfWeek}`} style={styles.githubRow}>
                  {weeksTop.map((week, weekIndex) => {
                    const date = week[dayOfWeek];
                    return renderDaySquare(
                      date,
                      squareSize,
                      `top-w${weekIndex}-d${dayOfWeek}`
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom 6 months */}
        <View style={styles.stackedSection}>
          <View style={styles.heatmapWrapper}>
            <View style={styles.monthLabelsRow}>
              {monthLabelsBottom.map((label, index) => (
                <Text
                  key={`month-bottom-${index}`}
                  style={[
                    styles.monthLabel2x2,
                    {
                      color: colors.textSecondary,
                      left: label.colIndex * (squareSize + 2),
                    },
                  ]}
                >
                  {label.month}
                </Text>
              ))}
            </View>
            <View style={styles.githubGrid}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                <View key={`bottom-day-${dayOfWeek}`} style={styles.githubRow}>
                  {weeksBottom.map((week, weekIndex) => {
                    const date = week[dayOfWeek];
                    return renderDaySquare(
                      date,
                      squareSize,
                      `bottom-w${weekIndex}-d${dayOfWeek}`
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isEditMode || isPreview}
      activeOpacity={0.7}
      style={[
        styles.widget,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: isEditMode ? 0.6 : 1,
        },
      ]}
    >
      {size === "1x1" && render1x1()}
      {size === "2x1" && render2x1()}
      {size === "1x2" && render1x2()}
      {size === "2x2" && render2x2()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  widget: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
  },

  // 1x1 Layout
  container1x1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 2,
  },

  // 2x1 Layout
  container2x1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel2x1: {
    fontSize: 7,
    fontWeight: "600",
    textTransform: "uppercase",
    position: "absolute",
  },

  // 1x2 Layout
  container1x2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stackedSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel1x2: {
    fontSize: 8,
    fontWeight: "600",
    textTransform: "uppercase",
    position: "absolute",
  },

  // 2x2 Layout
  container2x2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabelsRow: {
    flexDirection: "row",
    height: 10,
    marginBottom: 4,
    position: "relative",
  },
  monthLabel2x2: {
    fontSize: 7,
    fontWeight: "600",
    textTransform: "uppercase",
    position: "absolute",
  },

  // Wrapper for month labels + grid alignment
  heatmapWrapper: {
    alignItems: "flex-start",
  },

  // Horizontal grid styles for 1x1
  horizontalGrid: {
    gap: 3,
    alignItems: "center",
  },
  horizontalRow: {
    flexDirection: "row",
    gap: 3,
  },
  githubGrid: {
    gap: 2,
    justifyContent: "center",
  },
  githubRow: {
    flexDirection: "row",
    gap: 2,
  },

  // Common
  daySquare: {
    borderRadius: 2,
  },
});
