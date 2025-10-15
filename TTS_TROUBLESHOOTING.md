# 🔧 TTS Troubleshooting Guide

## Issues Fixed in This Update

### 1. **TTS Language Compatibility**
- **Problem**: TTS not working with Chinese characters
- **Solution**: Added multiple language code fallbacks (`zh-CN`, `zh_CN`, `cmn-CN`, `zh`)
- **Result**: Better compatibility across different Android devices

### 2. **Menu/Settings Button Positioning**
- **Problem**: Buttons positioned too high, hidden behind status bar
- **Solution**: Added safe area CSS properties and dynamic positioning
- **Result**: Buttons now respect device safe areas and status bar

## 📱 Testing the Fixes

### Build and Test New APK:
```bash
# Sync changes
npm run sync

# Open Android Studio
npm run android

# In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK
```

### TTS Testing Steps:
1. **Install the new APK** on your device
2. **Start the game** and try the audio pronunciation
3. **Check device TTS settings**:
   - Go to Settings → Accessibility → Text-to-speech output
   - Ensure "Google Text-to-speech Engine" is selected
   - Check if Chinese language data is installed
   - If not, tap "Install voice data" and select Chinese

### Menu Position Testing:
1. **Check the top menu** - buttons should be below the status bar
2. **Test on different orientations** - landscape and portrait
3. **Test on different devices** - phones with notches, different screen sizes

## 🐛 If TTS Still Doesn't Work

### Check Device Settings:
1. **TTS Engine**: Settings → Accessibility → Text-to-speech output
2. **Language Data**: Ensure Chinese (Mandarin) is installed
3. **Voice Quality**: Try different voice options if available

### Check App Logs:
1. **Connect device** to computer via USB
2. **Enable USB Debugging** in Developer Options
3. **Run**: `adb logcat | grep -i tts` to see TTS errors
4. **Look for**: Language code errors or permission issues

### Manual TTS Test:
1. **Open device Settings** → Accessibility → Text-to-speech output
2. **Tap "Listen to an example"**
3. **If this works**, the issue is in the app
4. **If this doesn't work**, the issue is device TTS setup

## 🔄 Alternative TTS Solutions

If the current TTS still doesn't work, we can implement:

### Option 1: Web TTS Fallback
```javascript
// Fallback to web TTS if native fails
if (window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    speechSynthesis.speak(utterance);
}
```

### Option 2: Google Cloud TTS
- Requires internet connection
- Higher quality but needs API key
- More reliable across devices

### Option 3: Pre-recorded Audio
- Record Chinese pronunciations
- Bundle with app
- Always works but larger app size

## 📞 Getting Help

If issues persist:
1. **Check the console logs** in Android Studio
2. **Test on different devices** to isolate device-specific issues
3. **Try the web version** in mobile browser to compare
4. **Report specific error messages** from the logs

## ✅ Success Indicators

The fixes are working if:
- ✅ Chinese characters are pronounced correctly
- ✅ Menu buttons are visible and accessible
- ✅ No error messages in console
- ✅ TTS works consistently across app features
