import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  Room,
  loadRooms,
  saveRooms,
  getUserId,
  getUserName,
  formatTimeAgo,
} from '../utils/roomsData';

export default function RoomsScreen() {
  const { colors } = useTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
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

  const myRooms = rooms.filter((room) => room.members?.some((m) => m.id === userId));

  const handleRoomPress = (room: Room) => {
    setSelectedRoom(room);
    setShowModal(true);
    setPasswordError(false);
    setPasswordInput('');
  };

  const handleJoinRoom = async (room: Room) => {
    const userName = await getUserName();
    const isAlreadyMember = room.members?.some((m) => m.id === userId);

    if (!isAlreadyMember) {
      const updatedRoom = {
        ...room,
        members: [
          ...(room.members || []),
          { id: userId, name: userName, status: 'idle' as const },
        ],
        memberCount: (room.memberCount || 0) + 1,
      };

      const updatedRooms = rooms.map((r) => (r.id === room.id ? updatedRoom : r));
      setRooms(updatedRooms);
      await saveRooms(updatedRooms);
    }
    setShowModal(false);
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

  const isUserInRoom = (room: Room) => room.members?.some((m) => m.id === userId);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>My Rooms</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {myRooms.length} room{myRooms.length !== 1 ? 's' : ''} joined
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
                    <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>
                      {room.name}
                    </Text>
                    {!room.isPublic && (
                      <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                    )}
                  </View>
                  <View style={styles.roomMeta}>
                    <Ionicons name="people" size={14} color={colors.textSecondary} />
                    <Text style={[styles.roomMetaText, { color: colors.textSecondary }]}>
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
                          ? 'rgba(52, 199, 89, 0.1)'
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: room.isPublic ? '#34c759' : colors.textSecondary,
                        },
                      ]}
                    >
                      {room.isPublic ? 'Public' : 'Private'}
                    </Text>
                  </View>
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                    {formatTimeAgo(room.startedAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No rooms joined yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Browse rooms below to get started
            </Text>
          </View>
        )}

        {/* All Rooms */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Rooms</Text>
        <View style={styles.roomsList}>
          {rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[styles.roomCard, { backgroundColor: colors.card }]}
              onPress={() => handleRoomPress(room)}
              activeOpacity={0.7}
            >
              <View style={styles.roomHeader}>
                <View style={styles.roomTitleRow}>
                  <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>
                    {room.name}
                  </Text>
                  {!room.isPublic && (
                    <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                  )}
                </View>
                <View style={styles.roomMeta}>
                  <Ionicons name="people" size={14} color={colors.textSecondary} />
                  <Text style={[styles.roomMetaText, { color: colors.textSecondary }]}>
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
                        ? 'rgba(52, 199, 89, 0.1)'
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: room.isPublic ? '#34c759' : colors.textSecondary,
                      },
                    ]}
                  >
                    {room.isPublic ? 'Public' : 'Private'}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {formatTimeAgo(room.startedAt)}
                </Text>
                {isUserInRoom(room) && (
                  <View style={[styles.joinedBadge, { backgroundColor: colors.accent + '33' }]}>
                    <Text style={[styles.joinedBadgeText, { color: colors.accent }]}>Joined</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Room Details Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedRoom?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Description
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {selectedRoom?.description}
                </Text>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Category</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {selectedRoom?.category}
                </Text>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Owner</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {selectedRoom?.ownerName}
                </Text>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Members</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {selectedRoom?.memberCount} / 50
                </Text>
              </View>

              {selectedRoom && !selectedRoom.isPublic && !isUserInRoom(selectedRoom) && (
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: passwordError ? colors.destructive : 'transparent',
                      },
                    ]}
                    placeholder="Enter room password..."
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                    value={passwordInput}
                    onChangeText={(text) => {
                      setPasswordInput(text);
                      setPasswordError(false);
                    }}
                  />
                  {passwordError && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>
                      Incorrect password
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              {selectedRoom && isUserInRoom(selectedRoom) ? (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.destructive }]}
                  onPress={() => handleLeaveRoom(selectedRoom)}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>Leave</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    if (selectedRoom && !selectedRoom.isPublic) {
                      if (passwordInput === selectedRoom.password) {
                        handleJoinRoom(selectedRoom);
                      } else {
                        setPasswordError(true);
                      }
                    } else if (selectedRoom) {
                      handleJoinRoom(selectedRoom);
                    }
                  }}
                  disabled={(selectedRoom?.memberCount || 0) >= 50}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    {(selectedRoom?.memberCount || 0) >= 50 ? 'Room Full' : 'Join'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '300',
    marginTop: 32,
    marginBottom: 16,
  },
  roomsList: {
    gap: 12,
  },
  roomCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  roomHeader: {
    marginBottom: 12,
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomMetaText: {
    fontSize: 14,
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
  },
  joinedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  joinedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  modalBody: {
    paddingHorizontal: 24,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  passwordContainer: {
    marginTop: 8,
  },
  passwordInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
