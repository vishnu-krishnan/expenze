# ADB Linux Configuration Fix Guide
================================================================================

Date: 2026-02-12

## Problem Statement
================================================================================

**Issue:** Android device connects successfully to Windows laptop but fails to 
connect on Linux system (Ubuntu 24.04).

**Root Cause:** Linux requires specific USB permissions and udev rules that 
Windows handles automatically. This is a configuration issue, not a hardware 
or ADB version problem.

**Status:** ADB is installed (version 34.0.4) but misconfigured for device access.


## Quick Diagnosis
================================================================================

### Step 1: Check Current Status

```bash
# Check if device is visible at USB level
lsusb

# Check if ADB sees the device
adb devices

# Check ADB server status
ps aux | grep adb
```

**Expected vs Actual:**
- `lsusb` should show your Android device ✅ (likely working)
- `adb devices` should show device but probably shows empty or "unauthorized" ❌
- This confirms USB hardware works, but permissions are wrong


### Step 2: Identify Your Device Vendor ID

```bash
# Connect your phone via USB, then run:
lsusb

# Example output:
# Bus 001 Device 010: ID 2717:ff48 Xiaomi Inc. Mi/Redmi series (MTP + ADB)
#                        ^^^^
#                        This is your Vendor ID
```

**Common Vendor IDs:**
- Samsung: `04e8`
- Google Pixel: `18d1`
- Xiaomi/Redmi: `2717`
- OnePlus: `2a70`
- Oppo: `22d9`
- Vivo: `2d95`
- Realme: `22d9`
- Motorola: `22b8`
- LG: `1004`
- HTC: `0bb4`
- Sony: `0fce`
- Huawei: `12d1`


## Complete Fix (Step-by-Step)
================================================================================

### Fix 1: Create/Update udev Rules

**What this does:** Grants your user account permission to access Android devices 
via USB without requiring root privileges.

```bash
# 1. Create udev rules file
sudo nano /etc/udev/rules.d/51-android.rules

# 2. Add the following line (replace XXXX with YOUR vendor ID from lsusb):
SUBSYSTEM=="usb", ATTR{idVendor}=="XXXX", MODE="0666", GROUP="plugdev"

# Example for Xiaomi (vendor ID 2717):
SUBSYSTEM=="usb", ATTR{idVendor}=="2717", MODE="0666", GROUP="plugdev"

# 3. If you have multiple device brands, add multiple lines:
SUBSYSTEM=="usb", ATTR{idVendor}=="2717", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", MODE="0666", GROUP="plugdev"

# 4. Save and exit (Ctrl+O, Enter, Ctrl+X)

# 5. Set correct permissions on the file
sudo chmod a+r /etc/udev/rules.d/51-android.rules

# 6. Reload udev rules
sudo udevadm control --reload-rules
sudo udevadm trigger

# 7. Restart udev service
sudo systemctl restart udev
```


### Fix 2: Add User to plugdev Group

```bash
# 1. Add your user to plugdev group
sudo usermod -aG plugdev $USER

# 2. Verify group membership
groups $USER

# Should show: ... plugdev ...

# 3. Apply group changes (choose ONE option):

# Option A: Logout and login again (RECOMMENDED)
# Option B: Restart your system
# Option C: Use newgrp (temporary for current session)
newgrp plugdev
```


### Fix 3: Reset ADB Server

```bash
# 1. Kill any existing ADB server (especially if running as root)
sudo killall adb 2>/dev/null
adb kill-server

# 2. Remove old authorization keys
rm -f ~/.android/adbkey ~/.android/adbkey.pub

# 3. Start fresh ADB server (as your user, not root)
adb start-server

# 4. Reconnect your device
# Unplug and replug USB cable
```


### Fix 4: Phone-Side Configuration

**On your Android device:**

1. **Revoke previous authorizations:**
   - Settings → Developer Options → Revoke USB debugging authorizations
   - Tap "Revoke" or "OK"

2. **Verify USB Debugging is ON:**
   - Settings → Developer Options → USB Debugging (should be enabled)

3. **Set USB mode to File Transfer:**
   - When connected, pull down notification shade
   - Tap "USB charging this device"
   - Select "File Transfer" or "MTP"

4. **Reconnect USB cable**
   - Unplug and replug
   - Watch for authorization popup on phone screen


### Fix 5: Verify Connection

```bash
# 1. Check device detection
adb devices

# Expected output:
# List of devices attached
# ABC123XYZ    device

# 2. If you see "unauthorized":
# - Check your phone screen for authorization prompt
# - Enable "Always allow from this computer"
# - Tap "Allow"

# 3. Test connection
adb shell echo "Success"

# Should print: Success

# 4. Get device info
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
```


## Automated Fix Script
================================================================================

**Save this as:** `~/fix-adb.sh`

```bash
#!/bin/bash

echo "========================================="
echo "ADB Linux Configuration Fix Script"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ ERROR: Do not run this script as root/sudo"
   echo "Run as: ./fix-adb.sh"
   exit 1
fi

# Step 1: Detect device
echo "Step 1: Detecting connected Android device..."
echo "Please ensure your phone is connected via USB"
echo ""

DEVICE_INFO=$(lsusb | grep -i "android\|xiaomi\|samsung\|google\|oneplus\|oppo\|vivo\|realme\|motorola")

if [ -z "$DEVICE_INFO" ]; then
    echo "⚠️  No Android device detected via USB"
    echo "Please:"
    echo "  1. Connect your phone via USB cable"
    echo "  2. Enable USB Debugging on your phone"
    echo "  3. Run this script again"
    exit 1
fi

echo "✅ Device detected:"
echo "$DEVICE_INFO"
echo ""

# Extract Vendor ID
VENDOR_ID=$(echo "$DEVICE_INFO" | grep -oP 'ID \K[0-9a-f]{4}' | head -1)
echo "Vendor ID: $VENDOR_ID"
echo ""

# Step 2: Create udev rules
echo "Step 2: Creating udev rules..."

UDEV_RULE="SUBSYSTEM==\"usb\", ATTR{idVendor}==\"$VENDOR_ID\", MODE=\"0666\", GROUP=\"plugdev\""

if [ -f /etc/udev/rules.d/51-android.rules ]; then
    if grep -q "$VENDOR_ID" /etc/udev/rules.d/51-android.rules; then
        echo "✅ udev rule already exists for this device"
    else
        echo "Adding new vendor ID to existing rules..."
        echo "$UDEV_RULE" | sudo tee -a /etc/udev/rules.d/51-android.rules > /dev/null
        echo "✅ udev rule added"
    fi
else
    echo "Creating new udev rules file..."
    echo "$UDEV_RULE" | sudo tee /etc/udev/rules.d/51-android.rules > /dev/null
    echo "✅ udev rules file created"
fi

sudo chmod a+r /etc/udev/rules.d/51-android.rules

# Step 3: Reload udev
echo ""
echo "Step 3: Reloading udev rules..."
sudo udevadm control --reload-rules
sudo udevadm trigger
sudo systemctl restart udev
echo "✅ udev rules reloaded"

# Step 4: Add user to plugdev group
echo ""
echo "Step 4: Checking user groups..."

if groups $USER | grep -q "\bplugdev\b"; then
    echo "✅ User already in plugdev group"
else
    echo "Adding user to plugdev group..."
    sudo usermod -aG plugdev $USER
    echo "✅ User added to plugdev group"
    echo "⚠️  You need to LOGOUT and LOGIN again for group changes to take effect"
fi

# Step 5: Reset ADB
echo ""
echo "Step 5: Resetting ADB server..."

# Kill any root ADB servers
sudo killall adb 2>/dev/null

# Kill user ADB server
adb kill-server 2>/dev/null

# Remove old keys
rm -f ~/.android/adbkey ~/.android/adbkey.pub 2>/dev/null

# Start fresh
adb start-server

echo "✅ ADB server reset"

# Step 6: Test connection
echo ""
echo "Step 6: Testing connection..."
echo ""
echo "⚠️  IMPORTANT: Check your phone screen now!"
echo "You should see an 'Allow USB debugging?' prompt"
echo "Enable 'Always allow from this computer' and tap 'Allow'"
echo ""
echo "Press Enter after you've allowed the connection..."
read

echo ""
echo "Checking device status..."
ADB_OUTPUT=$(adb devices)
echo "$ADB_OUTPUT"
echo ""

if echo "$ADB_OUTPUT" | grep -q "device$"; then
    echo "========================================="
    echo "✅ SUCCESS! Device connected"
    echo "========================================="
    echo ""
    echo "Device information:"
    adb shell getprop ro.product.model
    adb shell getprop ro.build.version.release
    echo ""
    echo "You can now use ADB and Flutter!"
elif echo "$ADB_OUTPUT" | grep -q "unauthorized"; then
    echo "========================================="
    echo "⚠️  Device is unauthorized"
    echo "========================================="
    echo ""
    echo "Please:"
    echo "1. Check your phone screen for authorization prompt"
    echo "2. Tap 'Allow' and enable 'Always allow from this computer'"
    echo "3. Run: adb devices"
elif echo "$ADB_OUTPUT" | grep -q "no permissions"; then
    echo "========================================="
    echo "⚠️  Permission issue detected"
    echo "========================================="
    echo ""
    echo "Please:"
    echo "1. LOGOUT and LOGIN again (group changes require re-login)"
    echo "2. Run this script again"
else
    echo "========================================="
    echo "⚠️  Device not detected"
    echo "========================================="
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Unplug and replug USB cable"
    echo "2. On phone: Settings → Developer Options → Revoke USB debugging authorizations"
    echo "3. Disable and re-enable USB Debugging"
    echo "4. Try a different USB cable"
    echo "5. Try a different USB port"
    echo "6. Run: adb devices"
fi

echo ""
echo "========================================="
echo "Script completed"
echo "========================================="
```

**Make it executable and run:**

```bash
chmod +x ~/fix-adb.sh
~/fix-adb.sh
```


## Manual Verification Checklist
================================================================================

After running the fix, verify each step:

- [ ] **USB Detection:** `lsusb` shows your Android device
- [ ] **udev Rules:** File `/etc/udev/rules.d/51-android.rules` exists with your vendor ID
- [ ] **Group Membership:** `groups` command shows `plugdev`
- [ ] **Logged Out/In:** You've logged out and back in (or rebooted)
- [ ] **ADB Server:** Running as your user, not root (`ps aux | grep adb`)
- [ ] **Phone Authorization:** Allowed USB debugging on phone
- [ ] **ADB Devices:** `adb devices` shows device with "device" status
- [ ] **Shell Access:** `adb shell echo test` prints "test"


## Common Issues After Fix
================================================================================

### Issue: Still shows "no permissions"

**Solution:**
```bash
# You MUST logout and login for group changes to take effect
# Or reboot:
sudo reboot
```

### Issue: Shows "unauthorized"

**Solution:**
```bash
# On phone: Revoke all authorizations
# Settings → Developer Options → Revoke USB debugging authorizations

# On computer:
adb kill-server
rm ~/.android/adbkey*
adb start-server

# Reconnect phone and allow the new prompt
```

### Issue: Device disappears after unplug/replug

**Solution:**
```bash
# This is normal. Just run:
adb devices

# The authorization should persist
```

### Issue: Multiple ADB versions conflict

**Solution:**
```bash
# Find all ADB installations
which -a adb

# If you see multiple, prioritize system ADB
# Add to ~/.bashrc:
export PATH="/usr/bin:$PATH"

# Reload:
source ~/.bashrc
```


## Testing After Fix
================================================================================

### Basic Tests

```bash
# 1. Device detection
adb devices
# Should show: ABC123XYZ    device

# 2. Shell access
adb shell echo "Hello from Android"
# Should print: Hello from Android

# 3. Device info
adb shell getprop ro.product.manufacturer
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release

# 4. File operations
adb shell ls /sdcard/
# Should list files

# 5. Install test (if you have an APK)
adb install -r test.apk
```

### Flutter-Specific Tests

```bash
# 1. Flutter device detection
flutter devices
# Should show your Android device

# 2. Flutter doctor
flutter doctor -v
# Should show checkmark for "Connected device"
```


## Prevention: Keep It Working
================================================================================

### Add to ~/.bashrc

```bash
# Add these lines to prevent future issues:

# Prioritize system ADB
export PATH="/usr/bin:$PATH"

# Android SDK (if using Flutter's SDK)
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

### Create Alias for Quick Checks

```bash
# Add to ~/.bashrc:
alias adb-check='adb kill-server && adb start-server && adb devices'
alias adb-reset='adb kill-server && rm -f ~/.android/adbkey* && adb start-server'

# Usage:
# adb-check    # Quick restart and check
# adb-reset    # Full reset (requires re-authorization)
```


## Why Windows Works But Linux Doesn't
================================================================================

**Windows:**
- Automatically installs USB drivers when device is connected
- Handles permissions through driver installation
- No manual configuration needed

**Linux:**
- Uses udev rules for USB device permissions
- Requires manual configuration for each vendor
- More secure but requires setup
- Group membership controls access

**This is by design** - Linux gives you more control but requires explicit 
permission grants. Once configured correctly, Linux ADB is actually more 
stable and faster than Windows.


## Next Steps After Fix
================================================================================

1. **Verify ADB works:** `adb devices` shows your device
2. **Test Flutter:** `flutter devices` detects your phone
3. **Proceed with Flutter installation** from main migration plan
4. **Test app deployment:** `flutter run`


## Support Resources
================================================================================

**If still having issues:**

1. Check system logs:
   ```bash
   dmesg | tail -50
   journalctl -xe | grep usb
   ```

2. Verify USB mode on phone:
   - Should be "File Transfer" or "MTP"
   - Not "Charging only"

3. Try different USB cable/port

4. Check if USB debugging is enabled:
   ```bash
   adb shell getprop persist.sys.usb.config
   # Should include "adb"
   ```


## Document Control
================================================================================

Version: 1.0
Status: Active
Date: 2026-02-12
Owner: Development Team

Change Log:
- 2026-02-12: Initial creation - Linux ADB configuration fix guide
