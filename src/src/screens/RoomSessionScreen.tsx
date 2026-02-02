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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
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
  const [showInlineChat, setShowInlineChat] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Animation values
  const pulseAnim = useSharedValue(1);
  const chatAnimation = useSharedValue(1000);

  // Animated styles (must be at top level, not conditional)
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }]
  }));

  const chatOverlayAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chatAnimation.value }]
  }));

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

    // Start pulsing animation
    pulseAnim.value = withRepeat(
      withTiming(1.3, { duration: 1000 }),
      -1,
      true
    );

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
    setShowInlineChat(true);
    setUnreadCount(0);
    chatAnimation.value = 1000;
    chatAnimation.value = withSpring(0, {
      damping: 20,
      stiffness: 90,
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session_start': return 'play-circle';
      case 'session_end': return 'checkmark-circle';
      case 'milestone': return 'trophy';
      case 'join': return 'person-add';
      case 'leave': return 'exit';
      default: return 'ellipse';
    }
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
    let progress = 0;

    if (member.status === 'studying' && member.currentSession) {
      statusText = 'Studying';
      const elapsed = member.currentSession.elapsedTime;
      const timerText = isCurrentUser && studyTimer.isRunning
        ? formatTime(Math.floor(studyTimer.elapsedMs / 1000))
        : formatTime(elapsed);
      activityText = `${member.currentSession.subject}`;

      // Calculate progress ring (full circle every 60 minutes)
      const minutes = elapsed / 60;
      progress = (minutes % 60) / 60 * 163; // 163 is circumference of r=26 circle
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
        {/* Avatar with progress ring */}
        <View style={styles.avatarContainer}>
          {member.status === 'studying' && member.currentSession && (
            <Svg width="56" height="56" style={styles.progressRing}>
              <Circle
                cx="28"
                cy="28"
                r="26"
                stroke={colors.accent}
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${progress} ${163 - progress}`}
                rotation="-90"
                origin="28, 28"
              />
            </Svg>
          )}
          <View style={[styles.memberAvatar, { backgroundColor: `${colors.accent}40` }]}>
            <Text style={[styles.memberAvatarText, { color: colors.text }]}>
              {member.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Status indicator (larger, 16x16) */}
        <Animated.View
          style={[
            styles.statusDot,
            { backgroundColor: statusColor },
            member.status === 'studying' && pulseAnimatedStyle
          ]}
        />

        {/* Member name */}
        <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
          {member.name}{isCurrentUser ? ' (You)' : ''}
        </Text>

        {/* Current activity */}
        <View style={styles.activitySection}>
          <Text style={[styles.activityText, { color: colors.text }]} numberOfLines={2}>
            {activityText || statusText}
          </Text>
        </View>

        {/* Timer text (if studying) */}
        {member.status === 'studying' && member.currentSession && (
          <Text style={[styles.timerText, { color: colors.accent }]}>
            {isCurrentUser && studyTimer.isRunning
              ? formatTime(Math.floor(studyTimer.elapsedMs / 1000))
              : formatTime(member.currentSession.elapsedTime)}
          </Text>
        )}

        {/* Today's total time */}
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
      {/* Enhanced Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>
            {room.name}
          </Text>
          <View style={styles.statusPills}>
            <View style={[styles.statusPill, { backgroundColor: colors.card }]}>
              <Animated.View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: '#ff3b30' },
                  pulseAnimatedStyle
                ]}
              />
              <Text style={[styles.statusText, { color: colors.text }]}>
                {onlineCount} studying now
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleLeaveRoom}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Activity Ticker */}
      <View style={[styles.activityTicker, { backgroundColor: colors.card }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tickerContent}
        >
          {activityFeed.slice(0, 5).map(activity => (
            <TouchableOpacity
              key={activity.id}
              style={[styles.activityChip, { backgroundColor: colors.background }]}
              onPress={() => setShowAllActivity(true)}
            >
              <Ionicons
                name={getActivityIcon(activity.type) as any}
                size={16}
                color={colors.accent}
              />
              <Text style={[styles.activityChipText, { color: colors.text }]} numberOfLines={1}>
                {activity.userName}: {getActivityDescription(activity)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={() => setShowAllActivity(!showAllActivity)}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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

      {/* Enhanced Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.card }]}>
        {!isStudying && (
          <TouchableOpacity
            style={[styles.primaryActionButton, { backgroundColor: colors.accent }]}
            onPress={handleStartStudying}
          >
            <Ionicons name="book" size={20} color="#ffffff" />
            <Text style={styles.primaryActionText}>Start Studying</Text>
          </TouchableOpacity>
        )}

        {isStudying && (
          <TouchableOpacity
            style={[styles.secondaryActionButton, { backgroundColor: colors.destructive }]}
            onPress={handleEndSession}
          >
            <Ionicons name="stop" size={18} color="#ffffff" />
            <Text style={styles.secondaryActionText}>End</Text>
          </TouchableOpacity>
        )}

        {/* Leaderboard Button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.accent }]}
          onPress={() => setShowLeaderboardModal(true)}
        >
          <Ionicons name="trophy" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Floating Chat Bubble */}
      {!showInlineChat && (
        <TouchableOpacity
          style={[styles.floatingChatBubble, { backgroundColor: colors.accent }]}
          onPress={handleChatOpen}
        >
          <Ionicons name="chatbubbles" size={24} color="#ffffff" />
          {unreadCount > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Inline Chat Overlay */}
      {showInlineChat && (
        <Animated.View
          style={[
            styles.inlineChatOverlay,
            { backgroundColor: colors.card },
            chatOverlayAnimatedStyle
          ]}
        >
          <View style={[styles.inlineChatHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.inlineChatTitle, { color: colors.text }]}>Chat</Text>
            <TouchableOpacity onPress={() => setShowInlineChat(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={chatScrollRef}
            data={chatMessages.slice(-10)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderChatMessage(item)}
            contentContainerStyle={styles.inlineChatMessages}
          />

          <View style={[styles.inlineChatInput, { borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.chatTextInput, { color: colors.text, backgroundColor: colors.background }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={chatMessage}
              onChangeText={setChatMessage}
            />
            <TouchableOpacity onPress={handleSendMessage} disabled={!chatMessage.trim()}>
              <Ionicons name="send" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

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
    paddingTop: 50,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    gap: 4,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusPills: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tickerContent: {
    gap: 8,
    paddingRight: 16,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: 200,
  },
  activityChipText: {
    fontSize: 12,
    fontWeight: '500',
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

  // 3-Column Member Grid with larger cards (240px height)
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberCard: {
    width: '31%', // 3 per row with gaps
    height: 240,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 8,
  },
  progressRing: {
    position: 'absolute',
    top: -2,
    left: -2,
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: 12,
    right: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  activitySection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityText: {
    fontSize: 12,
    textAlign: 'center',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  memberFooter: {
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    width: '100%',
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

  // Enhanced Action Bar with Gradient
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  primaryActionButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  secondaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // Floating Chat Bubble
  floatingChatBubble: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  chatBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Inline Chat Overlay
  inlineChatOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inlineChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  inlineChatTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  inlineChatMessages: {
    padding: 16,
    gap: 12,
  },
  inlineChatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
