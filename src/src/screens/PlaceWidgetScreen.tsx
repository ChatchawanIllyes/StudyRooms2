import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useWidgets, WidgetType, WidgetSize } from "../context/WidgetContext";
import { Ionicons } from "@expo/vector-icons";
import WidgetTile from "../components/WidgetTile";

const { width } = Dimensions.get("window");
const PADDING = 20;
const GAP = 12;
const PREVIEW_WIDTH = width - PADDING * 2;
const PREVIEW_SLOT_SIZE = (PREVIEW_WIDTH - GAP) / 2 - 4;

const WIDGET_INFO: Record<WidgetType, { name: string; icon: any }> = {
  timer: { name: "Timer", icon: "timer-outline" },
  tasks: { name: "Tasks", icon: "checkbox-outline" },
  stats: { name: "Stats", icon: "bar-chart-outline" },
  "stats-heatmap": { name: "Heatmap", icon: "grid-outline" },
};

export default function PlaceWidgetScreen() {
  const { colors, accentColor } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addWidget, isPositionAvailable, getOccupiedPositions } = useWidgets();

  const widgetType = route.params?.widgetType as WidgetType;
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<WidgetSize>("1x1");

  const occupiedPositions = getOccupiedPositions();
  const widgetInfo = WIDGET_INFO[widgetType];

  const sizeOptions: { label: string; value: WidgetSize }[] = [
    { label: "1×1", value: "1x1" },
    { label: "2×1", value: "2x1" },
    { label: "1×2", value: "1x2" },
  ];

  const getPositionCoordinates = (position: number) => ({
    row: Math.floor(position / 2),
    col: position % 2,
  });

  const isSlotAvailableForSize = (position: number): boolean => {
    if (selectedPosition === null) return !occupiedPositions.has(position);
    return isPositionAvailable(position, selectedSize);
  };

  const canConfirm = (): boolean => {
    if (selectedPosition === null) return false;
    return isPositionAvailable(selectedPosition, selectedSize);
  };

  const getSpaceWarning = (): string | null => {
    if (selectedPosition === null) return null;
    if (!isPositionAvailable(selectedPosition, selectedSize)) {
      return "Not enough space. Choose a smaller size or different position.";
    }
    return null;
  };

  const handleConfirm = () => {
    if (!canConfirm() || selectedPosition === null) return;

    addWidget(widgetType, selectedPosition, selectedSize);
    navigation.navigate("Home");
  };

  const renderPreviewSlot = (position: number) => {
    const isOccupied = occupiedPositions.has(position);
    const isSelected = selectedPosition === position;
    const isAvailable = isSlotAvailableForSize(position);
    const showPreview = isSelected;

    return (
      <View style={{ position: "relative", overflow: "visible" }}>
        <TouchableOpacity
          key={position}
          disabled={isOccupied}
          onPress={() => {
            if (isSelected) {
              // Tapping selected slot confirms placement
              handleConfirm();
            } else {
              setSelectedPosition(position);
            }
          }}
          style={[
            styles.previewSlot,
            {
              width: PREVIEW_SLOT_SIZE,
              height: PREVIEW_SLOT_SIZE,
              borderColor: isSelected ? accentColor : colors.border,
              backgroundColor: isOccupied ? colors.card : colors.background,
              opacity: isOccupied ? 0.3 : 1,
            },
            isSelected && { borderWidth: 2.5 },
          ]}
        >
          {/* Show actual widget preview when selected */}
          {showPreview && (
            <View style={styles.widgetPreviewContainer}>
              <WidgetTile
                type={widgetType}
                size="1x1"
                isPreview={true}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Checkmark overlay - COMPLETELY OUTSIDE TouchableOpacity */}
        {showPreview && (
          <View
            style={[
              styles.slotCheckmark,
              {
                backgroundColor: "#007AFF", // Bright blue for visibility
              }
            ]}
            pointerEvents="none"
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const renderPreviewGrid = () => {
    const grid: React.ReactNode[][] = [[], [], []];

    for (let i = 0; i < 6; i++) {
      const { row, col } = getPositionCoordinates(i);
      grid[row][col] = renderPreviewSlot(i);
    }

    return grid.map((row, rowIndex) => (
      <View key={`row-${rowIndex}`} style={styles.previewRow}>
        {row}
      </View>
    ));
  };

  const spaceWarning = getSpaceWarning();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color={accentColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            Place Widget
          </Text> 
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Widget Info */}
          <View
            style={[styles.widgetInfoCard, { backgroundColor: colors.card }]}
          >
            <Ionicons name={widgetInfo.icon} size={32} color={accentColor} />
            <Text style={[styles.widgetName, { color: colors.text }]}>
              {widgetInfo.name}
            </Text>
          </View>

          {/* Choose Position */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Choose Position
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { color: colors.textSecondary },
              ]}
            >
              Tap to place your widget, then tap again to confirm
            </Text>
            <View style={styles.previewGrid}>{renderPreviewGrid()}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  widgetInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  widgetName: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  section: {
    marginBottom: 24,
    overflow: "visible",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  sectionDescription: {
    fontSize: 15,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  previewGrid: {
    gap: GAP,
    overflow: "visible",
  },
  previewRow: {
    flexDirection: "row",
    gap: GAP,
    overflow: "visible",
  },
  previewSlot: {
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  widgetPreviewContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: 12,
    overflow: "hidden",
  },
  slotCheckmark: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#fff",
    zIndex: 1000,
  },
  sizeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  sizeOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
  },
  sizeOptionText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
});
