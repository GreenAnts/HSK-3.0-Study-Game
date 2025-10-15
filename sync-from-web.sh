#!/bin/bash

# Sync script to copy changes from web project to mobile project
echo "🔄 Syncing web changes to mobile project..."

# Copy main files
cp ../Game/index.html www/
cp ../Game/scripts.js www/
cp ../Game/styles.css www/

# Copy any new assets (if they exist)
if [ -d "../Game/Mascot" ]; then
    cp -r ../Game/Mascot www/
fi

if [ -d "../Game/Music" ]; then
    cp -r ../Game/Music www/
fi

if [ -d "../Game/Sounds" ]; then
    cp -r ../Game/Sounds www/
fi

if [ -d "../Game/Sprites" ]; then
    cp -r ../Game/Sprites www/
fi

if [ -d "../Game/wordlists" ]; then
    cp -r ../Game/wordlists www/
fi

# Sync Capacitor project
echo "📱 Syncing Capacitor project..."
npx cap sync

echo "✅ Sync complete! Mobile app is updated."
echo "🚀 Run 'npm run android' or 'npm run ios' to test on device"
