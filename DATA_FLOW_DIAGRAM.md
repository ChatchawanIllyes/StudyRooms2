# Data Flow Diagrams - StudyRooms Integration

## 1. Current State (Before Integration)

### Timer State Flow
```
┌──────────────────┐
│  TimerWidget     │
│  (uses Context)  │
└────────┬─────────┘
         │
         │ reads/writes
         ▼
┌──────────────────┐        ┌──────────────────┐
│StudyTimerContext │        │  TimerScreen     │
│                  │        │  (local state)   │
│ - elapsedMs      │   ✗    │                  │
│ - isRunning      │  NOT   │ - seconds        │
│ - currentSubject │ SYNCED │ - selectedSubject│
│ - stopAndSave()  │        │ - state          │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         │ saves session             │ saves session
         │                           │
         ▼                           ▼
    ┌────────────────────────────────────┐
    │      StorageService.addSession()    │
    └────────────────┬───────────────────┘
                     │
                     ├── Saves to sessions array
                     │
                     └── Auto-updates daily stats
                            │
                            ▼
                    ┌───────────────┐
                    │  DailyStats   │
                    └───────┬───────┘
                            │
                            │ read on focus
                            ▼
                    ┌───────────────┐
                    │  StatsScreen  │
                    └───────────────┘
```

### Goal Storage Flow (Inconsistent)
```
┌──────────────────┐
│ SettingsScreen   │
│                  │
│  Change goal     │
└────────┬─────────┘
         │
         │ writes
         ▼
┌──────────────────────────┐
│ AsyncStorage             │
│  key: "dailyStudyGoal"   │
└──────────────────────────┘
         │
         │ reads
         ▼
┌──────────────────┐
│  TimerScreen     │
└──────────────────┘

                              ┌──────────────────┐
                              │ StatsScreen      │
                              └────────┬─────────┘
                                       │
                                       │ reads
                                       ▼
                              ┌──────────────────┐
                              │ UserSettings     │
                              │ .dailyGoalMinutes│
                              └──────────────────┘
```

### Heatmap Data Flow (Using Dummy Data)
```
┌──────────────────────────┐
│  StatsHeatmapWidget      │
│                          │
│  loadData() {            │
│    generateDummy()   ←── │ PROBLEM: Dummy data!
│  }                       │
└──────────────────────────┘

Real sessions exist but unused:
┌──────────────────┐
│  StorageService  │
│  .getSessions()  │  ✗ Not called
└──────────────────┘
```

---

## 2. Target State (After Integration)

### Unified Timer State Flow
```
┌──────────────────┐           ┌──────────────────┐
│  TimerWidget     │           │  TimerScreen     │
└────────┬─────────┘           └────────┬─────────┘
         │                              │
         └──────────┬───────────────────┘
                    │
                    │ Both use same context
                    ▼
         ┌─────────────────────┐
         │ StudyTimerContext   │
         │                     │
         │ Shared State:       │
         │  - elapsedMs        │
         │  - isRunning        │
         │  - isPaused         │
         │  - currentSubject   │
         │  - sessionStartedAt │
         │                     │
         │ Methods:            │
         │  - start()          │
         │  - pause()          │
         │  - resume()         │
         │  - stopAndSave()    │
         │  - changeSubject()  │
         └──────────┬──────────┘
                    │
                    │ Auto-saves sessions
                    ▼
         ┌─────────────────────┐
         │ savePartialSession()│
         │                     │
         │ Saves on:           │
         │  - Pause            │
         │  - Stop             │
         │  - Subject change   │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ StorageService          │
         │  .addSession(session)   │
         └──────────┬──────────────┘
                    │
                    ├── 1. Save to sessions
                    │
                    └── 2. Update daily stats
                           │
                           ▼
                    ┌──────────────┐
                    │  DailyStats  │
                    └──────┬───────┘
                           │
                           │ Stats components listen
                           ▼
         ┌────────────────────────────────┐
         │   Stats Display Components     │
         │                                │
         │  - StatsScreen                 │
         │  - StatsHeatmapWidget          │
         │  - Progress indicators         │
         └────────────────────────────────┘
```

### Unified Goal Storage Flow
```
┌──────────────────┐
│ SettingsScreen   │
│                  │
│  Change goal     │
└────────┬─────────┘
         │
         │ writes via
         ▼
┌────────────────────────────┐
│ StorageService             │
│  .saveUserSettings({       │
│    dailyGoalMinutes: X     │
│  })                        │
└────────┬───────────────────┘
         │
         │ saves to
         ▼
┌────────────────────────────┐
│ AsyncStorage               │
│  key: @study_app/settings  │
│  {                         │
│    dailyGoalMinutes: 120   │
│  }                         │
└────────┬───────────────────┘
         │
         │ read by all components via
         ▼
┌────────────────────────────┐
│ StorageService             │
│  .getUserSettings()        │
└────────┬───────────────────┘
         │
         ├─────────────┬──────────────┐
         │             │              │
         ▼             ▼              ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  Stats   │  │  Timer   │  │ Progress │
  │  Screen  │  │  Screen  │  │  Widgets │
  └──────────┘  └──────────┘  └──────────┘
```

### Real Data Heatmap Flow
```
┌──────────────────────────┐
│  StatsHeatmapWidget      │
│                          │
│  loadData() {            │
│    getSessions()   ←──   │ ✓ Real data!
│  }                       │
└───────────┬──────────────┘
            │
            │ reads from
            ▼
┌──────────────────────────┐
│  StorageService          │
│  .getSessions()          │
└───────────┬──────────────┘
            │
            │ returns
            ▼
┌──────────────────────────┐
│  StudySession[]          │
│                          │
│  [{                      │
│    id, subject,          │
│    duration, date        │
│  }, ...]                 │
└───────────┬──────────────┘
            │
            │ process into heatmap
            ▼
┌──────────────────────────┐
│  GitHub-style heatmap    │
│  (color intensity based  │
│   on study minutes)      │
└──────────────────────────┘
```

---

## 3. Component Interaction Sequences

### Sequence 1: User Starts Timer from Widget

```
User                TimerWidget         StudyTimerContext      StorageService
 │                       │                      │                     │
 │  Tap timer           │                      │                     │
 ├──────────────────────►│                      │                     │
 │                       │                      │                     │
 │                       │  start()             │                     │
 │                       ├─────────────────────►│                     │
 │                       │                      │                     │
 │                       │  showSubjectModal    │                     │
 │                       │◄─────────────────────┤                     │
 │                       │                      │                     │
 │  Select subject      │                      │                     │
 ├──────────────────────►│                      │                     │
 │                       │                      │                     │
 │                       │  startWithSubject(s) │                     │
 │                       ├─────────────────────►│                     │
 │                       │                      │                     │
 │                       │  Context updates:    │                     │
 │                       │  - isRunning = true  │                     │
 │                       │  - currentSubject    │                     │
 │                       │  - elapsedMs starts  │                     │
 │                       │                      │                     │
 │  Navigate to Timer   │                      │                     │
 ├──────────────────────────────────────────────┤                     │
 │                                              │                     │
 │                    TimerScreen               │                     │
 │                       │                      │                     │
 │                       │  useStudyTimer()     │                     │
 │                       ├─────────────────────►│                     │
 │                       │                      │                     │
 │                       │  Returns state:      │                     │
 │                       │  - isRunning: true   │                     │
 │                       │  - currentSubject    │                     │
 │                       │  - elapsedMs         │                     │
 │                       │◄─────────────────────┤                     │
 │                       │                      │                     │
 │  See timer running    │                      │                     │
 │  with same state!     │                      │                     │
 │◄──────────────────────┤                      │                     │
```

### Sequence 2: Timer Stop and Stats Update

```
User         TimerScreen      StudyTimerContext    StorageService      StatsScreen
 │                │                   │                    │                 │
 │  Stop timer    │                   │                    │                 │
 ├───────────────►│                   │                    │                 │
 │                │                   │                    │                 │
 │                │  stopAndSave()    │                    │                 │
 │                ├──────────────────►│                    │                 │
 │                │                   │                    │                 │
 │                │                   │ Calculate duration │                 │
 │                │                   │                    │                 │
 │                │                   │  addSession({      │                 │
 │                │                   │    subject,        │                 │
 │                │                   │    duration,       │                 │
 │                │                   │    date            │                 │
 │                │                   │  })                │                 │
 │                │                   ├───────────────────►│                 │
 │                │                   │                    │                 │
 │                │                   │                    │ Save session    │
 │                │                   │                    │                 │
 │                │                   │                    │ Update daily    │
 │                │                   │                    │ stats           │
 │                │                   │                    │                 │
 │                │                   │  Success           │                 │
 │                │                   │◄───────────────────┤                 │
 │                │                   │                    │                 │
 │                │  Timer reset      │                    │                 │
 │                │◄──────────────────┤                    │                 │
 │                │                   │                    │                 │
 │  Navigate to   │                   │                    │                 │
 │  Stats         │                   │                    │                 │
 ├────────────────────────────────────────────────────────────────────────►│
 │                                                                           │
 │                                                         Load data         │
 │                                                         (useFocusEffect)  │
 │                                                                 │         │
 │                                                                 │  getSessions()
 │                                                                 │  getDailyStats()
 │                                                                 │  getRecentSessions()
 │                                                                 │         │
 │  See updated stats!                                                       │
 │◄──────────────────────────────────────────────────────────────────────────┤
```

### Sequence 3: Goal Change Propagation

```
User         SettingsScreen    StorageService     StatsScreen     TimerScreen
 │                │                   │                 │               │
 │  Change goal   │                   │                 │               │
 │  to 180 min    │                   │                 │               │
 ├───────────────►│                   │                 │               │
 │                │                   │                 │               │
 │                │  saveUserSettings │                 │               │
 │                │  ({               │                 │               │
 │                │    dailyGoalMin:  │                 │               │
 │                │    180            │                 │               │
 │                │  })               │                 │               │
 │                ├──────────────────►│                 │               │
 │                │                   │                 │               │
 │                │  Saved to         │                 │               │
 │                │  AsyncStorage     │                 │               │
 │                │◄──────────────────┤                 │               │
 │                │                   │                 │               │
 │  Navigate to   │                   │                 │               │
 │  Stats         │                   │                 │               │
 ├────────────────────────────────────────────────────►│               │
 │                                                      │               │
 │                                     getUserSettings()│               │
 │                                                      ├──────────────►│
 │                                                      │               │
 │                                     Returns: 180     │               │
 │                                                      │◄──────────────┤
 │                                                      │               │
 │  See new goal                                        │               │
 │  (180 min)                                           │               │
 │◄─────────────────────────────────────────────────────┤               │
 │                                                                      │
 │  Navigate to Timer                                                   │
 ├──────────────────────────────────────────────────────────────────────►│
 │                                                                      │
 │                                                      getUserSettings()│
 │                                                      ├───────────────►│
 │                                                      │               │
 │                                                      Returns: 180    │
 │                                                      │◄───────────────┤
 │                                                                      │
 │  See new goal everywhere!                                            │
 │◄──────────────────────────────────────────────────────────────────────┤
```

---

## 4. State Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       App.tsx                            │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Providers (Nested)                              │    │
│  │                                                 │    │
│  │  ThemeProvider                                  │    │
│  │    └─ ThemeContext (isDark, accentColor)       │    │
│  │                                                 │    │
│  │  WidgetProvider                                 │    │
│  │    └─ WidgetContext (widgets, grid state)      │    │
│  │                                                 │    │
│  │  StudyTimerProvider ◄─────────────────────┐    │    │
│  │    └─ StudyTimerContext                   │    │    │
│  │         │                                  │    │    │
│  │         ├─ State:                          │    │    │
│  │         │   - isRunning: boolean           │    │    │
│  │         │   - isPaused: boolean            │    │    │
│  │         │   - elapsedMs: number            │    │    │
│  │         │   - currentSubject: Subject      │    │    │
│  │         │   - sessionStartedAt: timestamp  │    │    │
│  │         │                                  │    │    │
│  │         ├─ Methods:                        │    │    │
│  │         │   - start()                      │    │    │
│  │         │   - pause()                      │    │    │
│  │         │   - resume()                     │    │    │
│  │         │   - stopAndSave()                │    │    │
│  │         │   - startWithSubject()           │    │    │
│  │         │   - changeSubject()              │    │    │
│  │         │                                  │    │    │
│  │         └─ Persistence:                    │    │    │
│  │             - Saves to AsyncStorage        │    │    │
│  │             - Loads on mount               │    │    │
│  │             - AppState listener            │    │    │
│  │                                            │    │    │
│  │  NavigationContainer                       │    │    │
│  │    └─ Tab.Navigator                        │    │    │
│  │         ├─ Focus (FocusNavigator)          │    │    │
│  │         ├─ Rooms (RoomsNavigator)          │    │    │
│  │         └─ Settings (SettingsScreen)       │    │    │
│  │                                            │    │    │
│  └────────────────────────────────────────────┘    │    │
│                                                     │    │
└─────────────────────────────────────────────────────┘    │
                                                           │
        Components consume context:                        │
                                                           │
        ┌─────────────────────────────────────────────────┘
        │
        ├─► TimerWidget (HomeScreen)
        │    └─ const { elapsedMs, isRunning, ... } = useStudyTimer()
        │
        ├─► TimerScreen
        │    └─ const { start, pause, stopAndSave, ... } = useStudyTimer()
        │
        └─► Any other component needing timer state
```

---

## 5. Data Persistence Architecture

```
┌────────────────────────────────────────────────────────┐
│               Application Layer                         │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ TimerWidget │  │ TimerScreen │  │ StatsScreen │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │            │
│         └────────────────┼────────────────┘            │
│                          │                             │
└──────────────────────────┼─────────────────────────────┘
                           │
                           │ All data access goes through
                           ▼
┌────────────────────────────────────────────────────────┐
│              StorageService Layer                       │
│            (Abstraction for easy migration)             │
│                                                         │
│  Session Management:                                    │
│   - addSession(session)                                 │
│   - getSessions()                                       │
│   - getRecentSessions(limit)                            │
│   - getSessionsForPeriod(start, end)                    │
│   - getSessionsBySubject(subjectId)                     │
│                                                         │
│  Stats Management:                                      │
│   - getDailyStats()                                     │
│   - getTodayStats()                                     │
│   - getWeeklySummary()                                  │
│   - calculateStreak()                                   │
│   - getWeekTrend()                                      │
│                                                         │
│  Settings Management:                                   │
│   - getUserSettings()                                   │
│   - saveUserSettings(settings)                          │
│                                                         │
│  Subject Management:                                    │
│   - getSubjects()                                       │
│   - saveSubjects(subjects)                              │
│   - addSubject(subject)                                 │
│                                                         │
└────────────────────────┬───────────────────────────────┘
                         │
                         │ Currently: AsyncStorage
                         │ Future: Supabase client
                         ▼
┌────────────────────────────────────────────────────────┐
│              AsyncStorage (Current)                     │
│                                                         │
│  Keys:                                                  │
│   @study_app/sessions      ← StudySession[]            │
│   @study_app/daily_stats   ← DailyStats[]              │
│   @study_app/settings      ← UserSettings              │
│   @study_app/subjects      ← Subject[]                 │
│   @study_app/tasks         ← Task[]                    │
│                                                         │
│  studyapp_timer_state      ← Timer state (Context)     │
│                                                         │
└────────────────────────────────────────────────────────┘
                         │
                         │ Future migration
                         ▼
┌────────────────────────────────────────────────────────┐
│               Supabase (Future)                         │
│                                                         │
│  Tables:                                                │
│   - study_sessions                                      │
│   - daily_stats                                         │
│   - user_settings                                       │
│   - subjects                                            │
│   - tasks                                               │
│                                                         │
│  Real-time subscriptions                                │
│  Row-level security                                     │
│  Automatic backups                                      │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 6. Auto-Save Trigger Points

```
User Action Flow → Auto-Save Decision Tree

┌─────────────────┐
│  User Action    │
└────────┬────────┘
         │
         ▼
    ┌───────────────────┐
    │ Timer Running?    │
    └────┬──────────────┘
         │
         ├─ NO → No save
         │
         └─ YES → Continue
                   │
                   ▼
            ┌─────────────────┐
            │ Trigger Event?  │
            └────┬────────────┘
                 │
                 ├─► PAUSE Button
                 │    │
                 │    └─► savePartialSession()
                 │         └─► StorageService.addSession()
                 │
                 ├─► STOP Button
                 │    │
                 │    └─► stopAndSave()
                 │         └─► savePartialSession()
                 │              └─► StorageService.addSession()
                 │
                 ├─► CHANGE SUBJECT
                 │    │
                 │    └─► changeSubject(newSubject)
                 │         ├─► Save current subject session
                 │         │    └─► savePartialSession()
                 │         │         └─► StorageService.addSession()
                 │         │
                 │         └─► Start new session with new subject
                 │
                 └─► APP BACKGROUNDED
                      │
                      └─► Timer continues
                           (saved on next pause/stop)

All save paths lead to:
┌────────────────────────────────────┐
│ StorageService.addSession()        │
│                                    │
│  1. Add to sessions array          │
│  2. Auto-update daily stats        │
│  3. Persist to AsyncStorage        │
└────────────────────────────────────┘
```

---

## 7. Navigation Flow with Shared State

```
┌──────────────────────────────────────────────────────────────┐
│                    Navigation Structure                       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                ┌───────────┴──────────────┐
                │                          │
         ┌──────▼─────┐            ┌──────▼──────┐
         │ HomeScreen │            │ TimerScreen │
         │            │            │             │
         │ Contains:  │            │ Full timer  │
         │ Timer      │            │ interface   │
         │ Widget     │            │             │
         └──────┬─────┘            └──────┬──────┘
                │                         │
                │                         │
                └──────────┬──────────────┘
                           │
                    Both consume:
                           │
                ┌──────────▼────────────┐
                │  StudyTimerContext    │
                │                       │
                │  Shared State:        │
                │   - elapsedMs         │
                │   - isRunning         │
                │   - isPaused          │
                │   - currentSubject    │
                │                       │
                │  Navigation scenario: │
                │                       │
                │  1. User on Home      │
                │  2. Start timer       │
                │     → isRunning=true  │
                │     → elapsedMs=0     │
                │  3. Navigate to Timer │
                │  4. Timer screen      │
                │     reads context     │
                │  5. Shows same state! │
                │                       │
                │  Reverse works too:   │
                │  Timer → Home         │
                └───────────────────────┘
```

---

## 8. Migration Path Visualization

```
Current (Inconsistent) → Migration Step → Target (Consistent)

Goal Storage Migration:
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│ AsyncStorage   │       │ Check both     │       │ UserSettings   │
│ "dailyStudyGoal"│  →   │ Migrate if     │  →   │ .dailyGoal     │
│                │       │ needed         │       │ Minutes        │
│ AND            │       │                │       │                │
│                │       │                │       │ (Single source)│
│ UserSettings   │       │                │       │                │
│ .dailyGoalMins │       │                │       │                │
└────────────────┘       └────────────────┘       └────────────────┘

Heatmap Data Migration:
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│ Dummy data     │       │ Remove dummy   │       │ Real sessions  │
│ generation     │  →   │ generation     │  →   │ from Storage   │
│                │       │                │       │                │
│ Fake sessions  │       │ Load real data │       │ User sessions  │
└────────────────┘       └────────────────┘       └────────────────┘

Timer State Migration:
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│ TimerScreen    │       │ Replace local  │       │ TimerScreen    │
│ local state    │  →   │ with context   │  →   │ uses context   │
│                │       │                │       │                │
│ TimerWidget    │       │ Keep widget as │       │ TimerWidget    │
│ uses context   │       │ is             │       │ uses context   │
│                │       │                │       │                │
│ NOT SYNCED     │       │ Refactor       │       │ SYNCED         │
└────────────────┘       └────────────────┘       └────────────────┘
```

---

*Document created: 2026-01-19*
*Version: 1.0*
