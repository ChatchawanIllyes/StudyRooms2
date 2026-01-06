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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get("window");
const PADDING = 20;
const GAP = 16;
const GRID_WIDTH = width - PADDING * 2;
const SLOT_SIZE = (GRID_WIDTH - GAP) / 2;

// ResizeSquare component with pulsing animation
interface ResizeSquareProps {
  position: number;
  left: number;
  top: number;
  isSelected?: boolean;
  accentColor: string;
  onPress: () => void;
}

function ResizeSquare({ position, left, top, isSelected, accentColor, onPress }: ResizeSquareProps) {
  const pulseOpacity = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (!isSelected) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        false
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      pulseOpacity.value = withTiming(0.6);
      pulseScale.value = withTiming(1);
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <TouchableOpacity
      key={`resize-${position}`}
      style={{
        position: 'absolute',
        left,
        top,
        width: SLOT_SIZE,
        height: SLOT_SIZE,
        zIndex: 3,
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            backgroundColor: accentColor,
            borderRadius: 16,
            borderWidth: isSelected ? 3 : 2,
            borderColor: accentColor,
          },
          animatedStyle,
        ]}
      />
    </TouchableOpacity>
  );
}

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
    getValidAdjacentPositions,
    getSizeFromPositions,
    setResizeState,
  } = useWidgets();
  const [buildPressed, setBuildPressed] = useState(false);

  // Reset edit mode when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsEditMode(false);
      setResizeState(null);
    }, [setIsEditMode, setResizeState])
  );

  const handleBuildPress = () => {
    navigation.navigate("MyWidgets");
  };

  const handleEditToggle = () => {
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);
    // Clear resize state when exiting edit mode
    if (!newEditMode) {
      setResizeState(null);
    }
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
          onPress: () => {
            // Clear resize state if we're removing the widget being resized
            if (resizeState?.widgetId === id) {
              setResizeState(null);
            }
            removeWidget(id);
          },
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

  const handlePositionClick = (position: number) => {
    if (!resizeState) return;

    const widget = widgets.find(w => w.id === resizeState.widgetId);
    if (!widget) return;

    const currentTargets = resizeState.targetPositions || [];
    let newTargets: number[];

    // Toggle position
    if (currentTargets.includes(position)) {
      newTargets = currentTargets.filter(p => p !== position);
    } else {
      newTargets = [...currentTargets, position];
    }

    // Calculate new size
    const newSize = getSizeFromPositions(widget.position, newTargets);

    setResizeState({
      widgetId: resizeState.widgetId,
      targetPositions: newTargets,
      previewSize: newSize || undefined,
    });
  };

  const handleConfirmResize = () => {
    if (!resizeState?.previewSize || !resizeState.widgetId) return;
    resizeWidget(resizeState.widgetId, resizeState.previewSize);
    setResizeState(null);
  };

  const handleCancelResize = () => {
    setResizeState(null);
  };

  const renderGrid = () => {
    const occupiedPositions = getOccupiedPositions();

    // Create absolute positioned widgets instead of grid layout
    const widgetElements: React.ReactNode[] = [];
    const emptySlots: React.ReactNode[] = [];
    const previewOverlays: React.ReactNode[] = [];
    const interactiveSquares: React.ReactNode[] = [];

    // Get preview info if in resize mode
    let previewWidget: (typeof widgets)[0] | null = null;
    let previewSize: WidgetSize | null = null;
    let validPositions: number[] = [];
    if (resizeState) {
      previewWidget =
        widgets.find((w) => w.id === resizeState.widgetId) || null;
      previewSize = resizeState.previewSize || null;
      if (previewWidget) {
        validPositions = getValidAdjacentPositions(resizeState.widgetId);
      }
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

    // Render interactive squares in resize mode
    if (resizeState && validPositions.length > 0) {
      validPositions.forEach((pos) => {
        const { row, col } = getPositionCoordinates(pos);
        const left = col * (SLOT_SIZE + GAP);
        const top = row * (SLOT_SIZE + GAP);
        const isSelected = resizeState.targetPositions?.includes(pos);

        interactiveSquares.push(
          <ResizeSquare
            key={`resize-${pos}`}
            position={pos}
            left={left}
            top={top}
            isSelected={isSelected}
            accentColor={accentColor}
            onPress={() => handlePositionClick(pos)}
          />
        );
      });
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
            opacity: 0.25,
            borderRadius: 16,
            borderWidth: 3,
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
        {interactiveSquares}
        {previewOverlays}
        {widgetElements}
        
        {/* Resize Confirm/Cancel Buttons */}
        {resizeState && previewWidget && (
          <View
            style={[
              styles.resizeControls,
              {
                top: SLOT_SIZE * 3 + GAP * 2 + 16,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.resizeControlButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleCancelResize}
            >
              <Text style={[styles.resizeControlText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.resizeControlButton,
                {
                  backgroundColor: resizeState.previewSize ? accentColor : colors.border,
                },
              ]}
              onPress={handleConfirmResize}
              disabled={!resizeState.previewSize}
            >
              <Text
                style={[
                  styles.resizeControlText,
                  { color: resizeState.previewSize ? '#ffffff' : colors.textSecondary },
                ]}
              >
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  resizeControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    zIndex: 20,
  },
  resizeControlButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resizeControlText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
