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

export default function CreateRoomScreen({
  navigation,
}: CreateRoomScreenProps) {
  const { colors } = useTheme();
  const [roomName, setRoomName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

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

      const newRoom: Room = {
        id: `room-${Date.now()}`,
        name: roomName.trim(),
        isPublic,
        password: isPublic ? undefined : password.trim(),
        memberCount: 1,
        members: [
          {
            id: userId,
            name: userName,
            status: "idle",
          },
        ],
        startedAt: new Date().toISOString(),
      };

      const updatedRooms = [...rooms, newRoom];
      await saveRooms(updatedRooms);

      Alert.alert("Success", "Room created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
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
    borderRadius: 12,
    alignItems: "center",
    marginTop: 32,
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
