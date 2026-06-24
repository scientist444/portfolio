#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ADXL345 Configuration
#define ADXL345_ADDRESS 0x53
#define ADXL345_POWER_CTL   0x2D
#define ADXL345_DATA_FORMAT 0x31
#define ADXL345_BW_RATE     0x2C
#define ADXL345_DATAX0      0x32
#define ADXL345_DEVID       0x00

// Pin definitions
#define SDA_PIN 4
#define SCL_PIN 5

// BLE UUIDs
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID_DATA      "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHAR_UUID_CONTROL   "beb5483e-36e1-4688-b7f5-ea07361b26a9"

// Sensor parameters
#define SAMPLE_RATE_HZ 100
#define SAMPLE_PERIOD_MS 10
#define CALIBRATION_SAMPLES 500
#define BUFFER_SIZE 100

// Jump detection thresholds
#define JUMP_THRESHOLD_G 2.5
#define FREEFALL_THRESHOLD_G 0.35
#define RESET_THRESHOLD_G 1.2
#define MIN_FLIGHT_TIME_MS 50
#define DEBOUNCE_TIME_MS 300

// Consistent payload structure (12 bytes) - UNCHANGED
struct DataPayload {
  uint16_t jumpCount;        // 2 bytes: Total jumps
  uint16_t flightTimeMs;     // 2 bytes: Last flight time in ms (0-65535ms = 0-65.5s)
  uint16_t vibrationRaw;     // 2 bytes: Vibration * 1000 (0.000-65.535g)
  uint8_t  status;           // 1 byte: Device status flags
  int16_t  accelX;           // 2 bytes: X acceleration * 100 (-327.68g to +327.67g)
  int16_t  accelY;           // 2 bytes: Y acceleration * 100
  int16_t  accelZ;           // 2 bytes: Z acceleration * 100
} __attribute__((packed));

// Status flags (bit field) - UNCHANGED
#define STATUS_CALIBRATED   0x01
#define STATUS_CALIBRATING  0x02
#define STATUS_IN_FLIGHT    0x04
#define STATUS_ERROR        0x80

// Calibration data
struct CalibrationData {
  float x_offset;
  float y_offset;
  float z_offset;
  bool isCalibrated;
};

// Global variables
CalibrationData calibration = {0.0, 0.0, 0.0, false};
float ax, ay, az;
float ax_buffer[BUFFER_SIZE];
float ay_buffer[BUFFER_SIZE];
float az_buffer[BUFFER_SIZE];
uint8_t buffer_index = 0;

// Jump detection
enum JumpState { IDLE, JUMPED, IN_FLIGHT };
JumpState jumpState = IDLE;
uint16_t jumpCount = 0;
uint32_t lastJumpTime = 0;
uint32_t flightStartTime = 0;
uint32_t lastFlightTime = 0;
bool flightDetected = false;
float vibration_rms = 0.0;

// Calibration state
volatile bool calibrationRequested = false;
bool isCalibrating = false;

// BLE variables
BLEServer* pServer = NULL;
BLECharacteristic* pCharData = NULL;
BLECharacteristic* pCharControl = NULL;
volatile bool deviceConnected = false;

// Timing variables
uint32_t lastSampleTime = 0;
uint32_t lastBLEUpdate = 0;
uint32_t lastPrint = 0;

// Forward declarations
bool initializeADXL345();
bool readADXL345();
void performCalibration();
float computeVibrationRMS();
void detectJump();
DataPayload buildPayload();
void sendBLEData();
void printStatus();

// BLE Callbacks - Simplified
class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  }
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    BLEDevice::startAdvertising();
  }
};

class ControlCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    uint8_t* pData = pCharacteristic->getData();
    size_t len = pCharacteristic->getValue().length();
    
    if (len > 0) {
      char cmd = pData[0];
      
      if (cmd == 'C' || cmd == 'c') {
        if (!isCalibrating) {
          calibrationRequested = true;
        }
      } else if (cmd == 'R' || cmd == 'r') {
        jumpCount = 0;
      }
    }
  }
};

void setup() {
  Serial.begin(115200);
  delay(1500);
  
  Serial.println("\n=== Jump Tracker Starting ===");
  
  // Initialize I2C
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(400000);
  delay(50);
  
  // Initialize ADXL345
  if (!initializeADXL345()) {
    Serial.println("ERROR: Sensor init failed!");
    while(1) {
      delay(1000);
      Serial.println("Check wiring...");
    }
  }
  
  Serial.println("Sensor OK");
  
  // Initialize BLE
  BLEDevice::init("JumpTracker");
  
  // Set BLE TX power to lowest level for battery operation
  esp_ble_tx_power_set(ESP_BLE_PWR_TYPE_DEFAULT, ESP_PWR_LVL_N12);
  Serial.println("BLE TX Power: -12dBm (Lowest)");
  
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  pCharData = pService->createCharacteristic(
    CHAR_UUID_DATA,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pCharData->addDescriptor(new BLE2902());
  
  pCharControl = pService->createCharacteristic(
    CHAR_UUID_CONTROL,
    BLECharacteristic::PROPERTY_WRITE
  );
  pCharControl->setCallbacks(new ControlCallbacks());
  
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  BLEDevice::startAdvertising();
  
  Serial.println("BLE Ready");
  Serial.println("Send 'C' to calibrate, 'R' to reset");
  Serial.println("=== Ready ===\n");
}

void loop() {
  uint32_t currentTime = millis();
  
  // Handle calibration request
  if (calibrationRequested && !isCalibrating) {
    performCalibration();
    calibrationRequested = false;
  }
  
  // Skip normal operation during calibration
  if (isCalibrating) {
    delay(10);
    return;
  }
  
  // Sample at fixed rate (100Hz)
  if (currentTime - lastSampleTime >= SAMPLE_PERIOD_MS) {
    lastSampleTime = currentTime;
    
    if (readADXL345()) {
      // Store in buffer
      ax_buffer[buffer_index] = ax;
      ay_buffer[buffer_index] = ay;
      az_buffer[buffer_index] = az;
      buffer_index++;
      if (buffer_index >= BUFFER_SIZE) buffer_index = 0;
      
      // Detect jumps only if calibrated
      if (calibration.isCalibrated) {
        detectJump();
      }
      
      // Calculate vibration every 100 samples
      if (buffer_index == 0) {
        vibration_rms = computeVibrationRMS();
      }
    }
  }
  
  // Send BLE updates every 100ms
  if (deviceConnected && (currentTime - lastBLEUpdate >= 100)) {
    lastBLEUpdate = currentTime;
    sendBLEData();
  }
  
  // Print status every second
  if (currentTime - lastPrint >= 1000) {
    lastPrint = currentTime;
    printStatus();
  }
  
  // Small yield to prevent watchdog issues
  yield();
}

bool initializeADXL345() {
  // Check device ID
  Wire.beginTransmission(ADXL345_ADDRESS);
  Wire.write(ADXL345_DEVID);
  if (Wire.endTransmission() != 0) return false;
  
  Wire.requestFrom(ADXL345_ADDRESS, (uint8_t)1);
  if (!Wire.available()) return false;
  
  uint8_t deviceID = Wire.read();
  if (deviceID != 0xE5) return false;
  
  // Set data rate to 100Hz
  Wire.beginTransmission(ADXL345_ADDRESS);
  Wire.write(ADXL345_BW_RATE);
  Wire.write(0x0A);
  if (Wire.endTransmission() != 0) return false;
  
  // Configure ±16g range
  Wire.beginTransmission(ADXL345_ADDRESS);
  Wire.write(ADXL345_DATA_FORMAT);
  Wire.write(0x0B);
  if (Wire.endTransmission() != 0) return false;
  
  // Enable measurement
  Wire.beginTransmission(ADXL345_ADDRESS);
  Wire.write(ADXL345_POWER_CTL);
  Wire.write(0x08);
  if (Wire.endTransmission() != 0) return false;
  
  delay(50);
  return true;
}

bool readADXL345() {
  Wire.beginTransmission(ADXL345_ADDRESS);
  Wire.write(ADXL345_DATAX0);
  if (Wire.endTransmission(false) != 0) return false;
  
  Wire.requestFrom(ADXL345_ADDRESS, (uint8_t)6);
  if (Wire.available() < 6) return false;
  
  int16_t x_raw = Wire.read() | (Wire.read() << 8);
  int16_t y_raw = Wire.read() | (Wire.read() << 8);
  int16_t z_raw = Wire.read() | (Wire.read() << 8);
  
  // Convert to g and apply calibration
  ax = (x_raw * 0.00390625) - calibration.x_offset;  // Divide by 256
  ay = (y_raw * 0.00390625) - calibration.y_offset;
  az = (z_raw * 0.00390625) - calibration.z_offset;
  
  return true;
}

void performCalibration() {
  isCalibrating = true;
  Serial.println("\n*** CALIBRATING ***");
  Serial.println("Keep vertical, X-axis UP");
  
  // Notify via BLE
  if (deviceConnected) {
    DataPayload payload = buildPayload();
    pCharData->setValue((uint8_t*)&payload, sizeof(payload));
    pCharData->notify();
  }
  
  float x_sum = 0, y_sum = 0, z_sum = 0;
  uint16_t validSamples = 0;
  
  for (uint16_t i = 0; i < CALIBRATION_SAMPLES; i++) {
    Wire.beginTransmission(ADXL345_ADDRESS);
    Wire.write(ADXL345_DATAX0);
    
    if (Wire.endTransmission(false) == 0) {
      Wire.requestFrom(ADXL345_ADDRESS, (uint8_t)6);
      
      if (Wire.available() >= 6) {
        int16_t x_raw = Wire.read() | (Wire.read() << 8);
        int16_t y_raw = Wire.read() | (Wire.read() << 8);
        int16_t z_raw = Wire.read() | (Wire.read() << 8);
        
        x_sum += x_raw * 0.00390625;
        y_sum += y_raw * 0.00390625;
        z_sum += z_raw * 0.00390625;
        validSamples++;
      }
    }
    
    delay(10);
    
    if (i % 100 == 0) {
      Serial.print(".");
      yield();  // Prevent watchdog
    }
  }
  Serial.println();
  
  if (validSamples > (CALIBRATION_SAMPLES * 9 / 10)) {
    // X-axis pointing up (X=1g, Y=0, Z=0)
    calibration.x_offset = (x_sum / validSamples) - 1.0;
    calibration.y_offset = y_sum / validSamples;
    calibration.z_offset = z_sum / validSamples;
    calibration.isCalibrated = true;
    
    Serial.println("Calibration OK!");
  } else {
    Serial.println("Calibration FAILED");
  }
  
  isCalibrating = false;
  
  // Send updated status
  if (deviceConnected) {
    DataPayload payload = buildPayload();
    pCharData->setValue((uint8_t*)&payload, sizeof(payload));
    pCharData->notify();
  }
}

float computeVibrationRMS() {
  float mean_ax = 0, mean_ay = 0, mean_az = 0;
  
  for (uint8_t i = 0; i < BUFFER_SIZE; i++) {
    mean_ax += ax_buffer[i];
    mean_ay += ay_buffer[i];
    mean_az += az_buffer[i];
  }
  
  mean_ax *= 0.01;  // Divide by 100
  mean_ay *= 0.01;
  mean_az *= 0.01;
  
  float sum_sq = 0;
  for (uint8_t i = 0; i < BUFFER_SIZE; i++) {
    float ax_ac = ax_buffer[i] - mean_ax;
    float ay_ac = ay_buffer[i] - mean_ay;
    float az_ac = az_buffer[i] - mean_az;
    
    sum_sq += (ax_ac * ax_ac) + (ay_ac * ay_ac) + (az_ac * az_ac);
  }
  
  return sqrt(sum_sq * 0.01);  // Divide by 100
}

void detectJump() {
  float accMag = sqrt(ax*ax + ay*ay + az*az);
  uint32_t currentTime = millis();

  switch(jumpState) {
    case IDLE:
      if (accMag > JUMP_THRESHOLD_G) {
        if (currentTime - lastJumpTime > DEBOUNCE_TIME_MS) {
          lastJumpTime = currentTime;
          flightStartTime = currentTime;
          flightDetected = false;
          jumpState = JUMPED;
        }
      }
      break;

    case JUMPED:
      if (!flightDetected && accMag < FREEFALL_THRESHOLD_G) {
        flightDetected = true;
        jumpState = IN_FLIGHT;
      }
      else if (accMag < RESET_THRESHOLD_G) {
        uint32_t elapsed = currentTime - flightStartTime;
        if (elapsed >= MIN_FLIGHT_TIME_MS) {
          lastFlightTime = elapsed;
          jumpCount++;
        }
        jumpState = IDLE;
      }
      break;

    case IN_FLIGHT:
      if (accMag > RESET_THRESHOLD_G) {
        lastFlightTime = currentTime - flightStartTime;
        jumpCount++;
        jumpState = IDLE;
      }
      else if (currentTime - flightStartTime > 2000) {
        lastFlightTime = currentTime - flightStartTime;
        jumpState = IDLE;
      }
      break;
  }
}

DataPayload buildPayload() {
  DataPayload payload;
  
  payload.jumpCount = jumpCount;
  payload.flightTimeMs = (uint16_t)min(lastFlightTime, 65535UL);
  payload.vibrationRaw = (uint16_t)(vibration_rms * 1000.0);
  
  payload.status = 0;
  if (calibration.isCalibrated) payload.status |= STATUS_CALIBRATED;
  if (isCalibrating) payload.status |= STATUS_CALIBRATING;
  if (jumpState == IN_FLIGHT) payload.status |= STATUS_IN_FLIGHT;
  
  payload.accelX = (int16_t)(ax * 100.0);
  payload.accelY = (int16_t)(ay * 100.0);
  payload.accelZ = (int16_t)(az * 100.0);
  
  return payload;
}

void sendBLEData() {
  DataPayload payload = buildPayload();
  pCharData->setValue((uint8_t*)&payload, sizeof(payload));
  pCharData->notify();
}

void printStatus() {
  Serial.printf("X:%+.2f Y:%+.2f Z:%+.2f | Vib:%.3f | Jumps:%d | Flight:%dms | Cal:%s | BLE:%s\n", 
                ax, ay, az, vibration_rms, jumpCount, (int)lastFlightTime,
                calibration.isCalibrated ? "Y" : "N",
                deviceConnected ? "C" : "W");
}