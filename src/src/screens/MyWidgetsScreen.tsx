import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useWidgets, WidgetType } from "../context/WidgetContext";
import WidgetTile from "../components/WidgetTile";

const AVAILABLE_WIDGETS: Array<{
  type: WidgetType;
  name: string;
  icon: any;
  description: string;
}> = [
  {
    type: "timer",
    name: "Timer",
    icon: "timer-outline",
    description: "Track your focus sessions with Pomodoro timer",
  },
  {
    type: "tasks",
    name: "Tasks",
    icon: "checkbox-outline",
    description: "View and manage your study tasks quickly",
  },
  {
    type: "stats",
    name: "Stats",
    icon: "bar-chart-outline",
    description: "See your daily study progress at a glance",
  },
];

export default function MyWidgetsScreen() {
  const { colors, accentColor } = useTheme();
  const navigation = useNavigation<any>();
  const { widgets, getOccupiedPositions } = useWidgets();

  const handleAddWidget = (widgetType: WidgetType) => {
    const occupiedPositions = getOccupiedPositions();

    // Check if grid is full
    if (occupiedPositions.size >= 6) {
      Alert.alert(
        "Grid Full",
        "No empty slots. Remove or resize existing widgets.",
        [{ text: "OK" }]
      );
      return;
    }

    navigation.navigate("PlaceWidget", { widgetType });
  };

  const installedWidgets = widgets.map((w) => w.type);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={accentColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Widgets</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Available Widgets Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Widgets
          </Text>
          <Text
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Add widgets to customize your home screen
          </Text>

          <View style={styles.widgetGrid}>
            {AVAILABLE_WIDGETS.filter(
              (widget) => !installedWidgets.includes(widget.type)
            ).map((widget) => {
              return (
                <View key={widget.type} style={styles.widgetGridItem}>
                  <WidgetTile
                    type={widget.type}
                    size="1x1"
                    isEditMode={false}
                    onPress={() => handleAddWidget(widget.type)}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Installed Section (if any) */}
        {widgets.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Installed on Home
            </Text>
            <View
              style={[styles.installedBadge, { backgroundColor: colors.card }]}
            >
              <Ionicons name="checkmark-circle" size={20} color={accentColor} />
              <Text style={[styles.installedText, { color: colors.text }]}>
                {widgets.length} widget{widgets.length !== 1 ? "s" : ""}{" "}
                installed
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation to Marketplace */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("WidgetMarketplace")}
          style={[styles.marketplaceButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.marketplaceButtonText, { color: accentColor }]}>
            Widget Marketplace
          </Text>
          <Ionicons name="chevron-forward" size={20} color={accentColor} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  sectionDescription: {
    fontSize: 15,
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  widgetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  widgetGridItem: {
    width: "50%",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  installedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  installedText: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  marketplaceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  marketplaceButtonText: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
});
