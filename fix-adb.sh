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

DEVICE_INFO=$(lsusb | grep -i "android\|xiaomi\|samsung\|google\|oneplus\|oppo\|vivo\|realme\|motorola\|redmi\|mi ")

if [ -z "$DEVICE_INFO" ]; then
    echo "⚠️  No Android device detected via USB"
    echo ""
    echo "All USB devices:"
    lsusb
    echo ""
    echo "Please:"
    echo "  1. Connect your phone via USB cable"
    echo "  2. Enable USB Debugging on your phone"
    echo "  3. Set USB mode to 'File Transfer' or 'MTP'"
    echo "  4. Run this script again"
    echo ""
    echo "If your device is connected, it might not be recognized."
    echo "You can manually find the vendor ID from 'lsusb' output above"
    echo "and add it to /etc/udev/rules.d/51-android.rules"
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
    NEED_RELOGIN=false
else
    echo "Adding user to plugdev group..."
    sudo usermod -aG plugdev $USER
    echo "✅ User added to plugdev group"
    echo "⚠️  You need to LOGOUT and LOGIN again for group changes to take effect"
    NEED_RELOGIN=true
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
    echo "Android version: $(adb shell getprop ro.build.version.release)"
    echo ""
    echo "You can now use ADB and Flutter!"
    
    if [ "$NEED_RELOGIN" = true ]; then
        echo ""
        echo "⚠️  REMINDER: You still need to logout/login for group changes"
        echo "But ADB should work for now."
    fi
elif echo "$ADB_OUTPUT" | grep -q "unauthorized"; then
    echo "========================================="
    echo "⚠️  Device is unauthorized"
    echo "========================================="
    echo ""
    echo "Please:"
    echo "1. Check your phone screen for authorization prompt"
    echo "2. Tap 'Allow' and enable 'Always allow from this computer'"
    echo "3. Run: adb devices"
    
    if [ "$NEED_RELOGIN" = true ]; then
        echo ""
        echo "Also: LOGOUT and LOGIN again for group changes to take effect"
    fi
elif echo "$ADB_OUTPUT" | grep -q "no permissions"; then
    echo "========================================="
    echo "⚠️  Permission issue detected"
    echo "========================================="
    echo ""
    if [ "$NEED_RELOGIN" = true ]; then
        echo "You MUST LOGOUT and LOGIN again for group changes to take effect"
        echo "Then run: adb devices"
    else
        echo "Try:"
        echo "1. Unplug and replug USB cable"
        echo "2. Run: adb devices"
    fi
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
    
    if [ "$NEED_RELOGIN" = true ]; then
        echo "6. LOGOUT and LOGIN again"
    fi
    
    echo "7. Run: adb devices"
fi

echo ""
echo "========================================="
echo "Script completed"
echo "========================================="
