import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export default function TasksScreen() {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Review calculus notes', completed: false },
    { id: '2', text: 'Complete chemistry lab report', completed: true },
    { id: '3', text: 'Read chapters 5-7 for history', completed: false },
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      setTasks((prev) => [
        ...prev,
        { id: Date.now().toString(), text: newTaskText, completed: false },
      ]);
      setNewTaskText('');
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
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
          {tasks.map((task) => (
            <View
              key={task.id}
              style={[styles.taskItem, { backgroundColor: colors.card }]}
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
                        : 'transparent',
                    },
                  ]}
                >
                  {task.completed && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              <Text
                style={[
                  styles.taskText,
                  {
                    color: task.completed ? colors.textSecondary : colors.text,
                    textDecorationLine: task.completed ? 'line-through' : 'none',
                  },
                ]}
              >
                {task.text}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTask(task.id)}
              >
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
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
    fontWeight: '300',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
});
