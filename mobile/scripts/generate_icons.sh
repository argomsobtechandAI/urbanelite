#!/bin/bash
SOURCE_IMAGE=$1
RES_DIR="android/app/src/main/res"
IOS_ICON_DIR="ios/UrbanElite/Images.xcassets/AppIcon.appiconset"

# High-fidelity SVG rendering logic (eliminating black tint & blur)
if [[ $SOURCE_IMAGE == *.svg ]]; then
    echo "Rendering SVG with specialized alpha-white-extraction to preserve Orange brilliance..."
    # Render at 300 DPI to a white background first, then extract transparency
    # This force-renders complex gradients/stops that often fail on direct alpha renders
    convert -background white -density 300 "$SOURCE_IMAGE" /tmp/rendered_w.png
    convert /tmp/rendered_w.png -transparent white -trim +repage /tmp/rendered_master.png
    SOURCE_READY="/tmp/rendered_master.png"
else
    echo "Processing standard image format..."
    convert "$SOURCE_IMAGE" -trim +repage /tmp/rendered_master.png
    SOURCE_READY="/tmp/rendered_master.png"
fi

# 1. Create the full branding image (Icon + Text) for in-app headers
cp "$SOURCE_READY" src/assets/images/logo.png

# 2. Extract the centerpiece icon (Wrench/Emblem) for the App Icon
# Perform center-balanced crop to avoid 'drowning' the logo
convert "$SOURCE_READY" -gravity North -crop 1:1 +repage /tmp/app_icon_base.png

# Android Launcher Icons
convert /tmp/app_icon_base.png -resize 48x48 "$RES_DIR/mipmap-mdpi/ic_launcher.png"
convert /tmp/app_icon_base.png -resize 72x72 "$RES_DIR/mipmap-hdpi/ic_launcher.png"
convert /tmp/app_icon_base.png -resize 96x96 "$RES_DIR/mipmap-xhdpi/ic_launcher.png"
convert /tmp/app_icon_base.png -resize 144x144 "$RES_DIR/mipmap-xxhdpi/ic_launcher.png"
convert /tmp/app_icon_base.png -resize 192x192 "$RES_DIR/mipmap-xxxhdpi/ic_launcher.png"

# Android Round Icons
convert /tmp/app_icon_base.png -resize 48x48 "$RES_DIR/mipmap-mdpi/ic_launcher_round.png"
convert /tmp/app_icon_base.png -resize 72x72 "$RES_DIR/mipmap-hdpi/ic_launcher_round.png"
convert /tmp/app_icon_base.png -resize 96x96 "$RES_DIR/mipmap-xhdpi/ic_launcher_round.png"
convert /tmp/app_icon_base.png -resize 144x144 "$RES_DIR/mipmap-xxhdpi/ic_launcher_round.png"
convert /tmp/app_icon_base.png -resize 192x192 "$RES_DIR/mipmap-xxxhdpi/ic_launcher_round.png"

# iOS Icons
if [ -d "$IOS_ICON_DIR" ]; then
    convert /tmp/app_icon_base.png -resize 1024x1024 "$IOS_ICON_DIR/icon-1024.png"
    convert /tmp/app_icon_base.png -resize 120x120 "$IOS_ICON_DIR/icon-60@2x.png"
    convert /tmp/app_icon_base.png -resize 180x180 "$IOS_ICON_DIR/icon-60@3x.png"
fi

echo "Success: High-DPI icon assets generated successfully using SVG source."
