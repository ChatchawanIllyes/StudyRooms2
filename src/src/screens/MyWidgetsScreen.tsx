import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function MyWidgetsScreen() {
  const { colors, accentColor } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Widgets</Text>
      </View>

      {/* Empty State */}
      <View style={styles.emptyState}>
        <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
          <Ionicons
            name="grid-outline"
            size={48}
            color={colors.textSecondary}
          />
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Your widgets will appear here
        </Text>
      </View>

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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 17,
    textAlign: "center",
    letterSpacing: -0.4,
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
