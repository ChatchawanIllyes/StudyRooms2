import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Subject } from "../../types";
import SubjectBar from "./SubjectBar";

interface SubjectData {
  subject: Subject;
  minutes: number;
}

interface SubjectBreakdownProps {
  subjects: SubjectData[];
  maxDisplay?: number;
}

export default function SubjectBreakdown({
  subjects,
  maxDisplay = 5,
}: SubjectBreakdownProps) {
  const { colors } = useTheme();

  if (subjects.length === 0) {
    return null;
  }

  // Sort by minutes descending and take top N
  const topSubjects = subjects
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, maxDisplay);

  const maxMinutes = Math.max(...topSubjects.map((s) => s.minutes), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Subject Breakdown
      </Text>

      <View style={styles.list}>
        {topSubjects.map((item, index) => (
          <SubjectBar
            key={item.subject.id}
            name={item.subject.name}
            icon={item.subject.icon}
            color={item.subject.color}
            minutes={item.minutes}
            maxMinutes={maxMinutes}
            delay={index * 100}
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
    marginBottom: 20,
  },
  list: {
    gap: 0,
  },
});
