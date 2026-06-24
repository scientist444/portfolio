#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEHIDDevice.h>
#include <BLECharacteristic.h>
#include "HIDTypes.h"
#include "HIDKeyboardTypes.h"

const int xPin = 34; // Joystick X-axis
const int yPin = 35; // Joystick Y-axis
const int joystickButtonPin = 4; // Joystick button
const int leftSwitchPin = 25; // Left tactile switch
const int rightSwitchPin = 26; // Right tactile switch

const int threshold = 50; // Adjusted threshold for joystick movement sensitivity
const int debounceDelay = 50; // Debounce delay in ms for the button

BLEHIDDevice* hid;
BLECharacteristic* input;
BLECharacteristic* output;
bool connected = false;
bool scrollMode = false; // To track the mode (cursor movement or scroll)

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
  
  pinMode(joystickButtonPin, INPUT_PULLUP);
  pinMode(leftSwitchPin, INPUT_PULLUP);
  pinMode(rightSwitchPin, INPUT_PULLUP);

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
    int joystickButtonState = digitalRead(joystickButtonPin);
    int leftSwitchState = digitalRead(leftSwitchPin);
    int rightSwitchState = digitalRead(rightSwitchPin);

    // Toggle between cursor movement and scroll mode
    static int lastJoystickButtonState = HIGH;
    if (joystickButtonState == LOW && lastJoystickButtonState == HIGH) {
      delay(debounceDelay);
      scrollMode = !scrollMode;
    }
    lastJoystickButtonState = joystickButtonState;

    // Map joystick values to mouse movements or scroll
    int8_t xMove = map(xValue, 0, 4095, -127, 127);
    int8_t yMove = map(yValue, 0, 4095, -127, 127);

    if (abs(xMove) > threshold || abs(yMove) > threshold) {
      xMove = (abs(xMove) > threshold) ? xMove / 4 : 0; // Reduce sensitivity
      yMove = (abs(yMove) > threshold) ? yMove / 4 : 0; // Reduce sensitivity

      uint8_t mouseReport[4];
      if (scrollMode) {
        mouseReport[0] = 0x00;
        mouseReport[1] = 0;
        mouseReport[2] = 0;
        mouseReport[3] = yMove; // Use Y-axis for scrolling
      } else {
        mouseReport[0] = 0x00;
        mouseReport[1] = xMove;
        mouseReport[2] = yMove;
        mouseReport[3] = 0;
      }
      input->setValue(mouseReport, sizeof(mouseReport));
      input->notify();
    }

    // Handle left click
    if (leftSwitchState == LOW) {
      static unsigned long lastLeftDebounceTime = 0;
      if ((millis() - lastLeftDebounceTime) > debounceDelay) {
        uint8_t mouseReport[4] = { 0x01, 0, 0, 0 }; // Left click
        input->setValue(mouseReport, sizeof(mouseReport));
        input->notify();
        delay(50); // Debounce delay
        mouseReport[0] = 0x00; // Release click
        input->setValue(mouseReport, sizeof(mouseReport));
        input->notify();
        lastLeftDebounceTime = millis();
      }
    }

    // Handle right click
    if (rightSwitchState == LOW) {
      static unsigned long lastRightDebounceTime = 0;
      if ((millis() - lastRightDebounceTime) > debounceDelay) {
        uint8_t mouseReport[4] = { 0x02, 0, 0, 0 }; // Right click
        input->setValue(mouseReport, sizeof(mouseReport));
        input->notify();
        delay(50); // Debounce delay
        mouseReport[0] = 0x00; // Release click
        input->setValue(mouseReport, sizeof(mouseReport));
        input->notify();
        lastRightDebounceTime = millis();
      }
    }
  }

  delay(20); // Small delay to prevent overwhelming the BLE connection
}
