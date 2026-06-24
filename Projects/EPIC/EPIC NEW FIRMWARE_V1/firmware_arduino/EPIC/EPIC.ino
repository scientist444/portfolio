/*
 * ESP32-S3 Low-Power BLE Firmware
 * MAX30102 + MPU6050 + EMG
 *
 * Updated EMG calibration for new working EMG sensor.
 *
 * BLE Characteristics:
 *
 * VITALS:
 *   hr,spo2,rmssd,sdnn,confidence,pi,snr_db,motion,valid
 *
 * FEATURES:
 *   hr,rmssd,sdnn,avg_motion,std_motion,avg_emg_zc,std_emg_zc,ready,status
 *
 * CALIBRATION:
 *   status,progress,ppg_ok,motion_ok,emg_ok,ir,motion,emg_abs,emg_zc,message
 *
 * RAW BLE removed to save power.
 * Serial runtime printing removed to save power.
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#include <Wire.h>
#include "MAX30105.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include "EMGFilters.h"

// =====================================================================
// DEBUG
// =====================================================================

#define DEBUG_SERIAL 0

#if DEBUG_SERIAL
  #define DBG_BEGIN(x) Serial.begin(x)
  #define DBG_PRINT(x) Serial.print(x)
  #define DBG_PRINTLN(x) Serial.println(x)
#else
  #define DBG_BEGIN(x)
  #define DBG_PRINT(x)
  #define DBG_PRINTLN(x)
#endif

// =====================================================================
// PINS
// =====================================================================

#define I2C_SDA   1
#define I2C_SCL   2
#define EMG_PIN   5

// =====================================================================
// BLE UUIDs
// =====================================================================

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define VITALS_CHAR_UUID    "beb5483f-36e1-4688-b7f5-ea07361b26a8"
#define FEATURES_CHAR_UUID  "beb54840-36e1-4688-b7f5-ea07361b26a8"
#define CALIB_CHAR_UUID     "beb54841-36e1-4688-b7f5-ea07361b26a8"

// =====================================================================
// TIMING
// =====================================================================

#define DEBUG_BAUD             115200
#define VITALS_SEND_INTERVAL   1000
#define FEATURES_INTERVAL      3000
#define CALIB_SEND_INTERVAL    1500

// =====================================================================
// MAX30102
// =====================================================================

#define MAX_ADC_RANGE       4096
#define MAX_SAMPLE_RATE     100
#define MAX_SAMPLE_AVG      4
#define MAX_PULSE_WIDTH     411
#define MAX_LED_MODE        2

static uint8_t irPA  = 0x1F;
static uint8_t redPA = 0x0A;

// =====================================================================
// MPU6050
// =====================================================================

#define MPU_ACCEL_RANGE   MPU6050_RANGE_2_G
#define MPU_GYRO_RANGE    MPU6050_RANGE_250_DEG
#define MPU_FILTER_BW     MPU6050_BAND_21_HZ

// =====================================================================
// BASELINE THRESHOLDS
// =====================================================================

#define PPG_IR_MIN_GOOD          50000
#define PPG_IR_MAX_GOOD          240000

#define MOTION_STABLE_MAX        750.0
#define MOTION_MOVING_MAX        2500.0
#define MOTION_HIGH_MAX          8000.0
#define MOTION_STD_MAX           147.0

#define ACCEL_STD_STABLE_MAX     0.15

// Updated from new working EMG sensor calibration
#define EMG_ACTIVE_ABS_THR       290.0
#define EMG_ACTIVE_ENV_THR       75000.0
#define EMG_ACTIVE_ZC_THR        28.0

#define PPG_AC_STD_MIN           10.0

// =====================================================================
// OBJECTS
// =====================================================================

MAX30105 ppg;
Adafruit_MPU6050 mpu;

BLEServer* pServer = nullptr;
BLECharacteristic* pVitalsChar = nullptr;
BLECharacteristic* pFeaturesChar = nullptr;
BLECharacteristic* pCalibChar = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;

// =====================================================================
// LATEST SENSOR VALUES
// =====================================================================

uint32_t latestIR = 0;
uint32_t latestRed = 0;

float latestAx = 0;
float latestAy = 0;
float latestAz = 0;
float latestGx = 0;
float latestGy = 0;
float latestGz = 0;

float motionLevel = 0;
float latestMotionMag = 0;

float latestPpgAC = 0;
float latestPpgAmplitude = 0;

unsigned long lastVitalsSend = 0;
unsigned long lastFeaturesSend = 0;
unsigned long lastCalibSend = 0;

// =====================================================================
// SIMPLE STATS
// =====================================================================

struct Stats {
  double sum = 0;
  double sumSq = 0;
  float minVal = 9999999;
  float maxVal = -9999999;
  int count = 0;
};

void resetStats(Stats &s) {
  s.sum = 0;
  s.sumSq = 0;
  s.minVal = 9999999;
  s.maxVal = -9999999;
  s.count = 0;
}

void addSample(Stats &s, float x) {
  s.sum += x;
  s.sumSq += (double)x * (double)x;

  if (x < s.minVal) s.minVal = x;
  if (x > s.maxVal) s.maxVal = x;

  s.count++;
}

float meanStats(const Stats &s) {
  if (s.count <= 0) return 0;
  return s.sum / s.count;
}

float stdStats(const Stats &s) {
  if (s.count <= 1) return 0;

  double mean = s.sum / s.count;
  double variance = (s.sumSq - s.count * mean * mean) / (s.count - 1);

  if (variance < 0) variance = 0;

  return sqrt(variance);
}

// =====================================================================
// DEVICE STATUS
// =====================================================================

enum DeviceStatus {
  STATUS_NOT_WORN = 0,
  STATUS_HOLD_STILL = 1,
  STATUS_PPG_POOR = 2,
  STATUS_RELAX_ARM = 3,
  STATUS_CALIBRATING = 4,
  STATUS_READY = 5,
  STATUS_MEASURING = 6,
  STATUS_FAILED = 7
};

DeviceStatus deviceStatus = STATUS_NOT_WORN;

const char* statusMessage(int s) {
  switch (s) {
    case STATUS_NOT_WORN:     return "WEAR_DEVICE";
    case STATUS_HOLD_STILL:   return "HOLD_STILL";
    case STATUS_PPG_POOR:     return "ADJUST_PPG";
    case STATUS_RELAX_ARM:    return "RELAX_ARM";
    case STATUS_CALIBRATING:  return "CALIBRATING";
    case STATUS_READY:        return "READY";
    case STATUS_MEASURING:    return "MEASURING";
    case STATUS_FAILED:       return "CALIBRATION_FAILED";
    default:                  return "UNKNOWN";
  }
}

// =====================================================================
// CALIBRATION
// =====================================================================

bool deviceReady = false;
bool calibrationRunning = false;
bool calibrationFailed = false;

unsigned long calibrationStartTime = 0;
unsigned long calibrationFailedTime = 0;

#define CALIB_TOTAL_MS      8000
#define CALIB_DISCARD_MS    2000
#define CALIB_FAIL_HOLD_MS  2000

Stats calibIrStats;
Stats calibPpgAcStats;
Stats calibMotionStats;
Stats calibAccelStats;
Stats calibEmgAbsStats;
Stats calibEmgEnvStats;
Stats calibEmgZcStats;

bool calibPpgOk = false;
bool calibMotionOk = false;
bool calibEmgOk = false;

void resetCalibrationStats() {
  resetStats(calibIrStats);
  resetStats(calibPpgAcStats);
  resetStats(calibMotionStats);
  resetStats(calibAccelStats);
  resetStats(calibEmgAbsStats);
  resetStats(calibEmgEnvStats);
  resetStats(calibEmgZcStats);

  calibPpgOk = false;
  calibMotionOk = false;
  calibEmgOk = false;
}

bool isCalibrationCollecting() {
  if (!calibrationRunning || deviceReady) return false;

  unsigned long elapsed = millis() - calibrationStartTime;

  return elapsed >= CALIB_DISCARD_MS && elapsed <= CALIB_TOTAL_MS;
}

void startCalibration() {
  resetCalibrationStats();

  calibrationRunning = true;
  calibrationFailed = false;
  deviceReady = false;
  calibrationStartTime = millis();
  deviceStatus = STATUS_CALIBRATING;
}

void evaluateCalibration() {
  float irMean = meanStats(calibIrStats);
  float ppgAcStd = stdStats(calibPpgAcStats);

  float motionMean = meanStats(calibMotionStats);
  float motionStd = stdStats(calibMotionStats);
  float accelStd = stdStats(calibAccelStats);

  float emgAbsMean = meanStats(calibEmgAbsStats);
  float emgEnvMean = meanStats(calibEmgEnvStats);

  calibPpgOk =
    irMean > PPG_IR_MIN_GOOD &&
    irMean < PPG_IR_MAX_GOOD &&
    ppgAcStd > PPG_AC_STD_MIN;

  calibMotionOk =
    motionMean < MOTION_STABLE_MAX &&
    motionStd < MOTION_STD_MAX &&
    accelStd < ACCEL_STD_STABLE_MAX;

  /*
   * Important:
   * Do NOT fail calibration using ZC.
   * ZC is kept as an algorithm feature only.
   * EMG relaxed check should use Abs + Envelope.
   */
  calibEmgOk =
    emgAbsMean < EMG_ACTIVE_ABS_THR &&
    emgEnvMean < EMG_ACTIVE_ENV_THR;

  if (calibPpgOk && calibMotionOk && calibEmgOk) {
    deviceReady = true;
    calibrationRunning = false;
    calibrationFailed = false;
    deviceStatus = STATUS_READY;
  } else {
    deviceReady = false;
    calibrationRunning = false;
    calibrationFailed = true;
    calibrationFailedTime = millis();

    if (!calibPpgOk) {
      deviceStatus = STATUS_PPG_POOR;
    } else if (!calibMotionOk) {
      deviceStatus = STATUS_HOLD_STILL;
    } else if (!calibEmgOk) {
      deviceStatus = STATUS_RELAX_ARM;
    } else {
      deviceStatus = STATUS_FAILED;
    }
  }
}

void updateCalibrationState() {
  bool ppgContact = latestIR > PPG_IR_MIN_GOOD;
  bool ppgSaturated = latestIR > PPG_IR_MAX_GOOD;

  if (!ppgContact) {
    deviceReady = false;
    calibrationRunning = false;
    calibrationFailed = false;
    resetCalibrationStats();
    deviceStatus = STATUS_NOT_WORN;
    return;
  }

  if (ppgSaturated) {
    deviceReady = false;
    calibrationRunning = false;
    calibrationFailed = false;
    resetCalibrationStats();
    deviceStatus = STATUS_PPG_POOR;
    return;
  }

  if (deviceReady) {
    deviceStatus = STATUS_MEASURING;
    return;
  }

  if (calibrationFailed) {
    if (millis() - calibrationFailedTime >= CALIB_FAIL_HOLD_MS) {
      startCalibration();
    }

    return;
  }

  if (!calibrationRunning) {
    startCalibration();
    return;
  }

  unsigned long elapsed = millis() - calibrationStartTime;

  if (elapsed < CALIB_DISCARD_MS) {
    deviceStatus = STATUS_CALIBRATING;
    return;
  }

  if (motionLevel > MOTION_STABLE_MAX) {
    deviceStatus = STATUS_HOLD_STILL;
  } else {
    float emgAbsMean = meanStats(calibEmgAbsStats);
    float emgEnvMean = meanStats(calibEmgEnvStats);

    if (calibEmgAbsStats.count > 20 &&
        (emgAbsMean > EMG_ACTIVE_ABS_THR ||
         emgEnvMean > EMG_ACTIVE_ENV_THR)) {
      deviceStatus = STATUS_RELAX_ARM;
    } else {
      deviceStatus = STATUS_CALIBRATING;
    }
  }

  if (elapsed >= CALIB_TOTAL_MS) {
    evaluateCalibration();
  }
}

// =====================================================================
// EMG
// =====================================================================

volatile int g_emgFiltered = 0;
volatile int g_emgEnvelope = 0;

#define EMG_ZC_THRESHOLD   25
#define EMG_ZC_BIN_MS      100
#define EMG_ZC_QUEUE_SIZE  64

volatile int g_zcQueue[EMG_ZC_QUEUE_SIZE];
volatile int g_zcHead = 0;
volatile int g_zcTail = 0;

TaskHandle_t emgTaskHandle = nullptr;
portMUX_TYPE zcMux = portMUX_INITIALIZER_UNLOCKED;

void pushZcBin(int value) {
  portENTER_CRITICAL(&zcMux);

  int nextHead = (g_zcHead + 1) % EMG_ZC_QUEUE_SIZE;

  if (nextHead != g_zcTail) {
    g_zcQueue[g_zcHead] = value;
    g_zcHead = nextHead;
  }

  portEXIT_CRITICAL(&zcMux);
}

bool popZcBin(int &value) {
  bool hasData = false;

  portENTER_CRITICAL(&zcMux);

  if (g_zcTail != g_zcHead) {
    value = g_zcQueue[g_zcTail];
    g_zcTail = (g_zcTail + 1) % EMG_ZC_QUEUE_SIZE;
    hasData = true;
  }

  portEXIT_CRITICAL(&zcMux);

  return hasData;
}

void emgSamplingTask(void* param) {
  EMGFilters emgFilter;
  emgFilter.init(SAMPLE_FREQ_1000HZ, NOTCH_FREQ_50HZ, true, true, true);

  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xPeriod = pdMS_TO_TICKS(1);

  int lastSign = 0;
  int localZcCount = 0;
  unsigned long lastZcBinTime = millis();

  while (true) {
    int raw = analogRead(EMG_PIN);
    int filtered = emgFilter.update(raw);
    int envelope = filtered * filtered;

    g_emgFiltered = filtered;
    g_emgEnvelope = envelope;

    int currentSign = 0;

    if (filtered > EMG_ZC_THRESHOLD) {
      currentSign = 1;
    } else if (filtered < -EMG_ZC_THRESHOLD) {
      currentSign = -1;
    }

    if (lastSign != 0 && currentSign != 0 && currentSign != lastSign) {
      localZcCount++;
    }

    if (currentSign != 0) {
      lastSign = currentSign;
    }

    unsigned long now = millis();

    if (now - lastZcBinTime >= EMG_ZC_BIN_MS) {
      pushZcBin(localZcCount);
      localZcCount = 0;
      lastZcBinTime = now;
    }

    vTaskDelayUntil(&xLastWakeTime, xPeriod);
  }
}

// =====================================================================
// FEATURE WINDOWS
// =====================================================================

Stats featureMotionStats;
Stats featureEmgZcStats;

void resetFeatureWindow() {
  resetStats(featureMotionStats);
  resetStats(featureEmgZcStats);
}

// =====================================================================
// HR ENGINE
// =====================================================================

float dcValue = 0;
float alpha = 0.90;

const int FILTER_SIZE = 6;
float buffer[FILTER_SIZE];
int bufferIndex = 0;

unsigned long startTime = 0;

float prev2 = 0;
float prev1 = 0;
float current = 0;

unsigned long lastPeakTime = 0;

float bpm = 0;
float smoothBpm = 0;
float stableBpm = 0;

float signalMin = 99999;
float signalMax = -99999;
float dynamicThreshold = 20;

unsigned long thresholdTimer = 0;
const unsigned long thresholdWindow = 2000;

int confidence = 0;
const int maxConfidence = 10;

float lastValidBpm = 0;

int minPeakDistance = 375;
int maxPeakDistance = 1000;

float minAllowedBpm = 60;
float maxAllowedBpm = 160;

const int BPM_BUF_SIZE = 5;
float bpmBuffer[BPM_BUF_SIZE];
int bpmBufferIndex = 0;
int bpmBufferCount = 0;

float pendingBpm = 0;
int pendingBpmCount = 0;
bool confirmedBpmShift = false;
bool confirmedRecoveryShift = false;
bool trackRejectedPeakTime = false;
unsigned long lowMotionStartTime = 0;

#define RR_BUF_SIZE 32

float rrBuffer[RR_BUF_SIZE];
int rrBufferIndex = 0;
int rrBufferCount = 0;

float latestRRms = 0;
float rmssdHRV = 0;
float sdnnHRV = 0;

void resetBpmBuffer() {
  for (int i = 0; i < BPM_BUF_SIZE; i++) {
    bpmBuffer[i] = 0;
  }

  bpmBufferIndex = 0;
  bpmBufferCount = 0;
}

void addBpmToBuffer(float value) {
  bpmBuffer[bpmBufferIndex] = value;
  bpmBufferIndex++;

  if (bpmBufferIndex >= BPM_BUF_SIZE) {
    bpmBufferIndex = 0;
  }

  if (bpmBufferCount < BPM_BUF_SIZE) {
    bpmBufferCount++;
  }
}

float getMedianBpm() {
  if (bpmBufferCount <= 0) return 0;

  float temp[BPM_BUF_SIZE];

  for (int i = 0; i < bpmBufferCount; i++) {
    temp[i] = bpmBuffer[i];
  }

  for (int i = 0; i < bpmBufferCount - 1; i++) {
    for (int j = i + 1; j < bpmBufferCount; j++) {
      if (temp[j] < temp[i]) {
        float t = temp[i];
        temp[i] = temp[j];
        temp[j] = t;
      }
    }
  }

  if (bpmBufferCount % 2 == 1) {
    return temp[bpmBufferCount / 2];
  } else {
    return (temp[bpmBufferCount / 2 - 1] + temp[bpmBufferCount / 2]) / 2.0;
  }
}

void resetRRBuffer() {
  for (int i = 0; i < RR_BUF_SIZE; i++) {
    rrBuffer[i] = 0;
  }

  rrBufferIndex = 0;
  rrBufferCount = 0;
  latestRRms = 0;
  rmssdHRV = 0;
  sdnnHRV = 0;
}

void addRRInterval(float rrMs) {
  if (rrMs < 400 || rrMs > 1500) return;

  rrBuffer[rrBufferIndex] = rrMs;
  rrBufferIndex++;

  if (rrBufferIndex >= RR_BUF_SIZE) {
    rrBufferIndex = 0;
  }

  if (rrBufferCount < RR_BUF_SIZE) {
    rrBufferCount++;
  }

  latestRRms = rrMs;
}

float computeSDNN() {
  if (rrBufferCount <= 1) return 0;

  float avg = 0;

  for (int i = 0; i < rrBufferCount; i++) {
    avg += rrBuffer[i];
  }

  avg /= rrBufferCount;

  float sumSq = 0;

  for (int i = 0; i < rrBufferCount; i++) {
    float d = rrBuffer[i] - avg;
    sumSq += d * d;
  }

  return sqrt(sumSq / (rrBufferCount - 1));
}

float computeRMSSD() {
  if (rrBufferCount <= 1) return 0;

  float sumSqDiff = 0;
  int diffCount = 0;

  for (int i = 1; i < rrBufferCount; i++) {
    int idxPrev;
    int idxCurr;

    if (rrBufferCount < RR_BUF_SIZE) {
      idxPrev = i - 1;
      idxCurr = i;
    } else {
      idxPrev = (rrBufferIndex + i - 1) % RR_BUF_SIZE;
      idxCurr = (rrBufferIndex + i) % RR_BUF_SIZE;
    }

    float diff = rrBuffer[idxCurr] - rrBuffer[idxPrev];

    sumSqDiff += diff * diff;
    diffCount++;
  }

  if (diffCount <= 0) return 0;

  return sqrt(sumSqDiff / diffCount);
}

void updateHRVMetrics() {
  sdnnHRV = computeSDNN();
  rmssdHRV = computeRMSSD();
}

bool acceptBpm(float newBpm, bool mediumMotion, bool highMotion, bool recoveryReady) {
  confirmedBpmShift = false;
  confirmedRecoveryShift = false;
  trackRejectedPeakTime = false;

  if (smoothBpm == 0 || confidence < 3) {
    if (newBpm >= 70 && newBpm <= 110) {
      pendingBpm = 0;
      pendingBpmCount = 0;
      return true;
    }
  }

  float referenceBpm = smoothBpm > 0 ? smoothBpm : lastValidBpm;

  if (referenceBpm > 0) {
    float jumpFromReference = fabsf(newBpm - referenceBpm);
    float instantLimit = highMotion ? 6.0 : (mediumMotion ? 8.0 : 10.0);

    if (recoveryReady) {
      instantLimit = 12.0;
    }

    if (jumpFromReference <= instantLimit) {
      pendingBpm = 0;
      pendingBpmCount = 0;
      return true;
    }
  }

  if (recoveryReady &&
      lastValidBpm > 0 &&
      smoothBpm > 0 &&
      fabsf(newBpm - lastValidBpm) <= 8.0 &&
      fabsf(newBpm - smoothBpm) > 10.0) {
    confirmedBpmShift = true;
    confirmedRecoveryShift = true;
    pendingBpm = 0;
    pendingBpmCount = 0;
    return true;
  }

  if (pendingBpm == 0 || fabsf(newBpm - pendingBpm) > 8.0) {
    pendingBpm = newBpm;
    pendingBpmCount = 1;
    trackRejectedPeakTime = true;
    return false;
  }

  pendingBpm = 0.60 * pendingBpm + 0.40 * newBpm;
  pendingBpmCount++;

  int requiredMatches = highMotion ? 3 : 2;

  if (pendingBpmCount >= requiredMatches) {
    confirmedBpmShift = true;
    confirmedRecoveryShift = recoveryReady;
    pendingBpm = 0;
    pendingBpmCount = 0;
    return true;
  }

  trackRejectedPeakTime = true;
  return false;
}

void resetHrEngine() {
  bpm = 0;
  smoothBpm = 0;
  stableBpm = 0;
  lastValidBpm = 0;
  confidence = 0;
  lastPeakTime = 0;
  pendingBpm = 0;
  pendingBpmCount = 0;
  confirmedBpmShift = false;
  confirmedRecoveryShift = false;
  trackRejectedPeakTime = false;
  lowMotionStartTime = 0;

  resetRRBuffer();

  dcValue = 0;
  prev2 = 0;
  prev1 = 0;
  current = 0;

  signalMin = 99999;
  signalMax = -99999;
  dynamicThreshold = 20;

  resetBpmBuffer();

  for (int i = 0; i < FILTER_SIZE; i++) {
    buffer[i] = 0;
  }

  bufferIndex = 0;
}

uint8_t motionClass() {
  if (motionLevel > MOTION_HIGH_MAX) return 2;
  if (motionLevel > MOTION_MOVING_MAX) return 1;
  return 0;
}

void updateCalibratedBpm(long irRaw) {
  bool mediumMotion = motionLevel > MOTION_MOVING_MAX;
  bool highMotion = motionLevel > MOTION_HIGH_MAX;
  bool lowMotion = motionLevel < MOTION_MOVING_MAX;

  if (lowMotion) {
    if (lowMotionStartTime == 0) {
      lowMotionStartTime = millis();
    }
  } else {
    lowMotionStartTime = 0;
  }

  bool recoveryReady =
    lowMotionStartTime > 0 &&
    millis() - lowMotionStartTime >= 1200;

  if (irRaw < PPG_IR_MIN_GOOD) {
    resetHrEngine();
    return;
  }

  dcValue = alpha * dcValue + (1.0 - alpha) * irRaw;
  float acSignal = irRaw - dcValue;
  latestPpgAC = acSignal;

  buffer[bufferIndex] = acSignal;
  bufferIndex++;

  if (bufferIndex >= FILTER_SIZE) {
    bufferIndex = 0;
  }

  float filtered = 0;

  for (int i = 0; i < FILTER_SIZE; i++) {
    filtered += buffer[i];
  }

  filtered /= FILTER_SIZE;

  if (millis() - startTime < 4000) {
    return;
  }

  if (filtered < signalMin) signalMin = filtered;
  if (filtered > signalMax) signalMax = filtered;

  if (millis() - thresholdTimer >= thresholdWindow) {
    float amplitude = signalMax - signalMin;

    dynamicThreshold = signalMin + amplitude * 0.45;

    if (dynamicThreshold < 15) dynamicThreshold = 15;
    if (dynamicThreshold > 30) dynamicThreshold = 30;

    signalMin = 99999;
    signalMax = -99999;
    thresholdTimer = millis();
  }

  prev2 = prev1;
  prev1 = current;
  current = filtered;

  unsigned long now = millis();

  bool isPeak =
    (prev1 > prev2) &&
    (prev1 > current) &&
    (prev1 > dynamicThreshold);

  if (isPeak) {
    if (lastPeakTime == 0) {
      lastPeakTime = now;
    } else {
      unsigned long peakInterval = now - lastPeakTime;

      if (peakInterval > minPeakDistance &&
          peakInterval < maxPeakDistance) {

        bpm = 60000.0 / peakInterval;

        if (bpm >= minAllowedBpm && bpm <= maxAllowedBpm) {
          bool accepted = acceptBpm(bpm, mediumMotion, highMotion, recoveryReady);

          if (accepted) {
            bool useFastUpdate = confirmedBpmShift;
            bool useRecoveryUpdate = confirmedRecoveryShift;
            confirmedBpmShift = false;
            confirmedRecoveryShift = false;

            if (useFastUpdate) {
              resetBpmBuffer();
            }

            addBpmToBuffer(bpm);

            float medianBpm = getMedianBpm();

            confidence++;
            if (confidence > maxConfidence) confidence = maxConfidence;

            float oldWeight;
            float newWeight;

            if (useRecoveryUpdate) {
              oldWeight = 0.35;
              newWeight = 0.65;
            } else if (useFastUpdate) {
              oldWeight = 0.65;
              newWeight = 0.35;
            } else if (highMotion) {
              oldWeight = 0.97;
              newWeight = 0.03;
            } else if (mediumMotion) {
              oldWeight = 0.93;
              newWeight = 0.07;
            } else {
              oldWeight = 0.88;
              newWeight = 0.12;
            }

            if (smoothBpm == 0) {
              smoothBpm = medianBpm;
            } else {
              smoothBpm = oldWeight * smoothBpm + newWeight * medianBpm;
            }

            stableBpm = smoothBpm;
            lastValidBpm = bpm;

            float rrMs = (float)peakInterval;

            bool rrReliable = true;

            if (smoothBpm > 0) {
              float bpmError = fabsf(bpm - smoothBpm);

              if (bpmError > 14.0) {
                rrReliable = false;
              }
            }

            if (rrReliable && confidence >= 3) {
              addRRInterval(rrMs);
              updateHRVMetrics();
            }

            lastPeakTime = now;
          } else {
            confidence--;
            if (confidence < 0) confidence = 0;

            if (trackRejectedPeakTime) {
              lastPeakTime = now;
              trackRejectedPeakTime = false;
            }
          }
        }
      }

      if (peakInterval >= 1200) {
        lastPeakTime = now;
      }
    }
  }
}

// =====================================================================
// BLE CALLBACKS
// =====================================================================

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer*) override {
    deviceConnected = true;
  }

  void onDisconnect(BLEServer*) override {
    deviceConnected = false;
  }
};

// =====================================================================
// BLE SEND FUNCTIONS
// =====================================================================

void sendVitalsBLE() {
  float hrOut = deviceReady ? smoothBpm : 0;
  float confidenceOut = constrain((float)confidence * 10.0, 0.0, 100.0);

  uint8_t validOut =
    deviceReady &&
    latestIR >= PPG_IR_MIN_GOOD &&
    confidence >= 3 &&
    hrOut > 0 ? 1 : 0;

  float pi = 0;

  if (dcValue > 1000) {
    pi = (latestPpgAmplitude / dcValue) * 100.0;
  }

  float spo2 = 0.0;
  float snr = 0.0;

  char vbuf[160];

  int vlen = snprintf(
    vbuf,
    sizeof(vbuf),
    "%.1f,%.1f,%.1f,%.1f,%.1f,%.2f,%.1f,%u,%u",
    hrOut,
    spo2,
    rmssdHRV,
    sdnnHRV,
    confidenceOut,
    pi,
    snr,
    (unsigned)motionClass(),
    (unsigned)validOut
  );

  if (deviceConnected) {
    pVitalsChar->setValue((uint8_t*)vbuf, vlen);
    pVitalsChar->notify();
  }
}

void sendFeaturesBLE() {
  float hrOut = deviceReady ? smoothBpm : 0;

  float avgMotion = meanStats(featureMotionStats);
  float stdMotion = stdStats(featureMotionStats);

  float avgZC = meanStats(featureEmgZcStats);
  float stdZC = stdStats(featureEmgZcStats);

  char fbuf[180];

  int flen = snprintf(
    fbuf,
    sizeof(fbuf),
    "%.1f,%.1f,%.1f,%.4f,%.4f,%.2f,%.2f,%u,%u",
    hrOut,
    rmssdHRV,
    sdnnHRV,
    avgMotion,
    stdMotion,
    avgZC,
    stdZC,
    (unsigned)(deviceReady ? 1 : 0),
    (unsigned)deviceStatus
  );

  if (deviceConnected) {
    pFeaturesChar->setValue((uint8_t*)fbuf, flen);
    pFeaturesChar->notify();
  }

  resetFeatureWindow();
}

void sendCalibrationBLE() {
  unsigned long now = millis();

  int progress = 0;

  if (deviceReady) {
    progress = 100;
  } else if (calibrationRunning) {
    unsigned long elapsed = now - calibrationStartTime;
    progress = constrain((int)((elapsed * 100UL) / CALIB_TOTAL_MS), 0, 100);
  }

  bool ppgNowOk =
    latestIR > PPG_IR_MIN_GOOD &&
    latestIR < PPG_IR_MAX_GOOD;

  bool motionNowOk =
    motionLevel < MOTION_STABLE_MAX;

  float emgAbsMean = meanStats(calibEmgAbsStats);
  float emgEnvMean = meanStats(calibEmgEnvStats);
  float emgZcMean = meanStats(calibEmgZcStats);

  bool emgNowOk = true;

  if (calibEmgAbsStats.count > 20) {
    emgNowOk =
      emgAbsMean < EMG_ACTIVE_ABS_THR &&
      emgEnvMean < EMG_ACTIVE_ENV_THR;
  }

  char cbuf[220];

  int clen = snprintf(
    cbuf,
    sizeof(cbuf),
    "%u,%d,%u,%u,%u,%lu,%.1f,%.1f,%.2f,%s",
    (unsigned)deviceStatus,
    progress,
    (unsigned)(ppgNowOk ? 1 : 0),
    (unsigned)(motionNowOk ? 1 : 0),
    (unsigned)(emgNowOk ? 1 : 0),
    (unsigned long)latestIR,
    motionLevel,
    emgAbsMean,
    emgZcMean,
    statusMessage((int)deviceStatus)
  );

  if (deviceConnected) {
    pCalibChar->setValue((uint8_t*)cbuf, clen);
    pCalibChar->notify();
  }
}

// =====================================================================
// SETUP
// =====================================================================

void setup() {
  DBG_BEGIN(DEBUG_BAUD);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  pinMode(EMG_PIN, INPUT);

  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(400000);

  if (!ppg.begin(Wire, I2C_SPEED_FAST)) {
    while (1) delay(1000);
  }

  ppg.setup(
    irPA,
    MAX_SAMPLE_AVG,
    MAX_LED_MODE,
    MAX_SAMPLE_RATE,
    MAX_PULSE_WIDTH,
    MAX_ADC_RANGE
  );

  ppg.setPulseAmplitudeIR(irPA);
  ppg.setPulseAmplitudeRed(redPA);
  ppg.enableFIFORollover();

  if (!mpu.begin(0x68, &Wire)) {
    while (1) delay(1000);
  }

  mpu.setAccelerometerRange(MPU_ACCEL_RANGE);
  mpu.setGyroRange(MPU_GYRO_RANGE);
  mpu.setFilterBandwidth(MPU_FILTER_BW);

  for (int i = 0; i < FILTER_SIZE; i++) {
    buffer[i] = 0;
  }

  resetBpmBuffer();
  resetRRBuffer();
  resetFeatureWindow();
  resetCalibrationStats();

  startTime = millis();
  thresholdTimer = millis();

  xTaskCreatePinnedToCore(
    emgSamplingTask,
    "EMG_Task",
    4096,
    nullptr,
    1,
    &emgTaskHandle,
    0
  );

  BLEDevice::init("EPIC_S3_Sensor");
  BLEDevice::setMTU(185);

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pVitalsChar = pService->createCharacteristic(
    VITALS_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pVitalsChar->addDescriptor(new BLE2902());

  pFeaturesChar = pService->createCharacteristic(
    FEATURES_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pFeaturesChar->addDescriptor(new BLE2902());

  pCalibChar = pService->createCharacteristic(
    CALIB_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pCalibChar->addDescriptor(new BLE2902());

  pService->start();

  BLEAdvertising* pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  pAdv->setScanResponse(true);
  pAdv->setMinPreferred(0x06);
  pAdv->setMaxPreferred(0x12);
  pAdv->setMinInterval(0x140);
  pAdv->setMaxInterval(0x1E0);

  BLEDevice::startAdvertising();

  lastVitalsSend = millis();
  lastFeaturesSend = millis();
  lastCalibSend = millis();
}

// =====================================================================
// LOOP
// =====================================================================

void loop() {
  unsigned long now = millis();

  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    oldDeviceConnected = false;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = true;
  }

  sensors_event_t accelEvt, gyroEvt, tempEvt;
  mpu.getEvent(&accelEvt, &gyroEvt, &tempEvt);

  latestAx = accelEvt.acceleration.x;
  latestAy = accelEvt.acceleration.y;
  latestAz = accelEvt.acceleration.z;

  latestGx = gyroEvt.gyro.x;
  latestGy = gyroEvt.gyro.y;
  latestGz = gyroEvt.gyro.z;

  motionLevel =
    (fabsf(latestGx) + fabsf(latestGy) + fabsf(latestGz)) *
    57.29578f *
    131.0f;

  latestMotionMag =
    sqrtf(latestAx * latestAx + latestAy * latestAy + latestAz * latestAz);

  int zcBin = 0;

  while (popZcBin(zcBin)) {
    addSample(featureEmgZcStats, (float)zcBin);

    if (isCalibrationCollecting()) {
      addSample(calibEmgZcStats, (float)zcBin);
    }
  }

  static unsigned long lastMotionFeatureSample = 0;

  if (now - lastMotionFeatureSample >= 20) {
    lastMotionFeatureSample = now;

    addSample(featureMotionStats, latestMotionMag);

    if (isCalibrationCollecting()) {
      addSample(calibMotionStats, motionLevel);
      addSample(calibAccelStats, latestMotionMag);
      addSample(calibEmgAbsStats, fabsf((float)g_emgFiltered));
      addSample(calibEmgEnvStats, (float)g_emgEnvelope);
    }
  }

  static float acMin = 999999;
  static float acMax = -999999;
  static unsigned long lastAmpUpdate = 0;

  ppg.check();

  while (ppg.available() > 0) {
    uint32_t ir = ppg.getIR();
    uint32_t red = ppg.getRed();
    ppg.nextSample();

    latestIR = ir;
    latestRed = red;

    updateCalibratedBpm((long)ir);

    if (latestPpgAC < acMin) acMin = latestPpgAC;
    if (latestPpgAC > acMax) acMax = latestPpgAC;

    if (isCalibrationCollecting()) {
      addSample(calibIrStats, (float)ir);
      addSample(calibPpgAcStats, latestPpgAC);
    }
  }

  if (now - lastAmpUpdate >= 1000) {
    latestPpgAmplitude = acMax - acMin;
    acMin = 999999;
    acMax = -999999;
    lastAmpUpdate = now;
  }

  updateCalibrationState();

  if (now - lastVitalsSend >= VITALS_SEND_INTERVAL) {
    lastVitalsSend = now;
    sendVitalsBLE();
  }

  if (now - lastFeaturesSend >= FEATURES_INTERVAL) {
    lastFeaturesSend = now;
    sendFeaturesBLE();
  }

  if (now - lastCalibSend >= CALIB_SEND_INTERVAL) {
    lastCalibSend = now;
    sendCalibrationBLE();
  }
}
