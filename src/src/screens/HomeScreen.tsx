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
  TextInput,
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
} from "react-native-reanimated";

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

function ResizeSquare({
  position,
  left,
  top,
  isSelected,
  accentColor,
  onPress,
}: ResizeSquareProps) {
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
        position: "absolute",
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
            width: "100%",
            height: "100%",
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
    addWidget,
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
    placementMode,
    setPlacementMode,
    homeTitle,
    setHomeTitle,
    homeDescription,
    setHomeDescription,
  } = useWidgets();
  const [buildPressed, setBuildPressed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(homeTitle);
  const [tempDescription, setTempDescription] = useState(homeDescription);

  // Reset edit mode when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsEditMode(false);
      setResizeState(null);
      // Don't clear placement mode here - let it persist
    }, [setIsEditMode, setResizeState])
  );

  const handleTitleEdit = () => {
    setTempTitle(homeTitle);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (tempTitle.trim()) {
      setHomeTitle(tempTitle.trim().slice(0, 20));
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionEdit = () => {
    setTempDescription(homeDescription);
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = () => {
    if (tempDescription.trim()) {
      setHomeDescription(tempDescription.trim().slice(0, 50));
    }
    setIsEditingDescription(false);
  };

  const handleBuildPress = () => {
    navigation.navigate("MyWidgets");
  };

  const handlePlacementSlotClick = (position: number) => {
    if (!placementMode) return;

    // Update preview position
    setPlacementMode({
      ...placementMode,
      previewPosition: position,
    });
  };

  const handleConfirmPlacement = () => {
    if (!placementMode || placementMode.previewPosition === null) return;

    addWidget(placementMode.widgetType, placementMode.previewPosition, "1x1");
    setPlacementMode(null);
  };

  const handleCancelPlacement = () => {
    setPlacementMode(null);
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

    const widget = widgets.find((w) => w.id === resizeState.widgetId);
    if (!widget) return;

    const widgetRow = Math.floor(widget.position / 2);
    const widgetCol = widget.position % 2;
    const posRow = Math.floor(position / 2);
    const posCol = position % 2;
    
    const currentTargets = resizeState.targetPositions || [];
    let newTargets: number[];
    let newSize: WidgetSize | null = null;
    let newPosition = widget.position;

    // If clicking current widget position, do nothing
    if (position === widget.position) {
      return;
    }

    // If clicking a target that's already selected, deselect it (shrink)
    if (currentTargets.includes(position)) {
      newTargets = currentTargets.filter((p) => p !== position);
      const allPositions = [widget.position, ...newTargets];
      const sortedPositions = allPositions.sort((a, b) => a - b);
      const rows = sortedPositions.map((p) => Math.floor(p / 2));
      const cols = sortedPositions.map((p) => p % 2);
      const minRow = Math.min(...rows);
      const minCol = Math.min(...cols);
      newPosition = minRow * 2 + minCol;
      newSize = getSizeFromPositions(widget.position, newTargets);
    } 
    // From 1x1 widget - determine size based on where user clicks
    else if (widget.size === "1x1") {
      const rowDiff = posRow - widgetRow;
      const colDiff = posCol - widgetCol;

      // Horizontal (2x1)
      if (rowDiff === 0 && Math.abs(colDiff) === 1) {
        newTargets = [position];
        newPosition = Math.min(widget.position, position);
        newSize = "2x1";
      }
      // Vertical (1x2)
      else if (colDiff === 0 && Math.abs(rowDiff) === 1) {
        newTargets = [position];
        newPosition = Math.min(widget.position, position);
        newSize = "1x2";
      }
      // Diagonal (2x2) - auto-complete the rectangle
      else if (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1) {
        const pos1 = widgetRow * 2 + posCol; // same row as widget, same col as target
        const pos2 = posRow * 2 + widgetCol; // same row as target, same col as widget
        newTargets = [position, pos1, pos2];
        const minRow = Math.min(widgetRow, posRow);
        const minCol = Math.min(widgetCol, posCol);
        newPosition = minRow * 2 + minCol;
        newSize = "2x2";
      }
    }
    // From 2x1 widget - can expand to 2x2
    else if (widget.size === "2x1") {
      // Get the other position occupied by this 2x1 widget
      const otherPos = widgetCol === 0 ? widget.position + 1 : widget.position - 1;
      
      // Check if clicking directly below the 2x1
      if (Math.abs(posRow - widgetRow) === 1) {
        // Need both bottom squares for 2x2
        const bottomLeft = (widgetRow + (posRow > widgetRow ? 1 : -1)) * 2;
        const bottomRight = bottomLeft + 1;
        
        if (position === bottomLeft || position === bottomRight) {
          newTargets = [bottomLeft, bottomRight];
          newPosition = Math.min(widget.position, otherPos, bottomLeft);
          newSize = "2x2";
        }
      }
    }
    // From 1x2 widget - can expand to 2x2
    else if (widget.size === "1x2") {
      // Get the other position occupied by this 1x2 widget
      const otherRow = widgetRow + (widget.position < 4 ? 1 : -1);
      const otherPos = otherRow * 2 + widgetCol;
      
      // Check if clicking to the right of the 1x2
      if (Math.abs(posCol - widgetCol) === 1) {
        const rightCol = widgetCol + (posCol > widgetCol ? 1 : -1);
        const rightTop = widgetRow * 2 + rightCol;
        const rightBottom = otherRow * 2 + rightCol;
        
        if (position === rightTop || position === rightBottom) {
          newTargets = [rightTop, rightBottom];
          newPosition = Math.min(widget.position, otherPos, rightTop);
          newSize = "2x2";
        }
      }
    }
    // From 2x2 widget - can shrink to any configuration
    else if (widget.size === "2x2") {
      // Already handled at the top with deselect logic
      newTargets = [position];
      newSize = getSizeFromPositions(widget.position, newTargets);
    }

    // If we couldn't determine a valid resize, return
    if (!newSize) {
      return;
    }

    setResizeState({
      widgetId: resizeState.widgetId,
      targetPositions: newTargets || [],
      previewSize: newSize,
      previewPosition: newPosition,
    });
  };

  const handleConfirmResize = () => {
    if (!resizeState?.previewSize || !resizeState.widgetId) return;
    resizeWidget(
      resizeState.widgetId,
      resizeState.previewSize,
      resizeState.previewPosition
    );
    setResizeState(null);
  };

  const handleCancelResize = () => {
    setResizeState(null);
  };

  const handleResetResize = () => {
    if (!resizeState?.widgetId) return;
    const widget = widgets.find((w) => w.id === resizeState.widgetId);
    if (!widget) return;

    // Reset to 1x1 at current position and stay in resize mode
    const success = resizeWidget(resizeState.widgetId, "1x1", widget.position);
    if (success) {
      // Clear the resize state targets/preview but keep the widgetId to show new squares
      setResizeState({
        widgetId: resizeState.widgetId,
        targetPositions: [],
        previewSize: undefined,
        previewPosition: undefined,
      });
    }
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
          <TouchableOpacity
            key={`empty-${i}`}
            activeOpacity={placementMode ? 0.7 : 1}
            onPress={() => placementMode && handlePlacementSlotClick(i)}
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
    if (
      previewWidget &&
      previewSize &&
      resizeState?.previewPosition !== undefined
    ) {
      const { row, col } = getPositionCoordinates(resizeState.previewPosition);
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

    // Render placement preview widget
    if (placementMode && placementMode.previewPosition !== null) {
      const { row, col } = getPositionCoordinates(
        placementMode.previewPosition
      );
      const left = col * (SLOT_SIZE + GAP);
      const top = row * (SLOT_SIZE + GAP);

      widgetElements.push(
        <View
          key="placement-preview"
          style={{
            position: "absolute",
            left,
            top,
            zIndex: 15,
          }}
        >
          <WidgetTile
            type={placementMode.widgetType}
            size="1x1"
            position={placementMode.previewPosition}
            isEditMode={false}
            onPress={() => {}}
          />
          {/* Checkmark button on preview */}
          <TouchableOpacity
            style={[
              styles.confirmPlacementButton,
              { backgroundColor: accentColor },
            ]}
            onPress={handleConfirmPlacement}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.gridWrapper}>
        {emptySlots}
        {interactiveSquares}
        {previewOverlays}
        {widgetElements}

        {/* Resize Control Buttons */}
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
              style={[
                styles.resizeControlButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleCancelResize}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.resizeControlButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleResetResize}
            >
              <Ionicons name="refresh" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.resizeControlButton,
                {
                  backgroundColor: resizeState.previewSize
                    ? accentColor
                    : colors.border,
                },
              ]}
              onPress={handleConfirmResize}
              disabled={!resizeState.previewSize}
            >
              <Ionicons
                name="checkmark"
                size={24}
                color={
                  resizeState.previewSize ? "#ffffff" : colors.textSecondary
                }
              />
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
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => placementMode && handleCancelPlacement()}
        >
          <View style={{ flex: 1 }} onStartShouldSetResponder={() => false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                {placementMode ? (
                  <>
                    <Text style={[styles.title, { color: colors.text }]}>
                      Choose position
                    </Text>
                    <Text
                      style={[styles.subtitle, { color: colors.textSecondary }]}
                    >
                      Tap an empty slot
                    </Text>
                  </>
                ) : isEditingTitle ? (
                  <TextInput
                    style={[
                      styles.titleInput,
                      { color: colors.text, borderColor: accentColor },
                    ]}
                    value={tempTitle}
                    onChangeText={(text) => setTempTitle(text.slice(0, 20))}
                    onBlur={handleTitleSave}
                    autoFocus
                    maxLength={20}
                    placeholder="Home"
                    placeholderTextColor={colors.textSecondary}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={handleTitleEdit}
                    activeOpacity={0.7}
                  >
                    <View style={styles.editableTextContainer}>
                      <Text style={[styles.title, { color: colors.text }]}>
                        {homeTitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                {isEditingDescription ? (
                  <TextInput
                    style={[
                      styles.descriptionInput,
                      { color: colors.textSecondary, borderColor: accentColor },
                    ]}
                    value={tempDescription}
                    onChangeText={(text) =>
                      setTempDescription(text.slice(0, 50))
                    }
                    onBlur={handleDescriptionSave}
                    autoFocus
                    maxLength={50}
                    placeholder="Your study space"
                    placeholderTextColor={colors.textSecondary}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={handleDescriptionEdit}
                    activeOpacity={0.7}
                  >
                    <View style={styles.editableTextContainer}>
                      <Text
                        style={[
                          styles.subtitle,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {homeDescription}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              {!placementMode && (
                <View style={styles.headerButtons}>
                  {widgets.length > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={handleEditToggle}
                      style={styles.editButton}
                    >
                      {isEditMode ? (
                        <Text
                          style={[
                            styles.editButtonText,
                            { color: accentColor },
                          ]}
                        >
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
              )}
            </View>

            {/* Grid Area */}
            <View style={styles.gridContainer}>{renderGrid()}</View>
          </View>
        </TouchableOpacity>
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
    position: "absolute",
    right: 20,
    top: Platform.OS === "ios" ? 8 : 16,
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
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    zIndex: 20,
  },
  resizeControlButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resizeControlText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  headerText: {
    flex: 1,
    paddingRight: 120,
  },
  editableTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleInput: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  descriptionInput: {
    fontSize: 15,
    letterSpacing: -0.2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  confirmPlacementButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
