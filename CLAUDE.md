# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StudyRooms2 is a React Native/Expo study management app with timer, task tracking, statistics, and collaborative "rooms" features. Uses AsyncStorage for local persistence (designed for easy Supabase migration).

## Commands

```bash
# Install dependencies
npm install

# Development
npm start           # Start Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS
npm run web         # Run in browser

# Type checking
npx tsc --noEmit
```

## Architecture

### Entry Points
- `index.js` → registers `src/App.tsx`
- `src/App.tsx` → wraps app in providers (Theme, Widget, StudyTimer) and sets up bottom tab navigation

### Navigation Structure
```
Tab.Navigator (Focus | Rooms | Settings)
├── Focus → FocusNavigator (stack)
│   ├── HomeScreen (widget grid)
│   ├── TimerScreen, TasksScreen, StatsScreen
│   ├── MyWidgetsScreen, PlaceWidgetScreen
│   └── WidgetMarketplaceScreen
├── Rooms → RoomsNavigator (stack)
│   ├── MyRoomsScreen
│   ├── JoinRoomScreen, CreateRoomScreen
│   └── RoomsScreen (active room view)
└── Settings → SettingsScreen
```

### State Management
Three React Contexts in `src/src/context/`:
- **ThemeContext**: Dark mode, accent color (persists to AsyncStorage)
- **WidgetContext**: Widget grid layout, positions, sizes (4-column grid system)
- **StudyTimerContext**: Global timer state, elapsed time tracking across app

### Data Layer
`src/src/services/storage.ts` - All AsyncStorage operations with typed interfaces:
- Tasks, StudySession, DailyStats, UserSettings, Subjects
- Storage keys prefixed with `@study_app/`
- Auto-cleanup of sessions older than 90 days

### Type Definitions
`src/src/types/index.ts` - Shared interfaces: Subject, StudySession, Task, SubTask, DailyStats, UserSettings

### Widget System
HomeScreen uses a 4-column grid where widgets can span multiple cells:
- Widget types: `timer`, `tasks`, `stats`, `stats-heatmap`
- Sizes: `small` (1x1), `medium` (2x1), `large` (2x2)
- Components in `src/src/components/`: TimerWidget, TaskWidget, StatsHeatmapWidget, WidgetTile

### Rooms Feature
Collaborative study rooms stored locally via `src/src/utils/roomsData.ts`:
- Room data includes: id, name, subject, participants, isPublic, password
- Rooms can be public or password-protected

## Key Patterns

- Navigation props typed as `any` throughout (known tech debt)
- Reanimated must be imported before other RN imports in App.tsx
- All async storage operations wrapped in try-catch with console.error fallback
- Timer uses AppState listener to track time when app is backgrounded
