#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEHIDDevice.h>
#include <BLECharacteristic.h>
#include "HIDTypes.h"
#include "HIDKeyboardTypes.h"

const int xPin1 = 9; // First Joystick X-axis (Cursor movement)
const int yPin1 = 10; // First Joystick Y-axis (Cursor movement)
const int buttonPin1 = 11; // First Joystick button (Left click)

const int xPin2 = 33; // Second Joystick X-axis (Scrolling)
const int yPin2 = 25; // Second Joystick Y-axis (Scrolling)
const int buttonPin2 = 26; // Second Joystick button (Right click)

const int threshold = 50; // Adjusted threshold for joystick movement sensitivity
const int debounceDelay = 50; // Debounce delay in ms for the button

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
  
  pinMode(buttonPin1, INPUT_PULLUP);
  pinMode(buttonPin2, INPUT_PULLUP);

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
    // Read joystick 1 positions (Cursor movement)
    int xValue1 = analogRead(xPin1);
    int yValue1 = analogRead(yPin1);
    int buttonState1 = digitalRead(buttonPin1);

    // Read joystick 2 positions (Scrolling)
    int xValue2 = analogRead(xPin2);
    int yValue2 = analogRead(yPin2);
    int buttonState2 = digitalRead(buttonPin2);

    // Map joystick values to mouse movements or scroll
    int8_t xMove1 = map(xValue1, 0, 4095, -127, 127);
    int8_t yMove1 = map(yValue1, 0, 4095, -127, 127);
    int8_t yMove2 = map(yValue2, 0, 4095, -127, 127);

    if (abs(xMove1) > threshold || abs(yMove1) > threshold) {
      xMove1 = (abs(xMove1) > threshold) ? xMove1 / 4 : 0; // Reduce sensitivity
      yMove1 = (abs(yMove1) > threshold) ? yMove1 / 4 : 0; // Reduce sensitivity

      uint8_t mouseReport[4] = {0x00, xMove1, yMove1, 0};
      input->setValue(mouseReport, sizeof(mouseReport));
      input->notify();
    }

    if (abs(yMove2) > threshold) {
      yMove2 = (abs(yMove2) > threshold) ? yMove2 / 4 : 0; // Reduce sensitivity

      uint8_t scrollReport[4] = {0x00, 0, 0, yMove2};
      input->setValue(scrollReport, sizeof(scrollReport));
      input->notify();
    }

    // Handle left click (Joystick 1 button)
    if (buttonState1 == LOW) {
      static unsigned long lastDebounceTime1 = 0;
      if ((millis() - lastDebounceTime1) > debounceDelay) {
        uint8_t clickReport[4] = {0x01, 0, 0, 0}; // Left click
        input->setValue(clickReport, sizeof(clickReport));
        input->notify();
        delay(50); // Debounce delay
        clickReport[0] = 0x00; // Release click
        input->setValue(clickReport, sizeof(clickReport));
        input->notify();
        lastDebounceTime1 = millis();
      }
    }

    // Handle right click (Joystick 2 button)
    if (buttonState2 == LOW) {
      static unsigned long lastDebounceTime2 = 0;
      if ((millis() - lastDebounceTime2) > debounceDelay) {
        uint8_t clickReport[4] = {0x02, 0, 0, 0}; // Right click
        input->setValue(clickReport, sizeof(clickReport));
        input->notify();
        delay(50); // Debounce delay
        clickReport[0] = 0x00; // Release click
        input->setValue(clickReport, sizeof(clickReport));
        input->notify();
        lastDebounceTime2 = millis();
      }
    }
  }

  delay(20); // Small delay to prevent overwhelming the BLE connection
}
