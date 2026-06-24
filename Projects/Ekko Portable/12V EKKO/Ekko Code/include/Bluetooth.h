#pragma once
#include "Arduino.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

extern bool bluetoothState;

void initBluetooth();

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#include "Buttons.h"
#include "Motor.h"
bool bluetoothState = false;
uint8_t value = 0;

class MyCallbacks : public BLECharacteristicCallbacks
{
    void onWrite(BLECharacteristic *pCharacteristic)
    {
        std::string rxValue = pCharacteristic->getValue();

        if (rxValue.length() > 0)
        {
            Serial.println("*********");
            Serial.print("Received Value: ");
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
            }

            else if (rxValue == "a")
            {
                motorSpeed = 0;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
            else if (rxValue == "b")
            {
                motorSpeed = 1;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }

            else if (rxValue == "c")
            {

                motorSpeed = 2;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
            else if (rxValue == "d")
            {
                motorSpeed = 3;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
            else if (rxValue == "e")
            {
                motorSpeed = 4;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
            else if (rxValue == "f")
            {
                motorSpeed = 5;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
            else if (rxValue == "g")
            {
                motorSpeed = 6;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
            else if (rxValue == "h")
            {
                motorSpeed = 7;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
            else if (rxValue == "i")
            {
                motorSpeed = 8;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
            else if (rxValue == "j")
            {
                motorSpeed = 9;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
            else if (rxValue == "k")
            {
                motorSpeed = 10;
                ledcWrite(0, map(motorSpeed, 0, 10, 40, 140));
                Serial.println(motorSpeed);
            }
        }
    }

    void onStatus(BLECharacteristic *pCharacteristic)
    {
        Serial.println("Status invoked");
    }

    void onConnect(BLECharacteristic *pCharacteristic)
    {
        Serial.println("connected");
        digitalWrite(5, HIGH);
    }

    void onDisconnect(BLECharacteristic *pCharacteristic)
    {
        Serial.println("disconnected");
        digitalWrite(5, LOW);
    }
};

void initBluetooth()
{

    BLEDevice::init("EKKO");
    BLEServer *pServer = BLEDevice::createServer();
    //pServer->setCallbacks(new MyServerCallbacks());
    BLEService *pService = pServer->createService(SERVICE_UUID);

    BLECharacteristic *pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE);

    // pCharacteristic->setCallbacks(new MyCallbacks());
    pCharacteristic->setCallbacks(new MyCallbacks());

    //pCharacteristic->addDescriptor(new BLE2902());
    pCharacteristic->setValue("Hello World");
    pService->start();

    BLEAdvertising *pAdvertising = pServer->getAdvertising();
    pAdvertising->start();
}