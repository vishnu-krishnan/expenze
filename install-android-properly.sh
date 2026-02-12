#!/bin/bash

# ==============================================================================
# PROPER ANDROID SDK INSTALLATION SCRIPT (FLUTTER-READY)
# ==============================================================================
# This script removes system-installed ADB and installs the official 
# Android SDK Command Line Tools in a clean environment.

set -e

echo "🚀 Starting Proper Android Installation..."

# 1. REMOVE SYSTEM-INSTALLED ANDROID PACKAGES
echo "🧹 Removing old system-installed Android tools to avoid conflicts..."
sudo apt remove -y adb fastboot android-sdk-platform-tools-common android-libbase android-libboringssl android-libcutils android-liblog android-libsparse android-libziparchive
sudo apt autoremove -y

# 2. CREATE DIRECTORY STRUCTURE
echo "📂 Creating Android SDK directory structure in ~/Android/Sdk..."
mkdir -p ~/Android/Sdk/cmdline-tools

# 3. DOWNLOAD OFFICIAL CMDLINE TOOLS
# Note: This is the official Google recommended way for CLI-only development
echo "📥 Downloading official Android Command Line Tools..."
cd /tmp
wget -O cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip

echo "📦 Extracting tools..."
unzip -q cmdline-tools.zip
mkdir -p ~/Android/Sdk/cmdline-tools/latest
mv cmdline-tools/* ~/Android/Sdk/cmdline-tools/latest/
rm -rf cmdline-tools cmdline-tools.zip

# 4. SET UP ENVIRONMENT VARIABLES
echo "⚙️ Setting up environment variables in ~/.bashrc..."
# Use a temporary file to avoid double-entry if script is run twice
EXT_BASHRC=$(cat << 'EOF'

# --- Android SDK Setup ---
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0
# -------------------------
EOF
)

if ! grep -q "ANDROID_HOME" ~/.bashrc; then
    echo "$EXT_BASHRC" >> ~/.bashrc
    echo "✅ Added variables to ~/.bashrc"
else
    echo "ℹ️ Environment variables already present in ~/.bashrc"
fi

# Load variables for the current session
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 5. FIX PERMISSIONS (UDEV RULES)
echo "🛡️ Configuring USB permissions for your Vivo phone..."
# Creating the rule for Vendor ID 2d95 (Vivo)
sudo tee /etc/udev/rules.d/51-android.rules << 'EOF'
SUBSYSTEM=="usb", ATTR{idVendor}=="2d95", MODE="0666", GROUP="plugdev"
# Also adding common IDs just in case
SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="2717", MODE="0666", GROUP="plugdev"
EOF

sudo chmod a+r /etc/udev/rules.d/51-android.rules
sudo udevadm control --reload-rules
sudo udevadm trigger

# Ensure user is in plugdev group
if ! groups $USER | grep -q "\bplugdev\b"; then
    echo "👤 Adding you to the 'plugdev' group..."
    sudo usermod -aG plugdev $USER
    RELOGIN_NEEDED=true
fi

# 6. INSTALL PLATFORM TOOLS & SDK PLATFORMS
echo "🛠️ Installing official Platform Tools (which includes ADB) and SDK 34..."

# Accept licenses first
yes | sdkmanager --licenses || true

# Install essential components
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo "✅ Proper Android SDK installation complete!"
echo "----------------------------------------------------------------------"
echo "🔧 NEXT STEPS:"
if [ "$RELOGIN_NEEDED" = true ]; then
    echo "1. ⚠️ IMPORTANT: You MUST LOG OUT and LOG IN again to apply permissions."
else
    echo "1. Run 'source ~/.bashrc' to refresh your terminal variables."
fi
echo "2. Connect your phone and run 'adb devices'."
echo "3. Watch your phone for the 'Allow USB Debugging' popup!"
echo "----------------------------------------------------------------------"
