# 📱 Expo Commands Reference

## Essential Commands

### Start Development Server
```bash
npx expo start
```
This is the main command to start your app. It will:
- Start the Metro bundler
- Show a QR code for Expo Go
- Provide options to open on iOS/Android/Web

### Clear Cache and Start
```bash
npx expo start -c
```
Use this when:
- App won't load properly
- Seeing weird errors
- After updating dependencies
- Things just aren't working right

### Start with Specific Platform

```bash
# Open in iOS Simulator (Mac only, requires Xcode)
npx expo start --ios
# OR
npm run ios

# Open in Android Emulator (requires Android Studio)
npx expo start --android
# OR
npm run android

# Open in web browser
npx expo start --web
# OR
npm run web
```

---

## Installation Commands

### Install All Dependencies
```bash
npm install
```
Use this to install all packages from `package.json`

### Install a New Package (Expo Way)
```bash
npx expo install package-name
```
**Example:**
```bash
npx expo install react-native-maps
```

**Why use `npx expo install` instead of `npm install`?**
- Expo ensures compatible versions for your Expo SDK
- Automatically handles version conflicts
- Recommended for React Native packages

### Install Regular npm Packages
```bash
npm install package-name
```
Use for regular JavaScript packages (non-React Native)

---

## Development Commands

### Doctor (Check for Issues)
```bash
npx expo doctor
```
Checks your project for:
- Incompatible dependencies
- Configuration issues
- Missing packages

### Upgrade Expo SDK
```bash
npx expo upgrade
```
Upgrades to the latest Expo SDK version

### Check Expo Version
```bash
npx expo --version
```

---

## Build Commands

### Development Build
```bash
npx expo prebuild
```
Generates native iOS and Android folders

### Production Build (EAS - Recommended)
```bash
# Install EAS CLI (one time)
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both
eas build --platform all
```

### Submit to App Stores
```bash
# Submit to Apple App Store
eas submit --platform ios

# Submit to Google Play Store
eas submit --platform android
```

---

## Useful Development Options

### Start with Tunnel (for different networks)
```bash
npx expo start --tunnel
```
Use when:
- Phone and computer on different WiFi networks
- Behind firewall
- Corporate network

### Start with LAN
```bash
npx expo start --lan
```
Default mode - both devices must be on same WiFi

### Start in Offline Mode
```bash
npx expo start --offline
```

### Open DevTools
```bash
npx expo start --dev-client
```

---

## Package Management

### List Outdated Packages
```bash
npm outdated
```

### Update All Packages (careful!)
```bash
npm update
```

### Check for Expo Compatibility
```bash
npx expo install --check
```

### Fix Expo Dependencies
```bash
npx expo install --fix
```

---

## Debugging Commands

### Show Metro Bundler Logs
When running `npx expo start`, press:
- `m` - Open menu
- `r` - Reload app
- `d` - Open developer menu on device
- `j` - Open debugger
- `c` - Clear Metro bundler cache
- `?` - Show all commands

### Clear All Caches
```bash
# Clear Metro bundler cache
npx expo start -c

# Clear npm cache
npm cache clean --force

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

---

## Project Management

### Eject from Expo (Advanced)
```bash
npx expo eject
```
**Warning:** Only do this if you need custom native code

### Customize App Config
Edit `app.json` for:
- App name
- Bundle identifier
- Splash screen
- Icon
- Permissions

---

## Quick Reference Table

| Command | What it does |
|---------|--------------|
| `npx expo start` | Start dev server |
| `npx expo start -c` | Start with cache clear |
| `npx expo install pkg` | Install package (Expo way) |
| `npm install` | Install all dependencies |
| `npx expo doctor` | Check for issues |
| `npx expo upgrade` | Upgrade Expo SDK |
| `eas build --platform ios` | Build for iOS |
| `eas build --platform android` | Build for Android |

---

## Common Workflows

### First Time Setup
```bash
npm install
npx expo start
```

### Daily Development
```bash
npx expo start
# Edit code, save, see changes!
```

### When Things Break
```bash
npx expo start -c
# If still broken:
rm -rf node_modules
npm install
npx expo start
```

### Before Committing Code
```bash
npx expo doctor
# Fix any issues shown
```

### Preparing for Production
```bash
npx expo doctor
eas build --platform all
```

---

## npm vs npx vs Expo

### `npm install`
- Installs packages from npm registry
- Updates `package.json` and `package-lock.json`
- Works for all packages

### `npx expo install`
- Installs packages with Expo-compatible versions
- Better for React Native packages
- Prevents version conflicts

### `npx expo start`
- Runs Expo CLI without installing globally
- Always uses latest version
- Recommended way to run Expo commands

---

## Environment-Specific Commands

### Development
```bash
npx expo start --dev
```

### Production Testing
```bash
npx expo start --no-dev --minify
```

---

## Tips & Tricks

1. **Use `npx expo` instead of global install**
   ```bash
   # Don't do this:
   npm install -g expo-cli
   
   # Do this:
   npx expo start
   ```

2. **Clear cache when in doubt**
   ```bash
   npx expo start -c
   ```

3. **Use tunnel mode if QR won't scan**
   ```bash
   npx expo start --tunnel
   ```

4. **Check compatibility before installing**
   ```bash
   npx expo install package-name
   # vs
   npm install package-name
   ```

---

## This Project's Specific Commands

Based on `package.json`:

```json
{
  "scripts": {
    "start": "npx expo start",
    "android": "npx expo start --android",
    "ios": "npx expo start --ios",
    "web": "npx expo start --web"
  }
}
```

So you can also use:
```bash
npm start        # Same as: npx expo start
npm run ios      # Same as: npx expo start --ios
npm run android  # Same as: npx expo start --android
npm run web      # Same as: npx expo start --web
```

---

**Recommended: Use `npx expo` commands directly for clarity! 🎯**
