# Implementation Guide - Quick Reference

This guide provides specific code changes needed for the timer, stats, and goal integration.

---

## Phase 1: Connect TimerScreen to StudyTimerContext

### File: `/src/src/screens/TimerScreen.tsx`

#### Step 1: Import StudyTimerContext

```typescript
// Add to imports:
import { useStudyTimer } from "../context/StudyTimerContext";
```

#### Step 2: Replace Local State with Context

```typescript
// REMOVE these lines:
// const [state, setState] = useState<TimerState>("idle");
// const [seconds, setSeconds] = useState(0);
// const [selectedSubject, setSelectedSubject] = useState<Subject>(DEFAULT_SUBJECTS[0]);

// REPLACE with context:
const {
  elapsedMs,
  isRunning,
  isPaused,
  currentSubject,
  start,
  pause,
  resume,
  stopAndSave,
  startWithSubject,
  changeSubject,
  showSubjectModal,
  setShowSubjectModal,
} = useStudyTimer();

// Keep these as local UI state (not part of global timer):
const [mode, setMode] = useState<TimerMode>("focus");
const [breakDuration, setBreakDuration] = useState(5 * 60);
const [showSubjectPicker, setShowSubjectPicker] = useState(false);
const [todayMinutes, setTodayMinutes] = useState(68);
const [dailyGoal, setDailyGoal] = useState(120);

// Compute derived state:
const seconds = Math.floor(elapsedMs / 1000);
const state: TimerState = isRunning ? "running" : isPaused ? "paused" : "idle";
```

#### Step 3: Update Timer Control Functions

```typescript
// REMOVE old handlePrimaryAction and replace with:
const handlePrimaryAction = async () => {
  if (mode === "focus") {
    // Focus mode uses context
    if (state === "idle") {
      start(); // Shows subject modal
    } else if (state === "running") {
      await pause();
    } else if (state === "paused") {
      resume();
    }
  } else {
    // Break mode uses local state (existing logic)
    // ... keep existing break mode logic
  }
};

// REMOVE old handleStop and replace with:
const handleStop = async () => {
  if (mode === "focus") {
    // Focus mode uses context
    await stopAndSave();
  } else {
    // Break mode logic (existing)
    setState("idle");
    setSeconds(breakDuration);
  }
};

// REMOVE old saveStudySession - context handles this now
```

#### Step 4: Update Subject Selection

```typescript
// Keep subject picker modal UI, but change handler:
const handleSubjectSelect = (subject: Subject) => {
  if (mode === "focus") {
    startWithSubject(subject); // From context
    setShowSubjectPicker(false);
  }
};

// Update subject change handler:
const handleChangeSubject = async (subject: Subject) => {
  await changeSubject(subject); // From context
  setShowSubjectPicker(false);
};
```

#### Step 5: Update Timer Display

```typescript
// Update formatTime to work with context:
const displaySeconds = mode === "focus" ? seconds : seconds; // local for break

// In render:
<Text style={styles.timerText}>
  {formatTime(displaySeconds)}
</Text>

// Update subject display:
{mode === "focus" && currentSubject && (
  <View style={styles.subjectSelector}>
    <Ionicons name={currentSubject.icon} size={20} color={currentSubject.color} />
    <Text>{currentSubject.name}</Text>
  </View>
)}
```

#### Step 6: Remove Old Timer Effect

```typescript
// REMOVE the useEffect with interval - context handles this:
/*
useEffect(() => {
  let interval: NodeJS.Timeout;
  if (state === "running") {
    interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }
  return () => clearInterval(interval);
}, [state]);
*/

// Context already has this interval logic
```

---

## Phase 2: Consolidate Daily Goal Storage

### File: `/src/src/screens/SettingsScreen.tsx`

#### Update Goal Save Function

```typescript
// REPLACE:
const saveDailyGoal = async (minutes: number) => {
  try {
    await AsyncStorage.setItem("dailyStudyGoal", minutes.toString());
    setDailyGoalMinutes(minutes);
  } catch (error) {
    console.error("Error saving daily goal:", error);
  }
};

// WITH:
const saveDailyGoal = async (minutes: number) => {
  try {
    await StorageService.saveUserSettings({
      dailyGoalMinutes: minutes
    });
    setDailyGoalMinutes(minutes);
  } catch (error) {
    console.error("Error saving daily goal:", error);
  }
};
```

#### Update Goal Load Function

```typescript
// REPLACE:
const loadDailyGoal = async () => {
  try {
    const savedGoal = await AsyncStorage.getItem("dailyStudyGoal");
    if (savedGoal) {
      setDailyGoalMinutes(parseInt(savedGoal));
    }
  } catch (error) {
    console.error("Error loading daily goal:", error);
  }
};

// WITH:
const loadDailyGoal = async () => {
  try {
    const settings = await StorageService.getUserSettings();
    setDailyGoalMinutes(settings.dailyGoalMinutes);
  } catch (error) {
    console.error("Error loading daily goal:", error);
  }
};
```

### File: `/src/src/screens/TimerScreen.tsx`

#### Update Goal Loading (same pattern)

```typescript
// REPLACE:
const loadDailyGoal = async () => {
  try {
    const savedGoal = await AsyncStorage.getItem("dailyStudyGoal");
    if (savedGoal) {
      setDailyGoal(parseInt(savedGoal));
    }
  } catch (error) {
    console.error("Error loading daily goal:", error);
  }
};

// WITH:
const loadDailyGoal = async () => {
  try {
    const settings = await StorageService.getUserSettings();
    setDailyGoal(settings.dailyGoalMinutes);
  } catch (error) {
    console.error("Error loading daily goal:", error);
  }
};
```

### File: `/src/App.tsx` (Optional Migration)

#### Add Migration Code on App Startup

```typescript
// Add to AppContent component, in useEffect:
useEffect(() => {
  const initializeData = async () => {
    // ... existing initialization code ...

    // Add goal migration:
    await migrateGoalSetting();
  };

  initializeData();
}, []);

// Add migration function:
const migrateGoalSetting = async () => {
  try {
    const oldGoal = await AsyncStorage.getItem("dailyStudyGoal");
    if (oldGoal) {
      const goalValue = parseInt(oldGoal);
      if (!isNaN(goalValue)) {
        const settings = await StorageService.getUserSettings();

        // Only migrate if user hasn't set a new goal
        if (settings.dailyGoalMinutes === 120) { // Default value
          await StorageService.saveUserSettings({
            dailyGoalMinutes: goalValue
          });
        }

        // Remove old key
        await AsyncStorage.removeItem("dailyStudyGoal");
        console.log(`Migrated daily goal: ${goalValue} minutes`);
      }
    }
  } catch (error) {
    console.error("Error migrating goal setting:", error);
  }
};
```

---

## Phase 3: Remove Dummy Data from Heatmap

### File: `/src/src/components/StatsHeatmapWidget.tsx`

#### Step 1: Update loadData Function

```typescript
// REPLACE (lines 54-66):
const loadData = async () => {
  try {
    // Generate dummy data for visualization
    const dummySessions = generateDummyStudySessions();
    setSessions(dummySessions);

    // Uncomment below to use real data:
    // const loadedSessions = await StorageService.getSessions();
    // setSessions(loadedSessions);
  } catch (error) {
    console.error("Error loading stats data:", error);
  }
};

// WITH:
const loadData = async () => {
  try {
    const loadedSessions = await StorageService.getSessions();
    setSessions(loadedSessions);
  } catch (error) {
    console.error("Error loading stats data:", error);
    // Fallback to empty array on error
    setSessions([]);
  }
};
```

#### Step 2: Remove Dummy Data Generator

```typescript
// DELETE entire generateDummyStudySessions function (lines 69-118):
// Delete this:
/*
const generateDummyStudySessions = (): StudySession[] => {
  // ... entire function ...
};
*/
```

#### Step 3: Add Empty State (Optional but Recommended)

```typescript
// Add after useMemo calculation:
const hasData = sessions.length > 0;

// In render, add empty state:
{!hasData ? (
  <View style={styles.emptyState}>
    <Ionicons
      name="calendar-outline"
      size={40}
      color={colors.textSecondary}
    />
    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
      No study data yet
    </Text>
    <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
      Start studying to see your heatmap!
    </Text>
  </View>
) : (
  // ... existing heatmap rendering ...
)}

// Add styles:
emptyState: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  gap: 8,
},
emptyText: {
  fontSize: 16,
  fontWeight: "600",
  marginTop: 8,
},
emptyHint: {
  fontSize: 14,
},
```

#### Step 4: Add Refresh on Focus (Optional)

```typescript
// Add import:
import { useFocusEffect } from "@react-navigation/native";

// Add focus effect:
useFocusEffect(
  React.useCallback(() => {
    loadData(); // Reload data when widget becomes visible
  }, [])
);
```

---

## Phase 4: Real-Time Stats Updates (Optional Enhancement)

### Option A: Focus-Based Updates (Simplest, Already Works)

**Current behavior:**
- StatsScreen uses `useFocusEffect` to reload data when screen comes into focus
- Works well for most cases
- No changes needed

### Option B: Event-Based Updates (More Reactive)

If you want immediate updates without navigation:

#### Create StatsContext

```typescript
// Create file: /src/src/context/StatsContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StatsContextType {
  lastUpdateTimestamp: number;
  notifyStatsUpdate: () => void;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const notifyStatsUpdate = () => {
    setLastUpdate(Date.now());
  };

  return (
    <StatsContext.Provider value={{
      lastUpdateTimestamp: lastUpdate,
      notifyStatsUpdate
    }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStatsUpdate() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStatsUpdate must be used within a StatsProvider');
  }
  return context;
}
```

#### Add to App.tsx

```typescript
import { StatsProvider } from './src/context/StatsContext';

// Wrap in provider:
<ThemeProvider>
  <WidgetProvider>
    <StudyTimerProvider>
      <StatsProvider>
        <AppContent />
      </StatsProvider>
    </StudyTimerProvider>
  </WidgetProvider>
</ThemeProvider>
```

#### Notify on Session Save

```typescript
// In StudyTimerContext.tsx, update savePartialSession:
import { useStatsUpdate } from './StatsContext';

// In component:
const { notifyStatsUpdate } = useStatsUpdate();

// In savePartialSession function, after addSession:
const savePartialSession = async (durationMs: number) => {
  // ... existing code ...

  try {
    await StorageService.addSession(session);
    notifyStatsUpdate(); // Notify all stats components
  } catch (error) {
    console.error("Failed to save study session:", error);
  }
};
```

#### Listen in Stats Components

```typescript
// In StatsScreen.tsx:
import { useStatsUpdate } from '../context/StatsContext';

const { lastUpdateTimestamp } = useStatsUpdate();

// Add to dependencies:
useEffect(() => {
  loadAllData();
}, [lastUpdateTimestamp]); // Reload when timestamp changes
```

```typescript
// In StatsHeatmapWidget.tsx:
import { useStatsUpdate } from '../context/StatsContext';

const { lastUpdateTimestamp } = useStatsUpdate();

useEffect(() => {
  loadData();
}, [lastUpdateTimestamp]);
```

---

## Testing Checklist

### Manual Testing

#### Test 1: Timer Widget to Timer Tab Sync
- [ ] Start timer from widget
- [ ] Select a subject
- [ ] Navigate to Timer tab
- [ ] Verify timer shows same elapsed time
- [ ] Verify same subject is displayed
- [ ] Pause in timer tab
- [ ] Go back to widget
- [ ] Verify widget shows paused state

#### Test 2: Auto-Save Sessions
- [ ] Start timer
- [ ] Let it run for 30 seconds
- [ ] Stop timer
- [ ] Navigate to Stats screen
- [ ] Verify session appears in recent sessions
- [ ] Verify daily stats updated

#### Test 3: Goal Consistency
- [ ] Change goal in Settings to 180 minutes
- [ ] Navigate to Stats
- [ ] Verify progress ring uses 180 min goal
- [ ] Navigate to Timer
- [ ] Verify timer displays 180 min goal

#### Test 4: Heatmap Real Data
- [ ] Complete a few study sessions over multiple days
- [ ] Navigate to Stats
- [ ] View heatmap widget
- [ ] Verify heatmap shows actual study days
- [ ] Verify color intensity matches study time

#### Test 5: Background Timer
- [ ] Start timer
- [ ] Put app in background for 2 minutes
- [ ] Return to app
- [ ] Verify elapsed time increased by ~2 minutes

#### Test 6: App Restart
- [ ] Start timer
- [ ] Force quit app
- [ ] Reopen app
- [ ] Verify timer resumed with correct time

---

## Common Issues and Solutions

### Issue 1: Timer not syncing between widget and tab

**Cause:** TimerScreen still using local state

**Solution:** Ensure TimerScreen uses `useStudyTimer()` hook and removes all local timer state

### Issue 2: Goal not updating everywhere

**Cause:** Components reading from different storage locations

**Solution:** All components must use `StorageService.getUserSettings()` to read goal

### Issue 3: Stats not showing real data

**Cause:** Heatmap widget still generating dummy data

**Solution:** Replace `generateDummyStudySessions()` with `StorageService.getSessions()`

### Issue 4: Sessions not auto-saving

**Cause:** Not using StudyTimerContext methods

**Solution:** Use `stopAndSave()`, `pause()`, or `changeSubject()` from context

### Issue 5: Timer resets on navigation

**Cause:** Context not properly provided in App.tsx

**Solution:** Ensure `StudyTimerProvider` wraps navigation container

---

## Performance Optimization Tips

### 1. Memoize Expensive Calculations

```typescript
const dailyTotals = useMemo(() => {
  return calculateDailyTotals(sessions);
}, [sessions]);
```

### 2. Limit Session Queries

```typescript
// Instead of loading all sessions:
const sessions = await StorageService.getSessions();

// Load only what you need:
const recentSessions = await StorageService.getRecentSessions(10);
const weekSessions = await StorageService.getSessionsForPeriod(weekStart, now);
```

### 3. Debounce Stats Updates

```typescript
const debouncedUpdate = useMemo(
  () => debounce(loadStatsData, 300),
  []
);

useEffect(() => {
  debouncedUpdate();
}, [lastUpdateTimestamp]);
```

### 4. Cache Computed Stats

```typescript
// In storage.ts, add caching:
let cachedWeeklySummary: { data: any; timestamp: number } | null = null;

export const getWeeklySummary = async () => {
  const now = Date.now();
  if (cachedWeeklySummary && now - cachedWeeklySummary.timestamp < 60000) {
    return cachedWeeklySummary.data;
  }

  const data = await computeWeeklySummary();
  cachedWeeklySummary = { data, timestamp: now };
  return data;
};
```

---

## Rollback Plan

If issues arise after implementation:

### Immediate Rollback

```bash
# Revert to previous commit
git revert HEAD
git push
```

### Partial Rollback

If only one phase has issues:

**Phase 1 (Timer):** Restore original TimerScreen.tsx from backup
**Phase 2 (Goal):** Revert goal storage changes
**Phase 3 (Heatmap):** Re-enable dummy data temporarily

### Data Recovery

User data is safe because:
- Sessions stored separately from timer state
- Goal migration preserves old value
- AsyncStorage operations are atomic

---

## Next Steps After Implementation

1. **Monitor for Issues**
   - Check crash reports
   - Monitor user feedback
   - Track analytics for timer usage

2. **Performance Testing**
   - Test with 1000+ sessions
   - Profile memory usage
   - Check battery impact

3. **User Testing**
   - Beta test with small group
   - Gather feedback on timer sync
   - Validate goal changes work smoothly

4. **Documentation**
   - Update user guide
   - Create troubleshooting docs
   - Document API for future developers

5. **Future Enhancements**
   - Add notifications
   - Implement Supabase sync
   - Create advanced analytics

---

*Document created: 2026-01-19*
*Version: 1.0*
