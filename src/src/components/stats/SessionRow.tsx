import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { StudySession, Subject } from "../../types";

interface SessionRowProps {
  session: StudySession;
  subject: Subject | null;
  timeAgo: string;
}

export default function SessionRow({
  session,
  subject,
  timeAgo,
}: SessionRowProps) {
  const { colors } = useTheme();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const subjectColor = subject?.color || colors.textSecondary;
  const subjectName = subject?.name || "Unknown Subject";

  return (
    <View style={styles.container}>
      <View
        style={[styles.indicator, { backgroundColor: subjectColor }]}
      />
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.subject, { color: colors.text }]}>
            {subjectName}
          </Text>
          <Text style={[styles.dot, { color: colors.textSecondary }]}>
            {" • "}
          </Text>
          <Text style={[styles.duration, { color: colors.text }]}>
            {formatDuration(session.duration)}
          </Text>
        </View>
        <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
          {timeAgo}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  subject: {
    fontSize: 15,
    fontWeight: "500",
  },
  dot: {
    fontSize: 15,
  },
  duration: {
    fontSize: 15,
    fontWeight: "600",
  },
  timeAgo: {
    fontSize: 13,
  },
});
