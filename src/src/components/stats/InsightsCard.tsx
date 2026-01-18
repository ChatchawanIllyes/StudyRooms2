import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

interface InsightsCardProps {
  insights: string[];
}

export default function InsightsCard({ insights }: InsightsCardProps) {
  const { colors, accentColor } = useTheme();

  if (insights.length === 0) {
    return null;
  }

  // Create gradient background with accent color at 10% opacity
  const gradientColors: [string, string] = [
    `${accentColor}15`,
    `${accentColor}08`,
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.icon}>💡</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Insights
            </Text>
          </View>

          <View style={styles.insightsList}>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightRow}>
                <Text style={[styles.bullet, { color: accentColor }]}>•</Text>
                <Text style={[styles.insightText, { color: colors.text }]}>
                  {insight}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  insightsList: {
    gap: 12,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
    fontWeight: "600",
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
});
