import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { StudySession, Subject } from "../../types";
import SessionRow from "./SessionRow";

interface RecentSessionsListProps {
  sessions: Array<{
    session: StudySession;
    subject: Subject | null;
    timeAgo: string;
  }>;
  maxDisplay?: number;
}

export default function RecentSessionsList({
  sessions,
  maxDisplay = 5,
}: RecentSessionsListProps) {
  const { colors } = useTheme();

  if (sessions.length === 0) {
    return null;
  }

  const displaySessions = sessions.slice(0, maxDisplay);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Recent Sessions
      </Text>

      <View style={styles.list}>
        {displaySessions.map((item, index) => (
          <SessionRow
            key={item.session.id}
            session={item.session}
            subject={item.subject}
            timeAgo={item.timeAgo}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  list: {
    gap: 0,
  },
});
