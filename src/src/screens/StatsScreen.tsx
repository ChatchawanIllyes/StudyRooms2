import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function StatsScreen() {
  const { colors } = useTheme();

  const stats = [
    { label: 'Today', value: '1h 8m', color: colors.accent },
    { label: 'This Week', value: '8h 24m', color: '#34c759' },
    { label: 'This Month', value: '42h 15m', color: '#ff9500' },
    { label: 'Total', value: '186h 32m', color: '#af52de' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Your Stats</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Track your study progress
      </Text>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[styles.statCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.statIndicator, { backgroundColor: stat.color }]} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Weekly Chart Placeholder */}
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Weekly Activity
        </Text>
        <View style={styles.chartPlaceholder}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
            const heights = [60, 80, 45, 90, 70, 30, 50];
            return (
              <View key={index} style={styles.chartBar}>
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: `${heights[index]}%`,
                      backgroundColor: colors.accent,
                      opacity: 0.8,
                    },
                  ]}
                />
                <Text style={[styles.chartDay, { color: colors.textSecondary }]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  chartPlaceholder: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartDay: {
    fontSize: 12,
  },
});
