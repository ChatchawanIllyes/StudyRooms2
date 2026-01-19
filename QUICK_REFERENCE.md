# Integration Quick Reference Card

## The Problem in 3 Points

1. **Timer not synced**: Widget uses context ✓, TimerScreen uses local state ✗
2. **Goal inconsistent**: Stored in two places (AsyncStorage + UserSettings)
3. **Heatmap fake**: Shows dummy data instead of real user sessions

## The Solution in 3 Phases

1. **Connect TimerScreen to StudyTimerContext** → Both use same state
2. **Use UserSettings.dailyGoalMinutes everywhere** → Single source
3. **Load real sessions in heatmap** → Replace dummy data

---

## Phase 1: Timer Sync (2-3 hours)

### Change This:
```typescript
// ❌ OLD - TimerScreen.tsx
const [seconds, setSeconds] = useState(0);
const [state, setState] = useState("idle");
const [subject, setSubject] = useState(DEFAULT_SUBJECTS[0]);
```

### To This:
```typescript
// ✅ NEW - TimerScreen.tsx
import { useStudyTimer } from "../context/StudyTimerContext";

const {
  elapsedMs,
  isRunning,
  isPaused,
  currentSubject,
  start,
  pause,
  resume,
  stopAndSave,
} = useStudyTimer();

const seconds = Math.floor(elapsedMs / 1000);
```

**Result:** Widget timer ↔ Timer tab perfectly synced

---

## Phase 2: Goal Storage (1-2 hours)

### Change This:
```typescript
// ❌ OLD - Multiple files
await AsyncStorage.setItem("dailyStudyGoal", "120");
const goal = await AsyncStorage.getItem("dailyStudyGoal");
```

### To This:
```typescript
// ✅ NEW - All files
import * as StorageService from "../services/storage";

// Save:
await StorageService.saveUserSettings({
  dailyGoalMinutes: 120
});

// Load:
const settings = await StorageService.getUserSettings();
const goal = settings.dailyGoalMinutes;
```

**Files to update:**
- `SettingsScreen.tsx`
- `TimerScreen.tsx`

**Result:** Goal changes sync everywhere instantly

---

## Phase 3: Real Heatmap (30 minutes)

### Change This:
```typescript
// ❌ OLD - StatsHeatmapWidget.tsx
const loadData = async () => {
  const dummySessions = generateDummyStudySessions();
  setSessions(dummySessions);
};
```

### To This:
```typescript
// ✅ NEW - StatsHeatmapWidget.tsx
const loadData = async () => {
  const loadedSessions = await StorageService.getSessions();
  setSessions(loadedSessions);
};
```

**Delete:** `generateDummyStudySessions()` function (69 lines)

**Result:** Heatmap shows actual user study data

---

## Data Flow Visualization

### Before Integration:
```
TimerWidget → StudyTimerContext ✓
TimerScreen → Local State      ✗ (Not synced!)

Settings    → AsyncStorage direct
Stats       → UserSettings     ✗ (Inconsistent!)

Heatmap     → Dummy data       ✗ (Not real!)
```

### After Integration:
```
TimerWidget ──┐
              ├→ StudyTimerContext ✓ (Synced!)
TimerScreen ──┘

All screens → UserSettings.dailyGoalMinutes ✓ (Consistent!)

Heatmap     → StorageService.getSessions() ✓ (Real data!)
```

---

## Files to Modify

### Required Changes:
```
✏️  src/src/screens/TimerScreen.tsx
    - Remove local timer state
    - Use useStudyTimer() hook
    - Keep break mode as local UI state

✏️  src/src/screens/SettingsScreen.tsx
    - Replace AsyncStorage.setItem()
    - Use StorageService.saveUserSettings()

✏️  src/src/components/StatsHeatmapWidget.tsx
    - Replace generateDummyStudySessions()
    - Use StorageService.getSessions()
    - Delete dummy generator function
```

### Optional Changes:
```
✏️  src/App.tsx
    - Add goal migration code (one-time)

🆕 src/src/context/StatsContext.tsx
    - Create for real-time updates (optional)
```

### No Changes Needed:
```
✅ src/src/context/StudyTimerContext.tsx    (Already perfect!)
✅ src/src/services/storage.ts              (Already perfect!)
✅ src/src/components/TimerWidget.tsx       (Already uses context!)
✅ src/src/screens/StatsScreen.tsx          (Already uses real data!)
```

---

## Testing Checklist

### Critical Tests:
```
□ Start timer in widget → Navigate to tab → Same time showing
□ Pause in tab → Go back to widget → Shows paused
□ Stop timer → Check stats screen → Session appears
□ Change goal in settings → Check all screens → Updated
□ Complete sessions → Check heatmap → Real data shown
□ Background app 2 min → Return → Time increased
□ Restart app with timer running → Timer resumed
```

### Edge Cases:
```
□ No sessions yet → Empty state shows
□ Change subject while running → Both sessions saved
□ Quick pause/resume → No data loss
□ Goal migration → Old value preserved
```

---

## Key Context Functions

### StudyTimerContext (already exists)
```typescript
const {
  elapsedMs,          // Current elapsed time in milliseconds
  isRunning,          // Is timer currently running?
  isPaused,           // Is timer paused?
  currentSubject,     // Current study subject
  start,              // Show subject modal and prepare to start
  pause,              // Pause timer (auto-saves session)
  resume,             // Resume paused timer
  stopAndSave,        // Stop timer and save final session
  startWithSubject,   // Start with specific subject
  changeSubject,      // Change subject (saves old, starts new)
} = useStudyTimer();
```

### StorageService (already exists)
```typescript
// Sessions
await StorageService.addSession(session);
const sessions = await StorageService.getSessions();
const recent = await StorageService.getRecentSessions(5);

// Stats
const dailyStats = await StorageService.getDailyStats();
const todayStats = await StorageService.getTodayStats();
const streak = await StorageService.calculateStreak();

// Settings
const settings = await StorageService.getUserSettings();
await StorageService.saveUserSettings({ dailyGoalMinutes: 120 });

// Subjects
const subjects = await StorageService.getSubjects();
```

---

## Common Pitfalls

### ❌ Don't Do This:
```typescript
// Don't use local timer state in TimerScreen
const [seconds, setSeconds] = useState(0);

// Don't access AsyncStorage directly for goal
await AsyncStorage.setItem("dailyStudyGoal", "120");

// Don't generate dummy data
const sessions = generateDummyStudySessions();
```

### ✅ Do This Instead:
```typescript
// Use context for timer
const { elapsedMs } = useStudyTimer();
const seconds = Math.floor(elapsedMs / 1000);

// Use StorageService for goal
await StorageService.saveUserSettings({ dailyGoalMinutes: 120 });

// Use real data
const sessions = await StorageService.getSessions();
```

---

## Success Indicators

### Immediate (Phase 1):
- ✓ Timer widget and tab show identical time
- ✓ Subject selection syncs across both
- ✓ Pause/resume works in both places

### Short-term (Phase 2):
- ✓ Goal change in settings updates everywhere
- ✓ No inconsistency between screens
- ✓ Settings persist correctly

### Medium-term (Phase 3):
- ✓ Heatmap shows real study patterns
- ✓ Empty state appears for new users
- ✓ Data accuracy matches expectations

---

## Performance Notes

### Already Optimized:
- ✓ Context persists to AsyncStorage (fast)
- ✓ Sessions auto-save (no user action needed)
- ✓ Daily stats auto-update (no recalculation)

### May Need Optimization Later:
- Large session arrays (1000+ sessions)
- Expensive stats calculations (caching)
- Frequent re-renders (memoization)

### Quick Optimizations:
```typescript
// Memoize expensive calculations
const stats = useMemo(() => calculateStats(sessions), [sessions]);

// Limit query results
const recent = await getRecentSessions(10); // Not all sessions

// Cache computed values
if (cachedValue && age < 60000) return cachedValue;
```

---

## Rollback Strategy

### If Issues Occur:
```bash
# Immediate rollback
git revert HEAD

# Partial rollback (restore one file)
git checkout HEAD~1 -- src/src/screens/TimerScreen.tsx

# Data is safe (atomic AsyncStorage operations)
```

### No Data Loss:
- ✓ User sessions preserved
- ✓ Settings maintained
- ✓ Timer state persisted
- ✓ Migration reversible

---

## Time Estimates

### Development:
- Phase 1 (Timer): 2-3 hours
- Phase 2 (Goal): 1-2 hours
- Phase 3 (Heatmap): 30 minutes
- **Total: 4-6 hours**

### Testing:
- Manual tests: 2 hours
- Edge cases: 1 hour
- Bug fixes: 1 hour
- **Total: 4 hours**

### Overall: 8-10 hours (1-2 days)

---

## Migration Checklist

### Before Implementation:
```
□ Backup current codebase
□ Create feature branch
□ Review all documentation
□ Understand current architecture
□ Plan testing approach
```

### During Implementation:
```
□ Phase 1: Connect timer screen
  □ Remove local state
  □ Add useStudyTimer hook
  □ Update handlers
  □ Test sync

□ Phase 2: Consolidate goal
  □ Update SettingsScreen
  □ Update TimerScreen
  □ Add migration code
  □ Test consistency

□ Phase 3: Real heatmap data
  □ Replace dummy data
  □ Add empty state
  □ Test accuracy
```

### After Implementation:
```
□ Run all manual tests
□ Check edge cases
□ Monitor for crashes
□ Gather user feedback
□ Update documentation
```

---

## Quick Commands

```bash
# Development
npm start              # Start dev server
npm run ios            # Run on iOS
npm run android        # Run on Android

# Type checking
npx tsc --noEmit      # Check TypeScript

# Git workflow
git checkout -b feature/timer-integration
git add .
git commit -m "Phase 1: Connect TimerScreen to context"
git push origin feature/timer-integration
```

---

## Storage Keys Reference

```typescript
// Timer state (StudyTimerContext)
"studyapp_timer_state"

// Data (StorageService)
"@study_app/sessions"      // StudySession[]
"@study_app/daily_stats"   // DailyStats[]
"@study_app/settings"      // UserSettings
"@study_app/subjects"      // Subject[]
"@study_app/tasks"         // Task[]

// Legacy (to be removed)
"dailyStudyGoal"           // Old goal storage
"breakDuration"            // Break setting
```

---

## Contact Points

### For Questions:
- Architecture: See `INTEGRATION_PLAN.md`
- Data Flow: See `DATA_FLOW_DIAGRAM.md`
- Code Examples: See `IMPLEMENTATION_GUIDE.md`
- Overview: See `INTEGRATION_SUMMARY.md`

### For Issues:
- Check "Common Issues" in `IMPLEMENTATION_GUIDE.md`
- Review edge cases in test scenarios
- Verify context provider hierarchy
- Confirm storage key consistency

---

**Ready to Start?**

1. Read `IMPLEMENTATION_GUIDE.md` for detailed code changes
2. Follow Phase 1 → Phase 2 → Phase 3 sequence
3. Test thoroughly at each phase
4. Deploy incrementally with monitoring

**Questions?** Refer to detailed documentation files.

---

*Quick Reference v1.0 | 2026-01-19*
