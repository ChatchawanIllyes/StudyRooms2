import React from "react";
import { View, StyleSheet } from "react-native";
import StatCard from "./StatCard";

interface QuickStatsRowProps {
  weeklyTotal: string;
  weekTrend: number;
  streak: number;
  sessionCount: number;
}

export default function QuickStatsRow({
  weeklyTotal,
  weekTrend,
  streak,
  sessionCount,
}: QuickStatsRowProps) {
  return (
    <View style={styles.container}>
      <StatCard
        label="Weekly Total"
        value={weeklyTotal}
        trend={weekTrend}
      />
      <View style={styles.spacer} />
      <StatCard
        label="Streak"
        value={`${streak}`}
        icon="🔥"
      />
      <View style={styles.spacer} />
      <StatCard
        label="Sessions"
        value={`${sessionCount}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 24,
  },
  spacer: {
    width: 12,
  },
});
