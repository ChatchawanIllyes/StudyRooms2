import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ActionSheetIOS,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useWidgets, WidgetSize } from "../context/WidgetContext";
import WidgetTile from "../components/WidgetTile";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const PADDING = 20;
const GAP = 16;
const GRID_WIDTH = width - PADDING * 2;
const SLOT_SIZE = (GRID_WIDTH - GAP) / 2;

export default function HomeScreen() {
  const { colors, accentColor } = useTheme();
  const navigation = useNavigation<any>();
  const {
    widgets,
    removeWidget,
    resizeWidget,
    moveWidget,
    getOccupiedPositions,
    isEditMode,
    setIsEditMode,
    resizeState,
    getValidAdjacentSizes,
  } = useWidgets();
  const [buildPressed, setBuildPressed] = useState(false);

  // Reset edit mode when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsEditMode(false);
    }, [])
  );

  const handleBuildPress = () => {
    navigation.navigate("MyWidgets");
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleWidgetPress = (type: string) => {
    const screenMap: { [key: string]: string } = {
      timer: "Timer",
      tasks: "Tasks",
      stats: "Stats",
    };
    navigation.navigate(screenMap[type]);
  };

  const handleRemoveWidget = (id: string) => {
    Alert.alert(
      "Remove Widget",
      "Are you sure you want to remove this widget?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeWidget(id),
        },
      ]
    );
  };

  const handleResizeWidget = (id: string, currentSize: WidgetSize) => {
    const sizeOptions = ["1×1", "2×1", "1×2", "Cancel"];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Resize Widget",
        options: sizeOptions,
        cancelButtonIndex: 3,
      },
      (buttonIndex) => {
        if (buttonIndex === 3) return;

        const sizeMap: WidgetSize[] = ["1x1", "2x1", "1x2"];
        const newSize = sizeMap[buttonIndex];

        if (newSize === currentSize) return;

        const success = resizeWidget(id, newSize);
        if (!success) {
          Alert.alert(
            "Cannot Resize",
            "Not enough space. Try removing other widgets first.",
            [{ text: "OK" }]
          );
        }
      }
    );
  };

  const getPositionCoordinates = (
    position: number
  ): { row: number; col: number } => {
    return {
      row: Math.floor(position / 2),
      col: position % 2,
    };
  };

  const renderEmptySlot = (position: number) => {
    return (
      <View
        key={`empty-${position}`}
        style={[
          styles.gridSlot,
          {
            width: SLOT_SIZE,
            height: SLOT_SIZE,
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      />
    );
  };

  const renderGrid = () => {
    const occupiedPositions = getOccupiedPositions();

    // Create absolute positioned widgets instead of grid layout
    const widgetElements: React.ReactNode[] = [];
    const emptySlots: React.ReactNode[] = [];
    const previewOverlays: React.ReactNode[] = [];

    // Get preview info if in resize mode
    let previewWidget: (typeof widgets)[0] | null = null;
    let previewSize: WidgetSize | null = null;
    if (resizeState) {
      previewWidget =
        widgets.find((w) => w.id === resizeState.widgetId) || null;
      previewSize = resizeState.previewSize || null;
    }

    // Render all empty slots first
    for (let i = 0; i < 6; i++) {
      if (!occupiedPositions.has(i)) {
        const { row, col } = getPositionCoordinates(i);
        const left = col * (SLOT_SIZE + GAP);
        const top = row * (SLOT_SIZE + GAP);

        emptySlots.push(
          <View
            key={`empty-${i}`}
            style={[
              styles.gridSlot,
              {
                position: "absolute",
                left,
                top,
                width: SLOT_SIZE,
                height: SLOT_SIZE,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />
        );
      }
    }

    // Render preview overlay if size is selected
    if (previewWidget && previewSize) {
      const { row, col } = getPositionCoordinates(previewWidget.position);
      const left = col * (SLOT_SIZE + GAP);
      const top = row * (SLOT_SIZE + GAP);

      const getPreviewDimensions = (size: WidgetSize) => {
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

      const previewDims = getPreviewDimensions(previewSize);

      previewOverlays.push(
        <View
          key="preview-overlay"
          style={{
            position: "absolute",
            left,
            top,
            width: previewDims.width,
            height: previewDims.height,
            backgroundColor: accentColor,
            opacity: 0.3,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: accentColor,
            zIndex: 1,
          }}
        />
      );
    }

    // Render widgets on top
    widgets.forEach((widget) => {
      const { row, col } = getPositionCoordinates(widget.position);
      const left = col * (SLOT_SIZE + GAP);
      const top = row * (SLOT_SIZE + GAP);

      widgetElements.push(
        <View
          key={widget.id}
          style={{
            position: "absolute",
            left,
            top,
            zIndex: resizeState?.widgetId === widget.id ? 10 : 2,
          }}
        >
          <WidgetTile
            type={widget.type}
            size={widget.size}
            position={widget.position}
            widgetId={widget.id}
            isEditMode={isEditMode}
            onPress={() => handleWidgetPress(widget.type)}
            onRemove={() => handleRemoveWidget(widget.id)}
            onResize={() => handleResizeWidget(widget.id, widget.size)}
          />
        </View>
      );
    });

    return (
      <View style={styles.gridWrapper}>
        {emptySlots}
        {previewOverlays}
        {widgetElements}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Home</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Build your study space
            </Text>
          </View>
          <View style={styles.headerButtons}>
            {widgets.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handleEditToggle}
                style={styles.editButton}
              >
                {isEditMode ? (
                  <Text style={[styles.editButtonText, { color: accentColor }]}>
                    Done
                  </Text>
                ) : (
                  <Ionicons
                    name="hammer-outline"
                    size={24}
                    color={accentColor}
                  />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.6}
              onPressIn={() => setBuildPressed(true)}
              onPressOut={() => setBuildPressed(false)}
              onPress={handleBuildPress}
              style={[
                styles.buildButton,
                buildPressed && styles.buildButtonPressed,
              ]}
            >
              <Ionicons name="add" size={28} color={accentColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid Area */}
        <View style={styles.gridContainer}>{renderGrid()}</View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: PADDING,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buildButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buildButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
  buildButtonText: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  editButtonText: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  gridContainer: {
    paddingHorizontal: PADDING,
  },
  gridWrapper: {
    width: GRID_WIDTH,
    height: SLOT_SIZE * 3 + GAP * 2,
    position: "relative",
  },
  gridRow: {
    flexDirection: "row",
    gap: GAP,
    minHeight: SLOT_SIZE,
  },
  gridSlot: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
