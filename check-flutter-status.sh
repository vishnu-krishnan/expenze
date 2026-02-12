#!/bin/bash

# Flutter Build Status Checker
# This script helps you monitor your Flutter build progress

echo "========================================="
echo "Flutter Build Status Checker"
echo "========================================="
echo ""

# Check if device is connected
echo "1. Checking device connection..."
DEVICE_STATUS=$(adb devices | grep "1592460721000B5")
if [ -z "$DEVICE_STATUS" ]; then
    echo "❌ Device not connected!"
    echo "Run: adb devices"
    exit 1
else
    echo "✅ Device connected: $DEVICE_STATUS"
fi
echo ""

# Check if Flutter process is running
echo "2. Checking Flutter build process..."
FLUTTER_PROCESS=$(ps aux | grep "flutter run" | grep -v grep)
if [ -z "$FLUTTER_PROCESS" ]; then
    echo "⚠️  No Flutter build running"
    echo "To start build, run:"
    echo "  cd /home/seq_vishnu/WORK/RnD/expenze/mobile"
    echo "  flutter run"
else
    echo "✅ Flutter build is running"
    echo "$FLUTTER_PROCESS"
fi
echo ""

# Check Gradle daemon
echo "3. Checking Gradle build..."
GRADLE_PROCESS=$(ps aux | grep gradle | grep -v grep)
if [ -z "$GRADLE_PROCESS" ]; then
    echo "⚠️  Gradle not running (build may be complete or not started)"
else
    echo "✅ Gradle is compiling..."
fi
echo ""

# Check if APK exists
echo "4. Checking for built APK..."
APK_PATH="/home/seq_vishnu/WORK/RnD/expenze/mobile/build/app/outputs/flutter-apk/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    APK_DATE=$(stat -c %y "$APK_PATH" | cut -d'.' -f1)
    echo "✅ APK found: $APK_SIZE"
    echo "   Built: $APK_DATE"
    echo "   Location: $APK_PATH"
else
    echo "⚠️  APK not found yet (still building)"
fi
echo ""

# Check if app is installed on device
echo "5. Checking if app is installed on device..."
APP_INSTALLED=$(adb shell pm list packages | grep "com.expenze.expenze_mobile")
if [ -z "$APP_INSTALLED" ]; then
    echo "⚠️  App not installed on device yet"
else
    echo "✅ App installed: $APP_INSTALLED"
fi
echo ""

# Show recent Gradle logs if available
echo "6. Recent build activity..."
if [ -d "/home/seq_vishnu/WORK/RnD/expenze/mobile/build" ]; then
    echo "Build directory exists"
    BUILD_AGE=$(stat -c %y "/home/seq_vishnu/WORK/RnD/expenze/mobile/build" | cut -d'.' -f1)
    echo "Last modified: $BUILD_AGE"
else
    echo "Build directory not created yet"
fi
echo ""

echo "========================================="
echo "Quick Commands:"
echo "========================================="
echo "View live build output:"
echo "  tail -f ~/.flutter-log"
echo ""
echo "Check device logs:"
echo "  adb logcat | grep flutter"
echo ""
echo "Manual install (if APK exists):"
echo "  adb install -r $APK_PATH"
echo ""
echo "Start fresh build:"
echo "  cd /home/seq_vishnu/WORK/RnD/expenze/mobile"
echo "  flutter run"
echo "========================================="
