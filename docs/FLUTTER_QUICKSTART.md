# Flutter Development Quick Start Guide
================================================================================

Date: 2026-02-12

## Your Current Situation
================================================================================

**Device Detected:** vivo I2202 (Vendor ID: 2d95)
**Problem:** ADB works on Windows but not on your Linux system
**Root Cause:** Missing Linux USB permissions (udev rules)
**Storage:** 53GB free (77% used) - needs cleanup before Flutter installation

## Immediate Action Required (30 Minutes)
================================================================================

### Step 1: Fix ADB Connection (10 minutes)

**Your phone is detected at USB level but ADB can't access it.**

Run the automated fix script:

```bash
cd /home/seq_vishnu/WORK/RnD/expenze
./fix-adb.sh
```

**What this script does:**
1. Detects your vivo phone (Vendor ID: 2d95)
2. Creates udev rule: `/etc/udev/rules.d/51-android.rules`
3. Adds you to `plugdev` group
4. Resets ADB server
5. Tests connection

**During script execution:**
- Watch your phone screen for "Allow USB debugging?" prompt
- Enable "Always allow from this computer"
- Tap "Allow"

**If script asks you to logout/login:**
```bash
# Save your work, then:
gnome-session-quit --logout
# Or just reboot:
sudo reboot
```

**After reboot, verify:**
```bash
adb devices
```

**Expected output:**
```
List of devices attached
ABC123XYZ    device
```

### Step 2: Storage Cleanup (20 minutes)

**You need ~25-30GB for Flutter. Currently have 53GB free.**

**Quick cleanup commands:**

```bash
# Clean package caches (safe, recovers 2-5GB)
sudo apt clean
sudo apt autoclean
sudo apt autoremove
npm cache clean --force

# Find large files to review
du -h ~ | sort -rh | head -20

# Check current status
df -h /home
```

**Target:** Get to at least 60-65GB free

**Common space hogs to check:**
```bash
# Old Docker images (if you use Docker)
docker system df
docker system prune -a --volumes  # BE CAREFUL - removes unused containers

# Snap packages old versions
snap list --all | awk '/disabled/{print $1, $3}'

# Old kernels (safe to remove)
dpkg --list | grep linux-image

# Browser caches
du -sh ~/.cache/mozilla
du -sh ~/.cache/google-chrome
```

## Installation Phase (1-2 Hours)
================================================================================

### Step 3: Install Flutter Dependencies

```bash
sudo apt update
sudo apt install -y \
  curl \
  git \
  unzip \
  xz-utils \
  zip \
  libglu1-mesa \
  clang \
  cmake \
  ninja-build \
  pkg-config \
  libgtk-3-dev
```

### Step 4: Download and Install Flutter

```bash
# Download Flutter SDK (~2.5GB)
cd ~/
wget https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.27.1-stable.tar.xz

# Extract
tar xf flutter_linux_3.27.1-stable.tar.xz

# Remove archive to save space
rm flutter_linux_3.27.1-stable.tar.xz

# Add to PATH
echo 'export PATH="$HOME/flutter/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
flutter --version
```

### Step 5: Run Flutter Doctor

```bash
# Check what's needed
flutter doctor -v

# Accept Android licenses
flutter doctor --android-licenses
# Press 'y' for all prompts

# Check again
flutter doctor -v
```

**Expected output:**
```
[✓] Flutter (Channel stable, 3.27.1)
[✓] Android toolchain - develop for Android devices
[✓] Connected device (1 available)  # Your vivo phone
[✓] Network resources
```

## First Flutter App (30 Minutes)
================================================================================

### Step 6: Create Flutter Project

```bash
# Backup existing React Native app
cd /home/seq_vishnu/WORK/RnD/expenze
cp -r mobile mobile_react_native_backup

# Create new Flutter project
flutter create expenze_flutter

# Navigate to project
cd expenze_flutter
```

### Step 7: Run on Your Phone

```bash
# Make sure phone is connected
adb devices

# Run the app
flutter run

# You should see:
# - App compiling
# - Installing on your vivo phone
# - App launches with Flutter demo
```

**Hot reload:** Press `r` in terminal
**Hot restart:** Press `R` in terminal
**Quit:** Press `q` in terminal

## Troubleshooting
================================================================================

### ADB Issues

**Problem:** `adb devices` shows empty list

**Solution:**
```bash
# Check if device is detected at USB level
lsusb | grep -i vivo

# If yes, run fix script again
./fix-adb.sh

# If no, check:
# - USB cable (try different cable/port)
# - USB Debugging enabled on phone
# - USB mode set to "File Transfer"
```

**Problem:** `adb devices` shows "unauthorized"

**Solution:**
```bash
# On phone: Settings → Developer Options → Revoke USB debugging authorizations
# Then:
adb kill-server
rm ~/.android/adbkey*
adb start-server
# Check phone for new authorization prompt
```

### Flutter Issues

**Problem:** `flutter doctor` shows Android toolchain issues

**Solution:**
```bash
flutter doctor --android-licenses
# Accept all licenses
```

**Problem:** `flutter run` fails with Gradle errors

**Solution:**
```bash
cd expenze_flutter
flutter clean
flutter pub get
flutter run
```

**Problem:** Out of storage during build

**Solution:**
```bash
# Clean Flutter cache
flutter clean

# Clean Gradle cache
rm -rf ~/.gradle/caches/

# Check storage
df -h /home
```

## Storage Monitoring
================================================================================

**Create monitoring script:**

```bash
# Create script
cat > ~/bin/check-storage.sh << 'EOF'
#!/bin/bash
THRESHOLD=80
CURRENT=$(df /home | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $CURRENT -gt $THRESHOLD ]; then
    echo "⚠️  WARNING: Storage at ${CURRENT}%"
    echo "Available: $(df -h /home | tail -1 | awk '{print $4}')"
else
    echo "✅ Storage OK: ${CURRENT}% used"
fi
EOF

# Make executable
chmod +x ~/bin/check-storage.sh

# Run it
~/bin/check-storage.sh
```

**Run before each build:**
```bash
~/bin/check-storage.sh && flutter run
```

## Next Steps After Setup
================================================================================

1. **Explore Flutter basics:**
   ```bash
   cd expenze_flutter
   # Edit lib/main.dart
   # Press 'r' for hot reload
   ```

2. **Read migration plan:**
   ```bash
   cat docs/FLUTTER_MIGRATION_PLAN.md
   ```

3. **Start migrating features:**
   - Week 1: Project structure, navigation
   - Week 2-3: Authentication, API integration
   - Week 4: SMS reading functionality
   - Week 5: Testing and optimization

## Quick Reference
================================================================================

**Check device:**
```bash
adb devices
```

**Run app:**
```bash
cd expenze_flutter
flutter run
```

**Check storage:**
```bash
df -h /home
```

**Clean build:**
```bash
flutter clean
```

**Update dependencies:**
```bash
flutter pub get
```

**Build release APK:**
```bash
flutter build apk --release
```

**Install APK:**
```bash
flutter install
```

## Important Notes
================================================================================

1. **Always check storage before building**
   - Builds can use 3-5GB temporarily
   - Keep at least 10GB free

2. **ADB authorization persists**
   - Once authorized, phone stays authorized
   - Unless you revoke it manually

3. **Hot reload is your friend**
   - Press 'r' for instant updates
   - No need to rebuild entire app

4. **Keep React Native backup**
   - Don't delete `mobile_react_native_backup`
   - Can rollback if needed

5. **Physical device testing is faster**
   - No emulator overhead
   - Real-world performance testing

## Support
================================================================================

**If stuck, check:**
1. `docs/FLUTTER_MIGRATION_PLAN.md` - Complete guide
2. `docs/ADB_LINUX_FIX_GUIDE.md` - ADB troubleshooting
3. `docs/ACTIVITY_LOG.md` - What was done and why

**Useful commands:**
```bash
flutter doctor -v      # Check setup
adb logcat | grep flutter  # View logs
flutter analyze        # Check code issues
flutter test          # Run tests
```

## Success Checklist
================================================================================

- [ ] ADB detects vivo phone: `adb devices` shows "device"
- [ ] Storage cleaned: At least 60GB free
- [ ] Flutter installed: `flutter --version` works
- [ ] Flutter doctor: All checkmarks (except Chrome/iOS)
- [ ] First app runs: `flutter run` launches on phone
- [ ] Hot reload works: Press 'r' updates app instantly

**Once all checked, you're ready to start development!**

## Document Control
================================================================================

Version: 1.0
Status: Active
Date: 2026-02-12
Owner: Development Team
