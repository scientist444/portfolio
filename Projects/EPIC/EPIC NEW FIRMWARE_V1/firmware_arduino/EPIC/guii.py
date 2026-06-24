import sys
import asyncio
import threading
from collections import deque

from bleak import BleakScanner, BleakClient
from PyQt5.QtCore import QObject, pyqtSignal, QTimer
from PyQt5.QtWidgets import (
    QApplication,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QGridLayout,
    QLabel,
    QPushButton,
    QTextEdit,
    QProgressBar,
    QGroupBox,
)
import pyqtgraph as pg


# ============================================================
# BLE CONFIG
# ============================================================

DEVICE_NAME = "EPIC_S3_Sensor"

SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"

VITALS_CHAR_UUID = "beb5483f-36e1-4688-b7f5-ea07361b26a8"
FEATURES_CHAR_UUID = "beb54840-36e1-4688-b7f5-ea07361b26a8"
CALIB_CHAR_UUID = "beb54841-36e1-4688-b7f5-ea07361b26a8"


STATUS_TEXT = {
    0: "WEAR DEVICE",
    1: "HOLD STILL",
    2: "ADJUST PPG SENSOR",
    3: "RELAX ARM",
    4: "CALIBRATING",
    5: "READY",
    6: "MEASURING",
    7: "CALIBRATION FAILED",
}


def ok_text(value: int) -> str:
    return "OK" if value else "NOT OK"


# ============================================================
# SIGNALS
# ============================================================

class BLESignals(QObject):
    status = pyqtSignal(str)
    vitals_data = pyqtSignal(str)
    features_data = pyqtSignal(str)
    calibration_data = pyqtSignal(str)


# ============================================================
# BLE CLIENT
# ============================================================

class EpicBLEClient:
    def __init__(self, signals: BLESignals):
        self.signals = signals
        self.client = None
        self.running = False

    async def connect(self):
        self.signals.status.emit("Scanning for EPIC_S3_Sensor...")

        device = await BleakScanner.find_device_by_filter(
            lambda d, ad: d.name and DEVICE_NAME in d.name,
            timeout=12.0,
        )

        if device is None:
            self.signals.status.emit("Device not found")
            return

        self.signals.status.emit(f"Found {device.name}. Connecting...")

        self.client = BleakClient(device)

        try:
            await self.client.connect()
        except Exception as e:
            self.signals.status.emit(f"Connection failed: {e}")
            return

        if not self.client.is_connected:
            self.signals.status.emit("Connection failed")
            return

        self.running = True
        self.signals.status.emit("Connected. Subscribing...")

        try:
            await self.client.start_notify(VITALS_CHAR_UUID, self.vitals_callback)
            await self.client.start_notify(FEATURES_CHAR_UUID, self.features_callback)
            await self.client.start_notify(CALIB_CHAR_UUID, self.calibration_callback)
        except Exception as e:
            self.signals.status.emit(f"Notify subscribe error: {e}")
            return

        self.signals.status.emit("Receiving BLE data...")

        while self.running and self.client and self.client.is_connected:
            await asyncio.sleep(0.1)

    async def disconnect(self):
        self.running = False

        if self.client and self.client.is_connected:
            try:
                await self.client.stop_notify(VITALS_CHAR_UUID)
                await self.client.stop_notify(FEATURES_CHAR_UUID)
                await self.client.stop_notify(CALIB_CHAR_UUID)
            except Exception:
                pass

            await self.client.disconnect()

        self.signals.status.emit("Disconnected")

    def vitals_callback(self, sender, data: bytearray):
        try:
            self.signals.vitals_data.emit(data.decode("utf-8").strip())
        except Exception as e:
            self.signals.status.emit(f"Vitals decode error: {e}")

    def features_callback(self, sender, data: bytearray):
        try:
            self.signals.features_data.emit(data.decode("utf-8").strip())
        except Exception as e:
            self.signals.status.emit(f"Features decode error: {e}")

    def calibration_callback(self, sender, data: bytearray):
        try:
            self.signals.calibration_data.emit(data.decode("utf-8").strip())
        except Exception as e:
            self.signals.status.emit(f"Calibration decode error: {e}")


# ============================================================
# GUI
# ============================================================

class MainWindow(QWidget):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("EPIC BLE Low-Power Dashboard")
        self.resize(1150, 780)

        self.signals = BLESignals()
        self.ble_client = EpicBLEClient(self.signals)

        self.loop = asyncio.new_event_loop()
        self.ble_thread = None

        self.feature_index = 0
        self.vitals_index = 0

        self.hr_x = deque(maxlen=200)
        self.hr_y = deque(maxlen=200)

        self.rmssd_x = deque(maxlen=200)
        self.rmssd_y = deque(maxlen=200)

        self.sdnn_x = deque(maxlen=200)
        self.sdnn_y = deque(maxlen=200)

        self.motion_x = deque(maxlen=200)
        self.motion_y = deque(maxlen=200)

        self.emg_zc_x = deque(maxlen=200)
        self.emg_zc_y = deque(maxlen=200)

        self.build_ui()
        self.connect_signals()

        self.plot_timer = QTimer()
        self.plot_timer.timeout.connect(self.update_plots)
        self.plot_timer.start(100)

    # ------------------------------------------------------------
    # UI
    # ------------------------------------------------------------

    def build_ui(self):
        main = QVBoxLayout()

        title = QLabel("EPIC ESP32-S3 BLE Sensor Dashboard — Low Power")
        title.setStyleSheet("font-size: 24px; font-weight: bold;")
        main.addWidget(title)

        self.connection_status = QLabel("Status: Not connected")
        self.connection_status.setStyleSheet("font-size: 16px;")
        main.addWidget(self.connection_status)

        btn_row = QHBoxLayout()

        self.connect_btn = QPushButton("Connect")
        self.disconnect_btn = QPushButton("Disconnect")

        self.connect_btn.clicked.connect(self.start_ble)
        self.disconnect_btn.clicked.connect(self.stop_ble)

        btn_row.addWidget(self.connect_btn)
        btn_row.addWidget(self.disconnect_btn)

        main.addLayout(btn_row)

        # ---------------- Calibration Box ----------------

        calib_box = QGroupBox("Calibration / Placement Check")
        calib_layout = QGridLayout()

        self.calib_status_label = QLabel("Device Status: --")
        self.calib_msg_label = QLabel("Message: --")
        self.calib_progress = QProgressBar()

        self.ppg_ok_label = QLabel("PPG: --")
        self.motion_ok_label = QLabel("Motion: --")
        self.emg_ok_label = QLabel("EMG: --")

        self.ir_label = QLabel("IR: --")
        self.motion_level_label = QLabel("Motion Level: --")
        self.emg_abs_label = QLabel("EMG Abs Baseline: --")
        self.emg_zc_label = QLabel("EMG ZC Baseline: --")

        calib_widgets = [
            self.calib_status_label,
            self.calib_msg_label,
            self.ppg_ok_label,
            self.motion_ok_label,
            self.emg_ok_label,
            self.ir_label,
            self.motion_level_label,
            self.emg_abs_label,
            self.emg_zc_label,
        ]

        for w in calib_widgets:
            w.setStyleSheet("font-size: 15px; padding: 5px;")

        calib_layout.addWidget(self.calib_status_label, 0, 0, 1, 2)
        calib_layout.addWidget(self.calib_msg_label, 0, 2, 1, 2)
        calib_layout.addWidget(self.calib_progress, 1, 0, 1, 4)

        calib_layout.addWidget(self.ppg_ok_label, 2, 0)
        calib_layout.addWidget(self.motion_ok_label, 2, 1)
        calib_layout.addWidget(self.emg_ok_label, 2, 2)

        calib_layout.addWidget(self.ir_label, 3, 0)
        calib_layout.addWidget(self.motion_level_label, 3, 1)
        calib_layout.addWidget(self.emg_abs_label, 3, 2)
        calib_layout.addWidget(self.emg_zc_label, 3, 3)

        calib_box.setLayout(calib_layout)
        main.addWidget(calib_box)

        # ---------------- Vitals Box ----------------

        vitals_box = QGroupBox("Vitals")
        vitals_layout = QGridLayout()

        self.hr_label = QLabel("HR: -- BPM")
        self.spo2_label = QLabel("SpO2: -- %")
        self.rmssd_label = QLabel("RMSSD: -- ms")
        self.sdnn_label = QLabel("SDNN: -- ms")
        self.confidence_label = QLabel("Confidence: -- %")
        self.pi_label = QLabel("PI: --")
        self.snr_label = QLabel("SNR: -- dB")
        self.valid_label = QLabel("Valid: --")
        self.motion_label = QLabel("Motion Class: --")

        vitals = [
            self.hr_label,
            self.spo2_label,
            self.rmssd_label,
            self.sdnn_label,
            self.confidence_label,
            self.pi_label,
            self.snr_label,
            self.valid_label,
            self.motion_label,
        ]

        for i, label in enumerate(vitals):
            label.setStyleSheet(
                "font-size: 16px; padding: 8px; border: 1px solid gray; border-radius: 6px;"
            )
            vitals_layout.addWidget(label, i // 3, i % 3)

        vitals_box.setLayout(vitals_layout)
        main.addWidget(vitals_box)

        # ---------------- Features Box ----------------

        features_box = QGroupBox("3-Second Algorithm Features")
        features_layout = QGridLayout()

        self.feat_hr_label = QLabel("Feature HR: --")
        self.feat_rmssd_label = QLabel("Feature RMSSD: --")
        self.feat_sdnn_label = QLabel("Feature SDNN: --")
        self.feat_motion_avg_label = QLabel("Avg Motion: --")
        self.feat_motion_std_label = QLabel("Std Motion: --")
        self.feat_zc_avg_label = QLabel("Avg EMG ZC: --")
        self.feat_zc_std_label = QLabel("Std EMG ZC: --")
        self.feat_ready_label = QLabel("Ready: --")
        self.feat_status_label = QLabel("Status Code: --")

        feature_widgets = [
            self.feat_hr_label,
            self.feat_rmssd_label,
            self.feat_sdnn_label,
            self.feat_motion_avg_label,
            self.feat_motion_std_label,
            self.feat_zc_avg_label,
            self.feat_zc_std_label,
            self.feat_ready_label,
            self.feat_status_label,
        ]

        for i, label in enumerate(feature_widgets):
            label.setStyleSheet("font-size: 15px; padding: 6px;")
            features_layout.addWidget(label, i // 3, i % 3)

        features_box.setLayout(features_layout)
        main.addWidget(features_box)

        # ---------------- Plots ----------------

        self.hr_plot = pg.PlotWidget(title="Heart Rate BPM")
        self.hr_curve = self.hr_plot.plot()

        self.rmssd_plot = pg.PlotWidget(title="RMSSD HRV")
        self.rmssd_curve = self.rmssd_plot.plot()

        self.sdnn_plot = pg.PlotWidget(title="SDNN HRV")
        self.sdnn_curve = self.sdnn_plot.plot()

        self.motion_plot = pg.PlotWidget(title="Average Motion Magnitude")
        self.motion_curve = self.motion_plot.plot()

        self.emg_zc_plot = pg.PlotWidget(title="Average EMG Zero Crossings")
        self.emg_zc_curve = self.emg_zc_plot.plot()

        main.addWidget(self.hr_plot)
        main.addWidget(self.rmssd_plot)
        main.addWidget(self.sdnn_plot)
        main.addWidget(self.motion_plot)
        main.addWidget(self.emg_zc_plot)

        self.log_box = QTextEdit()
        self.log_box.setReadOnly(True)
        self.log_box.setMaximumHeight(140)
        main.addWidget(self.log_box)

        self.setLayout(main)

    # ------------------------------------------------------------
    # SIGNAL CONNECTION
    # ------------------------------------------------------------

    def connect_signals(self):
        self.signals.status.connect(self.handle_status)
        self.signals.vitals_data.connect(self.handle_vitals)
        self.signals.features_data.connect(self.handle_features)
        self.signals.calibration_data.connect(self.handle_calibration)

    # ------------------------------------------------------------
    # BLE CONTROL
    # ------------------------------------------------------------

    def start_ble(self):
        if self.ble_thread and self.ble_thread.is_alive():
            self.handle_status("Already running")
            return

        self.ble_thread = threading.Thread(target=self.run_ble_loop, daemon=True)
        self.ble_thread.start()

    def run_ble_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self.ble_client.connect())

    def stop_ble(self):
        asyncio.run_coroutine_threadsafe(self.ble_client.disconnect(), self.loop)

    # ------------------------------------------------------------
    # HANDLERS
    # ------------------------------------------------------------

    def handle_status(self, msg: str):
        self.connection_status.setText(f"Status: {msg}")
        self.log_box.append(msg)

    def handle_vitals(self, text: str):
        # VITALS:
        # hr,spo2,rmssd,sdnn,confidence,pi,snr_db,motion,valid
        try:
            values = text.split(",")

            if len(values) != 9:
                self.log_box.append(f"Vitals length mismatch: {text}")
                return

            hr = float(values[0])
            spo2 = float(values[1])
            rmssd = float(values[2])
            sdnn = float(values[3])
            confidence = float(values[4])
            pi = float(values[5])
            snr = float(values[6])
            motion = int(values[7])
            valid = int(values[8])

            self.hr_label.setText(f"HR: {hr:.1f} BPM")
            self.spo2_label.setText(f"SpO2: {spo2:.1f} %")
            self.rmssd_label.setText(f"RMSSD: {rmssd:.1f} ms")
            self.sdnn_label.setText(f"SDNN: {sdnn:.1f} ms")
            self.confidence_label.setText(f"Confidence: {confidence:.0f} %")
            self.pi_label.setText(f"PI: {pi:.2f}")
            self.snr_label.setText(f"SNR: {snr:.1f} dB")
            self.valid_label.setText(f"Valid: {valid}")
            self.motion_label.setText(f"Motion Class: {motion}")

            self.vitals_index += 1
            self.hr_x.append(self.vitals_index)
            self.hr_y.append(hr)

        except Exception as e:
            self.log_box.append(f"Vitals parse error: {e} | {text}")

    def handle_features(self, text: str):
        # FEATURES:
        # hr,rmssd,sdnn,avg_motion,std_motion,avg_emg_zc,std_emg_zc,ready,status
        try:
            values = text.split(",")

            if len(values) != 9:
                self.log_box.append(f"Features length mismatch: {text}")
                return

            hr = float(values[0])
            rmssd = float(values[1])
            sdnn = float(values[2])
            avg_motion = float(values[3])
            std_motion = float(values[4])
            avg_zc = float(values[5])
            std_zc = float(values[6])
            ready = int(values[7])
            status = int(values[8])

            self.feature_index += 1

            self.feat_hr_label.setText(f"Feature HR: {hr:.1f} BPM")
            self.feat_rmssd_label.setText(f"Feature RMSSD: {rmssd:.1f} ms")
            self.feat_sdnn_label.setText(f"Feature SDNN: {sdnn:.1f} ms")
            self.feat_motion_avg_label.setText(f"Avg Motion: {avg_motion:.4f}")
            self.feat_motion_std_label.setText(f"Std Motion: {std_motion:.4f}")
            self.feat_zc_avg_label.setText(f"Avg EMG ZC: {avg_zc:.2f}")
            self.feat_zc_std_label.setText(f"Std EMG ZC: {std_zc:.2f}")
            self.feat_ready_label.setText(f"Ready: {ready}")
            self.feat_status_label.setText(
                f"Status Code: {status} ({STATUS_TEXT.get(status, 'UNKNOWN')})"
            )

            self.rmssd_x.append(self.feature_index)
            self.rmssd_y.append(rmssd)

            self.sdnn_x.append(self.feature_index)
            self.sdnn_y.append(sdnn)

            self.motion_x.append(self.feature_index)
            self.motion_y.append(avg_motion)

            self.emg_zc_x.append(self.feature_index)
            self.emg_zc_y.append(avg_zc)

        except Exception as e:
            self.log_box.append(f"Features parse error: {e} | {text}")

    def handle_calibration(self, text: str):
        # CALIB:
        # status,progress,ppg_ok,motion_ok,emg_ok,ir,motion,emg_abs,emg_zc,message
        try:
            values = text.split(",")

            if len(values) < 10:
                self.log_box.append(f"Calibration length mismatch: {text}")
                return

            status = int(values[0])
            progress = int(values[1])
            ppg_ok = int(values[2])
            motion_ok = int(values[3])
            emg_ok = int(values[4])
            ir = int(values[5])
            motion = float(values[6])
            emg_abs = float(values[7])
            emg_zc = float(values[8])
            message = ",".join(values[9:])

            status_name = STATUS_TEXT.get(status, "UNKNOWN")

            self.calib_progress.setValue(progress)

            self.calib_status_label.setText(
                f"Device Status: {status} ({status_name})"
            )
            self.calib_msg_label.setText(f"Message: {message}")

            self.ppg_ok_label.setText(f"PPG: {ok_text(ppg_ok)}")
            self.motion_ok_label.setText(f"Motion: {ok_text(motion_ok)}")
            self.emg_ok_label.setText(f"EMG: {ok_text(emg_ok)}")

            self.ir_label.setText(f"IR: {ir}")
            self.motion_level_label.setText(f"Motion Level: {motion:.1f}")
            self.emg_abs_label.setText(f"EMG Abs Baseline: {emg_abs:.1f}")
            self.emg_zc_label.setText(f"EMG ZC Baseline: {emg_zc:.2f}")

        except Exception as e:
            self.log_box.append(f"Calibration parse error: {e} | {text}")

    # ------------------------------------------------------------
    # PLOT UPDATE
    # ------------------------------------------------------------

    def update_plots(self):
        if len(self.hr_x) > 2:
            self.hr_curve.setData(list(self.hr_x), list(self.hr_y))

        if len(self.rmssd_x) > 2:
            self.rmssd_curve.setData(list(self.rmssd_x), list(self.rmssd_y))

        if len(self.sdnn_x) > 2:
            self.sdnn_curve.setData(list(self.sdnn_x), list(self.sdnn_y))

        if len(self.motion_x) > 2:
            self.motion_curve.setData(list(self.motion_x), list(self.motion_y))

        if len(self.emg_zc_x) > 2:
            self.emg_zc_curve.setData(list(self.emg_zc_x), list(self.emg_zc_y))


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    app = QApplication(sys.argv)

    win = MainWindow()
    win.show()

    sys.exit(app.exec_())