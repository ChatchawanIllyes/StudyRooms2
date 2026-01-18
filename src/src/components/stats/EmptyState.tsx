import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface EmptyStateProps {
  type: "no-data" | "no-period-data";
  periodLabel?: string;
  onStartTimer?: () => void;
}

export default function EmptyState({
  type,
  periodLabel,
  onStartTimer,
}: EmptyStateProps) {
  const { colors, accentColor } = useTheme();

  if (type === "no-data") {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>📚</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Start Your Study Journey
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Track your study time to see{"\n"}insights and progress here
        </Text>
        {onStartTimer && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: accentColor }]}
            onPress={onStartTimer}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Start Timer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📊</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        No study time recorded
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Start a session to begin tracking{"\n"}
        {periodLabel ? `for ${periodLabel}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
