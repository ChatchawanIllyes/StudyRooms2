import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import {
  Room,
  loadRooms,
  saveRooms,
  getUserId,
  getUserName,
} from "../utils/roomsData";

interface CreateRoomScreenProps {
  navigation: any;
}

const CATEGORIES = [
  { id: 'general', name: 'General', icon: 'people', color: '#007AFF' },
  { id: 'study', name: 'Study', icon: 'book', color: '#34C759' },
  { id: 'work', name: 'Work', icon: 'briefcase', color: '#FF9500' },
  { id: 'project', name: 'Project', icon: 'construct', color: '#FF3B30' },
  { id: 'exam', name: 'Exam Prep', icon: 'school', color: '#5856D6' },
  { id: 'focus', name: 'Deep Focus', icon: 'flash', color: '#AF52DE' },
];

export default function CreateRoomScreen({
  navigation,
}: CreateRoomScreenProps) {
  const { colors } = useTheme();
  const [roomName, setRoomName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert("Error", "Please enter a room name");
      return;
    }

    if (!isPublic && !password.trim()) {
      Alert.alert("Error", "Please enter a password for private room");
      return;
    }

    setCreating(true);

    try {
      const userId = await getUserId();
      const userName = await getUserName();
      const rooms = await loadRooms();

      const now = Date.now();

      const newRoom: Room = {
        id: `room-${now}`,
        name: roomName.trim(),
        isPublic,
        password: isPublic ? undefined : password.trim(),
        memberCount: 1,
        members: [
          {
            id: userId,
            name: userName,
            status: "idle",
            todayStats: {
              totalStudyTime: 0,
              sessionsCompleted: 0,
              lastActive: now,
            }
          },
        ],
        description: roomName.trim(),
        ownerName: userName,
        ownerId: userId,
        startedAt: now,
        category: selectedCategory.name,
        activityFeed: [],
        messages: [],
        leaderboard: {
          daily: {},
          weekly: [],
          allTime: []
        },
        settings: {
          maxMembers: 20,
          allowChat: true,
          allowReactions: true,
        }
      };

      const updatedRooms = [...rooms, newRoom];
      await saveRooms(updatedRooms);

      // Navigate to the newly created room
      navigation.navigate('RoomSession', { roomId: newRoom.id });
    } catch (error) {
      Alert.alert("Error", "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Create Room
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Preview Card */}
        {roomName.trim().length > 0 && (
          <View style={[styles.previewCard, { borderColor: colors.border }]}>
            <View style={styles.previewGradient}>
              <View style={styles.previewHeader}>
                <Ionicons
                  name={selectedCategory.icon as any}
                  size={24}
                  color={selectedCategory.color}
                />
                <Text style={[styles.previewTitle, { color: colors.text }]}>
                  {roomName}
                </Text>
              </View>
              <View style={styles.previewMeta}>
                <View
                  style={[
                    styles.previewBadge,
                    {
                      backgroundColor: isPublic
                        ? "rgba(52, 199, 89, 0.1)"
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewBadgeText,
                      { color: isPublic ? "#34c759" : colors.textSecondary },
                    ]}
                  >
                    {isPublic ? "Public" : "Private"}
                  </Text>
                </View>
                <Text style={[styles.previewCategory, { color: colors.textSecondary }]}>
                  {selectedCategory.name}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Room Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter room name"
            placeholderTextColor={colors.textSecondary}
            value={roomName}
            onChangeText={setRoomName}
            maxLength={50}
          />
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory.id === category.id
                        ? category.color + "20"
                        : colors.card,
                    borderColor:
                      selectedCategory.id === category.id
                        ? category.color
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={18}
                  color={
                    selectedCategory.id === category.id
                      ? category.color
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color:
                        selectedCategory.id === category.id
                          ? category.color
                          : colors.text,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons
                name={isPublic ? "globe-outline" : "lock-closed"}
                size={20}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.label,
                  { color: colors.textSecondary, marginBottom: 0 },
                ]}
              >
                {isPublic ? "Public Room" : "Private Room"}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#ffffff"
            />
          </View>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            {isPublic
              ? "Anyone can join this room"
              : "Only people with the password can join"}
          </Text>
        </View>

        {!isPublic && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Password
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              maxLength={20}
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: colors.accent },
            creating && styles.createButtonDisabled,
          ]}
          onPress={handleCreateRoom}
          disabled={creating}
        >
          <Text style={styles.createButtonText}>
            {creating ? "Creating..." : "Create Room"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  previewCard: {
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  previewGradient: {
    padding: 20,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  previewCategory: {
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  switchLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
  },
  createButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
