# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### 🚫 Installation Issues

#### "npm: command not found"
**Problem**: Node.js not installed

**Solution**:
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install the LTS version
3. Restart terminal
4. Verify: `node --version`

---

#### "Cannot find module 'expo'"
**Problem**: Dependencies not installed

**Solution**:
```bash
npm install
```

If that fails:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

#### "EACCES: permission denied"
**Problem**: Permission issues (Mac/Linux)

**Solution**:
```bash
sudo npm install
```

Or fix npm permissions:
```bash
sudo chown -R $USER ~/.npm
npm install
```

---

### 📱 Connection Issues

#### QR Code Won't Scan
**Problem**: Network issues or wrong camera app

**Solution**:
1. Make sure using Expo Go app (not phone camera)
2. Both devices on same WiFi network
3. Try manual URL entry instead
4. Check if VPN is active (disable it)

---

#### "Network response timed out"
**Problem**: Firewall or network blocking connection

**Solution**:
1. **Allow through firewall**:
   - Windows: Allow Node.js through Windows Firewall
   - Mac: System Preferences → Security → Firewall → Allow Node

2. **Use tunnel mode**:
   ```bash
   npm start -- --tunnel
   ```

3. **Check WiFi**:
   - Both devices on same network
   - Not on guest/public WiFi
   - Disable VPN

---

#### "Could not connect to development server"
**Problem**: Metro bundler not running

**Solution**:
1. Check terminal - server should be running
2. Look for "Metro waiting on..." message
3. If not running, restart: `npm start`

---

### 💥 App Crashes

#### App Crashes on Launch
**Problem**: Build error or incompatible code

**Solution**:
1. Check terminal for error messages
2. Clear cache:
   ```bash
   npx expo start -c
   ```
3. Reload app in Expo Go (shake phone → Reload)

---

#### "Element type is invalid"
**Problem**: Import error or missing component

**Solution**:
1. Check terminal for specific error
2. Verify all files exist
3. Check imports at top of files
4. Restart server: `npm start`

---

#### "Unable to resolve module"
**Problem**: Missing dependency

**Solution**:
```bash
npm install
npx expo start -c
```

---

### 🐌 Performance Issues

#### Very Slow Loading
**Cause**: Normal on first load

**Solutions**:
- **First load**: 1-2 minutes (normal)
- **After changes**: 5-10 seconds (normal)
- **If slower**: Clear cache with `npx expo start -c`

---

#### App Freezes/Laggy
**Problem**: Memory or render issues

**Solution**:
1. Close other apps on phone
2. Restart Expo Go
3. Restart development server
4. Check for infinite loops in code

---

### 🎨 Display Issues

#### Colors Look Wrong
**Problem**: Theme not loading

**Solution**:
1. Go to Settings → Toggle dark mode
2. Choose a new accent color
3. Restart app if needed

---

#### Layout Broken
**Problem**: StyleSheet error

**Solution**:
1. Check terminal for errors
2. Look for typos in style names
3. Verify all `StyleSheet.create({...})` syntax
4. Reload app (shake → Reload)

---

### 💾 Storage Issues

#### Data Not Persisting
**Problem**: AsyncStorage not working

**Solution**:
1. Check if using `await` with AsyncStorage
2. Verify storage operations in code
3. Test with: Shake phone → Debug → Show AsyncStorage

---

#### "Can't store data"
**Problem**: Storage quota or permission

**Solution**:
1. Clear app data in Expo Go
2. Restart Expo Go completely
3. Rebuild and reload

---

### 📦 Build Issues

#### "Expo CLI not found"
**Problem**: Expo not installed globally

**Solution**:
Expo CLI comes with the project, just use:
```bash
npm start
```

No need to install globally!

---

#### "Metro bundler failed to start"
**Problem**: Port conflict

**Solution**:
1. Kill process using port 8081:
   ```bash
   # Mac/Linux
   lsof -ti:8081 | xargs kill

   # Windows
   netstat -ano | findstr :8081
   taskkill /PID [PID_NUMBER] /F
   ```

2. Restart server: `npm start`

---

### 🔍 Debugging Tips

#### How to See Errors
1. **In Terminal**: Check for red error messages
2. **In Expo Go**: Shake phone → look for red error screen
3. **Enable Debug Mode**: Shake phone → Debug Remote JS

#### Clear All Caches
```bash
# Clear npm cache
npm cache clean --force

# Clear Expo cache
npx expo start -c

# Remove and reinstall
rm -rf node_modules
npm install
```

#### Reset Everything
```bash
# Nuclear option - fresh start
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

---

### 📱 Device-Specific Issues

#### iPhone-Specific

**"Unable to download" in Expo Go**
- Clear Expo Go cache
- Reinstall Expo Go
- Restart iPhone

**App won't load**
- Check iOS version (need iOS 13+)
- Update Expo Go to latest version
- Restart phone

---

#### Simulator Issues (Mac)

**Simulator won't open**
```bash
# Ensure Xcode installed
xcode-select --install

# Run iOS simulator
npm run ios
```

**Simulator stuck on splash**
- Cmd+D to open dev menu
- Reload
- Or restart simulator

---

### ⚙️ Development Environment

#### VS Code Issues

**TypeScript errors showing**
- Normal! VS Code shows type errors
- Check terminal for actual runtime errors
- Errors in editor don't stop app from running

**Hot reload not working**
- Save file with Cmd+S / Ctrl+S
- Check if server is running
- Try shaking phone → Reload

---

#### Terminal Issues

**Can't stop server (Ctrl+C not working)**
- Close terminal window
- Or use: Ctrl+Z then `kill %1`

**Multiple terminal windows confusing**
- Only need one terminal running `npm start`
- Can close others

---

### 🆘 Still Stuck?

#### Before Asking for Help:

1. ✅ Check terminal for specific error message
2. ✅ Try clearing cache: `npx expo start -c`
3. ✅ Try fresh install: `rm -rf node_modules && npm install`
4. ✅ Restart everything: phone, terminal, server
5. ✅ Check if both devices on same WiFi

#### Get Help:

1. **Google the exact error message**
2. **Check Expo Forums**: [forums.expo.dev](https://forums.expo.dev/)
3. **Stack Overflow**: Search for "expo react native [your error]"
4. **Expo Discord**: [discord.gg/expo](https://discord.gg/expo)

#### Include When Asking:

- Exact error message from terminal
- What you were trying to do
- Steps to reproduce
- Your OS (Mac/Windows/Linux)
- Node version: `node --version`
- Expo version (from package.json)

---

## Quick Reference

### Most Common Solutions

| Problem | Solution |
|---------|----------|
| Can't connect | Same WiFi, disable VPN |
| Slow loading | Normal first time (1-2 min) |
| App crashes | Clear cache: `npx expo start -c` |
| Module not found | Run `npm install` |
| Port in use | Kill port 8081, restart |
| QR won't scan | Use manual URL entry |

### Essential Commands

```bash
# Fresh start
npm install
npm start

# Clear cache
npx expo start -c

# Reset everything
rm -rf node_modules
npm install
npm start

# Stop server
Ctrl+C
```

### Developer Menu (Shake Phone)

- **Reload**: Refresh app
- **Debug**: Open Chrome debugger
- **Performance Monitor**: Check FPS
- **Element Inspector**: View component hierarchy

---

**Remember**: Most issues are solved by:
1. Clear cache
2. Restart server
3. Reinstall dependencies

Good luck! 🍀
