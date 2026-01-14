import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { WidgetSize } from "../context/WidgetContext";
import { Task, Subject } from "../types";
import * as StorageService from "../services/storage";
import CalendarPicker from "./CalendarPicker";

interface TaskWidgetProps {
  size: WidgetSize;
  isEditMode: boolean;
  onNavigateToTasks: () => void;
  isPreview?: boolean;
}

export default function TaskWidget({
  size,
  isEditMode,
  onNavigateToTasks,
  isPreview = false,
}: TaskWidgetProps) {
  const { colors, accentColor } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(
    undefined
  );
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Calculate widget dimensions based on size
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
  const is2x2 = size === "2x2";
  const is1x1 = size === "1x1";
  const is1x2 = size === "1x2";
  const is2x1 = size === "2x1";

  // Determine max tasks to show based on size
  const getMaxTasks = () => {
    if (is1x1) return 2;
    if (is2x1) return 4;
    if (is1x2) return 5;
    if (is2x2) return 8;
    return 3;
  };

  const maxTasks = getMaxTasks();

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isPreview) {
        loadTasks();
        loadSubjects();
      }
    }, [isPreview])
  );

  const loadTasks = useCallback(async () => {
    const allTasks = await StorageService.getTasks();
    // Filter incomplete tasks and sort by priority
    const incompleteTasks = allTasks
      .filter((task) => !task.completed)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    setTasks(incompleteTasks);
  }, []);

  const loadSubjects = useCallback(async () => {
    const allSubjects = await StorageService.getSubjects();
    setSubjects(allSubjects);
  }, []);

  const handleToggleTask = async (taskId: string) => {
    if (isEditMode || isPreview) return;

    // Mark as complete
    await StorageService.updateTask(taskId, {
      completed: true,
      completedAt: new Date().toISOString(),
    });

    // Reload tasks (completed ones will be filtered out)
    await loadTasks();
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || isPreview) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: selectedPriority,
      category: selectedCategory,
      dueDate: selectedDueDate?.toISOString(),
    };

    await StorageService.addTask(newTask);
    setNewTaskText("");
    setSelectedPriority("medium");
    setSelectedCategory(undefined);
    setSelectedDueDate(undefined);
    setShowAddModal(false);
    await loadTasks();
  };

  const getSubject = (categoryId?: string): Subject | null => {
    if (!categoryId) return null;
    return subjects.find((s) => s.id === categoryId) || null;
  };

  const handleTilePress = () => {
    if (!isEditMode && !isPreview) {
      onNavigateToTasks();
    }
  };

  const handleAddButtonPress = () => {
    if (!isEditMode && !isPreview) {
      setShowAddModal(true);
    }
  };

  const getPriorityColor = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "#ff3b30";
      case "medium":
        return "#ff9500";
      case "low":
        return "#34c759";
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return is1x2 ? "Tmrw" : "Tomorrow";
    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      return `${daysOverdue}d overdue`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Preview tasks for demo
  const previewTasks: Task[] = [
    {
      id: "1",
      text: "Complete assignment",
      completed: false,
      createdAt: new Date().toISOString(),
      priority: "high",
    },
    {
      id: "2",
      text: "Review notes",
      completed: false,
      createdAt: new Date().toISOString(),
      priority: "medium",
    },
  ];

  const displayTasks = isPreview ? previewTasks : tasks;
  const visibleTasks = displayTasks.slice(0, maxTasks);
  const remainingCount = Math.max(0, displayTasks.length - maxTasks);

  return (
    <>
      <View
        style={[
          styles.container,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: "transparent",
            overflow: isPreview ? "visible" : "hidden",
          },
        ]}
      >
        {/* Widget Title */}
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
            <Text style={[styles.widgetTitle, { color: "#FFFFFF" }]}>
              Tasks
            </Text>
          </View>
        )}

        {/* Header with title and add button */}
        <TouchableOpacity
          style={styles.header}
          onPress={handleTilePress}
          disabled={isEditMode || isPreview}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text,
                fontSize: is1x1 ? 16 : 18,
              },
            ]}
          >
            Tasks
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: isEditMode ? `${accentColor}30` : accentColor,
                opacity: isEditMode ? 0.4 : 1,
              },
            ]}
            onPress={(e) => {
              e?.stopPropagation?.();
              handleAddButtonPress();
            }}
            disabled={isEditMode || isPreview}
          >
            <Ionicons name="add" size={is1x1 ? 16 : 18} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Tasks List */}
        <ScrollView
          style={styles.tasksList}
          contentContainerStyle={styles.tasksListContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isEditMode && !isPreview}
          nestedScrollEnabled={true}
          bounces={false}
        >
          {visibleTasks.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyState}
              onPress={handleTilePress}
              disabled={isEditMode || isPreview}
              activeOpacity={0.7}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={is1x1 ? 32 : 40}
                color={colors.border}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.textSecondary, fontSize: is1x1 ? 12 : 13 },
                ]}
              >
                No tasks yet
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {visibleTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  colors={colors}
                  accentColor={accentColor}
                  widgetSize={size}
                  is1x1={is1x1}
                  getPriorityColor={getPriorityColor}
                  formatDueDate={formatDueDate}
                  getSubject={getSubject}
                />
              ))}
              {remainingCount > 0 && (
                <Text
                  style={[
                    styles.remainingText,
                    { color: colors.textSecondary },
                  ]}
                >
                  +{remainingCount} more task{remainingCount > 1 ? "s" : ""}
                </Text>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* Add Task Modal */}
      {showAddModal && (
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[styles.modalContent, { backgroundColor: colors.card }]}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                >
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      New Task
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowAddModal(false);
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="What needs to be done?"
                    placeholderTextColor={colors.textSecondary}
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    autoFocus
                    multiline
                    maxLength={200}
                    returnKeyType="done"
                    blurOnSubmit
                  />

                  {/* Priority Selector */}
                  <View style={styles.prioritySection}>
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Priority
                    </Text>
                    <View style={styles.priorityButtons}>
                      {(["low", "medium", "high"] as const).map((priority) => (
                        <TouchableOpacity
                          key={priority}
                          style={[
                            styles.priorityButton,
                            {
                              backgroundColor:
                                selectedPriority === priority
                                  ? getPriorityColor(priority)
                                  : colors.border,
                            },
                          ]}
                          onPress={() => setSelectedPriority(priority)}
                        >
                          <Text
                            style={[
                              styles.priorityButtonText,
                              {
                                color:
                                  selectedPriority === priority
                                    ? "#FFFFFF"
                                    : colors.text,
                              },
                            ]}
                          >
                            {priority.charAt(0).toUpperCase() +
                              priority.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Due Date Selector */}
                  <View style={styles.dueDateSection}>
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Due Date (Optional)
                    </Text>
                    <View style={styles.dueDateButtons}>
                      <TouchableOpacity
                        style={[
                          styles.dueDateButton,
                          {
                            backgroundColor: selectedDueDate
                              ? accentColor
                              : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setShowAddModal(false);
                          const timeout = setTimeout(() => setShowCalendar(true), 300);
                          timeoutRefs.current.push(timeout);
                        }}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={selectedDueDate ? "#FFFFFF" : colors.text}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.dueDateButtonText,
                            {
                              color: selectedDueDate ? "#FFFFFF" : colors.text,
                            },
                          ]}
                        >
                          {selectedDueDate
                            ? selectedDueDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Pick Date"}
                        </Text>
                      </TouchableOpacity>
                      {selectedDueDate && (
                        <TouchableOpacity
                          style={[
                            styles.dueDateButton,
                            {
                              backgroundColor: colors.border,
                              paddingHorizontal: 12,
                            },
                          ]}
                          onPress={() => setSelectedDueDate(undefined)}
                        >
                          <Ionicons
                            name="close"
                            size={16}
                            color={colors.text}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Subject/Category Selector */}
                  <View style={styles.dueDateSection}>
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Subject (Optional)
                    </Text>
                    <View style={styles.dueDateButtons}>
                      <TouchableOpacity
                        style={[
                          styles.dueDateButton,
                          {
                            backgroundColor: selectedCategory
                              ? accentColor
                              : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setShowAddModal(false);
                          const timeout = setTimeout(() => setShowCategoryPicker(true), 300);
                          timeoutRefs.current.push(timeout);
                        }}
                      >
                        <Ionicons
                          name="folder-outline"
                          size={16}
                          color={selectedCategory ? "#FFFFFF" : colors.text}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.dueDateButtonText,
                            {
                              color: selectedCategory ? "#FFFFFF" : colors.text,
                            },
                          ]}
                        >
                          {selectedCategory
                            ? getSubject(selectedCategory)?.name || "Subject"
                            : "Pick Subject"}
                        </Text>
                      </TouchableOpacity>
                      {selectedCategory && (
                        <TouchableOpacity
                          style={[
                            styles.dueDateButton,
                            {
                              backgroundColor: colors.border,
                              paddingHorizontal: 12,
                            },
                          ]}
                          onPress={() => setSelectedCategory(undefined)}
                        >
                          <Ionicons
                            name="close"
                            size={16}
                            color={colors.text}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Add Button */}
                  <TouchableOpacity
                    style={[
                      styles.addTaskButton,
                      {
                        backgroundColor: newTaskText.trim()
                          ? accentColor
                          : colors.border,
                        opacity: newTaskText.trim() ? 1 : 0.5,
                      },
                    ]}
                    onPress={handleAddTask}
                    disabled={!newTaskText.trim()}
                  >
                    <Text style={styles.addTaskButtonText}>Add Task</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Calendar Picker Modal */}
      {showCalendar && (
        <Modal
          visible={showCalendar}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowCalendar(false);
            const timeout = setTimeout(() => setShowAddModal(true), 300);
            timeoutRefs.current.push(timeout);
          }}
        >
          <CalendarPicker
            selectedDate={selectedDueDate}
            onSelectDate={(date) => {
              setSelectedDueDate(date);
              setShowCalendar(false);
              const timeout = setTimeout(() => setShowAddModal(true), 300);
              timeoutRefs.current.push(timeout);
            }}
            onClose={() => {
              setShowCalendar(false);
              const timeout = setTimeout(() => setShowAddModal(true), 300);
              timeoutRefs.current.push(timeout);
            }}
            colors={colors}
            accentColor={accentColor}
          />
        </Modal>
      )}

      {/* Category/Subject Picker Modal */}
      {showCategoryPicker && (
        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowCategoryPicker(false);
            const timeout = setTimeout(() => setShowAddModal(true), 300);
            timeoutRefs.current.push(timeout);
          }}
        >
          <TouchableOpacity
            style={styles.calendarOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowCategoryPicker(false);
              const timeout = setTimeout(() => setShowAddModal(true), 300);
              timeoutRefs.current.push(timeout);
            }}
          >
            <TouchableOpacity
              style={styles.calendarContainerWrapper}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View
                style={[
                  styles.calendarContainer,
                  { backgroundColor: colors.card },
                ]}
              >
                <Text
                  style={[
                    styles.calendarTitle,
                    { color: colors.text, marginBottom: 20 },
                  ]}
                >
                  Select Subject
                </Text>
                <ScrollView style={{ maxHeight: 400 }}>
                  <TouchableOpacity
                    style={[
                      styles.subjectOption,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() => {
                      setSelectedCategory(undefined);
                      setShowCategoryPicker(false);
                      const timeout = setTimeout(() => setShowAddModal(true), 300);
                      timeoutRefs.current.push(timeout);
                    }}
                  >
                    <Text style={[styles.subjectText, { color: colors.text }]}>
                      No Subject
                    </Text>
                  </TouchableOpacity>
                  {subjects.map((subject) => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectOption,
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => {
                        setSelectedCategory(subject.id);
                        setShowCategoryPicker(false);
                        const timeout = setTimeout(() => setShowAddModal(true), 300);
                        timeoutRefs.current.push(timeout);
                      }}
                    >
                      <View
                        style={[
                          styles.subjectIconContainer,
                          { backgroundColor: subject.color },
                        ]}
                      >
                        <Ionicons
                          name={subject.icon}
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text
                        style={[styles.subjectText, { color: colors.text }]}
                      >
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  colors: any;
  accentColor: string;
  widgetSize: WidgetSize;
  is1x1: boolean;
  getPriorityColor: (priority: "low" | "medium" | "high") => string;
  formatDueDate: (dateString?: string) => string | null;
  getSubject: (categoryId?: string) => Subject | null;
}

function TaskItem({
  task,
  onToggle,
  colors,
  accentColor,
  widgetSize,
  is1x1,
  getPriorityColor,
  formatDueDate,
  getSubject,
}: TaskItemProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onToggle(task.id);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dueDate = formatDueDate(task.dueDate);
  const priorityColor = getPriorityColor(task.priority);
  const subject = getSubject(task.category);

  // 1x1: Super compact - emoji subject only
  if (is1x1) {
    return (
      <Animated.View style={[styles.taskItem, animatedStyle]}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkboxInner,
              { borderColor: colors.border, backgroundColor: "transparent" },
            ]}
          />
        </TouchableOpacity>

        <View style={[styles.taskContent, { gap: 2 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {subject && (
              <View
                style={[styles.subjectDot, { backgroundColor: subject.color }]}
              />
            )}
            <Text
              style={[
                styles.taskText,
                {
                  color: colors.text,
                  fontSize: 13,
                  flex: 1,
                },
              ]}
              numberOfLines={1}
            >
              {task.text}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // 2x1: Horizontal layout - subject badge inline
  if (widgetSize === "2x1") {
    return (
      <Animated.View style={[styles.taskItem, animatedStyle]}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkboxInner,
              { borderColor: colors.border, backgroundColor: "transparent" },
            ]}
          />
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              style={[
                styles.taskText,
                {
                  color: colors.text,
                  fontSize: 14,
                  flex: 1,
                },
              ]}
              numberOfLines={1}
            >
              {task.text}
            </Text>
            {subject && (
              <View
                style={[
                  styles.subjectBadge,
                  { backgroundColor: `${subject.color}20` },
                ]}
              >
                <Ionicons name={subject.icon} size={12} color={subject.color} />
              </View>
            )}
          </View>
          {(dueDate || task.priority) && (
            <View style={styles.taskMeta}>
              {task.priority && (
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: `${priorityColor}20` },
                  ]}
                >
                  <Text
                    style={[styles.priorityBadgeText, { color: priorityColor }]}
                  >
                    {task.priority}
                  </Text>
                </View>
              )}
              {dueDate && (
                <Text
                  style={[styles.dueDateText, { color: colors.textSecondary }]}
                >
                  {dueDate}
                </Text>
              )}
            </View>
          )}
        </View>

        <View
          style={[styles.priorityIndicator, { backgroundColor: priorityColor }]}
        />
      </Animated.View>
    );
  }

  // 1x2 & 2x2: Full layout - subject below title
  return (
    <Animated.View style={[styles.taskItem, animatedStyle]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkboxInner,
            { borderColor: colors.border, backgroundColor: "transparent" },
          ]}
        />
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskText,
            {
              color: colors.text,
              fontSize: 14,
            },
          ]}
          numberOfLines={2}
        >
          {task.text}
        </Text>
        <View style={[styles.taskMeta, { flexWrap: "wrap" }]}>
          {subject && (
            <View
              style={[
                styles.subjectBadge,
                { backgroundColor: `${subject.color}20`, paddingHorizontal: 8 },
              ]}
            >
              <Ionicons name={subject.icon} size={12} color={subject.color} />
              <Text
                style={[
                  styles.subjectBadgeText,
                  { color: subject.color, marginLeft: 4 },
                ]}
              >
                {subject.name}
              </Text>
            </View>
          )}
          {task.priority && (
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: `${priorityColor}20` },
              ]}
            >
              <Text
                style={[styles.priorityBadgeText, { color: priorityColor }]}
              >
                {task.priority}
              </Text>
            </View>
          )}
          {dueDate && (
            <Text style={[styles.dueDateText, { color: colors.textSecondary }]}>
              {dueDate}
            </Text>
          )}
        </View>
      </View>

      <View
        style={[styles.priorityIndicator, { backgroundColor: priorityColor }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tasksList: {
    flexGrow: 1,
    flexShrink: 1,
  },
  tasksListContent: {
    gap: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 8,
    fontWeight: "500",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskText: {
    fontWeight: "500",
    lineHeight: 18,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dueDateText: {
    fontSize: 11,
    fontWeight: "500",
  },
  priorityIndicator: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
    marginTop: 2,
  },
  subjectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subjectBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  subjectOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  subjectIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectText: {
    fontSize: 16,
    fontWeight: "500",
  },
  remainingText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 60,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  prioritySection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priorityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dueDateSection: {
    marginBottom: 20,
  },
  dueDateButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dueDateButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  dueDateButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  addTaskButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  addTaskButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  calendarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  calendarContainerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarContainer: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarNav: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  weekDaysRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  calendarCloseButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  calendarCloseText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
