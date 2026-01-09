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
  {
    type: "stats-heatmap",
    name: "Study Heatmap",
    icon: "grid-outline",
    description: "GitHub-style heatmap of your study activity",
  },
];

export default function MyWidgetsScreen() {
  const { colors, accentColor } = useTheme();
  const navigation = useNavigation<any>();
  const { widgets, getOccupiedPositions, setPlacementMode } = useWidgets();

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

    setPlacementMode({ widgetType, previewPosition: null });
    navigation.navigate("Home");
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
            Add widgets to customize your home
          </Text>

          {/* Installed Badge */}
          {widgets.length > 0 && (
            <View
              style={[styles.installedBadge, { backgroundColor: colors.card }]}
            >
              <Ionicons name="checkmark-circle" size={20} color={accentColor} />
              <Text style={[styles.installedText, { color: colors.text }]}>
                {widgets.length} widget{widgets.length !== 1 ? "s" : ""}{" "}
                installed
              </Text>
            </View>
          )}

          {/* Marketplace message when all widgets installed or none available */}
          {(widgets.length === 3 ||
            AVAILABLE_WIDGETS.filter(
              (widget) => !installedWidgets.includes(widget.type)
            ).length === 0) && (
            <Text
              style={[styles.marketplaceHint, { color: colors.textSecondary }]}
            >
              Explore the marketplace for more widgets
            </Text>
          )}

          <View style={styles.widgetGrid}>
            {AVAILABLE_WIDGETS.filter(
              (widget) => !installedWidgets.includes(widget.type)
            ).map((widget) => {
              return (
                <TouchableOpacity
                  key={widget.type}
                  activeOpacity={0.7}
                  onPress={() => handleAddWidget(widget.type)}
                  style={styles.widgetGridItem}
                >
                  <WidgetTile
                    type={widget.type}
                    size="1x1"
                    isEditMode={false}
                    isPreview={true}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* FAB Shopping Cart Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate("WidgetMarketplace")}
        style={[styles.fab, { backgroundColor: accentColor }]}
      >
        <Ionicons name="cart" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
    marginTop: 0,
    marginBottom: 20,
  },
  installedText: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  marketplaceHint: {
    fontSize: 14,
    letterSpacing: -0.2,
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.7,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 15,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
