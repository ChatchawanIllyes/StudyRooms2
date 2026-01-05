import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
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

interface MyRoomsScreenProps {
  navigation: any;
}

export default function MyRoomsScreen({ navigation }: MyRoomsScreenProps) {
  const { colors } = useTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // Animation values
  const rotation = useSharedValue(0);
  const button1Opacity = useSharedValue(0);
  const button1TranslateY = useSharedValue(20);
  const button2Opacity = useSharedValue(0);
  const button2TranslateY = useSharedValue(20);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      initializeRooms();
    });
    return unsubscribe;
  }, [navigation]);

  const initializeRooms = async () => {
    const id = await getUserId();
    setUserId(id);
    const loadedRooms = await loadRooms();
    setRooms(loadedRooms);
    setLoading(false);
  };

  const myRooms = rooms.filter((room) =>
    room.members?.some((m) => m.id === userId)
  );

  const handleRoomPress = (room: Room) => {
    setSelectedRoom(room);
    setShowModal(true);
    setPasswordError(false);
    setPasswordInput("");
  };

  const handleLeaveRoom = async (room: Room) => {
    const updatedMembers = room.members?.filter((m) => m.id !== userId) || [];
    const updatedMemberCount = updatedMembers.length;

    const updatedRoom = {
      ...room,
      members: updatedMembers,
      memberCount: updatedMemberCount,
    };

    const updatedRooms = rooms.map((r) => (r.id === room.id ? updatedRoom : r));
    setRooms(updatedRooms);
    await saveRooms(updatedRooms);
    setShowModal(false);
  };

  const toggleActionButtons = () => {
    if (showActionButtons) {
      // Hide buttons
      rotation.value = withSpring(0);
      button1Opacity.value = withTiming(0, { duration: 150 });
      button1TranslateY.value = withTiming(20, { duration: 150 });
      button2Opacity.value = withTiming(0, { duration: 150 });
      button2TranslateY.value = withTiming(20, { duration: 150 });
      setTimeout(() => setShowActionButtons(false), 150);
    } else {
      // Show buttons
      setShowActionButtons(true);
      rotation.value = withSpring(45);
      button1Opacity.value = withTiming(1, { duration: 200 });
      button1TranslateY.value = withSpring(0);
      setTimeout(() => {
        button2Opacity.value = withTiming(1, { duration: 200 });
        button2TranslateY.value = withSpring(0);
      }, 50);
    }
  };

  const handleNavigate = (screen: string) => {
    toggleActionButtons();
    setTimeout(() => navigation.navigate(screen), 200);
  };

  // Animated styles
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const button1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: button1Opacity.value,
    transform: [{ translateY: button1TranslateY.value }],
  }));

  const button2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: button2Opacity.value,
    transform: [{ translateY: button2TranslateY.value }],
  }));

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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>My Rooms</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {myRooms.length} room{myRooms.length !== 1 ? "s" : ""} joined
        </Text>

        {myRooms.length > 0 ? (
          <View style={styles.roomsList}>
            {myRooms.map((room) => (
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
              name="people-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No rooms joined yet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Tap the + button to join or create a room
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {showActionButtons && (
        <>
          <Animated.View
            style={[
              styles.actionButton1,
              { backgroundColor: colors.card },
              button1AnimatedStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.actionButtonInner}
              onPress={() => handleNavigate("JoinRoom")}
              activeOpacity={0.7}
            >
              <Ionicons name="enter-outline" size={20} color={colors.accent} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Join Room
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.actionButton2,
              { backgroundColor: colors.card },
              button2AnimatedStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.actionButtonInner}
              onPress={() => handleNavigate("CreateRoom")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Create Room
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={toggleActionButtons}
        activeOpacity={0.8}
      >
        <Animated.View style={fabAnimatedStyle}>
          <Ionicons name="add" size={28} color="#ffffff" />
        </Animated.View>
      </TouchableOpacity>

      {/* Room Details Modal */}
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

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text
                      style={[
                        styles.modalLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Members ({selectedRoom.memberCount})
                    </Text>
                    {selectedRoom.members?.map((member, index) => (
                      <View key={index} style={styles.memberItem}>
                        <Ionicons
                          name="person-circle"
                          size={24}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[styles.memberName, { color: colors.text }]}
                        >
                          {member.name}
                          {member.id === userId ? " (You)" : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.leaveButton,
                      { backgroundColor: colors.border },
                    ]}
                    onPress={() => handleLeaveRoom(selectedRoom)}
                  >
                    <Text
                      style={[styles.leaveButtonText, { color: colors.text }]}
                    >
                      Leave Room
                    </Text>
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
  content: {
    padding: 20,
    paddingBottom: 100,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 0,
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
    paddingTop: 160,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  actionButton1: {
    position: "absolute",
    right: 16,
    bottom: 140,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButton2: {
    position: "absolute",
    right: 16,
    bottom: 85,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
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
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  memberName: {
    fontSize: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  leaveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
