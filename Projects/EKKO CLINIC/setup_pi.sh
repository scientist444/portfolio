#!/bin/bash
# EKKO Pi 3B+ Setup Script
# Run once on the Pi after copying the project:
#   sudo bash setup_pi.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_USER="${SUDO_USER:-pi}"
APP_HOME="/home/$APP_USER"

echo "=== EKKO Setup for Raspberry Pi 3B+ ==="

# 1. System packages
echo "[1/7] Installing system dependencies..."
apt-get update -q
apt-get install -y \
    python3-kivy \
    python3-pip \
    hostapd \
    dnsmasq \
    wireless-tools \
    wpasupplicant \
    rfkill \
    xserver-xorg \
    xinit \
    openbox

# 2. Python packages + pigpio daemon
echo "[2/7] Installing Python packages..."
apt-get install -y pigpio python3-pigpio
pip3 install --break-system-packages 'pymongo[srv]' pillow 2>/dev/null \
    || pip3 install 'pymongo[srv]' pillow
# pigpiod must run at boot — ekko_app.py connects to it for DMA PWM
systemctl enable pigpiod
systemctl start  pigpiod

# 3. Hide mouse cursor system-wide (unclutter)
apt-get install -y unclutter

# 4. WiFi hotspot preparation
echo "[3/7] Configuring WiFi hotspot services..."
# Add user to netdev group (allows nmcli hotspot via NetworkManager polkit)
usermod -a -G netdev "$APP_USER"
# Unmask hostapd (it is masked by default on Pi OS – app controls it directly)
systemctl unmask hostapd 2>/dev/null || true
# Disable hostapd and dnsmasq as system services so the app can start/stop
# them itself without systemd interfering
systemctl disable hostapd 2>/dev/null || true
systemctl stop    hostapd 2>/dev/null || true
systemctl disable dnsmasq 2>/dev/null || true
systemctl stop    dnsmasq 2>/dev/null || true

# 5. Install systemd service
echo "[4/7] Installing systemd service..."
cp "$SCRIPT_DIR/ekko.service" /etc/systemd/system/ekko.service
# Replace hardcoded 'EKKO' username with the actual logged-in user
sed -i "s/User=EKKO/User=$APP_USER/g"       /etc/systemd/system/ekko.service
sed -i "s/Group=EKKO/Group=$APP_USER/g"     /etc/systemd/system/ekko.service
sed -i "s|/home/EKKO|/home/$APP_USER|g"     /etc/systemd/system/ekko.service
systemctl daemon-reload
systemctl enable ekko.service

# 6. Configure boot to desktop (auto-login)
echo "[5/7] Configuring auto-login..."
raspi-config nonint do_boot_behaviour B4   # Desktop auto-login

# Suppress mouse cursor via X11 config
echo "[6/7] Hiding mouse cursor in X11..."
mkdir -p /etc/X11/xorg.conf.d
cat > /etc/X11/xorg.conf.d/99-no-cursor.conf << 'XEOF'
Section "ServerFlags"
    Option "BlankTime"  "0"
    Option "StandbyTime" "0"
    Option "SuspendTime" "0"
    Option "OffTime" "0"
EndSection
XEOF

# Configure unclutter to hide cursor after 0 seconds idle
mkdir -p /etc/xdg/autostart
cat > /etc/xdg/autostart/unclutter.desktop << 'UEOF'
[Desktop Entry]
Type=Application
Name=Unclutter
Exec=unclutter -idle 0 -root
Hidden=false
X-GNOME-Autostart-enabled=true
UEOF

# 7. XDG autostart .desktop (primary GUI launch — fires after X is fully ready)
echo "[7/7] Configuring autostart..."
AUTOSTART_DIR="$APP_HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"
cat > "$AUTOSTART_DIR/ekko.desktop" << DEOF
[Desktop Entry]
Type=Application
Name=EKKO Clinic
Exec=bash -c 'cd /home/$APP_USER/Desktop/EKKO && DISPLAY=:0 python3 ekko_app.py'
Hidden=false
X-GNOME-Autostart-enabled=true
DEOF
chown "$APP_USER:$APP_USER" "$AUTOSTART_DIR/ekko.desktop"

# Openbox autostart (fallback for bare openbox sessions)
OPENBOX_DIR="$APP_HOME/.config/openbox"
mkdir -p "$OPENBOX_DIR"
cat > "$OPENBOX_DIR/autostart" << OEOF
# Hide cursor
unclutter -idle 0 -root &
# Start EKKO app (only if not already launched by XDG autostart)
pgrep -f ekko_app.py >/dev/null || (cd /home/$APP_USER/Desktop/EKKO && DISPLAY=:0 python3 ekko_app.py &)
OEOF
chown -R "$APP_USER:$APP_USER" "$OPENBOX_DIR"

# 8. EKKO boot splash — replace Pi rainbow/logo with EKKO logo
echo "[8/8] Configuring EKKO boot splash..."

# Install Plymouth (lightweight boot splash framework)
apt-get install -y plymouth plymouth-themes

THEME_DIR="/usr/share/plymouth/themes/ekko"
mkdir -p "$THEME_DIR"

# Resize logo to 300x300 using Pillow (already installed above)
python3 - "$SCRIPT_DIR/assets/ekko_logo.png" "$THEME_DIR/ekko_logo.png" << 'PYEOF'
import sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
img = Image.open(src).convert('RGBA')
img.thumbnail((300, 300), Image.LANCZOS)
bg = Image.new('RGBA', (300, 300), (0, 0, 0, 255))
bg.paste(img, ((300 - img.width) // 2, (300 - img.height) // 2), img)
bg.convert('RGB').save(dst)
PYEOF

# Plymouth theme descriptor
cat > "$THEME_DIR/ekko.plymouth" << 'PLYEOF'
[Plymouth Theme]
Name=EKKO
Description=EKKO Clinic
ModuleName=script

[script]
ImageDir=/usr/share/plymouth/themes/ekko
ScriptFile=/usr/share/plymouth/themes/ekko/ekko.script
PLYEOF

# Plymouth script: centre logo on black background
cat > "$THEME_DIR/ekko.script" << 'SCREOF'
screen_width  = Window.GetWidth();
screen_height = Window.GetHeight();
logo          = Image("ekko_logo.png");
s             = Sprite(logo);
s.SetX((screen_width  - logo.GetWidth())  / 2);
s.SetY((screen_height - logo.GetHeight()) / 2);
SCREOF

# Activate the theme and rebuild initrd
plymouth-set-default-theme -R ekko

# Determine boot partition location (Bookworm uses /boot/firmware/, older /boot/)
if   [ -f /boot/firmware/config.txt ];  then BOOT_CFG="/boot/firmware/config.txt"
elif [ -f /boot/config.txt ];           then BOOT_CFG="/boot/config.txt"
else BOOT_CFG=""; fi

if   [ -f /boot/firmware/cmdline.txt ]; then BOOT_CMD="/boot/firmware/cmdline.txt"
elif [ -f /boot/cmdline.txt ];          then BOOT_CMD="/boot/cmdline.txt"
else BOOT_CMD=""; fi

# Disable the rainbow splash square that appears before Plymouth
if [ -n "$BOOT_CFG" ]; then
    grep -q "^disable_splash" "$BOOT_CFG" || echo "disable_splash=1" >> "$BOOT_CFG"
fi

# Add splash + quiet + logo.nologo to kernel cmdline
if [ -n "$BOOT_CMD" ]; then
    # Remove any existing splash/quiet/logo flags first, then re-add cleanly
    sed -i 's/ splash//g;  s/ quiet//g;  s/ logo\.nologo//g' "$BOOT_CMD"
    sed -i 's/$/ splash quiet logo.nologo/' "$BOOT_CMD"
fi

echo ""
echo "=== Setup complete! ==="
echo "Reboot the Pi: sudo reboot"
echo "The EKKO app will start automatically on every boot."
