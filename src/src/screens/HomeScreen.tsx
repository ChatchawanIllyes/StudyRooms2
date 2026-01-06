import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const PADDING = 20;
const GAP = 16;
const GRID_WIDTH = width - PADDING * 2;
const SLOT_SIZE = (GRID_WIDTH - GAP) / 2;

export default function HomeScreen() {
  const { colors, accentColor } = useTheme();
  const navigation = useNavigation<any>();
  const [buildPressed, setBuildPressed] = React.useState(false);

  const handleBuildPress = () => {
    navigation.navigate("MyWidgets");
  };

  const renderGridSlot = (index: number) => {
    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.7}
        style={[
          styles.gridSlot,
          {
            width: SLOT_SIZE,
            height: SLOT_SIZE,
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.slotContent} />
      </TouchableOpacity>
    );
  };

  return (
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
          <Text style={[styles.buildButtonText, { color: accentColor }]}>
            Build
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid Area */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          {renderGridSlot(0)}
          {renderGridSlot(1)}
        </View>
        <View style={styles.gridRow}>
          {renderGridSlot(2)}
          {renderGridSlot(3)}
        </View>
        <View style={styles.gridRow}>
          {renderGridSlot(4)}
          {renderGridSlot(5)}
        </View>
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
  gridContainer: {
    paddingHorizontal: PADDING,
    gap: GAP,
  },
  gridRow: {
    flexDirection: "row",
    gap: GAP,
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
  slotContent: {
    flex: 1,
  },
});
