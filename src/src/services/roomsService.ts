// Rooms Service Layer - Manages all room-related operations
// Designed for easy migration to Supabase real-time subscriptions

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Room,
  Member,
  ActivityItem,
  RoomMessage,
  LeaderboardEntry,
  loadRooms,
  saveRooms,
  getUserId,
  getUserName,
} from '../utils/roomsData';
import * as StorageService from './storage';
import { StudySession } from '../types';

// ============ ROOM RETRIEVAL ============

/**
 * Get a single room by ID
 */
export const getRoomById = async (roomId: string): Promise<Room | null> => {
  try {
    const rooms = await loadRooms();
    return rooms.find(r => r.id === roomId) || null;
  } catch (error) {
    console.error('Error getting room by ID:', error);
    return null;
  }
};

/**
 * Get all rooms where the current user is a member
 */
export const getUserRooms = async (): Promise<Room[]> => {
  try {
    const rooms = await loadRooms();
    const userId = await getUserId();
    return rooms.filter(room =>
      room.members?.some(m => m.id === userId)
    );
  } catch (error) {
    console.error('Error getting user rooms:', error);
    return [];
  }
};

// ============ MEMBER STATUS MANAGEMENT ============

/**
 * Update a member's status in a room
 */
export const updateMemberStatus = async (
  roomId: string,
  userId: string,
  status: 'studying' | 'idle'
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];
    const memberIndex = room.members?.findIndex(m => m.id === userId) || -1;

    if (memberIndex === -1 || !room.members) return;

    room.members[memberIndex].status = status;
    room.members[memberIndex].todayStats.lastActive = Date.now();

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error updating member status:', error);
  }
};

/**
 * Start a study session for a member
 */
export const startMemberSession = async (
  roomId: string,
  userId: string,
  subject: string,
  subjectId: string
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];
    const memberIndex = room.members?.findIndex(m => m.id === userId) || -1;

    if (memberIndex === -1 || !room.members) return;

    const now = Date.now();
    const member = room.members[memberIndex];

    // Ensure todayStats exists
    if (!member.todayStats) {
      member.todayStats = {
        totalStudyTime: 0,
        sessionsCompleted: 0,
        lastActive: Date.now(),
      };
    }

    // Update member's current session
    member.status = 'studying';
    member.currentSession = {
      subject,
      subjectId,
      startTime: now,
      elapsedTime: 0,
      isPaused: false,
    };
    member.todayStats.lastActive = now;

    // Add activity feed item
    const activity: ActivityItem = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'session_start',
      userId,
      userName: member.name,
      timestamp: now,
      metadata: { subject },
    };

    if (!room.activityFeed) room.activityFeed = [];
    room.activityFeed.unshift(activity);

    // Limit activity feed to last 50 items
    if (room.activityFeed.length > 50) {
      room.activityFeed = room.activityFeed.slice(0, 50);
    }

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error starting member session:', error);
  }
};

/**
 * Update member's timer elapsed time
 */
export const updateMemberTimer = async (
  roomId: string,
  userId: string,
  elapsedTime: number
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];
    const memberIndex = room.members?.findIndex(m => m.id === userId) || -1;

    if (memberIndex === -1 || !room.members) return;

    const member = room.members[memberIndex];

    if (member.currentSession) {
      member.currentSession.elapsedTime = elapsedTime;
      member.todayStats.lastActive = Date.now();
    }

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error updating member timer:', error);
  }
};

/**
 * End a study session for a member
 */
export const endMemberSession = async (
  roomId: string,
  userId: string,
  duration: number
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];
    const memberIndex = room.members?.findIndex(m => m.id === userId) || -1;

    if (memberIndex === -1 || !room.members) return;

    const now = Date.now();
    const member = room.members[memberIndex];

    // Update member stats
    member.todayStats.totalStudyTime += duration;
    member.todayStats.sessionsCompleted += 1;
    member.todayStats.lastActive = now;
    member.status = 'idle';
    member.currentSession = undefined;

    // Add activity feed item
    const activity: ActivityItem = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'session_end',
      userId,
      userName: member.name,
      timestamp: now,
      metadata: { duration },
    };

    if (!room.activityFeed) room.activityFeed = [];
    room.activityFeed.unshift(activity);

    // Check for milestones (1hr, 2hr, 3hr, etc.)
    const hours = Math.floor(member.todayStats.totalStudyTime / 3600);
    const prevHours = Math.floor((member.todayStats.totalStudyTime - duration) / 3600);

    if (hours > prevHours) {
      const milestoneActivity: ActivityItem = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'milestone',
        userId,
        userName: member.name,
        timestamp: now,
        metadata: { milestone: hours },
      };
      room.activityFeed.unshift(milestoneActivity);
    }

    // Limit activity feed to last 50 items
    if (room.activityFeed.length > 50) {
      room.activityFeed = room.activityFeed.slice(0, 50);
    }

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error ending member session:', error);
  }
};

// ============ ACTIVITY FEED ============

/**
 * Get activity feed for a room
 */
export const getActivityFeed = async (
  roomId: string,
  limit: number = 50
): Promise<ActivityItem[]> => {
  try {
    const room = await getRoomById(roomId);
    if (!room || !room.activityFeed) return [];

    return room.activityFeed.slice(0, limit);
  } catch (error) {
    console.error('Error getting activity feed:', error);
    return [];
  }
};

/**
 * Add a custom activity item
 */
export const addActivityItem = async (
  roomId: string,
  activity: Omit<ActivityItem, 'id'>
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];

    const newActivity: ActivityItem = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    if (!room.activityFeed) room.activityFeed = [];
    room.activityFeed.unshift(newActivity);

    if (room.activityFeed.length > 50) {
      room.activityFeed = room.activityFeed.slice(0, 50);
    }

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error adding activity item:', error);
  }
};

// ============ LEADERBOARD ============

/**
 * Calculate and get room leaderboard
 */
export const getRoomLeaderboard = async (
  roomId: string,
  period: 'today' | 'week' | 'alltime' = 'today'
): Promise<LeaderboardEntry[]> => {
  try {
    const room = await getRoomById(roomId);
    if (!room || !room.members) return [];

    // For "today", calculate from member todayStats
    if (period === 'today') {
      const entries: LeaderboardEntry[] = room.members
        .filter(member => member.todayStats) // Filter invalid members
        .map(member => ({
          userId: member.id,
          userName: member.name,
          rank: 0,
          totalTime: member.todayStats?.totalStudyTime || 0, // Safe access
          sessionsCompleted: member.todayStats?.sessionsCompleted || 0,
        }));

      // Sort by total time descending
      entries.sort((a, b) => b.totalTime - a.totalTime);

      // Assign ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    }

    // For week/alltime, would need historical data (future enhancement)
    return [];
  } catch (error) {
    console.error('Error getting room leaderboard:', error);
    return [];
  }
};

/**
 * Update today's stats for a member
 */
export const updateTodayStats = async (
  roomId: string,
  userId: string,
  studyTime: number
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];
    const memberIndex = room.members?.findIndex(m => m.id === userId) || -1;

    if (memberIndex === -1 || !room.members) return;

    // Ensure todayStats exists before updating
    if (!room.members[memberIndex].todayStats) {
      room.members[memberIndex].todayStats = {
        totalStudyTime: 0,
        sessionsCompleted: 0,
        lastActive: Date.now(),
      };
    }

    room.members[memberIndex].todayStats.totalStudyTime += studyTime;
    room.members[memberIndex].todayStats.lastActive = Date.now();

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error updating today stats:', error);
  }
};

// ============ CHAT SYSTEM ============

/**
 * Send a message to a room
 */
export const sendMessage = async (
  roomId: string,
  userId: string,
  userName: string,
  message: string
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];

    const newMessage: RoomMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      userId,
      userName,
      message,
      timestamp: Date.now(),
      type: 'user',
      reactions: {},
    };

    if (!room.messages) room.messages = [];
    room.messages.push(newMessage);

    // Limit to last 50 messages
    if (room.messages.length > 50) {
      room.messages = room.messages.slice(-50);
    }

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

/**
 * Send a system message to a room
 */
export const sendSystemMessage = async (
  roomId: string,
  message: string
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];

    const newMessage: RoomMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      userId: 'system',
      userName: 'System',
      message,
      timestamp: Date.now(),
      type: 'system',
    };

    if (!room.messages) room.messages = [];
    room.messages.push(newMessage);

    if (room.messages.length > 50) {
      room.messages = room.messages.slice(-50);
    }

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error sending system message:', error);
  }
};

/**
 * Get messages for a room
 */
export const getRoomMessages = async (
  roomId: string,
  limit: number = 50
): Promise<RoomMessage[]> => {
  try {
    const room = await getRoomById(roomId);
    if (!room || !room.messages) return [];

    return room.messages.slice(-limit);
  } catch (error) {
    console.error('Error getting room messages:', error);
    return [];
  }
};

/**
 * Add a reaction to a message
 */
export const addReactionToMessage = async (
  roomId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];
    if (!room.messages) return;

    const messageIndex = room.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = room.messages[messageIndex];
    if (!message.reactions) message.reactions = {};

    message.reactions[userId] = emoji;

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error adding reaction to message:', error);
  }
};

/**
 * Remove a reaction from a message
 */
export const removeReactionFromMessage = async (
  roomId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];
    if (!room.messages) return;

    const messageIndex = room.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = room.messages[messageIndex];
    if (message.reactions && message.reactions[userId]) {
      delete message.reactions[userId];
    }

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error removing reaction from message:', error);
  }
};

// ============ REAL-TIME SYNC HELPERS ============
// These are stubs for future Supabase implementation

/**
 * Subscribe to room updates (stub for Supabase real-time)
 * In production, this would use Supabase real-time subscriptions
 * For now, caller should poll getRoomById periodically
 */
export const subscribeToRoomUpdates = (
  roomId: string,
  callback: (room: Room) => void
): (() => void) => {
  // Stub: In Supabase, this would be:
  // const subscription = supabase
  //   .from(`rooms:id=eq.${roomId}`)
  //   .on('*', payload => callback(payload.new))
  //   .subscribe()
  // return () => subscription.unsubscribe()

  // For now, return a no-op unsubscribe function
  return () => {};
};

// ============ UTILITY FUNCTIONS ============

/**
 * Format time in seconds to readable string (e.g., "1h 23m", "45m", "12s")
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format timestamp to relative time (e.g., "2m ago", "1h ago", "Yesterday")
 */
export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};

/**
 * Get activity description text
 */
export const getActivityDescription = (activity: ActivityItem): string => {
  switch (activity.type) {
    case 'session_start':
      return `started studying ${activity.metadata?.subject || ''}`;
    case 'session_end':
      const duration = activity.metadata?.duration || 0;
      return `completed a ${formatTime(duration)} session`;
    case 'milestone':
      const hours = activity.metadata?.milestone || 0;
      return `reached ${hours}h study milestone!`;
    case 'rank_change':
      return `moved to rank #${activity.metadata?.newRank}`;
    case 'member_join':
      return 'joined the room';
    default:
      return 'activity';
  }
};

/**
 * Reset daily stats for all members in a room (should be called daily)
 */
export const resetDailyStats = async (roomId: string): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) return;

    const room = rooms[roomIndex];
    if (!room.members) return;

    room.members.forEach(member => {
      member.todayStats = {
        totalStudyTime: 0,
        sessionsCompleted: 0,
        lastActive: Date.now(),
      };
    });

    await saveRooms(rooms);
  } catch (error) {
    console.error('Error resetting daily stats:', error);
  }
};

// ============ TIMER SYNCHRONIZATION (Focus Tab <-> Rooms) ============

/**
 * Sync global timer state to all rooms user is in
 * Called when timer starts/stops from Focus tab
 */
export const syncGlobalTimerToRooms = async (
  userId: string,
  isActive: boolean,
  subject?: string,
  subjectId?: string
): Promise<void> => {
  try {
    const rooms = await loadRooms();
    const userRooms = rooms.filter(r =>
      r.members?.some(m => m.id === userId)
    );

    for (const room of userRooms) {
      if (isActive && subject && subjectId) {
        // Start session in all user's rooms
        await startMemberSession(room.id, userId, subject, subjectId);
      } else {
        // End session in all user's rooms
        const member = room.members?.find(m => m.id === userId);
        if (member?.currentSession) {
          await endMemberSession(room.id, userId, member.currentSession.elapsedTime);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing global timer to rooms:', error);
  }
};

