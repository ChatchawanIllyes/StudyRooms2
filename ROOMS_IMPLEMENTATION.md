# Competitive Study Rooms Implementation

## Overview

The Rooms feature has been transformed into a competitive, real-time study environment where users can study individually while seeing each other's progress, compete on leaderboards, and communicate via chat.

## Architecture

### Core Philosophy
- **Competitive, not collaborative** - Each user runs their own timer independently
- **Transparency** - All members can see each other's study status and progress
- **Motivation through competition** - Leaderboards, rankings, and visible achievements
- **Social support** - Chat and activity feed to celebrate wins

### Data Layer

#### Type Definitions (`src/utils/roomsData.ts`)

**Member Interface** - Extended with competitive features:
```typescript
interface Member {
  id: string;
  name: string;
  status: 'studying' | 'break' | 'idle';
  currentSession?: {
    subject: string;
    subjectId: string;
    startTime: number;
    elapsedTime: number;
    isPaused: boolean;
  };
  currentBreak?: {
    startTime: number;
    duration: number;
  };
  todayStats: {
    totalStudyTime: number;    // in seconds
    sessionsCompleted: number;
    lastActive: number;         // timestamp
  };
}
```

**Room Interface** - Enhanced with activity, chat, and leaderboard:
```typescript
interface Room {
  // Basic info
  id: string;
  name: string;
  isPublic: boolean;
  password?: string;
  description: string;
  ownerName: string;
  ownerId: string;
  startedAt: number;
  category: string;

  // Members
  memberCount: number;
  members: Member[];

  // Competitive features
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
```

**ActivityItem** - Tracks room events:
```typescript
interface ActivityItem {
  id: string;
  type: 'session_start' | 'session_end' | 'break_start' | 'milestone' | 'rank_change' | 'member_join';
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
```

**RoomMessage** - Chat messages with reactions:
```typescript
interface RoomMessage {
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
```

### Service Layer (`src/services/roomsService.ts`)

Comprehensive service layer with all room operations. Designed for easy Supabase migration.

**Key Functions:**

**Member Status Management:**
- `updateMemberStatus()` - Update studying/break/idle status
- `startMemberSession()` - Start a study session with subject
- `endMemberSession()` - End session and update stats
- `updateMemberTimer()` - Sync timer elapsed time
- `startMemberBreak()` / `endMemberBreak()` - Break management

**Activity Feed:**
- `getActivityFeed()` - Retrieve recent activity
- `addActivityItem()` - Add custom activity
- Auto-generates activities for: session start/end, breaks, milestones

**Leaderboard:**
- `getRoomLeaderboard()` - Calculate rankings from todayStats
- Supports 'today', 'week', 'alltime' periods
- Automatically ranks by total study time

**Chat System:**
- `sendMessage()` - Send user messages (200 char limit)
- `sendSystemMessage()` - Auto-generated announcements
- `getRoomMessages()` - Retrieve chat history (last 50)
- `addReactionToMessage()` / `removeReactionFromMessage()` - Emoji reactions

**Utility Functions:**
- `formatTime()` - Convert seconds to readable format (e.g., "1h 23m")
- `formatTimeAgo()` - Relative timestamps (e.g., "2m ago")
- `getActivityDescription()` - Human-readable activity text

### UI Components

#### RoomSessionScreen (`src/screens/RoomSessionScreen.tsx`)

The main active room view with all competitive features.

**Header:**
- Room name
- Online member count (X/Y active)
- Back button
- Leave room button

**Live Members Grid:**
- Card for each member showing:
  - Avatar (initials)
  - Name with "(You)" indicator for current user
  - Status indicator: 🔥 Studying | ☕ On Break | 💤 Idle
  - Current activity: subject + timer OR break timer
  - Today's total study time
  - Sessions completed today
- Current user's card is highlighted with accent color border
- Cards show real-time timer updates

**Today's Leaderboard (Collapsible):**
- Ranked list of members by total study time today
- Top 3 get medals: 🥇🥈🥉
- Shows: rank, name, total time, sessions completed
- Current user's entry is highlighted
- Motivational messages (planned feature)

**Activity Feed:**
- Scrollable list of recent room events
- Icons for different activity types
- Relative timestamps ("2m ago")
- Activities include:
  - "Alice started studying Math"
  - "Bob completed a 45m session! 🔥"
  - "Charlie reached 2h study milestone!"

**Quick Actions Bar:**
- **Start Studying** button (when idle) - opens subject picker
- **Take Break** / **End Session** buttons (when studying)
- **End Break** button (when on break)
- **Chat** button with unread message badge

**Subject Picker Modal:**
- List of available subjects from settings
- Icon + name for each subject
- Tapping starts study session and syncs with global timer

**Chat Modal:**
- Full-screen chat interface
- Message bubbles (sent/received)
- System messages (centered, italic)
- Text input with send button
- 200 character limit
- Auto-scroll to latest message

### Timer Integration

The room session is fully integrated with the global `StudyTimerContext`:

**Starting a Session:**
1. User taps "Start Studying"
2. Subject picker modal opens
3. User selects subject
4. Global timer starts via `studyTimer.startWithSubject(subject)`
5. Room member status updates via `startMemberSession()`
6. Activity feed item is added
7. Timer syncs every 10 seconds

**During Session:**
- Timer runs in global context
- Elapsed time displayed on member card
- Updates persist across app navigation
- Background/foreground state handled by timer context

**Ending a Session:**
1. User taps "End Session" or "Take Break"
2. Final elapsed time calculated
3. Session saved via `studyTimer.stopAndSave()` or `studyTimer.pause()`
4. Room stats updated via `endMemberSession()`
5. Activity feed item added
6. Milestone check (1hr, 2hr, etc.)

### Data Synchronization

**Current Implementation (AsyncStorage):**
- Poll for updates every 5 seconds
- Full room data reload on each poll
- Manual refresh via pull-to-refresh
- Timer updates every second locally

**Future Supabase Migration:**
The service layer is designed with Supabase in mind:
- All functions use async/await pattern
- Data structures mirror database tables
- `subscribeToRoomUpdates()` stub ready for real-time subscriptions
- Row-level security patterns commented in code

**Planned Schema (Supabase):**
```sql
-- rooms table
create table rooms (
  id text primary key,
  name text not null,
  is_public boolean default true,
  password text,
  description text,
  owner_id text not null,
  owner_name text not null,
  started_at timestamptz not null,
  category text,
  member_count int default 0,
  settings jsonb
);

-- room_members table
create table room_members (
  id text primary key,
  room_id text references rooms(id) on delete cascade,
  user_id text not null,
  user_name text not null,
  status text check (status in ('studying', 'break', 'idle')),
  current_session jsonb,
  current_break jsonb,
  today_stats jsonb,
  joined_at timestamptz default now(),
  last_active timestamptz default now()
);

-- room_messages table
create table room_messages (
  id text primary key,
  room_id text references rooms(id) on delete cascade,
  user_id text not null,
  user_name text not null,
  message text not null,
  message_type text check (message_type in ('user', 'system')),
  reactions jsonb,
  created_at timestamptz default now()
);

-- room_activities table
create table room_activities (
  id text primary key,
  room_id text references rooms(id) on delete cascade,
  activity_type text not null,
  user_id text not null,
  user_name text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
```

## Navigation Flow

```
MyRoomsScreen
  ├─> Tap room card ───────> RoomSessionScreen
  ├─> Tap + button
  │     ├─> Join Room ─────> JoinRoomScreen ─────> RoomSessionScreen
  │     └─> Create Room ───> CreateRoomScreen ───> RoomSessionScreen
  └─> Long press room card ─> Room Details Modal
```

## Key Features Implemented

✅ **Individual Timer State per User** - Each member runs their own timer
✅ **Real-time Status Indicators** - See who's studying/breaking/idle
✅ **Live Timer Display** - See elapsed time for all active members
✅ **Today's Leaderboard** - Ranked by total study time
✅ **Activity Feed** - Recent events with timestamps
✅ **Room Chat** - Send messages and reactions
✅ **Milestone Celebrations** - Auto-detect 1hr, 2hr, etc. achievements
✅ **Subject Selection** - Choose what to study
✅ **Break Management** - Track break duration
✅ **Study Session Persistence** - Saves to global study history
✅ **Unread Message Indicators** - Badge on chat button
✅ **Pull-to-Refresh** - Manual sync for latest data
✅ **Smooth Animations** - Polished transitions and interactions

## Testing Checklist

### Basic Flow
- [ ] Create a new room
- [ ] Navigate to room session screen
- [ ] See member grid with current user
- [ ] Start studying with a subject
- [ ] See timer counting up
- [ ] See status change to "Studying"
- [ ] Take a break
- [ ] See status change to "On Break"
- [ ] End break
- [ ] End session
- [ ] See updated stats

### Multi-User Simulation
- [ ] Join an existing room (demo rooms have mock users)
- [ ] See multiple members with different statuses
- [ ] See studying members with timers
- [ ] See break members with countdown
- [ ] Check leaderboard rankings
- [ ] Verify current user is highlighted

### Chat System
- [ ] Open chat modal
- [ ] Send a message
- [ ] See message appear in chat
- [ ] Close and reopen chat
- [ ] Verify messages persist
- [ ] Check unread badge updates

### Activity Feed
- [ ] Start a session and see activity
- [ ] Complete a session and see activity
- [ ] Reach a milestone and see celebration
- [ ] Verify timestamps are relative ("2m ago")

### Edge Cases
- [ ] Try to start session without selecting subject
- [ ] Leave room and verify removal
- [ ] Join password-protected room
- [ ] Test with 0 study time
- [ ] Test with long room names
- [ ] Test with many members (8+)
- [ ] Test timer persistence across app restart

## Performance Considerations

**Optimizations Implemented:**
- Activity feed limited to last 50 items
- Chat messages limited to last 50
- 5-second polling interval (adjustable)
- Local timer updates (1 second) with periodic syncs (10 seconds)
- Member cards use memoization-ready structure

**Future Optimizations:**
- Implement React.memo for member cards
- Virtual scrolling for large member lists
- Debounced chat input
- Background sync with exponential backoff
- Supabase real-time subscriptions (eliminates polling)

## Design Patterns

**AsyncStorage to Supabase Migration Strategy:**

1. **Interface Abstraction** - All operations go through `roomsService.ts`
2. **Async-First** - All functions use promises
3. **Structured Data** - Types mirror database schemas
4. **Subscription Stubs** - `subscribeToRoomUpdates()` ready for implementation
5. **Environment Config** - Add `.env` with Supabase credentials
6. **Feature Flags** - Toggle between local/remote storage

**Example Migration (startMemberSession):**

```typescript
// Current (AsyncStorage)
export const startMemberSession = async (roomId, userId, subject, subjectId) => {
  const rooms = await loadRooms();
  // ... update logic
  await saveRooms(rooms);
};

// Future (Supabase)
export const startMemberSession = async (roomId, userId, subject, subjectId) => {
  const { data, error } = await supabase
    .from('room_members')
    .update({
      status: 'studying',
      current_session: {
        subject,
        subject_id: subjectId,
        start_time: Date.now(),
        elapsed_time: 0,
        is_paused: false
      }
    })
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) throw error;
};
```

## Files Modified/Created

### Created Files:
- `/src/services/roomsService.ts` - Complete room management service layer
- `/src/screens/RoomSessionScreen.tsx` - Main active room UI with all features
- `/ROOMS_IMPLEMENTATION.md` - This documentation

### Modified Files:
- `/src/utils/roomsData.ts` - Extended Member, Room interfaces; updated default rooms with competitive data
- `/src/screens/RoomsNavigator.tsx` - Added RoomSessionScreen to navigation stack
- `/src/screens/MyRoomsScreen.tsx` - Navigate to RoomSessionScreen on tap; long press for details
- `/src/screens/JoinRoomScreen.tsx` - Navigate to room session after joining; proper Member initialization
- `/src/screens/CreateRoomScreen.tsx` - Initialize room with full data structure; navigate to session
- `/src/screens/RoomsScreen.tsx` - Fixed Member initialization with todayStats

## Usage Examples

### Creating a Room
```typescript
// User taps "Create Room"
// Fills in room name, sets public/private
// Taps "Create"
// Room is created with full structure
// User is navigated to RoomSessionScreen
```

### Starting a Study Session
```typescript
// User is in RoomSessionScreen
// Taps "Start Studying"
// Subject picker modal opens
// User selects "Math"
// Global timer starts
// Room member status updates
// Activity feed shows "You started studying Math"
// Member card shows 🔥 Studying status
// Timer counts up: 0:01, 0:02, 0:03...
```

### Competing with Others
```typescript
// User views leaderboard
// Sees: 1. Alice - 2h 34m - 3 sessions
//       2. You - 2h 15m - 2 sessions  ← highlighted
//       3. Bob - 1h 50m - 4 sessions
// User is motivated to study more to reach #1
```

### Using Chat
```typescript
// User taps chat button (badge shows "2")
// Chat modal opens
// Sees: "Alice: Let's all hit 3 hours today! 💪"
//       "Bob: I'm in! 🔥"
// User types: "Me too! Let's do this!"
// Taps send
// Message appears instantly
// Badge clears
```

## Future Enhancements

**Near Term:**
- Typing indicators in chat
- Message read receipts
- "Poke" or "Cheer" quick reactions on member cards
- Celebratory animations for milestones (confetti)
- Haptic feedback for key actions
- Room creation categories (from CATEGORIES list)
- Max member limits enforcement

**Medium Term:**
- Weekly and all-time leaderboards
- Streak tracking per user
- Room analytics (avg study time, most active hours)
- User profiles with avatars
- Direct messages between members
- Room invitations via link

**Long Term:**
- Supabase real-time integration
- Push notifications for room events
- Video/audio chat integration
- Study goal tracking per room
- Achievement system (badges, titles)
- Public room discovery feed
- Room moderation tools

## Technical Debt

**Known Issues:**
- Navigation props typed as `any` (project-wide pattern)
- Polling creates unnecessary load (will be solved with Supabase)
- No offline queue for chat messages
- Timer syncs can drift slightly (10s update interval)
- No cleanup for old activity feed items

**Recommended Improvements:**
- Add proper TypeScript types for navigation
- Implement connection status indicator
- Add retry logic for failed operations
- Debounce timer update calls
- Add date-based cleanup for old data
- Implement proper error boundaries

## Conclusion

The Competitive Study Rooms feature is fully functional with a robust architecture designed for scalability. The service layer abstraction makes Supabase migration straightforward, and the competitive elements (leaderboards, activity feed, live status) create an engaging study environment.

All code follows the existing project patterns, uses the theme system properly, and integrates seamlessly with the global timer context. The feature is ready for testing and user feedback.
