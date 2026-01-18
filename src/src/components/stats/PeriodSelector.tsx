import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export type Period = "today" | "week" | "month" | "all";

interface PeriodSelectorProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
}

export default function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
}: PeriodSelectorProps) {
  const { colors, accentColor } = useTheme();

  const periods: Array<{ value: Period; label: string }> = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "all", label: "All Time" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {periods.map((period) => {
        const isSelected = selectedPeriod === period.value;
        return (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.periodButton,
              isSelected && {
                backgroundColor: accentColor,
              },
            ]}
            onPress={() => onPeriodChange(period.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodText,
                {
                  color: isSelected ? "#FFFFFF" : colors.textSecondary,
                },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
