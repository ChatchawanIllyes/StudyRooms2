// Stats calculation helpers for heatmap visualization
// Optimized for hundreds of users with memoization patterns

import { StudySession } from "../types";

/**
 * Convert sessions to daily totals in YYYY-MM-DD format (local timezone)
 * @param sessions - Array of study sessions
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns Record of date string to total minutes studied
 */
export function getDailyTotals(
  sessions: StudySession[],
  startDate: Date,
  endDate: Date
): Record<string, number> {
  const dailyTotals: Record<string, number> = {};

  // Initialize all dates in range with 0
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = formatLocalDate(current);
    dailyTotals[dateKey] = 0;
    current.setDate(current.getDate() + 1);
  }

  // Sum session durations by date
  sessions.forEach((session) => {
    const sessionDate = new Date(session.date);
    const dateKey = formatLocalDate(sessionDate);

    if (dateKey in dailyTotals) {
      dailyTotals[dateKey] += Math.floor(session.duration / 60); // convert seconds to minutes
    }
  });

  return dailyTotals;
}

/**
 * Format date as YYYY-MM-DD in local timezone
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate intensity level (0-4) based on absolute minutes studied
 * @param minutes - Minutes studied on that day
 * @returns Intensity level 0 (empty) to 4 (brightest)
 */
export function getIntensityLevel(minutes: number): number {
  if (minutes === 0) return 0;
  if (minutes < 15) return 1; // 1-14 min
  if (minutes < 30) return 2; // 15-29 min
  if (minutes < 60) return 3; // 30-59 min
  return 4; // 60+ min
}

/**
 * Get color for intensity level using accent color with dark opacity
 * @param level - Intensity level 0-4
 * @param accentColor - Theme accent color (hex)
 * @param backgroundColor - Theme background color for level 0
 * @returns Color string
 */
export function getIntensityColor(
  level: number,
  accentColor: string,
  backgroundColor: string
): string {
  if (level === 0) {
    // Very dark, almost background
    return backgroundColor;
  }

  // Dark palette with lower opacity for subtlety
  const opacityMap: Record<number, string> = {
    1: "26", // 15% opacity
    2: "4D", // 30% opacity
    3: "80", // 50% opacity
    4: "CC", // 80% opacity
  };

  const opacity = opacityMap[level] || "FF";
  return `${accentColor}${opacity}`;
}

/**
 * Get last N days including today
 * @param days - Number of days to retrieve
 * @returns Array of dates in descending order (today first)
 */
export function getLastNDays(days: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }

  return dates;
}

/**
 * Get days for current month
 * @returns Array of dates for the current calendar month
 */
export function getCurrentMonthDays(): Date[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const dates: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month, day));
  }

  return dates;
}

/**
 * Get current month name (short form)
 * @returns Month name like "JAN", "FEB", etc.
 */
export function getCurrentMonthName(): string {
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return monthNames[new Date().getMonth()];
}

/**
 * Get month name for a given date (short form)
 * @returns Month name like "JAN", "FEB", etc.
 */
export function getMonthName(date: Date): string {
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return monthNames[date.getMonth()];
}

/**
 * Get last N months worth of days
 * @param months - Number of months to retrieve
 * @returns Array of arrays, each containing the days of a month
 */
export function getLastNMonths(months: number): Date[][] {
  const result: Date[][] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const targetMonth = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthDays: Date[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      monthDays.push(new Date(year, month, day));
    }
    result.push(monthDays);
  }

  return result;
}

/**
 * Get last N months worth of days for stacked layout
 * @param months - Number of months to retrieve
 * @returns Array of dates (flattened, not grouped by month)
 */
export function getLastNMonthsDates(months: number): Date[] {
  const result: Date[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const targetMonth = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      result.push(new Date(year, month, day));
    }
  }

  return result;
}

/**
 * Get calendar year months (Jan 1 - Dec 31 of current year)
 * @param startMonth - Starting month (0 = Jan, 11 = Dec)
 * @param endMonth - Ending month (0 = Jan, 11 = Dec)
 * @returns Array of dates from startMonth to endMonth of current year
 */
export function getCalendarYearMonths(
  startMonth: number,
  endMonth: number
): Date[] {
  const result: Date[] = [];
  const currentYear = new Date().getFullYear();

  for (let monthIndex = startMonth; monthIndex <= endMonth; monthIndex++) {
    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      result.push(new Date(currentYear, monthIndex, day));
    }
  }

  return result;
}

/**
 * Calculate total minutes for date range
 */
export function getTotalMinutesForRange(
  dailyTotals: Record<string, number>,
  dates: Date[]
): number {
  return dates.reduce((total, date) => {
    const dateKey = formatLocalDate(date);
    return total + (dailyTotals[dateKey] || 0);
  }, 0);
}

/**
 * Format minutes as hours and minutes (e.g., "2h 30m" or "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Organize dates into weeks (GitHub contribution graph style)
 * Returns array of weeks, where each week is an array of 7 dates (Sun-Sat)
 * Pads start/end with nulls to align to week boundaries
 */
export function organizeIntoWeeks(dates: Date[]): (Date | null)[][] {
  if (dates.length === 0) return [];

  const weeks: (Date | null)[][] = [];
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  // Find the Sunday before or on the first date
  const startSunday = new Date(firstDate);
  startSunday.setDate(firstDate.getDate() - firstDate.getDay());

  // Find the Saturday after or on the last date
  const endSaturday = new Date(lastDate);
  endSaturday.setDate(lastDate.getDate() + (6 - lastDate.getDay()));

  // Create date map for quick lookup
  const dateMap = new Map<string, Date>();
  dates.forEach((date) => {
    dateMap.set(formatLocalDate(date), date);
  });

  // Build weeks
  const current = new Date(startSunday);
  while (current <= endSaturday) {
    const week: (Date | null)[] = [];
    for (let day = 0; day < 7; day++) {
      const dateKey = formatLocalDate(current);
      const date = dateMap.get(dateKey);
      week.push(date || null);
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

/**
 * Get month labels with column positions for GitHub-style heatmap
 * Returns array of {month: "JAN", colIndex: 0} objects
 */
export function getMonthLabels(
  weeks: (Date | null)[][]
): Array<{ month: string; colIndex: number }> {
  const labels: Array<{ month: string; colIndex: number }> = [];
  let lastMonth = -1;

  weeks.forEach((week, colIndex) => {
    // Find first non-null date in the week
    const firstDate = week.find((d) => d !== null);
    if (firstDate) {
      const month = firstDate.getMonth();
      if (month !== lastMonth) {
        labels.push({
          month: getMonthName(firstDate),
          colIndex,
        });
        lastMonth = month;
      }
    }
  });

  return labels;
}
