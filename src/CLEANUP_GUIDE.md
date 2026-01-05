# 🧹 Project Cleanup Instructions

## ⚠️ IMPORTANT: Manual Cleanup Required

This project has leftover web-based files that need to be deleted. Follow these steps to clean up:

## 📂 Folders to DELETE (Entire folders)

Delete these entire directories and everything inside:

1. **`/components/`** - Old web UI components (not needed)
2. **`/src/app/`** - Old web app structure (not needed) 
3. **`/supabase/`** - Backend files (not needed for basic app)
4. **`/utils/supabase/`** - Supabase utilities (not needed)
5. **`/styles/`** - Old CSS files (not needed)
6. **`/guidelines/`** - Old guidelines (optional to keep)

## 📄 Files to DELETE

Delete these individual files:

- `/ATTRIBUTIONS.md` (optional, can keep if needed)

## ✅ Folders to KEEP (Essential!)

**DO NOT DELETE these:**

- `/src/context/` - Theme management ✅
- `/src/screens/` - All app screens ✅  
- `/src/utils/` - Room data utilities ✅

## ✅ Files to KEEP (Essential!)

**DO NOT DELETE these:**

- `/App.tsx` - Main app entry ✅
- `/index.js` - Expo registration ✅
- `/package.json` - Dependencies ✅
- `/app.json` - Expo config ✅
- `/babel.config.js` - Babel config ✅
- `/tsconfig.json` - TypeScript config ✅
- `/.gitignore` - Git ignore ✅
- All `/README` and documentation `.md` files ✅

---

## 🛠️ Manual Cleanup Steps

### Step 1: Delete Old Web Components

```bash
# On Mac/Linux:
rm -rf components/
rm -rf src/app/
rm -rf supabase/
rm -rf utils/supabase/
rm -rf styles/
rm -rf guidelines/

# On Windows (PowerShell):
Remove-Item -Recurse -Force components/
Remove-Item -Recurse -Force src/app/
Remove-Item -Recurse -Force supabase/
Remove-Item -Recurse -Force utils/supabase/
Remove-Item -Recurse -Force styles/
Remove-Item -Recurse -Force guidelines/
```

### Step 2: Verify Clean Structure

After cleanup, your project should look like this:

```
study-app/
├── App.tsx                    ✅ Main app
├── index.js                   ✅ Expo entry
├── package.json               ✅ Dependencies
├── app.json                   ✅ Expo config
├── babel.config.js            ✅ Babel
├── tsconfig.json              ✅ TypeScript
├── .gitignore                 ✅ Git
│
├── src/
│   ├── context/
│   │   └── ThemeContext.tsx   ✅ Theme
│   ├── screens/
│   │   ├── StudyNavigator.tsx ✅
│   │   ├── TimerScreen.tsx    ✅
│   │   ├── StatsScreen.tsx    ✅
│   │   ├── TasksScreen.tsx    ✅
│   │   ├── RoomsScreen.tsx    ✅
│   │   └── SettingsScreen.tsx ✅
│   └── utils/
│       └── roomsData.ts       ✅
│
└── Documentation/
    ├── README.md
    ├── QUICKSTART.md
    └── ...other .md files
```

### Step 3: Fresh Install

```bash
# Remove old dependencies
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Start the app
npm start
```

---

## 🎯 After Cleanup

Once cleaned up, you'll have a **pure React Native Expo app** with:

- ✅ Zero web dependencies
- ✅ Zero Vite/PostCSS files
- ✅ Only React Native components
- ✅ Clean project structure
- ✅ Ready for mobile development

---

## 🚀 Quick Test After Cleanup

1. Delete the folders listed above
2. Run: `npm install`
3. Run: `npm start`
4. Scan QR code with Expo Go
5. App should load perfectly on your phone!

---

## ❓ Why Delete These?

- **`/components/ui/`** - Web UI components (Radix, Tailwind) don't work in React Native
- **`/supabase/`** - Backend/server code not needed for basic mobile app
- **`/styles/`** - CSS files don't work in React Native (using StyleSheet instead)
- **`/src/app/`** - Old web app structure replaced by new `/src/screens/`

---

## 🆘 If Something Breaks

If the app won't start after cleanup:

1. Make sure you kept all files in `/src/screens/`, `/src/context/`, `/src/utils/`
2. Make sure `/App.tsx` and `/index.js` exist
3. Run: `rm -rf node_modules && npm install`
4. Run: `npm start`

---

**After cleanup, your project will be 100% clean React Native Expo! 🎉**
