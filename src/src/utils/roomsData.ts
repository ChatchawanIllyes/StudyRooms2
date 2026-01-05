import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Member {
  id: string;
  name: string;
  status: 'studying' | 'break' | 'idle';
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

const getDefaultRooms = (): Room[] => [
  {
    id: 'room:default:1',
    name: 'Deep Focus Study',
    isPublic: true,
    memberCount: 3,
    members: [
      { id: 'demo1', name: 'Alice', status: 'studying' },
      { id: 'demo2', name: 'Bob', status: 'break' },
      { id: 'demo3', name: 'Charlie', status: 'studying' },
    ],
    description: 'A room for deep focus study sessions.',
    ownerName: 'Alice',
    ownerId: 'owner1',
    startedAt: Date.now() - 3600000,
    category: 'General',
  },
  {
    id: 'room:default:2',
    name: 'CS Exam Prep',
    isPublic: true,
    memberCount: 5,
    members: [
      { id: 'demo4', name: 'Diana', status: 'studying' },
      { id: 'demo5', name: 'Ethan', status: 'idle' },
      { id: 'demo6', name: 'Fiona', status: 'studying' },
      { id: 'demo7', name: 'George', status: 'break' },
      { id: 'demo8', name: 'Hannah', status: 'studying' },
    ],
    description: 'Preparing for the upcoming Computer Science final exam.',
    ownerName: 'Diana',
    ownerId: 'owner2',
    startedAt: Date.now() - 7200000,
    category: 'Computer Science',
  },
  {
    id: 'room:default:3',
    name: 'MCAT Study Group',
    isPublic: true,
    memberCount: 8,
    members: [
      { id: 'demo9', name: 'Ian', status: 'studying' },
      { id: 'demo10', name: 'Julia', status: 'studying' },
      { id: 'demo11', name: 'Kevin', status: 'break' },
      { id: 'demo12', name: 'Laura', status: 'studying' },
      { id: 'demo13', name: 'Mike', status: 'studying' },
      { id: 'demo14', name: 'Nina', status: 'idle' },
      { id: 'demo15', name: 'Oliver', status: 'studying' },
      { id: 'demo16', name: 'Paula', status: 'studying' },
    ],
    description: 'Intensive MCAT prep - let\'s ace this together!',
    ownerName: 'Ian',
    ownerId: 'owner3',
    startedAt: Date.now() - 10800000,
    category: 'MCAT',
  },
];

export const loadRooms = async (): Promise<Room[]> => {
  const stored = await AsyncStorage.getItem('studyapp_rooms');
  const userId = await getUserId();
  const defaultRooms = getDefaultRooms();

  if (!stored) {
    await AsyncStorage.setItem('studyapp_rooms', JSON.stringify(defaultRooms));
    return defaultRooms;
  }

  const existingRooms: Room[] = JSON.parse(stored);
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
