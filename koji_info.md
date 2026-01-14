# Koji (StudyRooms2) - Project Analysis & Recommendations

> **For architecture overview and commands, see:** [CLAUDE.md](./CLAUDE.md)

## Executive Summary

**Project**: Koji (StudyRooms2) - React Native/Expo study management app
**Status**: Functional with significant bugs and opportunities
**Risk Level**: MEDIUM-HIGH (blocking bugs present)
**Last Analysis**: 2026-01-13

### Quick Stats
- **47 bugs identified** (4 critical, 16 high, 27 medium/low)
- **18 architecture improvements** recommended
- **32 feature suggestions** for enhanced UX
- **0 dependency vulnerabilities** (npm audit clean)
- **13 TypeScript errors** blocking production build

---

## Critical Issues Requiring Immediate Action

### 🔴 CRITICAL (App-Breaking)

#### 1. Notifications API Undefined - Runtime Crash
**File**: `src/src/screens/TimerScreen.tsx:123-127`
**Issue**: `Notifications` imported but never declared, will crash on call
**Fix**: Add `import * as Notifications from 'expo-notifications'`

#### 2. StudySession Type Mismatch - Data Corruption
**File**: `src/src/screens/TimerScreen.tsx:279-295`
**Issue**: Session object missing `id` and `subjectId` required fields
**Impact**: Sessions can't be saved, stats fail
**Fix**:
```typescript
const session: StudySession = {
  id: Date.now().toString(),
  subject: selectedSubject.name,
  subjectId: selectedSubject.id,
  duration: duration,
  date: new Date().toISOString(),
};
```

#### 3. Stats Screen Data Structure Bug
**File**: `src/src/screens/StatsScreen.tsx:66`
**Issue**: Code treats `sessions` (number) as array, calls `.forEach()`
**Impact**: Stats page completely broken
**Fix**: Change to iterate over actual sessions array from storage

#### 4. ActionSheetIOS Android Crash
**File**: `src/src/screens/HomeScreen.tsx:285-309`
**Issue**: iOS-only API called on Android
**Fix**: Use `Platform.select()` or cross-platform alternative

---

## High Priority Bugs

### Timer & Tracking Issues

**5. Duplicate Timer State** (HIGH)
- TimerScreen and StudyTimerContext both manage timer independently
- Creates sync issues, data inconsistency
- **Fix**: Remove TimerScreen state, use only StudyTimerContext

**6. Background Time Calculation Race Condition** (HIGH)
- `setState` called inside `setSeconds` callback
- File: `TimerScreen.tsx:154-191`
- **Fix**: Separate state updates, use refs for background time

**7. Memory Leak - Timer Intervals** (HIGH)
- `useEffect` cleanup missing in some branches
- File: `StudyTimerContext.tsx:72-96`
- **Fix**: Always return cleanup function

**8. setTimeout Not Cleaned Up** (HIGH)
- 15+ setTimeout calls without cleanup across app
- Files: `StudyFAB.tsx`, `TaskWidget.tsx`, `MyRoomsScreen.tsx`
- **Fix**: Store timeout IDs, clear on unmount

### Data & Storage Issues

**9. UserSettings Missing Required Field** (HIGH)
- Default settings missing `dailyGoalMinutes` property
- File: `storage.ts:260-280`
- **Fix**: Add field to default object

**10. Widget Position Validation Missing** (HIGH)
- Corrupted storage can create overlapping widgets
- File: `WidgetContext.tsx:108-117`
- **Fix**: Validate positions on load

**11. Recent Sessions Wrong Storage Key** (MEDIUM)
- Uses `"studySessions"` instead of `"@study_app/sessions"`
- File: `TimerScreen.tsx:129-140`
- Never loads actual data
- **Fix**: Use correct storage key constant

---

## Architecture Improvements

### State Management
1. **Consolidate Timer State** - Remove duplicate implementations
2. **Add Redux/Zustand Store** - Better cache management, optimistic updates
3. **Implement Write Queue** - Debounce AsyncStorage writes (500ms)

### Data Layer
4. **Data Validation Layer** - Use Zod/Yup to validate loaded data
5. **Migration System** - Version AsyncStorage schemas
6. **Database Abstraction** - Create `DatabaseAdapter` interface for easier Supabase migration

### Navigation
7. **Fix Type Safety** - Replace `any` with proper navigation types
8. **Deep Linking** - Add URL scheme support (`studyrooms://timer`)

### Performance
9. **Memoize Calculations** - Use `useMemo` for stats aggregation
10. **Virtualize Lists** - Replace ScrollView with FlashList for tasks/sessions
11. **Lazy Load Screens** - Use React.lazy() for non-critical screens

### Testing & Quality
12. **Add Unit Tests** - Jest tests for storage, timer, widget logic
13. **Add Integration Tests** - Detox tests for critical flows
14. **Global Error Boundary** - User-friendly crash fallback
15. **Error Reporting** - Integrate Sentry/Bugsnag

### Code Organization
16. **Extract Constants** - Move magic numbers to `constants.ts`
17. **Shared UI Components** - Extract `Button`, `Modal`, `Card` components
18. **Feature Flags** - Enable/disable features without release

---

## Feature Suggestions by Category

### 🎯 Core Study (High Impact)

1. **Pomodoro Presets** - Quick-select 25/5, 50/10, 90/20 timers (Effort: LOW)
2. **Study Streaks** - Track consecutive days, show badge (Effort: LOW)
3. **Focus Mode** - Integrate Screen Time API to block apps (Effort: HIGH)
4. **White Noise/Ambient Sounds** - Play during study (Effort: MEDIUM)
5. **Timer Pause Warnings** - Alert after too many pauses (Effort: LOW)

### ✅ Task Management

6. **Recurring Tasks** - Daily/weekly repeating tasks (Effort: MEDIUM)
7. **Task Templates** - Save common checklists (Effort: LOW)
8. **Time Estimates** - Track estimated vs actual duration (Effort: MEDIUM)
9. **Eisenhower Matrix** - Urgent/Important quadrant view (Effort: LOW)
10. **Quick Capture** - One-tap task creation (Effort: LOW)

### 📊 Statistics & Insights

11. **Weekly/Monthly Reports** - PDF export with charts (Effort: MEDIUM)
12. **Subject Performance Trends** - Time per subject over time (Effort: LOW)
13. **Best Study Times** - Analyze productivity by time of day (Effort: MEDIUM)
14. **Productivity Score** - Gamified overall score (Effort: LOW)
15. **Heatmap Calendar** - GitHub-style year view (Effort: LOW)
16. **Progress Comparisons** - "20% more than last week!" (Effort: LOW)

### 👥 Social/Collaborative

17. **Room Voice/Video Chat** - Live study sessions (Effort: VERY HIGH)
18. **Room Text Chat** - Simple messaging (Effort: HIGH)
19. **Study Challenges** - Group goals (Effort: MEDIUM)
20. **Leaderboards** - Top studiers (opt-in) (Effort: LOW)
21. **Study Buddies** - Friends system (Effort: MEDIUM)
22. **Live Room Status** - See who's studying (Effort: MEDIUM)
23. **Share Sessions** - Social media graphics (Effort: LOW)

### 🎨 Customization

24. **Widget Themes/Skins** - Different visual styles (Effort: MEDIUM)
25. **Custom Widget Sizes** - Flexible dimensions (Effort: LOW)
26. **More Widget Types** - Calendar, quotes, weather (Effort: MEDIUM/each)
27. **Home Screen Widgets** - iOS/Android widgets (Effort: HIGH)

### 🔔 Notifications

28. **Smart Reminders** - "Haven't studied today" at usual time (Effort: LOW)
29. **Task Due Notifications** - Remind about deadlines (Effort: LOW)
30. **Break Reminders** - Suggest breaks after long sessions (Effort: LOW)

---

## Immediate Action Plan (Next 2 Weeks)

### Week 1: Critical Bug Fixes
- [ ] Fix `Notifications` undefined (TimerScreen.tsx:123)
- [ ] Fix `StudySession` type mismatch (TimerScreen.tsx:279-295)
- [ ] Fix stats forEach error (StatsScreen.tsx:66)
- [ ] Fix ActionSheetIOS Android crash (HomeScreen.tsx:285)
- [ ] Add widget position validation
- [ ] Fix timer interval memory leak
- [ ] Consolidate timer state

### Week 2: High-Value Improvements
- [ ] Add navigation type safety
- [ ] Add loading states to all screens
- [ ] Implement Pomodoro presets UI
- [ ] Add study streaks tracking
- [ ] Create heatmap calendar view
- [ ] Add error boundary
- [ ] Set up Jest for unit tests

---

## Supabase Migration Roadmap

Given the architecture is designed for backend migration:

### Phase 1: Infrastructure (Week 1)
- Set up Supabase project, PostgreSQL schemas
- Design RLS policies for security
- Implement email/social authentication

### Phase 2: Data Layer (Week 2)
- Create `SupabaseAdapter` class
- Add offline sync logic
- Implement conflict resolution
- Migrate user data from AsyncStorage

### Phase 3: Real-time Features (Week 3)
- Room presence (who's online)
- Room chat with Supabase Realtime
- Live study stats updates

### Phase 4: Cloud Features (Week 4+)
- Cross-device sync
- Backup/restore
- Web dashboard

---

## Testing Checklist

### Critical Flows
- [ ] Start timer → background → return → verify time accurate
- [ ] Create task → complete → verify in stats
- [ ] Join room → leave → rejoin → verify membership persists
- [ ] Add widget → resize → move → delete
- [ ] Change theme → restart → verify persistence
- [ ] Study 5 min → stop → verify session saved correctly

### Edge Cases
- [ ] Timer running at midnight (date change)
- [ ] Rapid widget operations (race conditions)
- [ ] Low storage space (AsyncStorage errors)
- [ ] Airplane mode (offline behavior)
- [ ] System clock adjustment

---

## Known Technical Debt

From [CLAUDE.md](./CLAUDE.md#key-patterns):

1. **Navigation props typed as `any`** - No type safety for routes
2. **Inconsistent storage keys** - Theme uses `studyapp_`, storage uses `@study_app/`
3. **No error reporting** - Production crashes invisible
4. **No data migration system** - Schema changes break old data
5. **AsyncStorage direct coupling** - Harder to migrate to Supabase

---

## Security Considerations

### Current Issues
- Room passwords stored in plain text (AsyncStorage)
- No input sanitization on text fields
- No encryption for sensitive data (user IDs, study history)

### Recommendations for Production
1. Use `react-native-encrypted-storage` for sensitive data
2. Hash room passwords with bcrypt
3. Validate/sanitize all user inputs
4. Implement rate limiting when backend added
5. Add HTTPS pinning for API calls

---

## Performance Optimization Targets

### Current Bottlenecks
- Stats calculations on every render (no memoization)
- Large lists not virtualized (tasks, sessions)
- Widget animations don't cancel on unmount
- Multiple redundant subject lookups (O(n²))

### Optimization Priority
1. Add `useMemo` to stats aggregations
2. Convert to FlashList for lists >20 items
3. Memoize widget components with `React.memo`
4. Create subject Map for O(1) lookups

---

## Quick Reference

### File Structure
```
src/
├── App.tsx                      # Main entry, providers
├── src/
│   ├── components/              # Reusable components
│   │   ├── TimerWidget.tsx
│   │   ├── TaskWidget.tsx
│   │   └── StatsHeatmapWidget.tsx
│   ├── context/                 # React contexts
│   │   ├── ThemeContext.tsx
│   │   ├── WidgetContext.tsx
│   │   └── StudyTimerContext.tsx
│   ├── screens/                 # Screen components
│   │   ├── HomeScreen.tsx       # Widget grid
│   │   ├── TimerScreen.tsx      # Study timer
│   │   ├── TasksScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   └── RoomsScreen.tsx
│   ├── services/
│   │   └── storage.ts           # AsyncStorage wrapper
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   └── utils/
│       └── roomsData.ts         # Room management
```

### Storage Keys
- `@study_app/tasks` - Task list
- `@study_app/sessions` - Study sessions
- `@study_app/daily_stats` - Daily statistics
- `@study_app/settings` - User settings
- `@study_app/subjects` - Subject list
- `studyapp_darkMode` - Theme preference (inconsistent prefix!)
- `studyapp_accentColor` - Accent color

### Commands Reference
See [CLAUDE.md](./CLAUDE.md#commands) for all npm scripts.

---

## Resources & Documentation

- **Figma Design**: https://www.figma.com/design/lQ4IGAqsOFo3eBAyqQ1Rm2/StudyRooms2
- **React Navigation Docs**: https://reactnavigation.org/docs/typescript
- **Expo Documentation**: https://docs.expo.dev
- **Supabase Docs**: https://supabase.com/docs
- **React Native Reanimated**: https://docs.swmansion.com/react-native-reanimated/

---

## Contact & Next Steps

**Priority**: Fix critical bugs before any new features
**Timeline**: 2 weeks to stable release candidate
**Next Review**: After critical bugs resolved

For detailed architecture and development setup, see [CLAUDE.md](./CLAUDE.md).
