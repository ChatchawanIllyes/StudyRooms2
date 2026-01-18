import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { StudySession, Subject } from "../types";
import * as StorageService from "../services/storage";

interface DayDetailSheetProps {
  visible: boolean;
  date: Date | null;
  sessions: StudySession[];
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function DayDetailSheet({
  visible,
  date,
  sessions,
  onClose,
}: DayDetailSheetProps) {
  const { colors, accentColor } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slideAnim] = useState(new Animated.Value(SHEET_HEIGHT));

  // Load subjects
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const subs = await StorageService.getSubjects();
    setSubjects(subs);
  };

  // Animate sheet in/out
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!date) return null;

  // Format date
  const dateText = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate total time
  const totalMinutes = sessions.reduce((sum, session) => {
    return sum + Math.floor(session.duration / 60);
  }, 0);

  // Format time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Format session start time
  const formatSessionTime = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get subject info
  const getSubjectInfo = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId) || null;
  };

  // Sort sessions by time (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.background,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Handle bar */}
              <View style={styles.handleContainer}>
                <View
                  style={[styles.handle, { backgroundColor: colors.border }]}
                />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {dateText}
                  </Text>
                  <Text
                    style={[
                      styles.totalTimeText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {sessions.length === 0
                      ? "No study sessions"
                      : `${formatTime(totalMinutes)} total • ${
                          sessions.length
                        } ${sessions.length === 1 ? "session" : "sessions"}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Sessions list */}
              <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {sessions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View
                      style={[
                        styles.emptyIconContainer,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={48}
                        color={colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[styles.emptyText, { color: colors.textSecondary }]}
                    >
                      No study sessions on this day
                    </Text>
                  </View>
                ) : (
                  sortedSessions.map((session) => {
                    const subjectInfo = getSubjectInfo(session.subjectId);
                    const sessionMinutes = Math.floor(session.duration / 60);
                    const sessionColor = subjectInfo?.color || accentColor;

                    return (
                      <View
                        key={session.id}
                        style={[styles.sessionCard, { backgroundColor: colors.card }]}
                      >
                        {/* Subject icon and info */}
                        <View style={styles.sessionHeader}>
                          <View
                            style={[
                              styles.subjectIcon,
                              { backgroundColor: `${sessionColor}20` },
                            ]}
                          >
                            <Ionicons
                              name={
                                (subjectInfo?.icon as any) || "book-outline"
                              }
                              size={20}
                              color={sessionColor}
                            />
                          </View>
                          <View style={styles.sessionInfo}>
                            <Text
                              style={[styles.subjectName, { color: colors.text }]}
                            >
                              {session.subject}
                            </Text>
                            <Text
                              style={[
                                styles.sessionTime,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {formatSessionTime(session.date)}
                            </Text>
                          </View>
                          <View style={styles.sessionDuration}>
                            <Text
                              style={[
                                styles.durationText,
                                { color: sessionColor },
                              ]}
                            >
                              {formatTime(sessionMinutes)}
                            </Text>
                          </View>
                        </View>

                        {/* Notes if available */}
                        {session.notes && (
                          <View
                            style={[
                              styles.notesContainer,
                              { borderTopColor: colors.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.notesText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {session.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  totalTimeText: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  sessionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 13,
  },
  sessionDuration: {
    alignItems: "flex-end",
  },
  durationText: {
    fontSize: 15,
    fontWeight: "700",
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
