# EKKO – Wave Therapeutic Device

Control interface for the EKKO dual-applicator therapy device, built for Raspberry Pi 3B+ with a 7-inch 800×480 touchscreen.

---

## Feature List

### Core Therapy Control
- **Dual independent applicators** — Applicator 1 and Applicator 2 run completely independently; starting, pausing, or stopping one has no effect on the other
- **30-minute timed sessions** — each session auto-completes at exactly 30 minutes with motor auto-shutoff
- **Start / Pause / Resume / Stop** — full session lifecycle control per applicator
- **Intensity control (0–10 scale)** — vertical slider with fine-step Min−/Max+ buttons for precise finger control
- **PWM motor speed control** — intensity maps directly to L298N motor driver PWM duty cycle (0–100%)
- **Pause limit enforcement** — maximum 2 pauses per session; exceeding the limit auto-closes the current session and opens a new one
- **Button debounce** — 200ms lockout after any button press prevents accidental double-taps on touchscreen

### Session Data & Integrity
- **Session ID** — every session gets a unique 8-character UUID
- **Full session record** — logs device ID, applicator name, date, start/end time, total elapsed seconds, active therapy seconds, pause count, average intensity, status, flags, stop reason
- **Fraud / integrity detection — 7 flags:**
  - `PAUSE_LIMIT_EXCEEDED` — more than 2 pauses used
  - `LOW_ACTIVE_RATIO` — active time less than 50% of total (sessions over 2 min)
  - `PREMATURE_STOP` — manually stopped before 5 minutes of therapy
  - `LOW_INTENSITY_SESSION` — average intensity at or below 2/10
  - `SLIDER_ZEROED_DURING_SESSION` — slider dragged to 0 while session was running
  - `RAPID_SESSION_RESTART` — new session started within 2 minutes of previous end
  - `CLOCK_MANIPULATION` — wall-clock drift vs monotonic clock exceeds 60 seconds
- **Session status tagging** — each record marked `COMPLETED`, `FLAGGED`, or `STOPPED`

### Data Storage & Export
- **Local CSV logging** — all sessions appended to `~/therapy_data/sessions.csv` automatically
- **CSV auto-created** — directory and file created on first run, no manual setup needed
- **USB auto-export** — insert a USB drive and within 2 seconds the CSV is copied to it as `therapy_sessions.csv`; works silently in the background
- **Duplicate-safe USB copy** — detects all mount points under `/media/` and `/mnt/`

### Server Upload
- **Automatic background upload** every 30 seconds when internet is available
- **Endpoint:** `POST https://clinic-app-api-848541761748.us-central1.run.app/api/v1/clinic/sessions`
- **Auth headers:** `Authorization: Bearer ABC12345678` + `X-Device-ID: EKKO_PI_001`
- **Payload:** JSON array of unsent session records
- **Sent-ID tracking** — `sent_ids.json` ensures each session is uploaded exactly once, even after reboots
- **Offline resilient** — missed uploads are retried automatically on the next cycle when connectivity returns
- **Online check** — tests connectivity to `8.8.8.8:53` before attempting upload (no wasted requests)

### WiFi Provisioning
- **Auto-detects WiFi connection** on startup
- **Hotspot mode** — if no network is found, the Pi becomes a WiFi access point named `EKKO_Setup` (password: `ekko1234`)
- **Captive portal** — any phone connected to `EKKO_Setup` and opening a browser is redirected to a WiFi setup page
- **Phone-based credential entry** — user enters home WiFi SSID + password on their phone; no keyboard needed on the device
- **Persistent credential storage** — saves to `/etc/wpa_supplicant/wpa_supplicant.conf` using `wpa_passphrase` (secure hashing), survives reboots
- **Duplicate SSID handling** — existing blocks for the same network are replaced, not duplicated
- **Auto-reconnect** — after credentials are saved, hotspot tears down and Pi connects to the submitted network automatically
- **Live status bar** — on-screen WiFi indicator shows current SSID (teal) or setup instructions (amber warning) or idle state

### Hardware & GPIO
- **L298N dual motor driver** — BCM GPIO pins 14/15/19 (Applicator 1) and 23/24/25 (Applicator 2)
- **PWM at 1000 Hz** — smooth motor speed control on both channels
- **Motor direction control** — `IN1/IN2` and `IN3/IN4` pins set direction; enable pins carry PWM signal
- **Safe shutdown** — all motor pins driven LOW on stop/pause/session-end

### UI & Touchscreen
- **Optimised for 800×480 Pi 7" official touchscreen** — all rows sized from actual screen height, no overflow
- **Kiosk fullscreen** — launches fullscreen, no window decorations, no taskbar
- **No mouse cursor** — hidden at both the Kivy config level and window level
- **Touch-optimised buttons** — ~168px wide finger targets with 5px physical press-indent feel + colour flash on touch
- **Colour-coded button feedback** — Start (teal-green), Pause (amber), Stop (red), Min/Max (bright teal)
- **Live timers** — per-applicator elapsed time in `HH:MM:SS`, updated every second
- **Session info strip** — shows pause count, remaining time, or paused/complete state per applicator
- **Splash screen** — EKKO logo displayed for 2 seconds on boot before main UI loads
- **EKKO logo + RiseTech logo** — both properly stretched with aspect ratio preserved

### Performance (Pi 3B+ Tuned)
- **30 fps cap** — GPU not overloaded; more than sufficient for a touch kiosk
- **100ms UI loop** — timer updates once per second only; idle loop does near-zero work
- **Label dirty-checking** — labels only re-rendered when text actually changes (prevents unnecessary GPU texture rebuilds)
- **Single `datetime.now()` per tick** — no redundant system calls
- **Minimal canvas objects per button** — sheen layer removed; each button is fill + border only
- **Warning-level logging only** — no debug I/O overhead
- **Daemon background threads** — WiFi manager, data uploader, and USB watcher run independently without blocking the UI

### Autostart & Deployment
- **Systemd service (`ekko.service`)** — app starts automatically on every power-on, restarts on crash
- **One-shot setup script (`setup_pi.sh`)** — installs all dependencies, registers service, configures auto-login and cursor hiding in one command
- **No login prompt** — Pi boots straight to desktop then straight into the app

---

## Requirements

**Hardware**
- Raspberry Pi 3B+
- 7-inch official Raspberry Pi touchscreen (800×480)
- L298N motor driver connected to GPIO pins 14, 15, 19, 23, 24, 25

**Python Libraries**
```bash
sudo apt install python3-kivy hostapd dnsmasq wireless-tools
pip3 install RPi.GPIO requests
```

> All other imports (`csv`, `threading`, `socket`, etc.) are Python standard library.

---

## Run

```bash
cd /home/umer/Desktop/EKKO
DISPLAY=:0 python3 ekko_app.py
```

---

## Project Structure

```
EKKO/
├── ekko_app.py          # Main application (single file)
├── ekko.service         # Systemd autostart service
├── setup_pi.sh          # One-shot Pi setup script
└── assets/
    ├── ekko_logo.jpg    # EKKO brand logo
    └── risetech_logo.jpg
```

---

## Configuration

Edit the constants at the top of `ekko_app.py`:

| Constant | Default | Description |
|---|---|---|
| `DEVICE_ID` | `EKKO_PI_001` | Unique ID per physical device |
| `SERVER_URL` | *(set)* | API endpoint for session uploads |
| `SERVER_API_KEY` | *(set)* | Bearer token for server auth |
| `SESSION_DURATION_SECONDS` | `1800` | Session length (30 min) |
| `MAX_PAUSES_PER_SESSION` | `2` | Pauses before a new session is forced |
| `WIFI_HOTSPOT_SSID` | `EKKO_Setup` | Hotspot name shown on phones |
| `WIFI_HOTSPOT_PASSWORD` | `ekko1234` | Hotspot password |

---

## Deploying to Pi 3B+

1. Copy the project to the Pi:
   ```bash
   rsync -av /home/umer/Desktop/EKKO/ pi@<PI_IP>:/home/pi/EKKO/
   ```

2. Run the setup script once:
   ```bash
   sudo bash /home/pi/EKKO/setup_pi.sh
   sudo reboot
   ```

The app will start automatically on every boot — fullscreen, no cursor, no terminal.

---

## WiFi Provisioning Flow

1. On boot, if no WiFi is configured the Pi broadcasts hotspot `EKKO_Setup` (password: `ekko1234`)
2. Connect your phone to `EKKO_Setup`
3. Open any browser — you will be redirected to the setup page automatically
4. Enter your WiFi network name and password and tap **Connect & Save**
5. The hotspot closes, the Pi connects to your network, and future boots connect automatically
