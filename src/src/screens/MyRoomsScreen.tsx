import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  Room,
  loadRooms,
  saveRooms,
  getUserId,
} from "../utils/roomsData";
import { useTheme } from "../context/ThemeContext";

interface MyRoomsScreenProps {
  navigation: any;
}

export default function MyRoomsScreen({ navigation }: MyRoomsScreenProps) {
  const { isDark } = useTheme();

  // Reactive palette derived from theme
  const BG = isDark ? "#000000" : "#FFFFFF";
  const FG = isDark ? "#FFFFFF" : "#000000";
  const SUBTLE = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";

  // Color-dependent style overrides (kept out of StyleSheet.create so they
  // react to isDark changes at render time)
  const colorStyles = {
    bg: { backgroundColor: BG },
    borderFG: { borderColor: FG },
    borderSubtle: { borderColor: SUBTLE },
    borderTagOutline: {
      borderColor: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)",
    },
  };

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const timeoutRefs = React.useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      initializeRooms();
    });
    return () => {
      unsubscribe();
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
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

  const filteredRooms = myRooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoomPress = (room: Room) => {
    navigation.navigate("RoomSession", { roomId: room.id });
  };

  const handleRoomLongPress = (room: Room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handleChatPress = (room: Room) => {
    navigation.navigate("RoomSession", { roomId: room.id, openChat: true });
  };

  const handleLeaveRoom = async (room: Room) => {
    const updatedMembers = room.members?.filter((m) => m.id !== userId) || [];
    const updatedRoom = {
      ...room,
      members: updatedMembers,
      memberCount: updatedMembers.length,
    };
    const updatedRooms = rooms.map((r) => (r.id === room.id ? updatedRoom : r));
    setRooms(updatedRooms);
    await saveRooms(updatedRooms);
    setShowModal(false);
  };

  const toggleActionButtons = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowActionButtons((prev) => !prev);
  };

  if (loading) {
    return (
      <View style={[styles.container, colorStyles.bg]}>
        <ActivityIndicator size="large" color={FG} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, colorStyles.bg]}>
      {/* Fixed header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.eyebrow, { color: SUBTLE }]}>DISCOVER</Text>
          <Pressable onPress={toggleActionButtons} style={[styles.headerFab, colorStyles.borderFG]}>
            <View>
              <Ionicons name="add" size={20} color={FG} />
            </View>
          </Pressable>
        </View>
        <Text style={[styles.pageTitle, { color: FG }]}>Study Rooms</Text>
      </View>

      {/* Scrollable content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {myRooms.length > 0 && (
          <View style={[styles.searchBar, colorStyles.borderFG]}>
            <Ionicons name="search" size={18} color={SUBTLE} />
            <TextInput
              style={[styles.searchInput, { color: FG }]}
              placeholder="Search rooms..."
              placeholderTextColor={SUBTLE}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={FG}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={SUBTLE} />
              </Pressable>
            )}
          </View>
        )}

        {filteredRooms.length > 0 ? (
          <View style={styles.roomsList}>
            {filteredRooms.map((room) => {
              const currentCount = room.memberCount || room.members?.length || 0;
              const maxMembers = room.settings?.maxMembers || 0;
              const memberLabel = maxMembers
                ? `LIVE  ·  ${currentCount}/${maxMembers} MEMBERS`
                : `LIVE  ·  ${currentCount} MEMBERS`;

              return (
                <View key={room.id} style={styles.roomRow}>
                  {/* Room card */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.roomCard,
                      colorStyles.borderFG,
                      pressed && colorStyles.borderSubtle,
                    ]}
                    onPress={() => handleRoomPress(room)}
                    onLongPress={() => handleRoomLongPress(room)}
                  >
                    <View style={styles.roomTitleRow}>
                      <Text style={[styles.roomName, { color: FG }]} numberOfLines={1}>
                        {room.name}
                      </Text>
                      {!room.isPublic && (
                        <Ionicons name="lock-closed" size={12} color={SUBTLE} />
                      )}
                    </View>

                    <Text style={[styles.roomMeta, { color: SUBTLE }]}>
                      {memberLabel}
                    </Text>

                    <View style={styles.tagsRow}>
                      <View style={[styles.tag, colorStyles.borderTagOutline]}>
                        <Text style={[styles.tagText, { color: FG }]}>
                          {room.category || "General"}
                        </Text>
                      </View>
                      <View style={[styles.tag, colorStyles.borderTagOutline]}>
                        <Text style={[styles.tagText, { color: FG }]}>
                          {room.isPublic ? "PUBLIC" : "PRIVATE"}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Chat button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.chatButton,
                      colorStyles.borderFG,
                      pressed && { backgroundColor: FG },
                    ]}
                    onPress={() => handleChatPress(room)}
                  >
                    {({ pressed }) => (
                      <Ionicons
                        name="chatbubble"
                        size={20}
                        color={pressed ? BG : FG}
                      />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : myRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={SUBTLE} />
            <Text style={[styles.emptyTitle, { color: FG }]}>No Rooms Yet</Text>
            <Text style={[styles.emptySubtitle, { color: SUBTLE }]}>TAP + TO JOIN OR CREATE</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Action popup modal */}
      <Modal
        visible={showActionButtons}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionButtons(false)}
      >
        <Pressable style={styles.popupOverlay} onPress={() => setShowActionButtons(false)}>
          <Pressable style={[styles.popupCard, colorStyles.bg, { borderColor: FG }]} onPress={() => {}}>
            <Pressable
              onPress={() => setShowActionButtons(false)}
              style={styles.popupCloseButton}
            >
              <Ionicons name="close" size={16} color={SUBTLE} />
            </Pressable>

            <Pressable
              onPress={() => {
                setShowActionButtons(false);
                setTimeout(() => navigation.navigate("JoinRoom"), 200);
              }}
              style={({ pressed }) => [styles.popupButton, pressed && { backgroundColor: FG }]}
            >
              {({ pressed }) => (
                <>
                  <Ionicons name="enter-outline" size={18} color={pressed ? BG : FG} />
                  <Text style={[styles.popupButtonText, { color: pressed ? BG : FG }]}>JOIN ROOM</Text>
                </>
              )}
            </Pressable>

            <View style={[styles.popupDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }]} />

            <Pressable
              onPress={() => {
                setShowActionButtons(false);
                setTimeout(() => navigation.navigate("CreateRoom"), 200);
              }}
              style={({ pressed }) => [styles.popupButton, pressed && { backgroundColor: FG }]}
            >
              {({ pressed }) => (
                <>
                  <Ionicons name="add-circle-outline" size={18} color={pressed ? BG : FG} />
                  <Text style={[styles.popupButtonText, { color: pressed ? BG : FG }]}>CREATE ROOM</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Room details modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, colorStyles.bg, colorStyles.borderFG]}>
            {selectedRoom && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: FG }]}>{selectedRoom.name}</Text>
                  <Pressable onPress={() => setShowModal(false)}>
                    <Ionicons name="close" size={24} color={FG} />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={[styles.modalSectionHeader, { color: SUBTLE }]}>
                    {`MEMBERS (${selectedRoom.memberCount || 0})`}
                  </Text>
                  {selectedRoom.members?.map((member, index) => (
                    <View key={index} style={styles.memberRow}>
                      <Ionicons name="person-circle" size={22} color={SUBTLE} />
                      <Text style={[styles.memberName, { color: FG }]}>
                        {member.name}
                        {member.id === userId ? " (You)" : ""}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.leaveButton,
                      colorStyles.borderFG,
                      pressed && { backgroundColor: FG },
                    ]}
                    onPress={() => handleLeaveRoom(selectedRoom)}
                  >
                    {({ pressed }) => (
                      <Text
                        style={[
                          styles.leaveButtonText,
                          { color: pressed ? BG : FG },
                        ]}
                      >
                        LEAVE ROOM
                      </Text>
                    )}
                  </Pressable>
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
  // ── Container
  container: {
    flex: 1,
  },

  // ── Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 3,
  },
  pageTitle: {
    fontFamily: "PlayfairDisplayItalic",
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  headerFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // ── Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderRadius: 999,
    backgroundColor: "transparent",
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
  },

  // ── Room list
  roomsList: {
    flexDirection: "column",
    gap: 14,
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  roomCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 32,
    backgroundColor: "transparent",
    padding: 18,
  },
  roomTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  roomName: {
    fontFamily: "PlayfairDisplayItalic",
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  roomMeta: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // ── Chat button
  chatButton: {
    width: 52,
    borderRadius: 32,
    borderWidth: 2,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
    gap: 16,
  },
  emptyTitle: {
    fontFamily: "PlayfairDisplayItalic",
    fontSize: 22,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 2.5,
  },

  // ── Modal (details)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "90%",
    maxHeight: "80%",
    borderWidth: 2,
    borderRadius: 32,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  modalTitle: {
    fontFamily: "PlayfairDisplayItalic",
    fontSize: 22,
  },
  modalBody: {
    padding: 20,
    paddingTop: 0,
  },
  modalSectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 12,
  },
  memberRow: {
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
  },
  leaveButton: {
    borderWidth: 2,
    borderRadius: 32,
    backgroundColor: "transparent",
    paddingVertical: 14,
    alignItems: "center",
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 2,
  },

  // ── Popup modal (action buttons)
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupCard: {
    borderWidth: 2,
    borderRadius: 24,
    paddingVertical: 8,
    width: 220,
    overflow: "hidden",
  },
  popupButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  popupButtonText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 2.5,
  },
  popupDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  popupCloseButton: {
    position: "absolute",
    top: 4,
    right: 4,
    padding: 4,
  },
});
