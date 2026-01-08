import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { Task } from "../types";
import * as StorageService from "../services/storage";
import CalendarPicker from "../components/CalendarPicker";

interface TasksScreenProps {
  navigation?: any;
}

export default function TasksScreen({ navigation }: TasksScreenProps) {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(
    undefined
  );
  const [subjects, setSubjects] = useState<any[]>([]);

  // Load tasks and subjects
  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
      loadSubjects();
    }, [])
  );

  const loadTasks = async () => {
    const loaded = await StorageService.getTasks();
    setTasks(loaded);
  };

  const loadSubjects = async () => {
    const loaded = await StorageService.getSubjects();
    setSubjects(loaded);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updates: Partial<Task> = {
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    };

    await StorageService.updateTask(id, updates);
    await loadTasks();
  };

  const addTask = async () => {
    if (!newTaskText.trim()) return;

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
    await loadTasks();
  };

  const handleDeleteTask = async (id: string) => {
    await StorageService.deleteTask(id);
    await loadTasks();
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

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  };

  const isDueToday = (task: Task) => {
    if (!task.dueDate || task.completed) return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // Completed tasks go to bottom
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // Finally by creation date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getCategorySubject = (categoryId?: string) => {
    if (!categoryId) return null;
    return subjects.find((s) => s.id === categoryId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>Tasks</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {tasks.filter((t) => !t.completed).length} remaining
        </Text>

        {/* Priority Selector */}
        <View style={styles.priorityContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Priority:
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
                        : colors.card,
                  },
                ]}
                onPress={() => setSelectedPriority(priority)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    {
                      color:
                        selectedPriority === priority ? "white" : colors.text,
                    },
                  ]}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category and Due Date Row */}
        <View style={styles.metaRow}>
          <TouchableOpacity
            style={[styles.metaButton, { backgroundColor: colors.card }]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Ionicons name="folder-outline" size={20} color={colors.text} />
            <Text style={[styles.metaText, { color: colors.text }]}>
              {selectedCategory
                ? getCategorySubject(selectedCategory)?.name || "Category"
                : "Category"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metaButton, { backgroundColor: colors.card }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
            <Text style={[styles.metaText, { color: colors.text }]}>
              {selectedDueDate
                ? formatDueDate(selectedDueDate.toISOString())
                : "Due Date"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Task Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Add a new task..."
            placeholderTextColor={colors.textSecondary}
            value={newTaskText}
            onChangeText={setNewTaskText}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={addTask}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
        <View style={styles.tasksList}>
          {sortedTasks.map((task) => {
            const categorySubject = getCategorySubject(task.category);
            return (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  {
                    backgroundColor: colors.card,
                    borderLeftWidth: 3,
                    borderLeftColor: getPriorityColor(task.priority),
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.taskCheckbox}
                  onPress={() => toggleTask(task.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: task.completed
                          ? colors.accent
                          : colors.textSecondary,
                        backgroundColor: task.completed
                          ? colors.accent
                          : "transparent",
                      },
                    ]}
                  >
                    {task.completed && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskText,
                      {
                        color: task.completed
                          ? colors.textSecondary
                          : colors.text,
                        textDecorationLine: task.completed
                          ? "line-through"
                          : "none",
                      },
                    ]}
                  >
                    {task.text}
                  </Text>

                  <View style={styles.taskMeta}>
                    {categorySubject && (
                      <View style={styles.categoryBadge}>
                        <Ionicons
                          name={categorySubject.icon}
                          size={12}
                          color={categorySubject.color}
                        />
                        <Text
                          style={[
                            styles.categoryText,
                            { color: categorySubject.color },
                          ]}
                        >
                          {categorySubject.name}
                        </Text>
                      </View>
                    )}

                    {task.dueDate && (
                      <View
                        style={[
                          styles.dueBadge,
                          {
                            backgroundColor: isOverdue(task)
                              ? "#ff3b3020"
                              : isDueToday(task)
                              ? "#ff950020"
                              : colors.background,
                          },
                        ]}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={
                            isOverdue(task)
                              ? "#ff3b30"
                              : isDueToday(task)
                              ? "#ff9500"
                              : colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.dueText,
                            {
                              color: isOverdue(task)
                                ? "#ff3b30"
                                : isDueToday(task)
                                ? "#ff9500"
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {formatDueDate(task.dueDate)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTask(task.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.destructive}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Category
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => {
                  setSelectedCategory(undefined);
                  setShowCategoryPicker(false);
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  No Category
                </Text>
              </TouchableOpacity>

              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor:
                        selectedCategory === subject.id
                          ? `${subject.color}20`
                          : colors.background,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategory(subject.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Ionicons
                    name={subject.icon}
                    size={24}
                    color={subject.color}
                  />
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {subject.name}
                  </Text>
                  {selectedCategory === subject.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={subject.color}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <CalendarPicker
            selectedDate={selectedDueDate}
            onSelectDate={(date) => {
              setSelectedDueDate(date);
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
            colors={colors}
            accentColor={colors.accent}
          />
        </Modal>
      )}
    </View>
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
    fontWeight: "300",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  metaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  metaText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  taskCheckbox: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dueText: {
    fontSize: 11,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "70%",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalScroll: {
    maxHeight: 400,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
  },
  dateOption: {
    padding: 16,
  },
  dateText: {
    fontSize: 16,
  },
});
