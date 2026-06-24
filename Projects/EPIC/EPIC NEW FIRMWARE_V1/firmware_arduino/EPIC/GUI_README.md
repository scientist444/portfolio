# EPIC Python Visualizer

This GUI reads the firmware's existing USB serial output:

```text
t_ms,ax,ay,az,gx,gy,gz,ir,red,emg_filtered,emg_envelope,ppgAC
[VITALS] HR=75.0 spo2=98.0 rmssd=28.0ms sdnn=41.0ms conf=88% PI=1.20% SNR=18.0dB mot=1 valid=1
```

## Run

```powershell
pip install -r requirements.txt
python epic_visualizer.py
```

Use the same baud rate as the firmware: `115200`.

## What it shows

- Heart rate, SpO2, confidence, PI, SNR, motion state, valid flag
- Live PPG IR/red DC plot
- Live PPG AC plot
- Live EMG filtered/envelope plot
- Live motion plot derived from gyro values
- Optional CSV recording from the GUI

## Test Without Hardware

Press `Demo` to generate fake EPIC data and verify the GUI is working.
