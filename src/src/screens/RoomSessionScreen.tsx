import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useStudyTimer } from '../context/StudyTimerContext';
import {
  Room,
  Member,
  ActivityItem,
  getUserId,
  getUserName,
} from '../utils/roomsData';
import {
  getRoomById,
  startMemberSession,
  endMemberSession,
  updateMemberTimer,
  getRoomLeaderboard,
  getActivityFeed,
  sendMessage,
  getRoomMessages,
  addReactionToMessage,
  formatTime,
  formatTimeAgo,
  getActivityDescription,
  syncGlobalTimerToRooms,
} from '../services/roomsService';
import * as StorageService from '../services/storage';
import { Subject } from '../types';

interface RoomSessionScreenProps {
  navigation: any;
  route: any;
}

export default function RoomSessionScreen({ navigation, route }: RoomSessionScreenProps) {
  const { colors } = useTheme();
  const studyTimer = useStudyTimer();
  const { roomId } = route.params;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');

  // UI state
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Data state
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Refs
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<FlatList>(null);
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    initializeRoom();
    loadSubjects();

    // Poll for updates every 5 seconds
    pollInterval.current = setInterval(() => {
      refreshRoomData();
    }, 5000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [roomId]);

  // CRITICAL: Sync timer with room member status (bidirectional)
  // This updates room status every second when studying (for smooth updates)
  useEffect(() => {
    if (studyTimer.isRunning && !studyTimer.isPaused && studyTimer.currentSubject) {
      // Update member timer every 1 second for smooth updates
      const interval = setInterval(() => {
        const elapsedSeconds = Math.floor(studyTimer.elapsedMs / 1000);
        updateMemberTimer(roomId, userId, elapsedSeconds);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [studyTimer.isRunning, studyTimer.isPaused, studyTimer.elapsedMs, roomId, userId]);

  const initializeRoom = async () => {
    try {
      const id = await getUserId();
      const name = await getUserName();
      setUserId(id);
      setUserName(name);

      await loadRoomData();
      setLoading(false);
    } catch (error) {
      console.error('Error initializing room:', error);
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    const loadedSubjects = await StorageService.getSubjects();
    setSubjects(loadedSubjects);
  };

  const loadRoomData = async () => {
    try {
      const roomData = await getRoomById(roomId);
      if (!roomData) {
        Alert.alert('Error', 'Room not found');
        navigation.goBack();
        return;
      }

      setRoom(roomData);

      // Load leaderboard
      const leaderboardData = await getRoomLeaderboard(roomId, 'today');
      setLeaderboard(leaderboardData);

      // Load activity feed
      const activityData = await getActivityFeed(roomId, 20);
      setActivityFeed(activityData);

      // Load chat messages
      const messages = await getRoomMessages(roomId, 50);
      setChatMessages(messages);

      // Check for unread messages
      if (messages.length > lastMessageCountRef.current) {
        const newMessages = messages.length - lastMessageCountRef.current;
        if (lastMessageCountRef.current > 0) {
          setUnreadCount(prev => prev + newMessages);
        }
        lastMessageCountRef.current = messages.length;
      }
    } catch (error) {
      console.error('Error loading room data:', error);
    }
  };

  const refreshRoomData = async () => {
    await loadRoomData();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoomData();
    setRefreshing(false);
  };

  const handleStartStudying = () => {
    setShowSubjectPicker(true);
  };

  const handleSubjectSelect = async (subject: Subject) => {
    setShowSubjectPicker(false);

    // Start global timer (this is the source of truth)
    // This will automatically sync to all rooms the user is in
    await studyTimer.startWithSubject(subject);

    // Refresh room data to show updated status
    await refreshRoomData();
  };

  const handleEndSession = async () => {
    if (!studyTimer.isRunning && !studyTimer.isPaused) return;

    const elapsedSeconds = Math.floor(studyTimer.elapsedMs / 1000);

    // Stop global timer (saves session)
    await studyTimer.stopAndSave();

    // Update room member status
    await endMemberSession(roomId, userId, elapsedSeconds);
    await refreshRoomData();
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    await sendMessage(roomId, userId, userName, chatMessage.trim());
    setChatMessage('');
    await loadRoomData();

    // Auto-scroll to bottom
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleChatOpen = () => {
    setShowChatModal(true);
    setUnreadCount(0);
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const getStatusColor = (status: 'studying' | 'idle') => {
    switch (status) {
      case 'studying': return '#ff3b30'; // Red
      case 'idle': return colors.textSecondary; // Gray
    }
  };

  const renderMemberCard = (member: Member) => {
    const isCurrentUser = member.id === userId;
    const statusColor = getStatusColor(member.status);
    let statusText = 'Not studying';
    let activityText = '';

    if (member.status === 'studying' && member.currentSession) {
      statusText = 'Studying';
      const elapsed = member.currentSession.elapsedTime;
      const timerText = isCurrentUser && studyTimer.isRunning
        ? formatTime(Math.floor(studyTimer.elapsedMs / 1000))
        : formatTime(elapsed);
      activityText = `${member.currentSession.subject} - ${timerText}`;
    }

    const todayTime = formatTime(member.todayStats.totalStudyTime);

    return (
      <View
        key={member.id}
        style={[
          styles.memberCard,
          { backgroundColor: colors.card },
          isCurrentUser && { borderColor: colors.accent, borderWidth: 2 }
        ]}
      >
        {/* Header with colored dot and name */}
        <View style={styles.memberHeader}>
          <View style={[styles.memberAvatar, { backgroundColor: `${colors.accent}40` }]}>
            <Text style={[styles.memberAvatarText, { color: colors.text }]}>
              {member.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.nameRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                {member.name}{isCurrentUser ? ' (You)' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Current activity */}
        <View style={styles.activitySection}>
          <Text style={[styles.activityText, { color: colors.text }]} numberOfLines={1}>
            {activityText || statusText}
          </Text>
        </View>

        {/* Today's total time only */}
        <View style={styles.memberFooter}>
          <Text style={[styles.todayTime, { color: colors.textSecondary }]}>
            {todayTime} today
          </Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardEntry = (entry: any, index: number) => {
    const isCurrentUser = entry.userId === userId;
    const medalEmojis = ['🥇', '🥈', '🥉'];
    const medal = index < 3 ? medalEmojis[index] : null;

    return (
      <View
        key={entry.userId}
        style={[
          styles.leaderboardEntry,
          { backgroundColor: colors.background },
          isCurrentUser && { borderColor: colors.accent, borderWidth: 2 }
        ]}
      >
        <View style={styles.leaderboardRank}>
          {medal ? (
            <Text style={styles.medal}>{medal}</Text>
          ) : (
            <Text style={[styles.rankNumber, { color: colors.textSecondary }]}>
              #{entry.rank}
            </Text>
          )}
        </View>
        <View style={styles.leaderboardInfo}>
          <Text style={[styles.leaderboardName, { color: colors.text }]}>
            {entry.userName}{isCurrentUser ? ' (You)' : ''}
          </Text>
          <Text style={[styles.leaderboardStats, { color: colors.textSecondary }]}>
            {formatTime(entry.totalTime)} • {entry.sessionsCompleted} sessions
          </Text>
        </View>
      </View>
    );
  };

  const renderActivityItem = (activity: ActivityItem) => {
    const icon = activity.type === 'session_start' ? 'play-circle' :
                 activity.type === 'session_end' ? 'checkmark-circle' :
                 activity.type === 'milestone' ? 'trophy' :
                 'person-add';

    const description = getActivityDescription(activity);

    return (
      <View key={activity.id} style={styles.activityItem}>
        <Ionicons
          name={icon as any}
          size={20}
          color={activity.type === 'milestone' ? '#ffd700' : colors.accent}
        />
        <View style={styles.activityContent}>
          <Text style={[styles.activityDescription, { color: colors.text }]}>
            <Text style={{ fontWeight: '600' }}>{activity.userName}</Text> {description}
          </Text>
          <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
            {formatTimeAgo(activity.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderChatMessage = (item: any) => {
    const isCurrentUser = item.userId === userId;
    const isSystem = item.type === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
            {item.message}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.chatMessage,
          isCurrentUser ? styles.chatMessageSent : styles.chatMessageReceived
        ]}
      >
        <View
          style={[
            styles.chatBubble,
            {
              backgroundColor: isCurrentUser ? colors.accent : colors.card
            }
          ]}
        >
          {!isCurrentUser && (
            <Text style={[styles.chatSender, { color: '#ffffff' }]}>
              {item.userName}
            </Text>
          )}
          <Text
            style={[
              styles.chatText,
              { color: isCurrentUser ? '#ffffff' : colors.text }
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.chatTime,
              { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
            ]}
          >
            {formatTimeAgo(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading || !room) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 100 }} />
      </View>
    );
  }

  const currentMember = room.members?.find(m => m.id === userId);
  const isStudying = currentMember?.status === 'studying';
  const onlineCount = room.members?.filter(m => m.status !== 'idle').length || 0;

  // Activity feed: show 3 by default, all when expanded
  const displayedActivity = showAllActivity
    ? activityFeed
    : activityFeed.slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>
            {room.name}
          </Text>
          <Text style={[styles.roomMeta, { color: colors.textSecondary }]}>
            {onlineCount}/{room.memberCount} active
          </Text>
        </View>
        <TouchableOpacity onPress={handleLeaveRoom}>
          <Ionicons name="exit-outline" size={24} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Live Members Grid (4-column) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Members</Text>
          <View style={styles.membersGrid}>
            {room.members?.map(renderMemberCard)}
          </View>
        </View>

        {/* Activity Feed - Collapsible */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Feed</Text>
          <View style={styles.activityFeed}>
            {displayedActivity.length > 0 ? (
              <>
                {displayedActivity.map(renderActivityItem)}
                {activityFeed.length > 3 && (
                  <TouchableOpacity
                    style={[styles.seeAllButton, { backgroundColor: colors.card }]}
                    onPress={() => setShowAllActivity(!showAllActivity)}
                  >
                    <Text style={[styles.seeAllText, { color: colors.accent }]}>
                      {showAllActivity ? 'Show Less ↑' : `See All Activity (${activityFeed.length}) ↓`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No recent activity
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Quick Actions Bar with Leaderboard */}
      <View style={[styles.actionBar, { backgroundColor: colors.card }]}>
        {!isStudying && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={handleStartStudying}
          >
            <Ionicons name="book" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Study</Text>
          </TouchableOpacity>
        )}

        {isStudying && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.destructive }]}
            onPress={handleEndSession}
          >
            <Ionicons name="stop" size={18} color="#ffffff" />
            <Text style={[styles.actionButtonText, { fontSize: 13 }]}>End</Text>
          </TouchableOpacity>
        )}

        {/* Leaderboard Button (square, in bottom bar) */}
        <TouchableOpacity
          style={[styles.squareButton, { backgroundColor: colors.accent }]}
          onPress={() => setShowLeaderboardModal(true)}
        >
          <Ionicons name="trophy" size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* Chat Button */}
        <TouchableOpacity
          style={[styles.squareButton, { backgroundColor: colors.accent }]}
          onPress={handleChatOpen}
        >
          <Ionicons name="chatbubbles" size={20} color="#ffffff" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Leaderboard Modal (Bottom Sheet) */}
      <Modal visible={showLeaderboardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.leaderboardTrophy}>🏆</Text>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Today's Leaderboard
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLeaderboardModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.leaderboardScroll}>
              <View style={styles.leaderboardContainer}>
                {leaderboard.length > 0 ? (
                  leaderboard.slice(0, 10).map(renderLeaderboardEntry)
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No leaderboard data yet
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subject Picker Modal */}
      <Modal visible={showSubjectPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Subject
              </Text>
              <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.subjectList}>
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  style={[styles.subjectItem, { backgroundColor: colors.background }]}
                  onPress={() => handleSubjectSelect(subject)}
                >
                  <Ionicons name={subject.icon as any} size={24} color={subject.color} />
                  <Text style={[styles.subjectName, { color: colors.text }]}>
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal visible={showChatModal} animationType="slide">
        <View style={[styles.chatContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.chatHeader, { backgroundColor: colors.card }]}>
            <Text style={[styles.chatTitle, { color: colors.text }]}>Room Chat</Text>
            <TouchableOpacity onPress={() => setShowChatModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={chatScrollRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderChatMessage(item)}
            contentContainerStyle={styles.chatMessages}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: false })}
          />

          <View style={[styles.chatInput, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.chatTextInput, { color: colors.text, backgroundColor: colors.background }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={chatMessage}
              onChangeText={setChatMessage}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.accent }]}
              onPress={handleSendMessage}
              disabled={!chatMessage.trim()}
            >
              <Ionicons name="send" size={20} color="#ffffff" />
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
  },
  roomMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },

  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },

  // 4-Column Member Grid with taller cards (190px height)
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberCard: {
    width: '23.5%', // 4 per row with gaps
    height: 190,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
  },
  memberHeader: {
    alignItems: 'center',
    marginBottom: 6,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberInfo: {
    alignItems: 'center',
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  activitySection: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  activityText: {
    fontSize: 11,
    textAlign: 'center',
  },
  memberFooter: {
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  todayTime: {
    fontSize: 11,
  },

  // Leaderboard in Modal
  leaderboardContainer: {
    padding: 16,
    gap: 8,
  },
  leaderboardScroll: {
    maxHeight: '80%',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  medal: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  leaderboardStats: {
    fontSize: 14,
  },

  // Activity Feed
  activityFeed: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  seeAllButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Action Bar (smaller, cleaner buttons: 48px height)
  actionBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    gap: 6,
  },
  primaryButton: {
    flex: 2,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  squareButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leaderboardTrophy: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subjectList: {
    padding: 16,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Chat Modal
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatMessages: {
    padding: 16,
    gap: 12,
  },
  chatMessage: {
    marginBottom: 12,
  },
  chatMessageSent: {
    alignItems: 'flex-end',
  },
  chatMessageReceived: {
    alignItems: 'flex-start',
  },
  chatBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  chatSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  chatText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatTime: {
    fontSize: 10,
    marginTop: 4,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  chatInput: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  chatTextInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
