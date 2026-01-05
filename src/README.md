# Study App - React Native iOS App

A modern, minimalist iOS-first study app with deep focus features, social accountability through study rooms, and beautiful iOS design principles.

## ⚠️ IMPORTANT: First-Time Import & Cleanup

**Before using this project, you MUST run the cleanup script once to remove old web files.**

### 📥 Quick Import to Your Codebase

**See [IMPORT_INSTRUCTIONS.md](IMPORT_INSTRUCTIONS.md) for complete details.**

**Quick version:**

```bash
# 1. Run cleanup (ONE TIME - removes old web files)
./INSTANT_CLEANUP.sh        # Mac/Linux
# OR
INSTANT_CLEANUP.bat         # Windows

# 2. Install dependencies
npm install

# 3. Start the app
npx expo start

# 4. Scan QR code with Expo Go on your iPhone!
```

**After cleanup, you'll have a 100% clean React Native project with ZERO web dependencies!**

📖 **Full guide:** [IMPORT_INSTRUCTIONS.md](IMPORT_INSTRUCTIONS.md)

---

## Features

- ⏱️ **Timer** - Focus and break timer with session tracking
- 📊 **Stats** - Track your daily, weekly, and monthly study progress
- ✅ **Tasks** - Manage your study tasks efficiently
- 👥 **Study Rooms** - Join or create study rooms with up to 50 members
- 🎨 **Customizable** - Dark mode and accent color customization
- 💾 **Persistent Storage** - All data saved locally with AsyncStorage

## Quick Start

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Expo Go app on your iPhone (download from App Store)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npx expo start
   ```

3. **Preview on your iPhone:**
   - Open the Expo Go app on your iPhone
   - Scan the QR code shown in your terminal
   - The app will load automatically on your phone!

### Alternative Start Commands

- `npm run ios` - Open in iOS Simulator (requires macOS with Xcode)
- `npm run android` - Open in Android Emulator
- `npm run web` - Open in web browser

## Project Structure

```
study-app/
├── App.tsx                 # Main app entry point with navigation
├── src/
│   ├── context/
│   │   └── ThemeContext.tsx   # Theme and color management
│   ├── screens/
│   │   ├── StudyNavigator.tsx # Study tab navigation (Timer/Stats/Tasks)
│   │   ├── TimerScreen.tsx    # Focus timer screen
│   │   ├── StatsScreen.tsx    # Statistics screen
│   │   ├── TasksScreen.tsx    # Tasks management screen
│   │   ├── RoomsScreen.tsx    # Study rooms screen
│   │   └── SettingsScreen.tsx # Settings screen
│   └── utils/
│       └── roomsData.ts       # Room data and utilities
├── package.json
└── app.json               # Expo configuration
```

## Key Technologies

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation system
- **AsyncStorage** - Local data persistence
- **React Native Reanimated** - Smooth animations
- **Ionicons** - iOS-style icons

## Design Principles

- Clean iOS-style typography (SF Pro)
- Soft neutral colors with accent color customization
- Rounded corners (12-16px)
- Subtle shadows and blur effects
- Smooth 60fps animations
- Native iOS components and interactions

## Study Rooms Features

- Maximum 50 members per room
- Public and private rooms (password-protected)
- 29 educational categories
- Room descriptions and metadata
- Real-time member status
- Persistent room memberships

## Development

The app uses React Native StyleSheet for styling and follows iOS design guidelines. All animations are implemented using React Native Reanimated for optimal performance.

### Customization

You can customize the accent color in Settings. The app supports:
- Sky Blue (default)
- Green
- Orange
- Purple
- Pink
- Teal
- Indigo
- Red
- Yellow

## Building for Production

To build a standalone app:

```bash
# iOS
expo build:ios

# Android
expo build:android
```

For more information, visit [Expo Documentation](https://docs.expo.dev/).

## License

MIT License - Feel free to use this project for your own purposes.