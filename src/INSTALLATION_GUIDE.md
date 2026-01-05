# 📦 Complete Installation & Preview Guide

## ✅ What You'll Achieve
By the end of this guide, you'll have the Study App running on your iPhone via Expo Go.

---

## 📋 Prerequisites

### On Your Computer:
- ✅ **Node.js** installed ([Download Here](https://nodejs.org/) - get LTS version)
- ✅ **Terminal/Command Line** access
- ✅ **Code Editor** (VS Code, optional but recommended)

### On Your iPhone:
- ✅ **Expo Go** app ([Download from App Store](https://apps.apple.com/app/expo-go/id982107779))
- ✅ **Same WiFi network** as your computer

---

## 🚀 Step-by-Step Installation

### Step 1: Download/Clone This Project
If you haven't already, get this project folder on your computer.

### Step 2: Open Terminal in Project Folder

**On Mac:**
1. Open Finder
2. Navigate to project folder
3. Right-click → "New Terminal at Folder"

**On Windows:**
1. Open File Explorer
2. Navigate to project folder
3. Type `cmd` in address bar and press Enter

**Or use Terminal/Command Prompt:**
```bash
cd /path/to/study-app
```

### Step 3: Verify Node.js Installation
```bash
node --version
```
Should show: `v16.0.0` or higher

If not installed, download from [nodejs.org](https://nodejs.org/)

### Step 4: Install Project Dependencies
```bash
npm install
```

**What's happening:**
- Downloads all required packages (~300MB)
- Takes 2-5 minutes depending on internet speed
- Creates a `node_modules` folder

**Expected output:**
```
added 1200+ packages in 3m
```

### Step 5: Start Development Server
```bash
npm start
```

**What you'll see:**
```
› Metro waiting on exp://192.168.1.5:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

┌──────────────────────────────────────┐
│                                      │
│   ████ ████       ████ ████         │
│   ████ ████       ████ ████         │
│   ████ ████       ████ ████         │
│                                      │
└──────────────────────────────────────┘
```

**🎉 The server is now running!**

### Step 6: Open App on Your iPhone

#### Method 1: Scan QR Code (Recommended)
1. Open **Expo Go** app on iPhone
2. Tap **"Scan QR Code"** button
3. Point camera at QR code in terminal
4. App loads automatically!

#### Method 2: Manual URL Entry
1. Look for the URL in terminal (e.g., `exp://192.168.1.5:8081`)
2. Open **Expo Go** on iPhone
3. Tap **"Enter URL manually"**
4. Type the URL
5. Tap **"Connect"**

### Step 7: Wait for Build
**First time only:**
- Takes 1-2 minutes to build JavaScript bundle
- Shows progress bar in Expo Go
- Subsequent loads are faster (5-10 seconds)

### Step 8: App Launches! 🎊
You should now see the Study App running on your iPhone!

---

## 🎯 What to Do Now

### Explore the App
- **Study Tab**: Try the timer, check stats, add tasks
- **Rooms Tab**: Browse and join study rooms
- **Settings Tab**: Toggle dark mode, change accent color

### Make Changes (Optional)
1. Open project in VS Code (or any editor)
2. Edit any file in `/src/screens/`
3. Save the file
4. Watch it reload automatically on your phone!

---

## 🐛 Troubleshooting

### "Cannot find module 'expo'"
**Problem**: Dependencies not installed
**Solution**:
```bash
npm install
```

### QR Code Not Working
**Problem**: Phone and computer on different networks
**Solution**:
- Connect both to same WiFi
- Try manual URL method instead
- Disable VPN if active

### "Network response timed out"
**Problem**: Firewall blocking connection
**Solution**:
- Temporarily disable firewall
- Allow Node.js through firewall
- Use manual URL with your computer's IP

### "Something went wrong"
**Solution**:
1. Close Expo Go completely
2. In terminal: `Ctrl+C` (stops server)
3. Run `npm start` again
4. Reopen in Expo Go

### Metro Bundler Failed
**Solution**:
```bash
# Clear cache and restart
npx expo start -c
```

### App Crashes Immediately
**Solution**:
1. Check terminal for error messages
2. Make sure all dependencies installed
3. Try:
```bash
rm -rf node_modules
npm install
npm start
```

### Slow Loading
**Normal on first load!**
- First build: 1-2 minutes
- Subsequent loads: 5-10 seconds
- After code changes: 2-5 seconds

---

## 📱 Development Workflow

### Daily Usage
1. Open terminal in project folder
2. Run `npm start`
3. Open Expo Go on phone
4. Scan QR code (or select from recent projects)
5. Develop and test!

### Stopping the Server
- Press `Ctrl+C` in terminal
- Or just close the terminal window

### Restarting
- Run `npm start` again
- App remembers your recent projects in Expo Go

---

## 🔧 Advanced Options

### Clear Cache and Restart
```bash
npm start -- --clear
```

### Run on iOS Simulator (Mac only)
```bash
npm run ios
```
*Requires Xcode installed*

### Run on Android Emulator
```bash
npm run android
```
*Requires Android Studio*

### View in Web Browser
```bash
npm run web
```
*May have limited functionality*

---

## 📊 Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run ios` | Open in iOS Simulator (Mac) |
| `npm run android` | Open in Android Emulator |
| `npm run web` | Open in web browser |
| `npm install` | Install dependencies |

---

## 🎨 Customization Tips

### Change Accent Color
1. Open app on phone
2. Go to Settings tab
3. Tap "Accent Color"
4. Choose your favorite!

### Toggle Dark Mode
1. Go to Settings tab
2. Toggle "Dark Mode" switch
3. Instantly switches theme!

### Edit Screens
**Timer Screen**:
```
/src/screens/TimerScreen.tsx
```

**Study Rooms**:
```
/src/screens/RoomsScreen.tsx
```

**Settings**:
```
/src/screens/SettingsScreen.tsx
```

---

## 📚 Additional Resources

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev/)
- **React Native Docs**: [reactnative.dev](https://reactnative.dev/)
- **React Navigation**: [reactnavigation.org](https://reactnavigation.org/)

---

## ✨ Success Checklist

- [ ] Node.js installed
- [ ] Expo Go installed on iPhone
- [ ] Project downloaded
- [ ] Dependencies installed (`npm install`)
- [ ] Server started (`npm start`)
- [ ] QR code scanned
- [ ] App running on iPhone
- [ ] Hot reload working (make a change and see it update)

**All checked? You're ready to develop! 🎉**

---

## 💡 Pro Tips

1. **Keep Terminal Open**: Server must run for app to work
2. **Shake Phone**: Opens developer menu in Expo Go
3. **Hot Reload**: Saves time - changes appear instantly
4. **Error Messages**: Check terminal for detailed error info
5. **Reload App**: Shake phone → "Reload"

---

## 🆘 Still Having Issues?

1. Read `QUICKSTART.md` for quick reference
2. Check `CONVERSION_SUMMARY.md` for technical details
3. Search [Expo Forums](https://forums.expo.dev/)
4. Check terminal output for specific error messages

---

**Happy Coding! 📱✨**
