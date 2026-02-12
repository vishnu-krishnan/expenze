#!/bin/bash

# ==============================================================================
# FLUTTER BACKGROUND INSTALLATION SCRIPT
# ==============================================================================

LOG_FILE="/home/seq_vishnu/WORK/RnD/expenze/flutter_install.log"
INSTALL_DIR="/home/seq_vishnu/flutter"

echo "[$(date)] Starting Flutter installation..." > "$LOG_FILE"

# 1. INSTALL DEPENDENCIES
echo "[$(date)] Installing dependencies..." >> "$LOG_FILE"
sudo apt-get update >> "$LOG_FILE" 2>&1
sudo apt-get install -y curl git unzip xz-utils zip libglu1-mesa >> "$LOG_FILE" 2>&1

# 2. DOWNLOAD FLUTTER
echo "[$(date)] Downloading Flutter SDK stable..." >> "$LOG_FILE"
cd /home/seq_vishnu
wget https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.27.1-stable.tar.xz >> "$LOG_FILE" 2>&1

# 3. EXTRACT
echo "[$(date)] Extracting Flutter SDK..." >> "$LOG_FILE"
tar xf flutter_linux_3.27.1-stable.tar.xz >> "$LOG_FILE" 2>&1
rm flutter_linux_3.27.1-stable.tar.xz

# 4. UPDATE PATH
echo "[$(date)] Updating PATH in .bashrc..." >> "$LOG_FILE"
if ! grep -q "flutter/bin" /home/seq_vishnu/.bashrc; then
    echo 'export PATH="$HOME/flutter/bin:$PATH"' >> /home/seq_vishnu/.bashrc
fi

# 5. PRECACHE ARTIFACTS
echo "[$(date)] Pre-downloading Android artifacts..." >> "$LOG_FILE"
export PATH="/home/seq_vishnu/flutter/bin:$PATH"
flutter precache --android >> "$LOG_FILE" 2>&1

# 6. DOCTOR CHECK
echo "[$(date)] Running flutter doctor..." >> "$LOG_FILE"
flutter doctor -v >> "$LOG_FILE" 2>&1

echo "[$(date)] Flutter installation complete!" >> "$LOG_FILE"
