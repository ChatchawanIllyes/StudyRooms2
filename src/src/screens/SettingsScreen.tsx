import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const COLOR_PALETTE = [
  { name: 'Sky Blue', value: '#5b9bd5' },
  { name: 'Green', value: '#34c759' },
  { name: 'Orange', value: '#ff9500' },
  { name: 'Purple', value: '#af52de' },
  { name: 'Pink', value: '#ff2d55' },
  { name: 'Teal', value: '#5ac8fa' },
  { name: 'Indigo', value: '#5856d6' },
  { name: 'Red', value: '#ff3b30' },
  { name: 'Yellow', value: '#ffcc00' },
];

export default function SettingsScreen() {
  const { colors, isDark, toggleDark, accentColor, setAccentColor } = useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Appearance
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleDark}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="white"
                ios_backgroundColor={colors.border}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowColorPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="color-palette" size={22} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Accent Color</Text>
              </View>
              <View style={styles.settingRight}>
                <View
                  style={[
                    styles.colorPreview,
                    { backgroundColor: accentColor, borderColor: colors.border },
                  ]}
                />
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>

          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <Ionicons name="person" size={22} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>

          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle" size={22} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Version</Text>
              </View>
              <Text style={[styles.versionText, { color: colors.textSecondary }]}>1.0.0</Text>
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Accent Color</Text>
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
                  <Text style={[styles.colorName, { color: colors.text }]}>{color.name}</Text>
                </TouchableOpacity>
              ))}
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
    fontWeight: '300',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 20,
  },
  colorOption: {
    width: '30%',
    alignItems: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: 'white',
  },
  colorName: {
    fontSize: 13,
    textAlign: 'center',
  },
});
