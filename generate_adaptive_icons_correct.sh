#!/bin/bash

# CORRECTED Adaptive Icon Generation Script
# This script properly uses separate foreground and background images
# Following Android Studio's adaptive icon best practices

FOREGROUND_SOURCE="www/icon-foreground.png"
BACKGROUND_SOURCE="www/icon-background.png"
ANDROID_RES_DIR="android/app/src/main/res"

echo "🎯 Generating CORRECT adaptive icons with proper foreground/background separation..."

# Verify source files exist
if [ ! -f "$FOREGROUND_SOURCE" ]; then
    echo "❌ Error: Foreground image not found: $FOREGROUND_SOURCE"
    exit 1
fi

if [ ! -f "$BACKGROUND_SOURCE" ]; then
    echo "❌ Error: Background image not found: $BACKGROUND_SOURCE"
    exit 1
fi

echo "✅ Found foreground: $FOREGROUND_SOURCE"
echo "✅ Found background: $BACKGROUND_SOURCE"

# Icon sizes for different densities (Android standard)
declare -A SIZES=(
    ["ldpi"]="36"
    ["mdpi"]="48" 
    ["hdpi"]="72"
    ["xhdpi"]="96"
    ["xxhdpi"]="144"
    ["xxxhdpi"]="192"
)

# Create directories if they don't exist
mkdir -p "$ANDROID_RES_DIR/mipmap-ldpi"
mkdir -p "$ANDROID_RES_DIR/mipmap-mdpi"
mkdir -p "$ANDROID_RES_DIR/mipmap-hdpi"
mkdir -p "$ANDROID_RES_DIR/mipmap-xhdpi"
mkdir -p "$ANDROID_RES_DIR/mipmap-xxhdpi"
mkdir -p "$ANDROID_RES_DIR/mipmap-xxxhdpi"

# Function to create proper adaptive icons
create_adaptive_icon() {
    local size=$1
    local density=$2
    
    echo "📱 Creating ${density} adaptive icon (${size}x${size})..."
    
    # For adaptive icons, the safe zone is 66% of the total size
    # This means the foreground content should fit within 66% of the center
    local safe_zone_size=$((size * 66 / 100))
    local padding=$((size - safe_zone_size))
    local half_padding=$((padding / 2))
    
    # Create foreground with proper safe zone (66% of total size)
    convert -size "${size}x${size}" xc:"transparent" \
            "$FOREGROUND_SOURCE" -resize "${safe_zone_size}x${safe_zone_size}" \
            -gravity center \
            -composite "$ANDROID_RES_DIR/mipmap-${density}/ic_launcher_foreground.png"
    
    # Create background (full size, no safe zone needed)
    convert "$BACKGROUND_SOURCE" -resize "${size}x${size}" \
            "$ANDROID_RES_DIR/mipmap-${density}/ic_launcher_background.png"
    
    # Create legacy icons (for older Android versions)
    # Combine foreground and background for legacy support
    convert "$BACKGROUND_SOURCE" -resize "${size}x${size}" \
            "$FOREGROUND_SOURCE" -resize "${safe_zone_size}x${safe_zone_size}" \
            -gravity center -composite \
            "$ANDROID_RES_DIR/mipmap-${density}/ic_launcher.png"
    
    # Create round icon (same as legacy)
    cp "$ANDROID_RES_DIR/mipmap-${density}/ic_launcher.png" \
       "$ANDROID_RES_DIR/mipmap-${density}/ic_launcher_round.png"
    
    echo "✅ Created ${density} icons with ${safe_zone_size}x${safe_zone_size} safe zone"
}

# Generate adaptive icons for all densities
for density in "${!SIZES[@]}"; do
    size=${SIZES[$density]}
    create_adaptive_icon $size $density
done

echo ""
echo "🎉 CORRECT adaptive icon generation complete!"
echo "📋 What was created:"
echo "   • Foreground layers: Properly sized with 66% safe zone"
echo "   • Background layers: Full size, no clipping"
echo "   • Legacy icons: Combined for older Android versions"
echo "   • Round icons: For Android 7.1 compatibility"
echo ""
echo "🔧 Next steps:"
echo "   1. Your existing adaptive icon XML files are already correct"
echo "   2. Run: npx cap sync android"
echo "   3. Test on different Android devices/emulators"
echo "   4. Verify icons look good with different launcher masks"
