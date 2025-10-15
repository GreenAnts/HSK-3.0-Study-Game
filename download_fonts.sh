#!/bin/bash

# Chinese Font Download Script
# This script downloads free Chinese fonts for the app

echo "🔤 Downloading Chinese fonts for the app..."

# Create fonts directory
mkdir -p www/fonts

# Download Noto Sans CJK (Simplified Chinese)
echo "📥 Downloading Noto Sans CJK SC..."
curl -L "https://fonts.gstatic.com/s/notosanscjk/v36/NotoSansCJKsc-Regular.otf" -o www/fonts/NotoSansCJKsc-Regular.otf

# Download Noto Serif CJK (Simplified Chinese)  
echo "📥 Downloading Noto Serif CJK SC..."
curl -L "https://fonts.gstatic.com/s/notoserifcjk/v36/NotoSerifCJKsc-Regular.otf" -o www/fonts/NotoSerifCJKsc-Regular.otf

# Download Noto Sans CJK (Traditional Chinese)
echo "📥 Downloading Noto Sans CJK TC..."
curl -L "https://fonts.gstatic.com/s/notosanscjk/v36/NotoSansCJKtc-Regular.otf" -o www/fonts/NotoSansCJKtc-Regular.otf

# Download Noto Serif CJK (Traditional Chinese)
echo "📥 Downloading Noto Serif CJK TC..."
curl -L "https://fonts.gstatic.com/s/notoserifcjk/v36/NotoSerifCJKtc-Regular.otf" -o www/fonts/NotoSerifCJKtc-Regular.otf

# Download Source Han Sans (Simplified Chinese)
echo "📥 Downloading Source Han Sans SC..."
curl -L "https://github.com/adobe-fonts/source-han-sans/releases/download/2.004R/SourceHanSansSC.zip" -o www/fonts/SourceHanSansSC.zip
cd www/fonts && unzip -j SourceHanSansSC.zip "SourceHanSansSC-Regular.otf" && rm SourceHanSansSC.zip && cd ../..

# Download Source Han Serif (Simplified Chinese)
echo "📥 Downloading Source Han Serif SC..."
curl -L "https://github.com/adobe-fonts/source-han-serif/releases/download/2.001R/09_SourceHanSerifSC.zip" -o www/fonts/SourceHanSerifSC.zip
cd www/fonts && unzip -j SourceHanSerifSC.zip "SourceHanSerifSC-Regular.otf" && rm SourceHanSerifSC.zip && cd ../..

echo "✅ Font download complete!"
echo "📁 Fonts saved to: www/fonts/"
echo ""
echo "📋 Downloaded fonts:"
ls -la www/fonts/*.otf 2>/dev/null || echo "No .otf files found"
echo ""
echo "🔧 Next steps:"
echo "1. Update fonts.css to use the downloaded font files"
echo "2. Test the fonts in the app"
echo "3. Sync with Android: npx cap sync android"
