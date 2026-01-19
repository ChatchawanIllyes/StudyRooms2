import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import * as StorageService from "../services/storage";

const COLOR_PALETTE = [
  { name: "Sky Blue", value: "#5b9bd5" },
  { name: "Green", value: "#34c759" },
  { name: "Orange", value: "#ff9500" },
  { name: "Purple", value: "#af52de" },
  { name: "Pink", value: "#ff2d55" },
  { name: "Teal", value: "#5ac8fa" },
  { name: "Indigo", value: "#5856d6" },
  { name: "Red", value: "#ff3b30" },
  { name: "Yellow", value: "#ffcc00" },
];

export default function SettingsScreen() {
  const { colors, isDark, toggleDark, accentColor, setAccentColor } =
    useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showBreakPicker, setShowBreakPicker] = useState(false);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120); // Default: 2 hours
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(5); // Default: 5 minutes
  const [tempHours, setTempHours] = useState("2");
  const [tempMinutes, setTempMinutes] = useState("0");
  const [tempBreakMinutes, setTempBreakMinutes] = useState("5");

  useEffect(() => {
    loadDailyGoal();
    loadBreakDuration();
  }, []);

  const loadDailyGoal = async () => {
    try {
      const settings = await StorageService.getUserSettings();
      setDailyGoalMinutes(settings.dailyGoalMinutes);
      setBreakDurationMinutes(settings.breakDuration);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadBreakDuration = async () => {
    // Combined with loadDailyGoal - keeping for backward compatibility
    // but it now does nothing since loadDailyGoal loads both
  };

  const saveDailyGoal = async (minutes: number) => {
    try {
      await StorageService.saveUserSettings({ dailyGoalMinutes: minutes });
      setDailyGoalMinutes(minutes);
    } catch (error) {
      console.error("Error saving daily goal:", error);
    }
  };

  const formatGoalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const openGoalPicker = () => {
    const hours = Math.floor(dailyGoalMinutes / 60);
    const mins = dailyGoalMinutes % 60;
    setTempHours(hours.toString());
    setTempMinutes(mins.toString());
    setShowGoalPicker(true);
  };

  const saveGoal = () => {
    const hours = parseInt(tempHours) || 0;
    const mins = parseInt(tempMinutes) || 0;
    const totalMinutes = hours * 60 + mins;
    if (totalMinutes > 0) {
      saveDailyGoal(totalMinutes);
    }
    setShowGoalPicker(false);
  };

  const saveBreakDuration = async (minutes: number) => {
    try {
      await StorageService.saveUserSettings({ breakDuration: minutes });
      setBreakDurationMinutes(minutes);
    } catch (error) {
      console.error("Error saving break duration:", error);
    }
  };

  const openBreakPicker = () => {
    setTempBreakMinutes(breakDurationMinutes.toString());
    setShowBreakPicker(true);
  };

  const saveBreak = () => {
    const mins = parseInt(tempBreakMinutes) || 0;
    if (mins > 0) {
      saveBreakDuration(mins);
    }
    setShowBreakPicker(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Study Goals Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Study Goals
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={openGoalPicker}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name="trophy"
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Daily Study Goal
                </Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.goalValue, { color: accentColor }]}>
                  {formatGoalTime(dailyGoalMinutes)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={openBreakPicker}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="cafe" size={22} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Break Duration
                </Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.goalValue, { color: "#34c759" }]}>
                  {formatGoalTime(breakDurationMinutes)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Appearance
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleDark}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="white"
                ios_backgroundColor={colors.border}
              />
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowColorPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name="color-palette"
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Accent Color
                </Text>
              </View>
              <View style={styles.settingRight}>
                <View
                  style={[
                    styles.colorPreview,
                    {
                      backgroundColor: accentColor,
                      borderColor: colors.border,
                    },
                  ]}
                />
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Account
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="person"
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Profile
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            About
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="information-circle"
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Version
                </Text>
              </View>
              <Text
                style={[styles.versionText, { color: colors.textSecondary }]}
              >
                1.0.0
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choose Accent Color
              </Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.colorGrid}>
              {COLOR_PALETTE.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={styles.colorOption}
                  onPress={() => {
                    setAccentColor(color.value);
                    setShowColorPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.value },
                      accentColor === color.value && styles.selectedColor,
                    ]}
                  >
                    {accentColor === color.value && (
                      <Ionicons name="checkmark" size={24} color="white" />
                    )}
                  </View>
                  <Text style={[styles.colorName, { color: colors.text }]}>
                    {color.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Picker Modal */}
      <Modal
        visible={showGoalPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Daily Study Goal
              </Text>
              <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.goalPicker}>
              <View style={styles.timeInputContainer}>
                <View style={styles.timeInput}>
                  <TextInput
                    style={[
                      styles.timeTextInput,
                      { color: colors.text, borderColor: colors.border },
                    ]}
                    value={tempHours}
                    onChangeText={setTempHours}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text
                    style={[styles.timeLabel, { color: colors.textSecondary }]}
                  >
                    hours
                  </Text>
                </View>

                <Text style={[styles.timeSeparator, { color: colors.text }]}>
                  :
                </Text>

                <View style={styles.timeInput}>
                  <TextInput
                    style={[
                      styles.timeTextInput,
                      { color: colors.text, borderColor: colors.border },
                    ]}
                    value={tempMinutes}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      if (num <= 59) setTempMinutes(text);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text
                    style={[styles.timeLabel, { color: colors.textSecondary }]}
                  >
                    minutes
                  </Text>
                </View>
              </View>

              <View style={styles.quickGoals}>
                <Text
                  style={[
                    styles.quickGoalsLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Quick Select:
                </Text>
                <View style={styles.quickGoalsButtons}>
                  {[30, 60, 120].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.quickGoalButton,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                        dailyGoalMinutes === mins && {
                          backgroundColor: accentColor,
                          borderColor: accentColor,
                        },
                      ]}
                      onPress={() => {
                        const hours = Math.floor(mins / 60);
                        const minutes = mins % 60;
                        setTempHours(hours.toString());
                        setTempMinutes(minutes.toString());
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickGoalText,
                          { color: colors.text },
                          dailyGoalMinutes === mins && { color: "white" },
                        ]}
                      >
                        {formatGoalTime(mins)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: accentColor }]}
                onPress={saveGoal}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Break Duration Picker Modal */}
      <Modal
        visible={showBreakPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBreakPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Break Duration
              </Text>
              <TouchableOpacity onPress={() => setShowBreakPicker(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.goalPicker}>
              <View style={styles.breakInputContainer}>
                <View style={styles.timeInput}>
                  <TextInput
                    style={[
                      styles.timeTextInput,
                      { color: "#34c759", borderColor: "#34c759" },
                    ]}
                    value={tempBreakMinutes}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      if (num <= 60) setTempBreakMinutes(text);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text
                    style={[styles.timeLabel, { color: colors.textSecondary }]}
                  >
                    minutes
                  </Text>
                </View>
              </View>

              <View style={styles.quickGoals}>
                <Text
                  style={[
                    styles.quickGoalsLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Quick Select:
                </Text>
                <View style={styles.quickGoalsButtons}>
                  {[5, 10, 15].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.quickGoalButton,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                        breakDurationMinutes === mins && {
                          backgroundColor: "#34c759",
                          borderColor: "#34c759",
                        },
                      ]}
                      onPress={() => {
                        setTempBreakMinutes(mins.toString());
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickGoalText,
                          { color: colors.text },
                          breakDurationMinutes === mins && { color: "white" },
                        ]}
                      >
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: "#34c759" }]}
                onPress={saveBreak}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Save Break Duration</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorPreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  versionText: {
    fontSize: 15,
  },
  divider: {
    height: 0.5,
    marginLeft: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    gap: 20,
  },
  colorOption: {
    width: "30%",
    alignItems: "center",
    gap: 8,
  },
  colorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "white",
  },
  colorName: {
    fontSize: 13,
    textAlign: "center",
  },
  goalValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  goalPicker: {
    paddingHorizontal: 24,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  breakInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  timeInput: {
    alignItems: "center",
    gap: 8,
  },
  timeTextInput: {
    fontSize: 48,
    fontWeight: "300",
    width: 100,
    height: 80,
    textAlign: "center",
    borderWidth: 2,
    borderRadius: 16,
  },
  timeLabel: {
    fontSize: 14,
  },
  timeSeparator: {
    fontSize: 48,
    fontWeight: "300",
    marginHorizontal: 8,
  },
  quickGoals: {
    marginBottom: 32,
  },
  quickGoalsLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  quickGoalsButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickGoalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  quickGoalText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
});
