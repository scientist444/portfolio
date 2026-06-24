#pragma once
#include "Arduino.h"
#include <Wire.h>

namespace {
constexpr uint8_t MAX17048_ADDRESS = 0x36;
constexpr uint8_t MAX17048_VCELL_REGISTER = 0x02;
constexpr uint8_t MAX17048_SOC_REGISTER = 0x04;

constexpr uint8_t BATTERY_SDA_PIN = 21;
constexpr uint8_t BATTERY_SCL_PIN = 22;

bool readMax17048Register(uint8_t reg, uint16_t &value) {
    Wire.beginTransmission(MAX17048_ADDRESS);
    Wire.write(reg);
    if (Wire.endTransmission(false) != 0) {
        return false;
    }

    if (Wire.requestFrom((uint16_t)MAX17048_ADDRESS, (uint8_t)2) != 2) {
        return false;
    }

    uint8_t msb = Wire.read();
    uint8_t lsb = Wire.read();
    value = (uint16_t(msb) << 8) | lsb;
    return true;
}
}

void initBattery() {
    // MAX17048 I2C pins based on ESP32-WROOM-32D schematic:
    // SDA is IO21, SCL is IO22
    Wire.begin(BATTERY_SDA_PIN, BATTERY_SCL_PIN);
}

float getBatterySOC() {
    uint16_t raw = 0;
    if (!readMax17048Register(MAX17048_SOC_REGISTER, raw)) {
        return -1.0;
    }

    float soc = (raw >> 8) + ((raw & 0xFF) / 256.0f);
    if (soc < 0.0f) {
        return 0.0f;
    }
    if (soc > 100.0f) {
        return 100.0f;
    }
    return soc;
}

float getBatteryVoltage() {
    uint16_t raw = 0;
    if (!readMax17048Register(MAX17048_VCELL_REGISTER, raw)) {
        return -1.0;
    }

    // MAX17048 VCELL resolution is 78.125 uV per register LSB.
    return raw * 0.000078125f;
}

bool hasChargerStatusHardware() {
    return false;
}

bool isChargerConnected() {
    // The schematic does not show USB VBUS, TP4056 CHRG, or TP4056 STDBY
    // connected to an ESP32 GPIO. GPIO34's divider appears tied to a board
    // supply rail, so it cannot accurately report charger presence.
    return false;
}

bool isBatteryCharging(float voltage) {
    (void)voltage;
    return isChargerConnected();
}
