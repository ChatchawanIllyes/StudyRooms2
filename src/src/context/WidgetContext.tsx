import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type WidgetType = "timer" | "tasks" | "stats";
export type WidgetSize = "1x1" | "2x1" | "1x2" | "2x2";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: number; // 0-5 for grid positions (row-major order)
  size: WidgetSize;
}

interface ResizeState {
  widgetId: string;
  previewSize?: WidgetSize;
  targetPositions?: number[];
}

interface WidgetContextType {
  widgets: WidgetConfig[];
  addWidget: (type: WidgetType, position: number, size: WidgetSize) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, newPosition: number) => boolean;
  resizeWidget: (id: string, newSize: WidgetSize) => boolean;
  isPositionAvailable: (
    position: number,
    size: WidgetSize,
    excludeId?: string
  ) => boolean;
  getOccupiedPositions: (excludeId?: string) => Set<number>;
  getValidAdjacentSizes: (id: string) => WidgetSize[];
  getValidAdjacentPositions: (id: string) => number[];
  getSizeFromPositions: (basePosition: number, targetPositions: number[]) => WidgetSize | null;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  resizeState: ResizeState | null;
  setResizeState: (state: ResizeState | null) => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

const STORAGE_KEY = "studyapp_widgets";

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  useEffect(() => {
    loadWidgets();
  }, []);

  useEffect(() => {
    saveWidgets();
  }, [widgets]);

  // Clear resize state if the widget being resized no longer exists
  useEffect(() => {
    if (resizeState && !widgets.find(w => w.id === resizeState.widgetId)) {
      setResizeState(null);
    }
  }, [widgets, resizeState]);

  const loadWidgets = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setWidgets(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load widgets:", error);
    }
  };

  const saveWidgets = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (error) {
      console.error("Failed to save widgets:", error);
    }
  };

  const getPositionsForSize = (
    position: number,
    size: WidgetSize
  ): number[] => {
    const positions = [position];

    switch (size) {
      case "2x1": // 2 columns, 1 row
        if (position % 2 === 0) {
          positions.push(position + 1);
        }
        break;
      case "1x2": // 1 column, 2 rows
        if (position < 4) {
          positions.push(position + 2);
        }
        break;
      case "2x2": // 2 columns, 2 rows
        if (position % 2 === 0 && position < 4) {
          positions.push(position + 1, position + 2, position + 3);
        }
        break;
    }

    return positions;
  };

  const getOccupiedPositions = (excludeId?: string): Set<number> => {
    const occupied = new Set<number>();

    widgets.forEach((widget) => {
      if (excludeId && widget.id === excludeId) return;
      const positions = getPositionsForSize(widget.position, widget.size);
      positions.forEach((pos) => occupied.add(pos));
    });

    return occupied;
  };

  const isPositionAvailable = (
    position: number,
    size: WidgetSize,
    excludeId?: string
  ): boolean => {
    // Check if position is valid for grid (0-5)
    if (position < 0 || position > 5) return false;

    // Check if size can fit from this position
    const requiredPositions = getPositionsForSize(position, size);

    // For 2x1, must start in left column (even position)
    if (size === "2x1" && position % 2 !== 0) return false;

    // For 1x2, must not be in bottom row (positions 4-5)
    if (size === "1x2" && position >= 4) return false;

    // For 2x2, must start in top-left quadrant (positions 0 or 2)
    if (size === "2x2" && (position % 2 !== 0 || position >= 4)) return false;

    // Check if any required position is outside grid
    if (requiredPositions.some((pos) => pos < 0 || pos > 5)) return false;

    // Check if any required position is already occupied
    const occupied = getOccupiedPositions(excludeId);
    return !requiredPositions.some((pos) => occupied.has(pos));
  };

  const addWidget = (type: WidgetType, position: number, size: WidgetSize) => {
    if (!isPositionAvailable(position, size)) {
      console.warn("Position not available");
      return;
    }

    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      size,
    };

    setWidgets((prev) => [...prev, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const moveWidget = (id: string, newPosition: number): boolean => {
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return false;

    if (!isPositionAvailable(newPosition, widget.size, id)) {
      return false;
    }

    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position: newPosition } : w))
    );

    return true;
  };

  const resizeWidget = (id: string, newSize: WidgetSize): boolean => {
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return false;

    if (!isPositionAvailable(widget.position, newSize, id)) {
      return false;
    }

    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size: newSize } : w))
    );

    return true;
  };

  const getValidAdjacentSizes = (id: string): WidgetSize[] => {
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return [];

    const validSizes: WidgetSize[] = [];
    const allSizes: WidgetSize[] = ["1x1", "2x1", "1x2", "2x2"];

    allSizes.forEach((size) => {
      if (
        size !== widget.size &&
        isPositionAvailable(widget.position, size, id)
      ) {
        validSizes.push(size);
      }
    });

    return validSizes;
  };

  const getValidAdjacentPositions = (id: string): number[] => {
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return [];

    const currentPositions = new Set(getPositionsForSize(widget.position, widget.size));
    const occupied = getOccupiedPositions(id);
    const validPositions = new Set<number>();

    // Check all 6 grid positions
    for (let pos = 0; pos < 6; pos++) {
      // Skip if already part of current widget
      if (currentPositions.has(pos)) continue;
      
      // Check if position is occupied by another widget
      if (occupied.has(pos)) continue;

      // Check if position is adjacent (horizontally or vertically)
      const isAdjacent = Array.from(currentPositions).some((currentPos) => {
        const currentRow = Math.floor(currentPos / 2);
        const currentCol = currentPos % 2;
        const posRow = Math.floor(pos / 2);
        const posCol = pos % 2;

        // Adjacent if same row and adjacent column, or same column and adjacent row
        return (
          (currentRow === posRow && Math.abs(currentCol - posCol) === 1) ||
          (currentCol === posCol && Math.abs(currentRow - posRow) === 1)
        );
      });

      if (isAdjacent) {
        validPositions.add(pos);
      }
    }

    // Also include current positions for shrinking
    currentPositions.forEach(pos => validPositions.add(pos));

    return Array.from(validPositions);
  };

  const getSizeFromPositions = (basePosition: number, targetPositions: number[]): WidgetSize | null => {
    const allPositions = new Set([basePosition, ...targetPositions]);
    const sortedPositions = Array.from(allPositions).sort((a, b) => a - b);

    // Calculate bounding box
    const rows = sortedPositions.map(p => Math.floor(p / 2));
    const cols = sortedPositions.map(p => p % 2);
    
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;

    // Verify it's a valid rectangle
    const expectedPositions = new Set<number>();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        expectedPositions.add(r * 2 + c);
      }
    }

    // Check if all positions match
    if (expectedPositions.size !== allPositions.size) return null;
    for (const pos of allPositions) {
      if (!expectedPositions.has(pos)) return null;
    }

    // Return the size
    if (width === 1 && height === 1) return "1x1";
    if (width === 2 && height === 1) return "2x1";
    if (width === 1 && height === 2) return "1x2";
    if (width === 2 && height === 2) return "2x2";

    return null;
  };

  return (
    <WidgetContext.Provider
      value={{
        widgets,
        addWidget,
        removeWidget,
        moveWidget,
        resizeWidget,
        isPositionAvailable,
        getOccupiedPositions,
        getValidAdjacentSizes,
        getValidAdjacentPositions,
        getSizeFromPositions,
        isEditMode,
        setIsEditMode,
        resizeState,
        setResizeState,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgets() {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error("useWidgets must be used within a WidgetProvider");
  }
  return context;
}
