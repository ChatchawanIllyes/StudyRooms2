# 📱 First Time Setup - Study App

## What You Need

1. **On Your Computer:**
   - Node.js installed (download from [nodejs.org](https://nodejs.org))
   - This project folder
   - Terminal/Command Prompt

2. **On Your iPhone:**
   - "Expo Go" app (free download from App Store)

## Setup Instructions

### 1. Open Terminal
- **Mac**: Open "Terminal" app
- **Windows**: Open "Command Prompt" or "PowerShell"  
- **Navigate to this project folder**:
  ```bash
  cd path/to/study-app
  ```

### 2. Install Everything
Run this command (only needed once):
```bash
npm install
```

**This will take 2-3 minutes.** It's downloading all the required packages.

### 3. Start the Development Server
```bash
npm start
```

You'll see:
- A QR code
- Some text with URLs
- "Metro waiting on..." message

**Leave this terminal window open!**

### 4. Connect Your iPhone

**Option A: Scan QR Code (Easiest)**
1. Open "Expo Go" on your iPhone
2. Tap "Scan QR Code"
3. Point camera at the QR code in your terminal
4. App loads automatically!

**Option B: Manual URL**
1. Open "Expo Go" on your iPhone
2. Look for the URL in terminal (starts with `exp://`)
3. Type it into Expo Go

### 5. You're Done! 🎉

The app is now running on your iPhone. Any code changes you make will automatically reload on your phone.

## Common Issues & Solutions

### "Cannot find module..."
**Solution**: Run `npm install` again

### "Network response timed out"
**Solution**: Make sure your iPhone and computer are on the same WiFi network

### QR code doesn't work
**Solution**: 
1. Check both devices are on same WiFi
2. Try the manual URL option instead
3. Restart the development server (`npm start`)

### App crashes or won't load
**Solution**:
1. Close Expo Go completely on your phone
2. In terminal, press `Ctrl+C` to stop the server
3. Run `npm start` again
4. Reopen app in Expo Go

## File Structure

```
study-app/
├── App.tsx              ← Main app file
├── src/
│   ├── screens/         ← All app screens
│   ├── context/         ← Theme/state management
│   └── utils/           ← Helper functions
├── package.json         ← Dependencies list
└── app.json            ← Expo configuration
```

## Making Changes

1. Open any file in `/src/screens/` with your code editor
2. Make changes and save
3. App automatically reloads on your phone
4. See your changes instantly!

## Need More Help?

- Read `QUICKSTART.md` for basic commands
- Read `README.md` for full documentation
- Visit [Expo Docs](https://docs.expo.dev/) for detailed guides

---

**Pro Tip**: Keep the terminal window open while developing. The app needs the development server running to work!
