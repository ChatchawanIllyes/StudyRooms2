import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CalendarPickerProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  colors: any;
  accentColor: string;
}

export default function CalendarPicker({
  selectedDate,
  onSelectDate,
  onClose,
  colors,
  accentColor,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const selectDate = (day: number) => {
    const selected = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    onSelectDate(selected);
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    const checkDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return checkDate.toDateString() === selectedDate.toDateString();
  };

  const isToday = (day: number) => {
    const today = new Date();
    const checkDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return checkDate.toDateString() === today.toDateString();
  };

  // Create array of day numbers
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <TouchableOpacity
      style={styles.calendarOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <TouchableOpacity
        style={styles.calendarContainerWrapper}
        activeOpacity={1}
        onPress={(e) => e.stopPropagation()}
      >
        <View
          style={[styles.calendarContainer, { backgroundColor: colors.card }]}
        >
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={previousMonth}
              style={styles.calendarNav}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.calendarTitle, { color: colors.text }]}>
              {currentMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.calendarNav}>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Week Day Labels */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text
                  style={[styles.weekDayText, { color: colors.textSecondary }]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {days.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                {day !== null && (
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: isSelectedDate(day)
                          ? accentColor
                          : isToday(day)
                          ? colors.background
                          : "transparent",
                      },
                    ]}
                    onPress={() => selectDate(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isSelectedDate(day)
                            ? "#FFFFFF"
                            : isToday(day)
                            ? accentColor
                            : colors.text,
                          fontWeight: isToday(day) ? "700" : "500",
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={[
              styles.calendarCloseButton,
              { backgroundColor: colors.background },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.calendarCloseText, { color: colors.text }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  calendarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  calendarContainerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarContainer: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarNav: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  weekDaysRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  calendarCloseButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  calendarCloseText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
