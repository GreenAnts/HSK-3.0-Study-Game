# HSK 3.0 Chinese Vocabulary Game - Mobile App

This is the mobile version of the HSK 3.0 Chinese Vocabulary Game, built with Capacitor for cross-platform deployment to Android and iOS.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation
```bash
# Install dependencies
npm install

# Sync the project
npm run sync
```

## 📱 Building for Mobile

### Android
```bash
# Open Android Studio
npm run android

# Or build directly
npx cap build android
```

### iOS (macOS only)
```bash
# Open Xcode
npm run ios

# Or build directly
npx cap build ios
```

## 🛠️ Development

### Local Development Server
```bash
# Start development server
npm run serve
```

### Sync Changes
After making changes to the web assets:
```bash
npm run sync
```

## 📁 Project Structure

```
Game-Mobile/
├── www/                    # Web assets
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Game styles
│   ├── scripts.js         # Game logic (adapted for mobile)
│   ├── capacitor.js       # Capacitor-specific code
│   ├── manifest.json      # PWA manifest
│   ├── Mascot/           # Mascot animations
│   ├── Music/            # Background music
│   ├── Sounds/           # Sound effects
│   ├── Sprites/          # Click animations
│   └── wordlists/        # HSK word data
├── android/              # Android native project
├── ios/                  # iOS native project
├── capacitor.config.json # Capacitor configuration
└── package.json          # Dependencies and scripts
```

## 🔧 Key Mobile Adaptations

### Text-to-Speech (TTS)
- **Web**: Uses Google Translate TTS API
- **Mobile**: Uses device's native TTS engine via Capacitor
- **Quality**: High-quality Chinese pronunciation on both platforms

### Storage
- **Web**: Uses localStorage
- **Mobile**: Uses Capacitor Preferences plugin
- **Features**: Persistent game state and settings across app restarts

### Responsive Design
- Optimized for mobile screens
- Touch-friendly interface
- Mobile-specific UI adjustments

## 🎮 Features

- **HSK 3.0 Word Lists**: Bands 1-3 with 500+ words each
- **Interactive Learning**: Multiple choice with visual feedback
- **Progress Tracking**: Bronze/Silver/Gold tier system
- **Audio Pronunciation**: Native TTS for Chinese characters
- **Game Modes**: Easy mode, traditional characters, pinyin display
- **Resume Functionality**: Save and continue games
- **Customizable Settings**: Audio, display, and gameplay options

## 📱 Mobile-Specific Features

- **Native Performance**: Runs as a true mobile app
- **Offline Support**: Works without internet connection
- **App Store Ready**: Configured for Google Play and App Store
- **Device Integration**: Uses native TTS and storage
- **Touch Optimized**: Designed for mobile interaction

## 🚀 Deployment

### Android (Google Play Store)
1. Build the Android project: `npm run android`
2. Open Android Studio
3. Generate signed APK/AAB
4. Upload to Google Play Console

### iOS (App Store)
1. Build the iOS project: `npm run ios`
2. Open Xcode
3. Archive and upload to App Store Connect

## 🔄 Updating the Game

To update the game with new features:
1. Modify files in the `www/` directory
2. Run `npm run sync` to update native projects
3. Rebuild and redeploy

## 🐛 Troubleshooting

### Common Issues

**TTS not working on mobile:**
- Ensure device has Chinese TTS voices installed
- Check app permissions for audio

**Game state not saving:**
- Verify Capacitor Preferences plugin is properly installed
- Check device storage permissions

**Build errors:**
- Run `npm run sync` after making changes
- Clear and rebuild native projects

## 📄 License

Same license as the original web game.

## 🤝 Contributing

1. Make changes to the `www/` directory
2. Test on both web and mobile
3. Run `npm run sync` before committing
4. Submit pull request

## 📞 Support

For issues specific to the mobile version, check:
- Capacitor documentation: https://capacitorjs.com/docs
- Plugin documentation for TTS and Storage
- Original game repository for game logic questions
