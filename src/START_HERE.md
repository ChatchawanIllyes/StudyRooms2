# 🚀 COMPLETE SETUP GUIDE - Start to Finish

## ⚡ Super Quick Start (3 Steps)

### Option A: Automated Cleanup (Recommended)

**Mac/Linux:**
```bash
chmod +x cleanup.sh
./cleanup.sh
npm install
npx expo start
```

**Windows:**
```bash
cleanup.bat
npm install
npx expo start
```

### Option B: Manual Cleanup

**Mac/Linux:**
```bash
rm -rf components/ src/app/ supabase/ utils/ styles/ guidelines/
npm install
npx expo start
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force components/,src/app/,supabase/,utils/,styles/,guidelines/
npm install
npx expo start
```

---

## 📱 Complete Step-by-Step

### Step 1: Clean Up Old Web Files

This project was converted from web to React Native. We need to delete old web files first.

**Run the cleanup script:**

**On Mac/Linux:**
```bash
chmod +x cleanup.sh
./cleanup.sh
```

**On Windows:**
- Double-click `cleanup.bat`
- OR run in Command Prompt: `cleanup.bat`

**Or manually delete these folders:**
- `/components/` (old web UI)
- `/src/app/` (old web structure)
- `/supabase/` (not needed)
- `/utils/` (old utilities)
- `/styles/` (CSS files)
- `/guidelines/` (optional)

### Step 2: Install Dependencies

```bash
npm install
```

**This will take 2-3 minutes.** ☕

### Step 3: Start the App

```bash
npx expo start
```

**You'll see a QR code in your terminal!**

### Step 4: Open on Your iPhone

1. Download **"Expo Go"** from App Store
2. Open Expo Go
3. Tap **"Scan QR Code"**
4. Point at the QR code in terminal
5. **App loads on your phone!** 🎉

---

## 📂 Clean Project Structure

After cleanup, your project will look like this:

```
study-app/
├── 📱 App.tsx                 # Main entry
├── 📱 index.js                # Expo entry
├── 📦 package.json            # Dependencies
├── ⚙️ app.json                # Expo config
├── 🔧 babel.config.js
├── 🔧 tsconfig.json
│
├── 📁 src/
│   ├── context/
│   │   └── ThemeContext.tsx
│   ├── screens/
│   │   ├── TimerScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── RoomsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── StudyNavigator.tsx
│   └── utils/
│       └── roomsData.ts
│
└── 📚 Documentation/
    ├── README.md
    ├── QUICKSTART.md
    └── ...
```

---

## ✅ Verification Checklist

After running cleanup and install:

- [ ] `/components/` folder deleted
- [ ] `/src/app/` folder deleted  
- [ ] `/supabase/` folder deleted
- [ ] `/src/screens/` folder EXISTS (important!)
- [ ] `node_modules/` folder created
- [ ] `npx expo start` runs without errors
- [ ] QR code appears in terminal
- [ ] Expo Go installed on phone
- [ ] App loads on phone

---

## 🎯 What You Get

A **100% native iOS app** with:

- ⏱️ **Timer** - Focus/Break sessions
- 📊 **Stats** - Study tracking
- ✅ **Tasks** - Task management
- 👥 **Rooms** - Study rooms (join/create)
- 🌗 **Dark Mode** - Theme switching
- 🎨 **9 Colors** - Accent customization

---

## 🐛 Common Issues After Cleanup

### "Cannot find module '@/components/...'"
**Fix:** You forgot to delete old files. Run cleanup script again.

### "Metro bundler failed"
**Fix:**
```bash
npx expo start -c
```

### "Module not found: expo"
**Fix:**
```bash
rm -rf node_modules
npm install
```

---

## 🔄 Development Workflow

```
1. Open VS Code in project folder
   ↓
2. Run: npx expo start
   ↓
3. Scan QR code with Expo Go
   ↓
4. Edit files in /src/screens/
   ↓
5. Save (Cmd+S) and watch it reload!
```

---

## 💡 Pro Tips

1. **Keep terminal open** - Server must run for app to work
2. **Hot reload** - Changes appear instantly after saving
3. **Shake phone** - Opens developer menu
4. **Error messages** - Check terminal for details

---

## 📚 Next Steps

After successful setup:

1. ✅ Explore the app on your phone
2. ✅ Try dark mode in Settings
3. ✅ Change accent colors
4. ✅ Edit code in `/src/screens/` and see changes
5. ✅ Read full documentation in `README.md`

---

## 🆘 Still Having Issues?

1. Make sure you ran cleanup first
2. Delete `node_modules` and run `npm install` again
3. Try: `npx expo start -c` (clears cache)
4. Check `TROUBLESHOOTING.md`
5. Make sure phone and computer on same WiFi

---

## ⚡ TL;DR (Too Long, Didn't Read)

```bash
# Mac/Linux
./cleanup.sh && npm install && npx expo start

# Windows
cleanup.bat
npm install
npx expo start

# Then scan QR code with Expo Go on iPhone
```

**That's it! 🎉**

---

**Your iOS study app is ready to use! 📱✨**