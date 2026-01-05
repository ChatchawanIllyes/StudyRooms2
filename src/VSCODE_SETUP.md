# 💻 Visual Studio Code Setup Guide

## 🎯 Complete VS Code + React Native Setup

This guide shows you how to open and run this project in Visual Studio Code for the best development experience.

---

## 📥 Step 1: Install VS Code

If you don't have VS Code:
1. Download from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install it
3. Open VS Code

---

## 📂 Step 2: Open Project in VS Code

### Method 1: Drag and Drop
1. Drag the `study-app` folder onto VS Code icon

### Method 2: File Menu
1. Open VS Code
2. File → Open Folder
3. Select the `study-app` folder
4. Click "Open"

### Method 3: Terminal
```bash
cd /path/to/study-app
code .
```

---

## 🔌 Step 3: Install Recommended Extensions

VS Code will show a popup: **"Do you want to install recommended extensions?"**

Click **"Install All"**

### Or Install Manually:

Open Extensions panel (Cmd+Shift+X / Ctrl+Shift+X) and install:

1. **ES7+ React/Redux/React-Native snippets**
   - Publisher: dsznajder
   - Provides React Native code snippets

2. **React Native Tools** (Optional)
   - Publisher: Microsoft
   - Debugging and IntelliSense

3. **Prettier - Code formatter** (Optional)
   - Publisher: Prettier
   - Auto-format code

4. **ESLint** (Optional)
   - Publisher: Microsoft
   - Code linting

---

## 🧹 Step 4: Clean Up Old Files (IMPORTANT!)

**Open the integrated terminal in VS Code:**
- View → Terminal (or Ctrl+`)

**Run cleanup:**

**Mac/Linux:**
```bash
chmod +x cleanup.sh
./cleanup.sh
```

**Windows:**
```bash
cleanup.bat
```

**Or manually delete these folders in VS Code:**
- Right-click on folders in sidebar → Delete:
  - `/components/`
  - `/src/app/`
  - `/supabase/`
  - `/utils/`
  - `/styles/`
  - `/guidelines/`

---

## 📦 Step 5: Install Dependencies

**In VS Code terminal:**
```bash
npm install
```

Wait 2-3 minutes for installation to complete.

---

## 🚀 Step 6: Start the App

**In VS Code terminal:**
```bash
npm start
```

You'll see:
- Metro bundler starting
- QR code in terminal
- "Metro waiting on..." message

**Keep this terminal open!**

---

## 📱 Step 7: Connect Your iPhone

1. Download **Expo Go** from App Store
2. Open Expo Go on iPhone
3. Scan the QR code in VS Code terminal
4. App loads on your phone! 🎉

---

## 🎨 Step 8: Start Developing!

### Edit Files

1. **Open any screen file:**
   - `/src/screens/TimerScreen.tsx`
   - `/src/screens/RoomsScreen.tsx`
   - etc.

2. **Make changes** (try changing text or colors)

3. **Save file** (Cmd+S / Ctrl+S)

4. **Watch it reload on your phone instantly!**

---

## 💡 VS Code Pro Tips

### Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Open File | Cmd+P | Ctrl+P |
| Find in Files | Cmd+Shift+F | Ctrl+Shift+F |
| Terminal | Ctrl+` | Ctrl+` |
| Command Palette | Cmd+Shift+P | Ctrl+Shift+P |
| Quick Fix | Cmd+. | Ctrl+. |

### Split Editor

- Right-click file → "Split Right"
- Edit multiple files side-by-side

### IntelliSense

- Type and see auto-complete suggestions
- Hover over code for documentation
- Cmd+Click to jump to definition

---

## 🗂️ Recommended VS Code Settings

**File → Preferences → Settings** (or Cmd+,)

Add these settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.updateImportsOnFileMove.enabled": "always",
  "emmet.includeLanguages": {
    "typescript": "typescriptreact"
  }
}
```

---

## 📁 Project Explorer Tips

### Important Folders

```
study-app/
├── 📱 App.tsx              # Main entry - start here
│
├── 📁 src/
│   ├── screens/            # ⭐ Edit these files most
│   │   ├── TimerScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── RoomsScreen.tsx
│   │   └── SettingsScreen.tsx
│   │
│   ├── context/
│   │   └── ThemeContext.tsx  # Theme/colors
│   │
│   └── utils/
│       └── roomsData.ts      # Room data
│
└── 📚 Documentation/
```

### Files to Edit Often
- `/src/screens/*.tsx` - Screen components
- `/src/context/ThemeContext.tsx` - Colors and themes

### Files NOT to Edit
- `package.json` - Dependencies (don't manually edit)
- `babel.config.js` - Babel config
- `app.json` - Expo config (advanced)

---

## 🔍 Finding Things Quickly

### Search for Code

1. Cmd+Shift+F (Ctrl+Shift+F)
2. Type search term
3. See results across all files

### Open Any File Fast

1. Cmd+P (Ctrl+P)
2. Type file name
3. Press Enter

### Find and Replace

1. Cmd+F (Ctrl+F) - Find in current file
2. Cmd+H (Ctrl+H) - Find and replace

---

## 🐛 Debugging in VS Code

### View Console Logs

**In VS Code terminal:**
- All `console.log()` statements appear here
- Error messages show up here

**On Phone:**
- Shake phone → "Show Developer Menu"
- Tap "Debug Remote JS"
- Opens Chrome debugger

### Common Error Locations

1. **Terminal** - Build errors, import errors
2. **Problems Panel** - TypeScript errors (Cmd+Shift+M)
3. **Phone Screen** - Runtime errors (red screen)

---

## 🔄 Development Workflow

```
1. Open VS Code
   ↓
2. Open terminal (Ctrl+`)
   ↓
3. Run: npm start
   ↓
4. Scan QR code with phone
   ↓
5. Edit files in /src/screens/
   ↓
6. Save file (Cmd+S)
   ↓
7. Watch it reload on phone!
   ↓
8. Repeat steps 5-7
```

---

## 🎯 Quick Tasks in VS Code

### Create New File

1. Right-click on `/src/screens/` folder
2. "New File"
3. Name it: `MyNewScreen.tsx`
4. Start typing!

### Copy Existing Screen

1. Right-click `TimerScreen.tsx`
2. "Copy"
3. Right-click folder → "Paste"
4. Rename and edit

### Delete File

1. Right-click file
2. "Delete"
3. Confirm

---

## 🎨 Code Snippets

Type these shortcuts in `.tsx` files:

| Shortcut | Creates |
|----------|---------|
| `rnf` | React Native Function Component |
| `rnfe` | Function Component with Export |
| `rnfs` | Function Component with StyleSheet |
| `imp` | Import statement |
| `log` | console.log() |

---

## 📊 Status Bar (Bottom of VS Code)

Shows:
- Current file type (TypeScript)
- Git branch
- Errors/warnings count
- Line/column number

Click on items for quick actions!

---

## 🔧 Terminal Commands Reference

### Essential Commands

```bash
# Start app
npm start

# Clear cache and start
npx expo start -c

# Stop server
Ctrl+C

# Install new package
npm install package-name

# Check Node version
node --version
```

### Open Multiple Terminals

- Click "+" in terminal panel
- Run different commands in each

---

## 🎓 Learning Resources in VS Code

### IntelliSense

- Hover over any code
- See documentation
- See parameter hints

### Go to Definition

- Cmd+Click (Ctrl+Click) any function/component
- Jump to where it's defined

### Find All References

- Right-click on function
- "Find All References"
- See everywhere it's used

---

## 🆘 Common VS Code Issues

### "Cannot find module"
**Fix:** Run `npm install` in terminal

### Terminal not showing
**Fix:** View → Terminal (or Ctrl+`)

### Red squiggly lines everywhere
**Normal!** TypeScript showing type errors. App might still work.

### File changes not reloading
**Fix:** 
1. Save file (Cmd+S)
2. Check terminal is running
3. Shake phone → Reload

---

## 🎉 You're All Set!

Your VS Code is now perfectly configured for React Native development!

### Next Steps:

1. ✅ Start editing `/src/screens/TimerScreen.tsx`
2. ✅ Change some text or colors
3. ✅ Save and watch it reload
4. ✅ Read inline code comments
5. ✅ Experiment and have fun!

---

## 📞 Need More Help?

- **VS Code Docs**: [code.visualstudio.com/docs](https://code.visualstudio.com/docs)
- **React Native Docs**: [reactnative.dev](https://reactnative.dev/)
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev/)

---

**Happy Coding in VS Code! 💻✨**
