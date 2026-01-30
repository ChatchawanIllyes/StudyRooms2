import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Member {
  id: string;
  name: string;
  status: 'studying' | 'idle';
  currentSession?: {
    subject: string;
    subjectId: string;
    startTime: number; // timestamp when started
    elapsedTime: number; // seconds (for pause/resume support)
    isPaused: boolean;
  };
  todayStats: {
    totalStudyTime: number; // seconds
    sessionsCompleted: number;
    lastActive: number; // timestamp
  };
}

export interface ActivityItem {
  id: string;
  type: 'session_start' | 'session_end' | 'milestone' | 'rank_change' | 'member_join';
  userId: string;
  userName: string;
  timestamp: number;
  metadata?: {
    subject?: string;
    duration?: number;
    milestone?: number;
    oldRank?: number;
    newRank?: number;
  };
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: 'user' | 'system';
  reactions?: {
    [userId: string]: string; // emoji
  };
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  rank: number;
  totalTime: number;
  sessionsCompleted: number;
  streak?: number;
}

export interface Room {
  id: string;
  name: string;
  isPublic: boolean;
  memberCount?: number;
  members?: Member[];
  description: string;
  ownerName: string;
  ownerId: string;
  startedAt: number;
  category: string;
  password?: string;
  activityFeed?: ActivityItem[];
  messages?: RoomMessage[];
  leaderboard?: {
    daily: { [date: string]: LeaderboardEntry[] };
    weekly: LeaderboardEntry[];
    allTime: LeaderboardEntry[];
  };
  settings?: {
    maxMembers: number;
    allowChat: boolean;
    allowReactions: boolean;
  };
}

export const getUserId = async (): Promise<string> => {
  let userId = await AsyncStorage.getItem('studyapp_userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('studyapp_userId', userId);
  }
  return userId;
};

export const getUserName = async (): Promise<string> => {
  let userName = await AsyncStorage.getItem('studyapp_userName');
  if (!userName) {
    userName = `User ${Math.floor(Math.random() * 1000)}`;
    await AsyncStorage.setItem('studyapp_userName', userName);
  }
  return userName;
};

const getDefaultRooms = (): Room[] => {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'room:default:1',
      name: 'Deep Focus Study',
      isPublic: true,
      memberCount: 3,
      members: [
        {
          id: 'demo1',
          name: 'Alice',
          status: 'studying',
          currentSession: {
            subject: 'Math',
            subjectId: 'math',
            startTime: now - 1425000, // 23:45 ago
            elapsedTime: 1425,
            isPaused: false,
          },
          todayStats: {
            totalStudyTime: 9240, // 2h 34m
            sessionsCompleted: 3,
            lastActive: now,
          }
        },
        {
          id: 'demo2',
          name: 'Bob',
          status: 'idle',
          todayStats: {
            totalStudyTime: 5400, // 1h 30m
            sessionsCompleted: 2,
            lastActive: now,
          }
        },
        {
          id: 'demo3',
          name: 'Charlie',
          status: 'studying',
          currentSession: {
            subject: 'Science',
            subjectId: 'science',
            startTime: now - 2700000, // 45m ago
            elapsedTime: 2700,
            isPaused: false,
          },
          todayStats: {
            totalStudyTime: 7200, // 2h
            sessionsCompleted: 2,
            lastActive: now,
          }
        },
      ],
      description: 'A room for deep focus study sessions.',
      ownerName: 'Alice',
      ownerId: 'owner1',
      startedAt: now - 3600000,
      category: 'General',
      activityFeed: [
        {
          id: 'act1',
          type: 'session_start',
          userId: 'demo1',
          userName: 'Alice',
          timestamp: now - 1425000,
          metadata: { subject: 'Math' }
        },
        {
          id: 'act3',
          type: 'session_start',
          userId: 'demo3',
          userName: 'Charlie',
          timestamp: now - 2700000,
          metadata: { subject: 'Science' }
        }
      ],
      messages: [],
      leaderboard: {
        daily: {},
        weekly: [],
        allTime: []
      },
      settings: {
        maxMembers: 10,
        allowChat: true,
        allowReactions: true,
      }
    },
    {
      id: 'room:default:2',
      name: 'CS Exam Prep',
      isPublic: true,
      memberCount: 5,
      members: [
        {
          id: 'demo4',
          name: 'Diana',
          status: 'studying',
          currentSession: {
            subject: 'Programming',
            subjectId: 'programming',
            startTime: now - 3600000, // 1h ago
            elapsedTime: 3600,
            isPaused: false,
          },
          todayStats: {
            totalStudyTime: 10800, // 3h
            sessionsCompleted: 2,
            lastActive: now,
          }
        },
        {
          id: 'demo5',
          name: 'Ethan',
          status: 'idle',
          todayStats: {
            totalStudyTime: 3600, // 1h
            sessionsCompleted: 1,
            lastActive: now - 1800000,
          }
        },
        {
          id: 'demo6',
          name: 'Fiona',
          status: 'studying',
          currentSession: {
            subject: 'Programming',
            subjectId: 'programming',
            startTime: now - 1800000, // 30m ago
            elapsedTime: 1800,
            isPaused: false,
          },
          todayStats: {
            totalStudyTime: 5400, // 1h 30m
            sessionsCompleted: 2,
            lastActive: now,
          }
        },
        {
          id: 'demo7',
          name: 'George',
          status: 'idle',
          todayStats: {
            totalStudyTime: 7200, // 2h
            sessionsCompleted: 3,
            lastActive: now,
          }
        },
        {
          id: 'demo8',
          name: 'Hannah',
          status: 'studying',
          currentSession: {
            subject: 'Math',
            subjectId: 'math',
            startTime: now - 900000, // 15m ago
            elapsedTime: 900,
            isPaused: false,
          },
          todayStats: {
            totalStudyTime: 8100, // 2h 15m
            sessionsCompleted: 2,
            lastActive: now,
          }
        },
      ],
      description: 'Preparing for the upcoming Computer Science final exam.',
      ownerName: 'Diana',
      ownerId: 'owner2',
      startedAt: now - 7200000,
      category: 'Computer Science',
      activityFeed: [],
      messages: [],
      leaderboard: {
        daily: {},
        weekly: [],
        allTime: []
      },
      settings: {
        maxMembers: 15,
        allowChat: true,
        allowReactions: true,
      }
    },
    {
      id: 'room:default:3',
      name: 'MCAT Study Group',
      isPublic: true,
      memberCount: 8,
      members: [
        { id: 'demo9', name: 'Ian', status: 'studying', currentSession: { subject: 'Medicine', subjectId: 'medicine', startTime: now - 4500000, elapsedTime: 4500, isPaused: false }, todayStats: { totalStudyTime: 14400, sessionsCompleted: 3, lastActive: now } },
        { id: 'demo10', name: 'Julia', status: 'studying', currentSession: { subject: 'Science', subjectId: 'science', startTime: now - 2400000, elapsedTime: 2400, isPaused: false }, todayStats: { totalStudyTime: 10800, sessionsCompleted: 2, lastActive: now } },
        { id: 'demo11', name: 'Kevin', status: 'idle', todayStats: { totalStudyTime: 9000, sessionsCompleted: 2, lastActive: now } },
        { id: 'demo12', name: 'Laura', status: 'studying', currentSession: { subject: 'Medicine', subjectId: 'medicine', startTime: now - 1800000, elapsedTime: 1800, isPaused: false }, todayStats: { totalStudyTime: 12600, sessionsCompleted: 3, lastActive: now } },
        { id: 'demo13', name: 'Mike', status: 'studying', currentSession: { subject: 'Science', subjectId: 'science', startTime: now - 3000000, elapsedTime: 3000, isPaused: false }, todayStats: { totalStudyTime: 11400, sessionsCompleted: 2, lastActive: now } },
        { id: 'demo14', name: 'Nina', status: 'idle', todayStats: { totalStudyTime: 5400, sessionsCompleted: 2, lastActive: now - 3600000 } },
        { id: 'demo15', name: 'Oliver', status: 'studying', currentSession: { subject: 'Medicine', subjectId: 'medicine', startTime: now - 2100000, elapsedTime: 2100, isPaused: false }, todayStats: { totalStudyTime: 13200, sessionsCompleted: 3, lastActive: now } },
        { id: 'demo16', name: 'Paula', status: 'studying', currentSession: { subject: 'Science', subjectId: 'science', startTime: now - 1200000, elapsedTime: 1200, isPaused: false }, todayStats: { totalStudyTime: 10200, sessionsCompleted: 2, lastActive: now } },
      ],
      description: 'Intensive MCAT prep - let\'s ace this together!',
      ownerName: 'Ian',
      ownerId: 'owner3',
      startedAt: now - 10800000,
      category: 'MCAT',
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
    },
  ];
};

export const loadRooms = async (): Promise<Room[]> => {
  const stored = await AsyncStorage.getItem('studyapp_rooms');
  const userId = await getUserId();
  const defaultRooms = getDefaultRooms();

  if (!stored) {
    await AsyncStorage.setItem('studyapp_rooms', JSON.stringify(defaultRooms));
    return defaultRooms;
  }

  const existingRooms: Room[] = JSON.parse(stored);

  // MIGRATION: Ensure all members have todayStats initialized and remove break functionality
  existingRooms.forEach(room => {
    if (room.members) {
      room.members.forEach(member => {
        // Migrate break status to idle
        if ((member as any).status === 'break') {
          member.status = 'idle';
        }
        // Remove break-related fields
        delete (member as any).currentBreak;
        delete (member as any).previousSession;

        // Initialize todayStats if needed
        if (!member.todayStats) {
          member.todayStats = {
            totalStudyTime: 0,
            sessionsCompleted: 0,
            lastActive: Date.now(),
          };
        }
      });
    }

    // Clean up activity feed
    if (room.activityFeed) {
      room.activityFeed = room.activityFeed.filter(
        activity => activity.type !== 'break_start' as any
      );
    }
  });

  const userRooms = existingRooms.filter((r) => !r.id.startsWith('room:default:'));

  const mergedDefaultRooms = defaultRooms.map((defaultRoom) => {
    const existingRoom = existingRooms.find((r) => r.id === defaultRoom.id);
    if (existingRoom && existingRoom.members?.some((m) => m.id === userId)) {
      return existingRoom;
    }
    return defaultRoom;
  });

  const mergedRooms = [...mergedDefaultRooms, ...userRooms];
  await AsyncStorage.setItem('studyapp_rooms', JSON.stringify(mergedRooms));
  return mergedRooms;
};

export const saveRooms = async (rooms: Room[]) => {
  await AsyncStorage.setItem('studyapp_rooms', JSON.stringify(rooms));
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
};

export const CATEGORIES = [
  'General',
  'High School',
  'Undergraduate',
  'Graduate School',
  'Post-Graduate',
  'PhD',
  'MBA',
  'Law School',
  'Bar Exam',
  'LSAT',
  'Medical School',
  'MCAT',
  'USMLE',
  'Dental School',
  'DAT',
  'Nursing',
  'NCLEX',
  'CPA',
  'Engineering',
  'Computer Science',
  'SAT/ACT',
  'GRE',
  'GMAT',
  'Professional Development',
  'Career Transition',
  'Certification Prep',
  'Language Learning',
  'Test Prep',
  'Other',
];
