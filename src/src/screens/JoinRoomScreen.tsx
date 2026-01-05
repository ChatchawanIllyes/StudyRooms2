import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import {
  Room,
  loadRooms,
  saveRooms,
  getUserId,
  getUserName,
  formatTimeAgo,
} from "../utils/roomsData";

interface JoinRoomScreenProps {
  navigation: any;
}

export default function JoinRoomScreen({ navigation }: JoinRoomScreenProps) {
  const { colors } = useTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    initializeRooms();
  }, []);

  const initializeRooms = async () => {
    const id = await getUserId();
    setUserId(id);
    const loadedRooms = await loadRooms();
    setRooms(loadedRooms);
    setLoading(false);
  };

  const availableRooms = rooms.filter(
    (room) => !room.members?.some((m) => m.id === userId)
  );

  const handleRoomPress = (room: Room) => {
    setSelectedRoom(room);
    setShowModal(true);
    setPasswordError(false);
    setPasswordInput("");
  };

  const handleJoinRoom = async (room: Room) => {
    if (!room.isPublic && room.password) {
      if (passwordInput !== room.password) {
        setPasswordError(true);
        return;
      }
    }

    const userName = await getUserName();
    const updatedRoom = {
      ...room,
      members: [
        ...(room.members || []),
        { id: userId, name: userName, status: "idle" as const },
      ],
      memberCount: (room.memberCount || 0) + 1,
    };

    const updatedRooms = rooms.map((r) => (r.id === room.id ? updatedRoom : r));
    setRooms(updatedRooms);
    await saveRooms(updatedRooms);
    setShowModal(false);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={{ marginTop: 100 }}
        />
      </View>
    );
  }

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
          Join Room
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {availableRooms.length} room{availableRooms.length !== 1 ? "s" : ""}{" "}
          available
        </Text>

        {availableRooms.length > 0 ? (
          <View style={styles.roomsList}>
            {availableRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[styles.roomCard, { backgroundColor: colors.card }]}
                onPress={() => handleRoomPress(room)}
                activeOpacity={0.7}
              >
                <View style={styles.roomHeader}>
                  <View style={styles.roomTitleRow}>
                    <Text
                      style={[styles.roomName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {room.name}
                    </Text>
                    {!room.isPublic && (
                      <Ionicons
                        name="lock-closed"
                        size={16}
                        color={colors.textSecondary}
                      />
                    )}
                  </View>
                  <View style={styles.roomMeta}>
                    <Ionicons
                      name="people"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.roomMetaText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {room.memberCount} members
                    </Text>
                  </View>
                </View>
                <View style={styles.roomFooter}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: room.isPublic
                          ? "rgba(52, 199, 89, 0.1)"
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: room.isPublic
                            ? "#34c759"
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {room.isPublic ? "Public" : "Private"}
                    </Text>
                  </View>
                  <Text
                    style={[styles.timeText, { color: colors.textSecondary }]}
                  >
                    {formatTimeAgo(room.startedAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-circle-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You've joined all available rooms!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Join Room Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedRoom && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedRoom.name}
                  </Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="people"
                        size={20}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {selectedRoom.memberCount} members
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name={
                          selectedRoom.isPublic
                            ? "globe-outline"
                            : "lock-closed"
                        }
                        size={20}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {selectedRoom.isPublic ? "Public" : "Private"}
                      </Text>
                    </View>
                  </View>

                  {!selectedRoom.isPublic && selectedRoom.password && (
                    <View style={styles.passwordSection}>
                      <Text
                        style={[
                          styles.passwordLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Password Required
                      </Text>
                      <TextInput
                        style={[
                          styles.passwordInput,
                          {
                            backgroundColor: colors.background,
                            color: colors.text,
                            borderColor: passwordError
                              ? "#ff3b30"
                              : colors.border,
                          },
                        ]}
                        placeholder="Enter room password"
                        placeholderTextColor={colors.textSecondary}
                        value={passwordInput}
                        onChangeText={(text) => {
                          setPasswordInput(text);
                          setPasswordError(false);
                        }}
                        secureTextEntry
                      />
                      {passwordError && (
                        <Text style={styles.errorText}>Incorrect password</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.joinButton,
                      { backgroundColor: colors.accent },
                    ]}
                    onPress={() => handleJoinRoom(selectedRoom)}
                  >
                    <Text style={styles.joinButtonText}>Join Room</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  roomsList: {
    gap: 12,
  },
  roomCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  roomHeader: {
    marginBottom: 12,
  },
  roomTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  roomName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  roomMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomMetaText: {
    fontSize: 14,
  },
  roomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 16,
  },
  passwordSection: {
    marginTop: 12,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 4,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  joinButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
