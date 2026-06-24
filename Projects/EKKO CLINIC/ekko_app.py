# ekko_app.py — EKKO Clinic therapy device controller
# Raspberry Pi 3B+ | 800x480 7" touchscreen | Kivy 2.x

import os, sys, csv, uuid, json, time, socket, threading, shutil, subprocess, re, math
import datetime
from pathlib import Path

# ── Single-instance guard (MUST run before GPIO / Kivy / threads) ──────────
# The Pi launches the app from more than one place (systemd ekko.service AND
# the XDG autostart .desktop).  Two live instances both read the touchscreen
# and both log every session → DUPLICATE records with the same start/end time
# but different session_id and avg_intensity.  Bind a fixed loopback port as a
# lock: if it is already held, another EKKO is running, so this copy exits.
_SINGLE_INSTANCE_PORT = 47921

def _acquire_single_instance_lock():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(('127.0.0.1', _SINGLE_INSTANCE_PORT))
        s.listen(1)
        return s            # keep the socket alive for the whole process life
    except OSError:
        return None

_INSTANCE_LOCK = _acquire_single_instance_lock()
if _INSTANCE_LOCK is None:
    print('EKKO is already running — exiting this duplicate instance.')
    sys.exit(0)

# ── Environment (must precede all kivy imports) ────────────────────────────
os.environ['KIVY_GL_BACKEND'] = 'gl'
os.environ['KIVY_WINDOW']     = 'sdl2'

from kivy.config import Config
Config.set('graphics', 'width',  '800')
Config.set('graphics', 'height', '480')
Config.set('graphics', 'maxfps', '30')
Config.set('input',    'mouse',  'mouse,disable_multitouch')
Config.set('kivy',     'log_level', 'warning')

import kivy
kivy.require('2.1.0')

from kivy.app import App
from kivy.uix.button import Button
from kivy.uix.gridlayout import GridLayout
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.slider import Slider
from kivy.clock import Clock
from kivy.uix.label import Label
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.image import Image as kImage
from kivy.uix.widget import Widget
from kivy.core.window import Window
from kivy.graphics import Color, Line, Ellipse

# ── Touch boundary helper ─────────────────────────────────────────────────
class TouchBoundaryPanel(GridLayout):
    """
    Hard touch boundary: only dispatches ANY touch event to children if that
    specific touch UID originated (touch_down) within this panel's bounding box.

    This stops slider drags from leaking on_touch_move / on_touch_up into
    adjacent button columns or the opposite applicator panel, regardless of
    how far the user's finger wanders across the screen.

    The slider widget still receives its events via Kivy's grab mechanism
    (which bypasses the panel tree entirely) so dragging continues to work
    even when the finger moves outside the panel.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._owned_uids: set = set()

    def on_touch_down(self, touch):
        if not self.collide_point(*touch.pos):
            return False
        self._owned_uids.add(touch.uid)
        return super().on_touch_down(touch)

    def on_touch_move(self, touch):
        if touch.uid not in self._owned_uids:
            return False
        return super().on_touch_move(touch)

    def on_touch_up(self, touch):
        owned = touch.uid in self._owned_uids
        self._owned_uids.discard(touch.uid)
        if not owned:
            return False
        return super().on_touch_up(touch)

# ── Slider that locks out all buttons while a finger is on it ─────────────
class TherapySlider(Slider):
    """
    Plain kiosk slider — sensitivity='all' so track-taps work.
    All ghost-touch locking is handled centrally by ControlPage;
    no lock logic lives here.
    """
    pass


# ── WiFi status icon (mobile-style symbol, no text) ───────────────────────
class WiFiIcon(Widget):
    """
    Pure-canvas WiFi glyph — a base dot plus three concentric arcs fanning
    upward, exactly like the signal indicator on a phone.

    The symbol is ALWAYS drawn (no text ever appears on screen):
      • connected     → bright teal
      • not connected → dim grey
    It is display-only; it never grabs or dispatches touches, so it cannot
    contribute to any accidental clicks.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.size_hint = (None, None)
        self.size      = (30, 24)
        self._connected = False
        self.bind(pos=self._redraw, size=self._redraw)

    def set_connected(self, connected: bool):
        connected = bool(connected)
        if connected != self._connected:
            self._connected = connected
            self._redraw()

    def _redraw(self, *args):
        self.canvas.clear()
        with self.canvas:
            if self._connected:
                Color(0, 0.8, 0.8, 1)      # teal — online
            else:
                Color(0.4, 0.4, 0.4, 1)    # dim grey — offline
            cx = self.center_x
            by = self.y + 3                # base dot sits near the bottom
            d  = 4
            Ellipse(pos=(cx - d / 2, by - d / 2), size=(d, d))
            # three upward-fanning arcs (0deg = top, +/-45deg span)
            for r in (6, 11, 16):
                Line(circle=(cx, by, r, -45, 45), width=1.6)

    # Display-only: swallow nothing, dispatch nothing.
    def on_touch_down(self, touch):
        return False


# ── GPIO via pigpio (DMA-based PWM — hardware-timed, no scheduler jitter) ─
try:
    import pigpio as _pigpio
    _pi   = _pigpio.pi()
    _GPIO = _pi.connected
except Exception:
    _GPIO = False
    _pi   = None

# ══════════════════════════════════════════════════════════════════════════
#  Constants
# ══════════════════════════════════════════════════════════════════════════
DEVICE_ID            = 'EKKO_PI_001'

# ── MongoDB Atlas (data sink) ──────────────────────────────────────────────
MONGO_URI            = 'mongodb+srv://admin:EKK9492D94@ekko-staging.s88uf88.mongodb.net/'
MONGO_DB_NAME        = 'ekko-clinic'
MONGO_COLLECTION     = 'Sessions'   # existing collection in ekko-clinic (note: plural)

SESSION_DURATION_SEC = 1800   # 30 minutes
MAX_PAUSES           = 2

# Hard-coded WiFi network the device always connects to (no setup hotspot).
WIFI_SSID            = 'umer'
WIFI_PASSWORD        = '12345678'

# Keep-alive: free MongoDB Atlas M0 clusters auto-pause after long inactivity.
# A tiny ping this often (while the app runs) keeps the cluster awake.
KEEPALIVE_SEC = 6 * 3600   # every 6 hours

DATA_DIR      = Path.home() / 'therapy_data'
CSV_PATH      = DATA_DIR / 'sessions.csv'
SENT_IDS_PATH = DATA_DIR / 'sent_ids.json'

CSV_HEADERS = [
    'session_id', 'device_id', 'device_name', 'date', 'start_time',
    'end_time', 'total_elapsed_seconds', 'active_seconds',
    'pause_count', 'avg_intensity', 'status', 'cheating_flags', 'stop_reason',
]

# PWM duty cycle (pigpio counts): speed level 0-10 → PWM 40-140, +10 per step.
#   speed 0 = 40,  speed 1 = 50,  speed 2 = 60 ... speed 10 = 140
def _duty(level: float) -> int:
    lvl = int(round(level))
    lvl = 0 if lvl < 0 else (10 if lvl > 10 else lvl)
    return 40 + lvl * 10

# GPIO BCM pins
IN1, IN2, EN1 = 14, 15, 19
IN3, IN4, EN2 = 23, 24, 25
_PWM_HZ = 100   # 100 Hz — optimal resonance range for ERM cylinder motors

# ── GPIO init ──────────────────────────────────────────────────────────────
if _GPIO:
    for _pin in (IN1, IN2, EN1, IN3, IN4, EN2):
        _pi.set_mode(_pin, _pigpio.OUTPUT)
    for _pin in (IN1, IN2, IN3, IN4):
        _pi.write(_pin, 0)
    _pi.set_PWM_frequency(EN1, _PWM_HZ)
    _pi.set_PWM_frequency(EN2, _PWM_HZ)
    _pi.set_PWM_dutycycle(EN1, 0)
    _pi.set_PWM_dutycycle(EN2, 0)

# ── Data-storage init ──────────────────────────────────────────────────────
DATA_DIR.mkdir(parents=True, exist_ok=True)
if not CSV_PATH.exists():
    with open(CSV_PATH, 'w', newline='') as _f:
        csv.writer(_f).writerow(CSV_HEADERS)


# ══════════════════════════════════════════════════════════════════════════
#  Session State
# ══════════════════════════════════════════════════════════════════════════
class SessionState:
    """Tracks a single therapy session for one applicator."""

    def __init__(self, applicator_name: str):
        self.applicator       = applicator_name
        self._prev_end_mono   = None   # kept across resets for RAPID_SESSION_RESTART
        self.reset()

    # ── reset (called by start(); does NOT touch _prev_end_mono) ──────────
    def reset(self):
        self.session_id          = None
        self.start_wall          = None
        self.start_mono          = None
        self.status              = None   # None | running | paused | completed
        self.pause_count         = 0
        self._pause_start_mono   = None
        self._total_paused_sec   = 0.0
        self._intensity_samples  = []
        self._weighted_sum       = 0.0   # Σ(level × seconds at that level, while running)
        self._weighted_time      = 0.0   # Σ(seconds spent running)

    # ── computed ───────────────────────────────────────────────────────────
    @property
    def total_elapsed(self):
        return 0.0 if self.start_mono is None else time.monotonic() - self.start_mono

    @property
    def paused_seconds(self):
        extra = (time.monotonic() - self._pause_start_mono
                 if self.status == 'paused' and self._pause_start_mono else 0.0)
        return self._total_paused_sec + extra

    @property
    def active_seconds(self):
        return max(0.0, self.total_elapsed - self.paused_seconds)

    @property
    def remaining_seconds(self):
        return max(0.0, SESSION_DURATION_SEC - self.active_seconds)

    # ── lifecycle ──────────────────────────────────────────────────────────
    def start(self):
        self.reset()
        self.session_id  = uuid.uuid4().hex[:8].upper()
        self.start_wall  = datetime.datetime.now()
        self.start_mono  = time.monotonic()
        self.status      = 'running'

    def pause(self):
        if self.status == 'running':
            self._pause_start_mono = time.monotonic()
            self.pause_count      += 1
            self.status            = 'paused'

    def resume(self):
        if self.status == 'paused' and self._pause_start_mono:
            self._total_paused_sec += time.monotonic() - self._pause_start_mono
            self._pause_start_mono  = None
            self.status             = 'running'

    def record_intensity(self, level):
        # Kept for the integrity flags (e.g. SLIDER_ZEROED_DURING_SESSION):
        # records each value the slider takes while the session runs.
        if self.status == 'running':
            self._intensity_samples.append(level)

    def tick_intensity(self, level, dt):
        # Time-weighted accumulation — called every UI tick (~0.1 s) while
        # running.  avg_intensity = Σ(level×seconds) / Σ(seconds), so the
        # average reflects how long each intensity was actually held.
        if self.status == 'running' and dt > 0:
            self._weighted_sum  += level * dt
            self._weighted_time += dt

    def mark_ended(self):
        self._prev_end_mono = time.monotonic()

    # ── record / flags ─────────────────────────────────────────────────────
    def build_record(self, final_status: str, stop_reason: str = '') -> dict:
        # Time-weighted average intensity (falls back to a plain mean of the
        # samples, then 0, only when no running time was accumulated).
        if self._weighted_time > 0:
            avg_int = self._weighted_sum / self._weighted_time
        elif self._intensity_samples:
            avg_int = sum(self._intensity_samples) / len(self._intensity_samples)
        else:
            avg_int = 0.0
        flags    = self._compute_flags(final_status, avg_int)
        tagged   = 'FLAGGED' if flags else final_status
        end_wall = datetime.datetime.now()
        return {
            'session_id':            self.session_id,
            'device_id':             DEVICE_ID,
            'device_name':           self.applicator,
            'date':                  self.start_wall.strftime('%Y-%m-%d') if self.start_wall else '',
            'start_time':            self.start_wall.strftime('%H:%M:%S') if self.start_wall else '',
            'end_time':              end_wall.strftime('%H:%M:%S'),
            'total_elapsed_seconds': round(self.total_elapsed),
            'active_seconds':        round(self.active_seconds),
            'pause_count':           self.pause_count,
            'avg_intensity':         round(avg_int, 2),
            'status':                tagged,
            'cheating_flags':        '|'.join(flags) if flags else 'NONE',
            'stop_reason':           stop_reason,
        }

    def _compute_flags(self, final_status: str, avg_int: float) -> list:
        flags  = []
        active = self.active_seconds
        total  = self.total_elapsed

        if self.pause_count > MAX_PAUSES:
            flags.append('PAUSE_LIMIT_EXCEEDED')
        if total > 120 and active < total * 0.5:
            flags.append('LOW_ACTIVE_RATIO')
        if final_status == 'STOPPED' and active < 300:
            flags.append('PREMATURE_STOP')
        if avg_int <= 2.0:
            flags.append('LOW_INTENSITY_SESSION')
        if self._intensity_samples and any(v == 0 for v in self._intensity_samples):
            flags.append('SLIDER_ZEROED_DURING_SESSION')
        if (self._prev_end_mono is not None and self.start_mono is not None
                and (self.start_mono - self._prev_end_mono) < 120):
            flags.append('RAPID_SESSION_RESTART')
        if self.start_wall and self.start_mono:
            wall_el = (datetime.datetime.now() - self.start_wall).total_seconds()
            mono_el = time.monotonic() - self.start_mono
            if abs(wall_el - mono_el) > 60:
                flags.append('CLOCK_MANIPULATION')
        return flags


# ══════════════════════════════════════════════════════════════════════════
#  Data helpers
# ══════════════════════════════════════════════════════════════════════════
def save_session_record(record: dict):
    with open(CSV_PATH, 'a', newline='') as f:
        csv.DictWriter(f, fieldnames=CSV_HEADERS).writerow(record)
    _upload_event.set()   # wake upload worker — new session is ready to send


def _load_sent_ids() -> set:
    if SENT_IDS_PATH.exists():
        try:
            return set(json.loads(SENT_IDS_PATH.read_text()))
        except Exception:
            pass
    return set()


def _save_sent_ids(ids: set):
    SENT_IDS_PATH.write_text(json.dumps(list(ids)))


# ── Upload status (written by background thread, read by UI loop) ──────────
_upload_stats = {
    'total_sent':  0,        # cumulative sessions successfully uploaded this run
    'last_time':   None,     # 'HH:MM:SS' of last successful upload
    'last_error':  None,     # short error string, or None when last attempt was OK
    'pending':     0,        # rows waiting to be sent (refreshed each attempt)
}

# Event fired by save_session_record — wakes the upload worker immediately
_upload_event = threading.Event()

# ══════════════════════════════════════════════════════════════════════════
#  Background workers
# ══════════════════════════════════════════════════════════════════════════
def _usb_watcher():
    """Copy sessions.csv to any newly-inserted USB drive."""
    known: set = set()
    while True:
        try:
            mounts = []
            for base in ('/media', '/mnt'):
                bp = Path(base)
                if bp.exists():
                    for entry in bp.iterdir():
                        if entry.is_dir():
                            mounts.append(entry)
                            for sub in entry.iterdir():
                                if sub.is_dir():
                                    mounts.append(sub)
            current = {str(m) for m in mounts}
            for mp in (current - known):
                try:
                    shutil.copy2(CSV_PATH, Path(mp) / 'therapy_sessions.csv')
                except Exception:
                    pass
            known = current
        except Exception:
            pass
        time.sleep(2)


def _is_online() -> bool:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect(('8.8.8.8', 53))
        s.close()
        return True
    except Exception:
        return False


def _sanitize_row(row: dict) -> dict:
    """
    Prepare a CSV row for insertion into MongoDB.

    • Migrates old field names (applicator → device_name, etc.)
    • Keeps only the known session columns
    • Converts numeric fields to real numbers so Mongo stores them as
      numbers (queryable/aggregatable), not strings
    • Replaces NaN / Infinity with 0
    • Normalises string fields to clean ASCII
    """
    # ── Field-name migration (old code versions) ─────────────────────────
    if 'applicator' in row:
        row['device_name'] = row.pop('applicator')
    if 'active_therapy_seconds' in row:
        row['active_seconds'] = row.pop('active_therapy_seconds')
    if 'flags' in row:
        row['cheating_flags'] = row.pop('flags') or 'NONE'
    if not row.get('cheating_flags'):
        row['cheating_flags'] = 'NONE'

    # ── Keep only columns the table knows about ───────────────────────────
    row = {k: v for k, v in row.items() if k in CSV_HEADERS}

    # ── Numeric fields ────────────────────────────────────────────────────
    for field in ('total_elapsed_seconds', 'active_seconds', 'avg_intensity'):
        try:
            v = float(row[field])
            row[field] = 0.0 if (math.isnan(v) or math.isinf(v)) else v
        except (ValueError, KeyError, TypeError):
            row[field] = 0.0

    try:
        v = float(row['pause_count'])
        row['pause_count'] = 0 if (math.isnan(v) or math.isinf(v)) else int(v)
    except (ValueError, KeyError, TypeError):
        row['pause_count'] = 0

    # ── String fields — strip anything non-ASCII / non-printable ─────────
    # PostgreSQL raises error 22P05 (unsupported unicode escape sequence)
    # when a text value contains raw bytes or escape sequences it cannot
    # interpret.  Encoding to ASCII with 'replace' makes every string safe.
    for k, v in row.items():
        if isinstance(v, str):
            row[k] = v.encode('ascii', errors='replace').decode('ascii').strip()

    return row


def _upload_worker():
    """
    Upload unsent session records to MongoDB Atlas via pymongo.

    Trigger: fires immediately when save_session_record() sets _upload_event.
    Fallback: also wakes every 5 minutes so rows recorded while offline are
              retried automatically once the Pi reconnects.

    Idempotency: each session's session_id is used as the Mongo `_id`, so a
    re-sent row raises DuplicateKeyError and is simply marked as already done.
    Combined with sent_ids.json this guarantees every session lands exactly
    once, even across reboots.
    """
    try:
        from pymongo import MongoClient
        from pymongo.errors import DuplicateKeyError, PyMongoError
    except ImportError:
        _upload_stats['last_error'] = 'pymongo lib missing'
        return

    sent_ids       = _load_sent_ids()
    client         = None
    last_keepalive = 0.0   # monotonic ts of last keep-alive ping (0 → ping now)

    while True:
        # Block until a session is saved OR 5 minutes pass (offline retry)
        _upload_event.wait(timeout=300)
        _upload_event.clear()

        if not _is_online():
            _upload_stats['last_error'] = 'offline'
            continue

        try:
            if client is None:
                client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
            coll = client[MONGO_DB_NAME][MONGO_COLLECTION]

            # ── Keep-alive ping — keeps a free Atlas M0 cluster from auto-
            #    pausing after long inactivity, even on zero-session days ────
            now = time.monotonic()
            if now - last_keepalive >= KEEPALIVE_SEC:
                client.admin.command('ping')   # raises if unreachable
                last_keepalive = now

            rows = []
            with open(CSV_PATH, newline='', encoding='utf-8') as f:
                for row in csv.DictReader(f):
                    if row.get('session_id') not in sent_ids:
                        rows.append(_sanitize_row(dict(row)))

            _upload_stats['pending'] = len(rows)
            if not rows:
                _upload_stats['last_error'] = None
                continue

            # Insert one row at a time — a single bad row never blocks the rest
            upload_ok = 0
            last_err  = None
            for row in rows:
                sid = row.get('session_id')
                row['_id'] = sid          # session_id doubles as the Mongo _id
                try:
                    coll.insert_one(row)
                    sent_ids.add(sid)
                    upload_ok += 1
                except DuplicateKeyError:
                    sent_ids.add(sid)     # already in DB — count as done
                    upload_ok += 1
                except PyMongoError as ex:
                    # Connection/server problem — drop client, retry next cycle
                    last_err = str(ex)[:80]
                    client   = None
                    break

            _save_sent_ids(sent_ids)
            if upload_ok:
                _upload_stats['total_sent'] += upload_ok
                _upload_stats['last_time']   = datetime.datetime.now().strftime('%H:%M:%S')
                _upload_stats['pending']     = len(rows) - upload_ok
            _upload_stats['last_error'] = last_err

        except Exception as e:
            _upload_stats['last_error'] = str(e)[:80]
            client = None   # force a fresh connection on the next cycle


# ══════════════════════════════════════════════════════════════════════════
#  WiFi Manager
# ══════════════════════════════════════════════════════════════════════════
class WiFiManager:
    """
    Connects the device to a single hard-coded WiFi network (WIFI_SSID /
    WIFI_PASSWORD).  There is no setup hotspot and no captive portal.

    Runs in a daemon thread: it writes the credentials once, then polls the
    link every few seconds and pushes the live connection state to the
    on-screen WiFi icon.  If the link drops it issues a reconfigure so the
    Pi reconnects on its own.
    """

    POLL_SEC = 8

    def __init__(self, on_status):
        self._on_status = on_status   # callback(ssid_or_None) — called on main thread

    def start(self):
        self._ensure_credentials()
        while True:
            ssid = self._current_ssid()
            Clock.schedule_once(lambda dt, s=ssid: self._on_status(s), 0)
            if not ssid:
                self._reconnect()
            time.sleep(self.POLL_SEC)

    def _current_ssid(self):
        # NetworkManager (Bookworm) first — most reliable on this Pi.
        try:
            out = subprocess.check_output(
                ['nmcli', '-t', '-f', 'active,ssid', 'dev', 'wifi'],
                stderr=subprocess.DEVNULL,
            ).decode()
            for line in out.splitlines():
                if line.startswith('yes:'):
                    ssid = line.split(':', 1)[1].strip()
                    return ssid or None
        except Exception:
            pass
        # Fallback: iwgetid (use full paths — /usr/sbin not always on PATH).
        for path in ('iwgetid', '/usr/sbin/iwgetid', '/sbin/iwgetid'):
            try:
                out = subprocess.check_output(
                    [path, '-r'], stderr=subprocess.DEVNULL
                ).decode().strip()
                if out:
                    return out
            except Exception:
                continue
        return None

    def _ensure_credentials(self):
        """Write the hard-coded network into wpa_supplicant.conf once."""
        try:
            conf = Path('/etc/wpa_supplicant/wpa_supplicant.conf')
            existing = conf.read_text() if conf.exists() else ''
            if f'ssid="{WIFI_SSID}"' not in existing:
                result = subprocess.check_output(
                    ['wpa_passphrase', WIFI_SSID, WIFI_PASSWORD]
                ).decode()
                m = re.search(r'network=\{.*?\}', result, re.DOTALL)
                if m:
                    conf.write_text(existing.rstrip() + '\n' + m.group(0) + '\n')
            subprocess.run(['sudo', 'wpa_cli', '-i', 'wlan0', 'reconfigure'], check=False)
        except Exception:
            pass

    def _reconnect(self):
        try:
            subprocess.run(['sudo', 'wpa_cli', '-i', 'wlan0', 'reconfigure'], check=False)
        except Exception:
            pass


# ══════════════════════════════════════════════════════════════════════════
#  Kivy UI — identical layout to reference, EKKO logo only
# ══════════════════════════════════════════════════════════════════════════
class EkkoApp(App):
    def build(self):
        Window.fullscreen  = 'auto'
        Window.show_cursor = False
        sm = ScreenManager()

        s1 = Screen(name='SplashScreen')
        s1.add_widget(SplashScreen())
        sm.add_widget(s1)

        s2 = Screen(name='Controls')
        s2.add_widget(ControlPage())
        sm.add_widget(s2)

        self.screen_manager = sm
        return sm


class SplashScreen(GridLayout):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.rows = 3
        self.cols = 1
        Window.clearcolor = (0, 0, 0, 1)

        logo = kImage(
            height=Window.size[1] * 0.7, size_hint_y=None,
            source='assets/ekko_logo.png',
            allow_stretch=True, keep_ratio=True,
        )
        self.add_widget(logo)

        loading = Label(text='Initialising', font_size='20sp')
        bottom  = GridLayout(cols=3, height=Window.size[1] * 0.15,
                             size_hint_y=None, padding=[0, 0, 0, 10])
        bottom.add_widget(Label(text=''))
        bottom.add_widget(loading)
        bottom.add_widget(Label(text=''))
        self.add_widget(bottom)

        Clock.schedule_once(
            lambda dt: setattr(
                App.get_running_app().screen_manager, 'current', 'Controls'
            ), 2
        )


class ControlPage(GridLayout):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        Window.clearcolor  = (0, 0, 0, 1)
        self.rows          = 5   # wifi_bar | timer+logo | labels | controls | footer
        self.cols          = 1
        self._ui_locked   = False   # True for 300 ms after every touch_up (ghost absorber)
        self._active_uid  = None    # UID of the single touch currently being tracked
        self.buttons_ids_dict = {}
        self.sliders_ids_dict = {}

        self.sess1 = SessionState('Applicator 1')
        self.sess2 = SessionState('Applicator 2')

        # ── WiFi status bar (28 px) — icon only, no text ──────────────────
        ekko_top_label = Label(
            text='EKKO', font_size='14sp',
            color=(0, 0.8, 0.8, 1),
            size_hint_x=None, width=80,
        )
        self.wifi_icon = WiFiIcon()
        # Right-side holder keeps the fixed-size icon padded off the edge.
        _icon_holder = BoxLayout(orientation='horizontal', size_hint_x=None,
                                 width=44, padding=[0, 2, 10, 2])
        _icon_holder.add_widget(self.wifi_icon)
        _spacer = Label(text='', size_hint_x=1)
        wifi_bar = BoxLayout(orientation='horizontal', height=28, size_hint_y=None)
        wifi_bar.add_widget(ekko_top_label)
        wifi_bar.add_widget(_spacer)
        wifi_bar.add_widget(_icon_holder)
        self.add_widget(wifi_bar)

        # ── Row 1: Timers + Logo ──────────────────────────────────────────
        self.applicator_one_timer = Label(text='00:00:00', font_size=30)
        self.applicator_two_timer = Label(text='00:00:00', font_size=30)
        _logo_sz = int(Window.size[1] * 0.17)
        self.logo_2 = kImage(source='assets/ekko_logo.png',
                             allow_stretch=True, keep_ratio=True,
                             size_hint_x=None, width=_logo_sz)
        top_row = GridLayout(cols=3, height=_logo_sz,
                             size_hint_y=None, padding=[0, 8, 0, 4])
        top_row.add_widget(self.applicator_one_timer)
        top_row.add_widget(self.logo_2)
        top_row.add_widget(self.applicator_two_timer)
        self.add_widget(top_row)

        # ── Row 2: Applicator labels ──────────────────────────────────────
        self.device1_label = Label(text='Applicator 1', font_size=35,
                                   halign='center', valign='middle')
        self.device2_label = Label(text='Applicator 2', font_size=35,
                                   halign='center', valign='middle')
        second_row = GridLayout(cols=2, height=int(Window.size[1] * 0.08),
                                size_hint_y=None, padding=[0, 4, 0, 4])
        second_row.add_widget(self.device1_label)
        second_row.add_widget(self.device2_label)
        self.add_widget(second_row)

        # ── Row 3: Controls ───────────────────────────────────────────────
        # Device 1 — slider column
        self.device1_minbutton = Button(text='Min -', font_size=25,
                                        background_color=(0,0,0,0), halign='center')
        self.buttons_ids_dict['Decrement_Button_Device_1'] = self.device1_minbutton
        self.device1_minbutton.bind(on_release=self.decrement)

        self.device1_maxbutton = Button(text='Max +', font_size=25,
                                        background_color=(0,0,0,0), halign='center')
        self.buttons_ids_dict['Increment_Button_Device_1'] = self.device1_maxbutton
        self.device1_maxbutton.bind(on_release=self.increment)

        self.device1_level_control = TherapySlider(
            min=0, max=10, orientation='vertical',
            value_track=True, value_track_color=[1,0,0,1],
            size_hint_y=8, step=1, sensitivity='all',
        )
        self.sliders_ids_dict['Device1_Slider'] = self.device1_level_control
        self.device1_level_control.bind(value=self.value_change)

        d1_slider_grid = TouchBoundaryPanel(cols=1, rows=3, padding=[-10,0,0,0])
        d1_slider_grid.add_widget(self.device1_maxbutton)
        d1_slider_grid.add_widget(self.device1_level_control)
        d1_slider_grid.add_widget(self.device1_minbutton)

        # Device 1 — button column
        self.device1_startbutton = Button(text='Start Therapy', font_size=20,
                                          background_color=(0.5,0.85,0.90,1),
                                          width=175, size_hint_x=None)
        self.buttons_ids_dict['Start_Button_Device_1'] = self.device1_startbutton
        self.device1_startbutton.bind(on_release=self.start_button)

        self.device1_pausebutton = Button(text='Pause Therapy', font_size=20,
                                          background_color=(0.5,0.85,0.90,1),
                                          width=175, size_hint_x=None)
        self.buttons_ids_dict['Pause_Button_Device_1'] = self.device1_pausebutton
        self.device1_pausebutton.bind(on_release=self.pause_button)

        self.device1_stopbutton = Button(text='Stop Therapy', font_size=20,
                                         background_color=(0.5,0.85,0.90,1),
                                         width=175, size_hint_x=None)
        self.buttons_ids_dict['Stop_Button_Device_1'] = self.device1_stopbutton
        self.device1_stopbutton.bind(on_release=self.stop_button)

        d1_btn_grid = TouchBoundaryPanel(cols=1, rows=5, padding=[-10,0,0,0])
        d1_btn_grid.add_widget(Label(text=''))
        d1_btn_grid.add_widget(self.device1_startbutton)
        d1_btn_grid.add_widget(self.device1_pausebutton)
        d1_btn_grid.add_widget(self.device1_stopbutton)
        d1_btn_grid.add_widget(Label(text=''))

        device_1_grid = TouchBoundaryPanel(cols=2,
                                          height=int(Window.size[1] * 0.60),
                                          size_hint_y=None, padding=[0, 4, 0, 4])
        device_1_grid.add_widget(d1_slider_grid)
        device_1_grid.add_widget(d1_btn_grid)

        # Device 2 — slider column
        self.device2_minbutton = Button(text='Min -', font_size=25,
                                        background_color=(0,0,0,0), halign='center')
        self.buttons_ids_dict['Decrement_Button_Device_2'] = self.device2_minbutton
        self.device2_minbutton.bind(on_release=self.decrement)

        self.device2_maxbutton = Button(text='Max +', font_size=25,
                                        background_color=(0,0,0,0), halign='center')
        self.buttons_ids_dict['Increment_Button_Device_2'] = self.device2_maxbutton
        self.device2_maxbutton.bind(on_release=self.increment)

        self.device2_level_control = TherapySlider(
            min=0, max=10, orientation='vertical',
            value_track=True, value_track_color=[1,0,0,1],
            size_hint_y=8, step=1, sensitivity='all',
        )
        self.sliders_ids_dict['Device2_Slider'] = self.device2_level_control
        self.device2_level_control.bind(value=self.value_change)

        d2_slider_grid = TouchBoundaryPanel(cols=1, rows=3, padding=[-10,0,0,0])
        d2_slider_grid.add_widget(self.device2_maxbutton)
        d2_slider_grid.add_widget(self.device2_level_control)
        d2_slider_grid.add_widget(self.device2_minbutton)

        # Device 2 — button column
        self.device2_startbutton = Button(text='Start Therapy', font_size=20,
                                          background_color=(0.5,0.85,0.90,1),
                                          width=175, size_hint_x=None)
        self.buttons_ids_dict['Start_Button_Device_2'] = self.device2_startbutton
        self.device2_startbutton.bind(on_release=self.start_button)

        self.device2_pausebutton = Button(text='Pause Therapy', font_size=20,
                                          background_color=(0.5,0.85,0.90,1),
                                          width=175, size_hint_x=None)
        self.buttons_ids_dict['Pause_Button_Device_2'] = self.device2_pausebutton
        self.device2_pausebutton.bind(on_release=self.pause_button)

        self.device2_stopbutton = Button(text='Stop Therapy', font_size=20,
                                         background_color=(0.5,0.85,0.90,1),
                                         width=175, size_hint_x=None)
        self.buttons_ids_dict['Stop_Button_Device_2'] = self.device2_stopbutton
        self.device2_stopbutton.bind(on_release=self.stop_button)

        d2_btn_grid = TouchBoundaryPanel(cols=1, rows=5, padding=[-10,0,0,0])
        d2_btn_grid.add_widget(Label(text=' '))
        d2_btn_grid.add_widget(self.device2_startbutton)
        d2_btn_grid.add_widget(self.device2_pausebutton)
        d2_btn_grid.add_widget(self.device2_stopbutton)
        d2_btn_grid.add_widget(Label(text=' '))

        device_2_grid = TouchBoundaryPanel(cols=2,
                                          height=int(Window.size[1] * 0.60),
                                          size_hint_y=None, padding=[0, 4, 0, 4])
        device_2_grid.add_widget(d2_slider_grid)
        device_2_grid.add_widget(d2_btn_grid)

        devices_grid = GridLayout(cols=2, rows=1, padding=[0,0,0,0])
        devices_grid.add_widget(device_1_grid)
        devices_grid.add_widget(device_2_grid)
        self.add_widget(devices_grid)

        # ── Row 4: Footer — session info + copyright ──────────────────────
        self.session1_info = Label(text='', font_size='12sp',
                                   halign='center', valign='middle')
        self.session2_info = Label(text='', font_size='12sp',
                                   halign='center', valign='middle')
        self.all_rights_reserved = Label(
            text='', font_size=11,
            halign='center', valign='middle', text_size=self.size,
        )
        bottom_row = GridLayout(cols=3, height=int(Window.size[1] * 0.10),
                                size_hint_y=None, padding=[0, 4, 0, 4])
        bottom_row.add_widget(self.session1_info)
        bottom_row.add_widget(self.all_rights_reserved)
        bottom_row.add_widget(self.session2_info)
        self.add_widget(bottom_row)

        # ── Background threads ────────────────────────────────────────────
        threading.Thread(target=_usb_watcher,  daemon=True).start()
        threading.Thread(target=_upload_worker, daemon=True).start()
        threading.Thread(
            target=WiFiManager(self._wifi_status_update).start, daemon=True
        ).start()

        Clock.schedule_interval(self.update_counter, 0.1)

    # ── WiFi callback (called on main thread via Clock.schedule_once) ──────
    def _wifi_status_update(self, ssid):
        # Icon only — connected shows teal, disconnected shows dim grey.
        self.wifi_icon.set_connected(bool(ssid))

    # ── Exclusive-touch ghost-absorber ───────────────────────────────────
    #
    # Algorithm: "Single active UID + 300 ms post-touch cooldown"
    #
    # Pi resistive touchscreens produce bounce/ghost events for up to ~200 ms
    # after a real touch lifts.  This layer enforces:
    #   1. Only ONE touch UID is processed at a time (_active_uid).
    #      A second finger while the first is still down is absorbed.
    #   2. After touch_up, ALL new touches are absorbed for 300 ms (_ui_locked).
    #      This window covers the full Pi ghost-touch tail.
    #
    # Kivy's grab mechanism bypasses the widget tree (the grab dispatch goes
    # directly to the grabbing widget — our on_touch_move / on_touch_up never
    # see it).  Sliders therefore continue tracking the finger via their grab
    # even while _ui_locked is True, which is exactly the correct behaviour.
    #
    def on_touch_down(self, touch):
        if self._ui_locked:
            return True              # in post-touch cooldown — absorb ghost
        if self._active_uid is not None:
            return True              # another touch is live — absorb
        self._active_uid = touch.uid
        return super().on_touch_down(touch)

    def on_touch_move(self, touch):
        if touch.uid != self._active_uid:
            return True              # not the tracked touch — absorb
        return super().on_touch_move(touch)

    def on_touch_up(self, touch):
        if touch.uid == self._active_uid:
            self._active_uid = None
            self._ui_locked  = True
            Clock.schedule_once(
                lambda dt: setattr(self, '_ui_locked', False), 0.3
            )
        elif self._ui_locked:
            return True              # stray touch_up during cooldown — absorb
        return super().on_touch_up(touch)

    # ── Label dirty-check ─────────────────────────────────────────────────
    def _set_label(self, label, text):
        if label.text != text:
            label.text = text

    # ── Timer formatter ───────────────────────────────────────────────────
    def time_formatter(self, value):
        return f'0{value}' if value < 10 else str(value)

    # ── Motor helpers ─────────────────────────────────────────────────────
    def _motors_on(self, device: int, duty: int):
        if _GPIO:
            if device == 1:
                _pi.write(IN1, 1); _pi.write(IN2, 0)
                _pi.set_PWM_dutycycle(EN1, duty)
            else:
                _pi.write(IN3, 1); _pi.write(IN4, 0)
                _pi.set_PWM_dutycycle(EN2, duty)

    def _motors_off(self, device: int):
        if _GPIO:
            if device == 1:
                _pi.write(IN1, 0); _pi.write(IN2, 0)
                _pi.set_PWM_dutycycle(EN1, 0)
            else:
                _pi.write(IN3, 0); _pi.write(IN4, 0)
                _pi.set_PWM_dutycycle(EN2, 0)

    # ── Session save helper ───────────────────────────────────────────────
    def _end_and_save(self, sess: SessionState, final_status: str, stop_reason: str = ''):
        if not sess.session_id:
            return
        record = sess.build_record(final_status, stop_reason)
        sess.mark_ended()
        sess.session_id = None   # guard: prevents double-save
        threading.Thread(target=save_session_record, args=(record,), daemon=True).start()

    # ── Button handlers ───────────────────────────────────────────────────
    def start_button(self, instance):
        if instance == self.buttons_ids_dict['Start_Button_Device_1']:
            if self.sess1.status in ('running', 'paused'):
                return   # already active — guard against duplicate start
            self.sess1.start()
            self._motors_on(1, _duty(self.sliders_ids_dict['Device1_Slider'].value))
            self.buttons_ids_dict['Pause_Button_Device_1'].text = 'Pause Therapy'
        elif instance == self.buttons_ids_dict['Start_Button_Device_2']:
            if self.sess2.status in ('running', 'paused'):
                return
            self.sess2.start()
            self._motors_on(2, _duty(self.sliders_ids_dict['Device2_Slider'].value))
            self.buttons_ids_dict['Pause_Button_Device_2'].text = 'Pause Therapy'

    def pause_button(self, instance):
        if instance == self.buttons_ids_dict['Pause_Button_Device_1']:
            self._handle_pause(self.sess1, 'Pause_Button_Device_1', 'Device1_Slider', 1)
        elif instance == self.buttons_ids_dict['Pause_Button_Device_2']:
            self._handle_pause(self.sess2, 'Pause_Button_Device_2', 'Device2_Slider', 2)

    def _handle_pause(self, sess: SessionState, btn_key: str, slider_key: str, device: int):
        btn = self.buttons_ids_dict[btn_key]
        if sess.status == 'running':
            sess.pause()
            self._motors_off(device)
            btn.text = 'Resume Therapy'
        elif sess.status == 'paused':
            sess.resume()
            self._motors_on(device, _duty(self.sliders_ids_dict[slider_key].value))
            btn.text = 'Pause Therapy'

    def stop_button(self, instance):
        if instance == self.buttons_ids_dict['Stop_Button_Device_1']:
            if self.sess1.status not in ('running', 'paused'):
                return   # nothing to stop
            self._handle_stop(self.sess1, 'Device1_Slider', 'Pause_Button_Device_1', 1)
        elif instance == self.buttons_ids_dict['Stop_Button_Device_2']:
            if self.sess2.status not in ('running', 'paused'):
                return
            self._handle_stop(self.sess2, 'Device2_Slider', 'Pause_Button_Device_2', 2)

    def _handle_stop(self, sess: SessionState, slider_key: str, pause_btn_key: str, device: int):
        self._end_and_save(sess, 'STOPPED', 'manual_stop')
        self.sliders_ids_dict[slider_key].value = 0
        self._motors_off(device)
        self.buttons_ids_dict[pause_btn_key].text = 'Pause Therapy'
        sess.reset()

    def value_change(self, instance, level):
        if instance == self.sliders_ids_dict['Device1_Slider']:
            if self.sess1.status == 'running':
                if _GPIO: _pi.set_PWM_dutycycle(EN1, _duty(level))
            self.sess1.record_intensity(level)
        elif instance == self.sliders_ids_dict['Device2_Slider']:
            if self.sess2.status == 'running':
                if _GPIO: _pi.set_PWM_dutycycle(EN2, _duty(level))
            self.sess2.record_intensity(level)

    def increment(self, instance):
        if instance == self.buttons_ids_dict['Increment_Button_Device_1']:
            sl = self.sliders_ids_dict['Device1_Slider']
            if sl.value < 10: sl.value += 1
        elif instance == self.buttons_ids_dict['Increment_Button_Device_2']:
            sl = self.sliders_ids_dict['Device2_Slider']
            if sl.value < 10: sl.value += 1

    def decrement(self, instance):
        if instance == self.buttons_ids_dict['Decrement_Button_Device_1']:
            sl = self.sliders_ids_dict['Device1_Slider']
            if sl.value > 0: sl.value -= 1
        elif instance == self.buttons_ids_dict['Decrement_Button_Device_2']:
            sl = self.sliders_ids_dict['Device2_Slider']
            if sl.value > 0: sl.value -= 1

    # ── Session info strip text ───────────────────────────────────────────
    def _session_info_text(self, sess: SessionState) -> str:
        if sess.status == 'running':
            rem  = int(sess.remaining_seconds)
            m, s = divmod(rem, 60)
            return f'Rem: {m:02d}:{s:02d}'
        if sess.status == 'paused':
            return 'PAUSED'
        if sess.status == 'completed':
            return 'Session Complete'
        return ''

    # ── Main 100 ms update loop ───────────────────────────────────────────
    def update_counter(self, dt):
        for sess, timer_lbl, info_lbl, pause_key, device, slider_key in (
            (self.sess1, self.applicator_one_timer, self.session1_info,
             'Pause_Button_Device_1', 1, 'Device1_Slider'),
            (self.sess2, self.applicator_two_timer, self.session2_info,
             'Pause_Button_Device_2', 2, 'Device2_Slider'),
        ):
            if sess.status == 'running':
                sess.tick_intensity(self.sliders_ids_dict[slider_key].value, dt)
                active = sess.active_seconds
                if active >= SESSION_DURATION_SEC:
                    # Auto-complete at 30 min
                    self._end_and_save(sess, 'COMPLETED')
                    self._motors_off(device)
                    sess.status = 'completed'
                    self.buttons_ids_dict[pause_key].text = 'Pause Therapy'
                    self._set_label(timer_lbl, '30:00')
                else:
                    h, rem = divmod(int(active), 3600)
                    m, s   = divmod(rem, 60)
                    self._set_label(
                        timer_lbl,
                        f'{self.time_formatter(h)}:'
                        f'{self.time_formatter(m)}:'
                        f'{self.time_formatter(s)}'
                    )
            elif sess.status is None:
                self._set_label(timer_lbl, '00:00:00')

            self._set_label(info_lbl, self._session_info_text(sess))

        self._set_label(self.all_rights_reserved, '')


# ══════════════════════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    Window.fullscreen  = 'auto'
    Window.show_cursor = False
    EkkoApp().run()
