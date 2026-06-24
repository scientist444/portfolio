#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEHIDDevice.h>
#include <BLECharacteristic.h>
#include "HIDTypes.h"
#include "HIDKeyboardTypes.h"

const int xPin = 9; // Joystick X-axis
const int yPin = 10; // Joystick Y-axis
const int switchPin = 11; // Joystick switch

const int threshold = 50; // Adjusted threshold for joystick movement sensitivity
const int longPressDuration = 1000; // Duration in ms to detect long press for scrolling

BLEHIDDevice* hid;
BLECharacteristic* input;
BLECharacteristic* output;
bool connected = false;

// Callback class to handle client connection and disconnection events
class MyCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    connected = true;
  }

  void onDisconnect(BLEServer* pServer) {
    connected = false;
  }
};

void setup() {
  Serial.begin(115200);
  
  pinMode(switchPin, INPUT_PULLUP);

  BLEDevice::init("ESP32 Mouse");
  BLEServer* pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyCallbacks());

  hid = new BLEHIDDevice(pServer);
  input = hid->inputReport(1); // Report ID
  output = hid->outputReport(1); // Report ID

  hid->manufacturer()->setValue("RISETech");
  hid->pnp(0x02, 0xe502, 0xa111, 0x0210);
  hid->hidInfo(0x00, 0x01);

  const uint8_t reportMap[] = {
    USAGE_PAGE(1), 0x01, // Generic Desktop
    USAGE(1), 0x02, // Mouse
    COLLECTION(1), 0x01, // Application
    USAGE(1), 0x01, // Pointer
    COLLECTION(1), 0x00, // Physical
    REPORT_ID(1), 0x01,
    USAGE_PAGE(1), 0x09, // Buttons
    USAGE_MINIMUM(1), 0x01,
    USAGE_MAXIMUM(1), 0x03,
    LOGICAL_MINIMUM(1), 0x00,
    LOGICAL_MAXIMUM(1), 0x01,
    REPORT_SIZE(1), 0x01,
    REPORT_COUNT(1), 0x03,
    HIDINPUT(1), 0x02, // Data, Var, Abs
    REPORT_SIZE(1), 0x05,
    REPORT_COUNT(1), 0x01,
    HIDINPUT(1), 0x01, // Const, Array, Abs
    USAGE_PAGE(1), 0x01, // Generic Desktop
    USAGE(1), 0x30, // X
    USAGE(1), 0x31, // Y
    USAGE(1), 0x38, // Wheel
    LOGICAL_MINIMUM(1), 0x81, // -127
    LOGICAL_MAXIMUM(1), 0x7f, // 127
    REPORT_SIZE(1), 0x08,
    REPORT_COUNT(1), 0x03,
    HIDINPUT(1), 0x06, // Data, Var, Rel
    END_COLLECTION(0),
    END_COLLECTION(0)
  };

  hid->reportMap((uint8_t*)reportMap, sizeof(reportMap));
  hid->startServices();

  BLEAdvertising* pAdvertising = pServer->getAdvertising();
  pAdvertising->setAppearance(HID_MOUSE);
  pAdvertising->addServiceUUID(hid->hidService()->getUUID());
  pAdvertising->start();
}

void loop() {
  if (connected) {
    // Read joystick positions
    int xValue = analogRead(xPin);
    int yValue = analogRead(yPin);
    int switchState = digitalRead(switchPin);

    // Map joystick values to mouse movements
    int8_t xMove = map(xValue, 0, 4095, -127, 127);
    int8_t yMove = map(yValue, 0, 4095, -127, 127);

    // Check if there's actual joystick movement
    if (abs(xMove) > threshold || abs(yMove) > threshold) {
      xMove = (abs(xMove) > threshold) ? xMove / 4 : 0; // Reduce sensitivity
      yMove = (abs(yMove) > threshold) ? yMove / 4 : 0; // Reduce sensitivity

      uint8_t mouseReport[4] = { 0x00, xMove, yMove, 0 };
      input->setValue(mouseReport, sizeof(mouseReport));
      input->notify();
    }

    // Handle mouse click
    if (switchState == LOW) {
      uint8_t mouseReport[4] = { 0x01, 0, 0, 0 }; // Left click
      input->setValue(mouseReport, sizeof(mouseReport));
      input->notify();
      delay(200); // Debounce delay
      mouseReport[0] = 0x00; // Release click
      input->setValue(mouseReport, sizeof(mouseReport));
      input->notify();
    }

    // Handle scrolling
    static unsigned long holdStart = 0;
    if (abs(xMove) > threshold || abs(yMove) > threshold) {
      if (holdStart == 0) {
        holdStart = millis();
      } else if (millis() - holdStart > longPressDuration) {
        int8_t scrollValue = (abs(xMove) > abs(yMove)) ? xMove : yMove;
        uint8_t mouseReport[4] = { 0x00, 0, 0, scrollValue / 10 }; // Adjust scroll sensitivity
        input->setValue(mouseReport, sizeof(mouseReport));
        input->notify();
        holdStart = millis(); // Reset hold start to continuously scroll
      }
    } else {
      holdStart = 0;
    }
  }

  delay(20); // Small delay to prevent overwhelming the BLE connection
}
