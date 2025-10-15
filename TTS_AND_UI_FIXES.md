# 🔧 TTS and UI Positioning Fixes

## Issues Fixed

### 1. **TTS Language Detection and Installation Prompt**
- **Problem**: TTS was defaulting to English instead of prompting for Chinese language installation
- **Solution**: Enhanced the `TTSHelperPlugin.java` with new methods:
  - `checkChineseTTSAvailable()`: Checks if Chinese TTS is installed
  - `promptChineseTTSInstall()`: Prompts user to install Chinese TTS if not available
- **Result**: App now properly detects Chinese TTS availability and prompts user to install if needed

### 2. **UI Positioning Issues**
- **Problem**: Top menu and settings buttons were positioned too high, overlapping with native navigation bar
- **Solution**: Updated CSS to use proper `env(safe-area-inset-*)` values instead of custom CSS variables
- **Result**: All UI elements now properly respect device safe areas and avoid native UI overlap

## Files Modified

### Android Java Files:
- `android/app/src/main/java/com/hskchinese/game/plugins/TTSHelperPlugin.java`
  - Added Chinese TTS availability checking
  - Added user-friendly installation prompts
  - Enhanced error handling and logging

### JavaScript Files:
- `www/tts-helper.js`
  - Updated plugin interface (removed TypeScript interface for JS compatibility)
- `www/capacitor.js`
  - Enhanced TTS function to check Chinese TTS availability before attempting to speak
  - Added user confirmation dialog for TTS installation

### CSS Files:
- `www/styles.css`
  - Updated all positioning to use `env(safe-area-inset-*)` instead of custom variables
  - Fixed score bar, menu controls, mobile menu toggle, and modal positioning
  - Enhanced mobile-specific positioning rules

## Testing Instructions

### 1. Build and Deploy:
```bash
# Sync changes to Android
npm run sync

# Open Android Studio
npm run android

# Build APK in Android Studio: Build → Build Bundle(s) / APK(s) → Build APK
```

### 2. TTS Testing:
1. **Install the new APK** on your device
2. **Start the game** and try the audio pronunciation
3. **Expected behavior**:
   - If Chinese TTS is installed: Should work normally
   - If Chinese TTS is NOT installed: Should show a dialog asking to install Chinese TTS
   - Clicking "OK" should open Android TTS settings
   - In TTS settings, install Chinese language data if prompted

### 3. UI Positioning Testing:
1. **Check the top menu** - buttons should be below the status bar
2. **Test on different orientations** - landscape and portrait
3. **Test on different devices** - phones with notches, different screen sizes
4. **Check settings modal** - should not overlap with status bar

### 4. Manual TTS Testing:
You can also test TTS functionality manually using the browser console:
```javascript
// Test Chinese TTS availability
window.testTTS('你好');

// Test TTS settings helper
window.testTTSSettings();

// Check available TTS languages
window.checkTTSLanguages();
```

## Troubleshooting

### If TTS Still Doesn't Work:
1. **Check device TTS settings**:
   - Go to Settings → Accessibility → Text-to-speech output
   - Ensure "Google Text-to-speech Engine" is selected
   - Check if Chinese language data is installed
   - If not, tap "Install voice data" and select Chinese

2. **Check app logs**:
   - Connect device via USB
   - Enable USB Debugging in Developer Options
   - Run: `adb logcat | grep -i tts` to see TTS errors
   - Look for language code errors or permission issues

### If UI Still Overlaps:
1. **Check viewport meta tag** - should include `viewport-fit=cover`
2. **Test on different devices** - some devices may have different safe area values
3. **Check browser developer tools** - inspect safe area values in mobile view

## Technical Details

### TTS Implementation:
- Uses Android's `TextToSpeech.isLanguageAvailable()` to check Chinese support
- Provides user-friendly error messages and installation prompts
- Falls back gracefully if TTS checking fails

### UI Positioning:
- Uses CSS `env(safe-area-inset-*)` for proper safe area support
- Applies to all major UI elements: score bar, menu controls, modals
- Includes mobile-specific overrides for better compatibility

## Next Steps

After testing, if issues persist:
1. Check device-specific TTS engine compatibility
2. Verify safe area values on specific device models
3. Consider adding device-specific CSS overrides if needed
