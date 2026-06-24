#pragma once
#include "Arduino.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

extern bool bluetoothState;

void initBluetooth();
void updateBatteryBLE(int percentage);

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BATTERY_CHARACTERISTIC_UUID "2a19"
#define LED_PIN 5
#include "Buttons.h"
#include "Motor.h"
bool bluetoothState = false;
uint8_t value = 0;
bool deviceConnected = false;

BLECharacteristic *pBatteryCharacteristic = nullptr;

void updateBatteryBLE(int percentage) {
    if (deviceConnected && pBatteryCharacteristic != nullptr) {
        char batteryMsg[10];
        sprintf(batteryMsg, "BAT:%d", percentage);
        pBatteryCharacteristic->setValue(batteryMsg);
        pBatteryCharacteristic->notify();
        
        Serial.print("Battery sent: ");
        Serial.println(batteryMsg);
    }
}

class MyServerCallbacks : public BLEServerCallbacks
{
    void onConnect(BLEServer *pServer)
    {
        deviceConnected = true;
        bluetoothState = true;
        Serial.println("Device Connected");
        digitalWrite(LED_PIN, HIGH);
    }

    void onDisconnect(BLEServer *pServer)
    {
        deviceConnected = false;
        bluetoothState = false;
        Serial.println("Device Disconnected");
        digitalWrite(LED_PIN, LOW);
        delay(500);
        pServer->startAdvertising();
        Serial.println("Advertising restarted");
    }
};

class MyCallbacks : public BLECharacteristicCallbacks
{
    void onWrite(BLECharacteristic *pCharacteristic)
    {
        std::string rxValue = pCharacteristic->getValue();

        if (rxValue.length() > 0)
        {
            Serial.println("*********");
            Serial.print("Received Value: ");
            Serial.println(rxValue.c_str());
            if (rxValue == "UP")
            {
                Serial.println("UP RECEIVED");
                up();
            }
            else if (rxValue == "DOWN")
            {
                Serial.println("DOWN RECEIVED");
                down();
            }

            else if (rxValue == "STOP")
            {
                Serial.println("STOP RECEIVED");
                motorSpeed = 0;
                ledcWrite(0, 0);
            }

            else if (rxValue == "a")
            {
                motorSpeed = 0;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
            else if (rxValue == "b")
            {
                motorSpeed = 1;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }

            else if (rxValue == "c")
            {

                motorSpeed = 2;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
            else if (rxValue == "d")
            {
                motorSpeed = 3;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
            else if (rxValue == "e")
            {
                motorSpeed = 4;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
            else if (rxValue == "f")
            {
                motorSpeed = 5;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
            else if (rxValue == "g")
            {
                motorSpeed = 6;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
            else if (rxValue == "h")
            {
                motorSpeed = 7;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
            else if (rxValue == "i")
            {
                motorSpeed = 8;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
            else if (rxValue == "j")
            {
                motorSpeed = 9;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
            else if (rxValue == "k")
            {
                motorSpeed = 10;
                writeMotorSpeedPwm();
                Serial.println(motorSpeed);
            }
        }
    }

    void onStatus(BLECharacteristic *pCharacteristic)
    {
        Serial.println("Status invoked");
    }
};

void initBluetooth()
{
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    BLEDevice::init("EKKO");
    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);

    BLECharacteristic *pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE);

    pCharacteristic->setCallbacks(new MyCallbacks());
    pCharacteristic->setValue("EKKO Ready");

    pBatteryCharacteristic = pService->createCharacteristic(
        BATTERY_CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pBatteryCharacteristic->addDescriptor(new BLE2902());
    pBatteryCharacteristic->setValue("BAT:100");

    pService->start();

    BLEAdvertising *pAdvertising = pServer->getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    pAdvertising->start();

    Serial.println("Bluetooth initialized - Device name: EKKO");
}
