
#include "Arduino.h"
#include "Bluetooth.h"
#include "Buttons.h"
#include "Motor.h"
#include "Battery.h"
#include <SPI.h>
#include <Wire.h>

unsigned long lastBatteryCheck = 0;
const unsigned long BATTERY_INTERVAL_MS = 10000;

void setup()
{
  Serial.begin(115200);
  initMotor();
  initButtons();
  initBattery();
  initBluetooth();
}

void loop()
{
  // Check and send battery percentage via BLE every 10 seconds
  if (millis() - lastBatteryCheck >= BATTERY_INTERVAL_MS) {
      lastBatteryCheck = millis();
      float soc = getBatterySOC();
      float voltage = getBatteryVoltage();
      bool chargerConnected = isChargerConnected();
      if (soc >= 0.0 && voltage >= 0.0) {
          int batteryPercentage = (int)(soc + 0.5f);
          Serial.print("Battery Level: ");
          Serial.print(batteryPercentage);
          Serial.print("% | Voltage: ");
          Serial.print(voltage);
          Serial.print("V | Charger: ");
          Serial.println(hasChargerStatusHardware()
              ? (chargerConnected ? "CONNECTED" : "DISCONNECTED")
              : "UNKNOWN - not wired to ESP32");
          updateBatteryBLE(batteryPercentage);
      }
  }
}
