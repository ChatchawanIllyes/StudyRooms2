import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { WidgetSize } from "../context/WidgetContext";
import * as StorageService from "../services/storage";
import { StudySession, Subject } from "../types";
import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";

interface StatsWidgetProps {
  size: WidgetSize;
  isEditMode: boolean;
  onNavigateToStats: () => void;
  isPreview?: boolean;
}

interface RadarDataPoint {
  subject: Subject;
  minutes: number;
  percentage: number;
}

export default function StatsWidget({
  size,
  isEditMode,
  onNavigateToStats,
  isPreview = false,
}: StatsWidgetProps) {
  const { colors, accentColor, isDark } = useTheme();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const getDimensions = () => {
    const { width } = Dimensions.get("window");
    const PADDING = 20;
    const GAP = 16;
    const GRID_WIDTH = width - PADDING * 2;
    const SLOT_SIZE = (GRID_WIDTH - GAP) / 2;

    switch (size) {
      case "1x1":
        return { width: SLOT_SIZE, height: SLOT_SIZE };
      case "2x1":
        return { width: GRID_WIDTH, height: SLOT_SIZE };
      case "1x2":
        return { width: SLOT_SIZE, height: SLOT_SIZE * 2 + GAP };
      case "2x2":
        return { width: GRID_WIDTH, height: SLOT_SIZE * 2 + GAP };
    }
  };

  const dimensions = getDimensions();
  const is1x1 = size === "1x1";
  const is2x1 = size === "2x1";
  const is1x2 = size === "1x2";
  const is2x2 = size === "2x2";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (isPreview) return;

    const [loadedSessions, loadedSubjects] = await Promise.all([
      StorageService.getSessions(),
      StorageService.getSubjects(),
    ]);

    setSessions(loadedSessions);
    setSubjects(loadedSubjects);
  };

  const radarData = useMemo(() => {
    // Helper function to generate hardcoded/dummy data
    const generateDummyData = () => {
      const dummySubjects: Subject[] = [
        {
          id: "math",
          name: "Math",
          icon: "calculator-outline",
          color: accentColor,
        },
        {
          id: "science",
          name: "Science",
          icon: "flask-outline",
          color: accentColor,
        },
        {
          id: "history",
          name: "History",
          icon: "book-outline",
          color: accentColor,
        },
        {
          id: "english",
          name: "English",
          icon: "create-outline",
          color: accentColor,
        },
        {
          id: "art",
          name: "Art",
          icon: "color-palette-outline",
          color: accentColor,
        },
        {
          id: "music",
          name: "Music",
          icon: "musical-notes-outline",
          color: accentColor,
        },
      ];
      const dummyMinutes = [120, 110, 100, 95, 85, 80];
      const maxMinutes = Math.max(...dummyMinutes, 120);
      const dataPoints: RadarDataPoint[] = dummySubjects.map((subject, i) => ({
        subject,
        minutes: dummyMinutes[i],
        percentage: (dummyMinutes[i] / maxMinutes) * 100,
      }));
      return { dataPoints, maxMinutes };
    };

    // Always show dummy data in preview mode
    if (isPreview) {
      return generateDummyData();
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Filter sessions from last 7 days
    const recentSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.date);
      return sessionDate >= sevenDaysAgo;
    });

    // If no sessions exist at all, show hardcoded dummy data
    if (sessions.length === 0) {
      return generateDummyData();
    }

    // Group by subject
    const subjectMinutes: Record<string, number> = {};
    recentSessions.forEach((session) => {
      const subjectId = session.subjectId || "general";
      subjectMinutes[subjectId] =
        (subjectMinutes[subjectId] || 0) + Math.floor(session.duration / 60);
    });

    // Get top 5-6 subjects
    const topSubjects = Object.entries(subjectMinutes)
      .map(([subjectId, minutes]) => {
        const subject = subjects.find((s) => s.id === subjectId);
        return {
          subject: subject || {
            id: subjectId,
            name: "Other",
            color: accentColor,
            icon: "book-outline" as any,
          },
          minutes,
        };
      })
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6);

    // If no data for last 7 days, show hardcoded dummy data
    if (topSubjects.length === 0) {
      return generateDummyData();
    }

    // Calculate percentages
    const maxMinutes = Math.max(...topSubjects.map((s) => s.minutes), 60);
    const dataPoints: RadarDataPoint[] = topSubjects.map((item) => ({
      subject: item.subject,
      minutes: item.minutes,
      percentage: (item.minutes / maxMinutes) * 100,
    }));

    return { dataPoints, maxMinutes };
  }, [sessions, subjects, accentColor, isPreview]);

  const handlePress = () => {
    if (!isEditMode && !isPreview) {
      onNavigateToStats();
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Calculate radar chart points
  const calculateRadarPoints = (
    centerX: number,
    centerY: number,
    radius: number,
    dataPoints: RadarDataPoint[]
  ): string => {
    if (!dataPoints || dataPoints.length === 0) return "";

    const points = dataPoints.map((point, index) => {
      const angle = (index / dataPoints.length) * 2 * Math.PI - Math.PI / 2;
      const distance = ((point?.percentage || 0) / 100) * radius;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
      return `${x},${y}`;
    });

    return points.join(" ");
  };

  const renderRadarChart = (chartSize: number, showLabels: boolean = true) => {
    const padding = showLabels ? (is2x2 ? 45 : 30) : 10;
    const center = chartSize / 2;
    const maxRadius = center - padding;

    const dataPoints = radarData.dataPoints;
    const numPoints = dataPoints.length;

    // Safety check - should never happen now, but just in case
    if (dataPoints.length === 0) {
      return (
        <View
          style={[
            styles.radarContainer,
            { width: chartSize, height: chartSize },
          ]}
        >
          <View style={styles.placeholderRadar}>
            <Ionicons
              name="stats-chart"
              size={chartSize * 0.3}
              color={colors.border}
            />
            <Text
              style={[styles.placeholderText, { color: colors.textSecondary }]}
            >
              No data yet
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[styles.radarContainer, { width: chartSize, height: chartSize }]}
      >
        <Svg width={chartSize} height={chartSize}>
          {/* Grid circles (3 levels) - subtle and clean */}
          {[0.33, 0.66, 1].map((scale, i) => (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={maxRadius * scale}
              fill="none"
              stroke={isDark ? "#ffffff20" : "#00000015"}
              strokeWidth={1}
            />
          ))}

          {/* Axis lines - very subtle */}
          {dataPoints.map((point, index) => {
            const angle = (index / numPoints) * 2 * Math.PI - Math.PI / 2;
            const endX = center + maxRadius * Math.cos(angle);
            const endY = center + maxRadius * Math.sin(angle);

            return (
              <Line
                key={`axis-${index}`}
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke={isDark ? "#ffffff18" : "#00000012"}
                strokeWidth={1}
              />
            );
          })}

          {/* Data polygon - using accent color with transparency */}
          <Polygon
            points={calculateRadarPoints(center, center, maxRadius, dataPoints)}
            fill={`${accentColor}20`}
            stroke={accentColor}
            strokeWidth={2}
          />

          {/* Data points circles - accent color */}
          {dataPoints.map((point, index) => {
            const angle = (index / numPoints) * 2 * Math.PI - Math.PI / 2;
            const distance = (point.percentage / 100) * maxRadius;
            const x = center + distance * Math.cos(angle);
            const y = center + distance * Math.sin(angle);

            return (
              <Circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r={3}
                fill={accentColor}
                stroke={isDark ? "#ffffff40" : "#00000020"}
                strokeWidth={1.5}
              />
            );
          })}

          {/* Labels */}
          {showLabels &&
            dataPoints.map((point, index) => {
              const angle = (index / numPoints) * 2 * Math.PI - Math.PI / 2;
              const labelDistance = maxRadius + (is2x2 ? 30 : 20);
              const x = center + labelDistance * Math.cos(angle);
              const y = center + labelDistance * Math.sin(angle);

              // Adjust text anchor based on position
              let textAnchor: "start" | "middle" | "end" = "middle";
              if (x > center + 5) textAnchor = "start";
              else if (x < center - 5) textAnchor = "end";

              // For 2x2: show full text with smaller font size (no truncation)
              // For other sizes: truncate to 8 characters
              const displayText = is2x2
                ? point.subject?.name || ""
                : point.subject?.name?.length > 8
                ? point.subject.name.substring(0, 7) + "."
                : point.subject?.name || "";

              return (
                <SvgText
                  key={`label-${index}`}
                  x={x}
                  y={y}
                  fill={colors.text}
                  fontSize={is1x1 ? 8 : is2x2 ? 8 : 9}
                  fontWeight="600"
                  textAnchor={textAnchor}
                  opacity={0.8}
                >
                  {displayText}
                </SvgText>
              );
            })}
        </Svg>
      </View>
    );
  };

  const renderLegend = () => {
    // Always render legend if we have data points (which we always should now)
    if (radarData.dataPoints.length === 0) return null;

    return (
      <View style={styles.legend}>
        {radarData.dataPoints
          .slice(0, is1x1 ? 2 : is2x1 ? 3 : 6)
          .map((point, index) => (
            <View
              key={point.subject?.id || `subject-${index}`}
              style={styles.legendItem}
            >
              <View
                style={[styles.legendDot, { backgroundColor: accentColor }]}
              />
              <Text
                style={[
                  styles.legendText,
                  { color: colors.text, fontSize: is1x1 ? 9 : 11 },
                ]}
                numberOfLines={1}
              >
                {point.subject?.name || "Unknown"}
              </Text>
              <Text
                style={[
                  styles.legendValue,
                  {
                    color: accentColor,
                    fontSize: is1x1 ? 9 : 11,
                  },
                ]}
              >
                {formatTime(point.minutes)}
              </Text>
            </View>
          ))}
      </View>
    );
  };

  // Layout variants based on size
  if (is1x1) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: colors.background,
            borderColor: colors.border,
            overflow: isPreview ? "visible" : "hidden",
          },
        ]}
        onPress={handlePress}
        disabled={isEditMode || isPreview}
        activeOpacity={0.7}
      >
        {isPreview && (
          <View
            style={[
              styles.titleContainer,
              {
                backgroundColor: accentColor,
                borderWidth: 2,
                borderColor: colors.background,
              },
            ]}
          >
            <Text style={styles.widgetTitle}>Stats Radar</Text>
          </View>
        )}

        <View style={styles.content1x1}>
          {renderRadarChart(dimensions.width - 32, false)}
        </View>
      </TouchableOpacity>
    );
  }

  if (is2x1) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: colors.background,
            borderColor: colors.border,
            overflow: isPreview ? "visible" : "hidden",
          },
        ]}
        onPress={handlePress}
        disabled={isEditMode || isPreview}
        activeOpacity={0.7}
      >
        {isPreview && (
          <View
            style={[
              styles.titleContainer,
              {
                backgroundColor: accentColor,
                borderWidth: 2,
                borderColor: colors.background,
              },
            ]}
          >
            <Text style={styles.widgetTitle}>Stats Radar</Text>
          </View>
        )}

        <View style={styles.content2x1}>
          <View style={styles.radarSection}>
            {renderRadarChart(dimensions.height - 32, true)}
          </View>
          <View style={styles.legendSection}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Last 7 Days
            </Text>
            {renderLegend()}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (is1x2) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: colors.background,
            borderColor: colors.border,
            overflow: isPreview ? "visible" : "hidden",
          },
        ]}
        onPress={handlePress}
        disabled={isEditMode || isPreview}
        activeOpacity={0.7}
      >
        {isPreview && (
          <View
            style={[
              styles.titleContainer,
              {
                backgroundColor: accentColor,
                borderWidth: 2,
                borderColor: colors.background,
              },
            ]}
          >
            <Text style={styles.widgetTitle}>Stats Radar</Text>
          </View>
        )}

        <View style={styles.content1x2}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Weekly Focus
          </Text>
          {renderRadarChart(dimensions.width - 32, false)}
          {renderLegend()}
        </View>
      </TouchableOpacity>
    );
  }

  // 2x2: Full featured radar chart
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: colors.background,
          borderColor: colors.border,
          overflow: isPreview ? "visible" : "hidden",
        },
      ]}
      onPress={handlePress}
      disabled={isEditMode || isPreview}
      activeOpacity={0.7}
    >
      {isPreview && (
        <View
          style={[
            styles.titleContainer,
            {
              backgroundColor: accentColor,
              borderWidth: 2,
              borderColor: colors.background,
            },
          ]}
        >
          <Text style={styles.widgetTitle}>Stats Radar</Text>
        </View>
      )}

      <View style={styles.content2x2}>
        <View style={styles.header2x2}>
          <Text style={[styles.titleLarge, { color: colors.text }]}>
            Study Analysis
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Last 7 days by subject
          </Text>
        </View>

        {renderRadarChart(
          Math.min(dimensions.width, dimensions.height) - 80,
          true
        )}

        <View style={styles.legendGrid}>{renderLegend()}</View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
    justifyContent: "flex-start",
    position: "relative",
  },
  titleContainer: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  widgetTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },

  // 1x1 layout
  content1x1: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // 2x1 layout
  content2x1: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
  },
  radarSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  legendSection: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },

  // 1x2 layout
  content1x2: {
    flex: 1,
    gap: 12,
    alignItems: "center",
  },

  // 2x2 layout
  content2x2: {
    flex: 1,
    gap: 16,
    alignItems: "center",
  },
  header2x2: {
    alignItems: "center",
    gap: 4,
  },
  titleLarge: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Radar chart
  radarContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderRadar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Legend
  legend: {
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    flex: 1,
    fontWeight: "600",
  },
  legendValue: {
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  legendGrid: {
    width: "100%",
    gap: 10,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
});
