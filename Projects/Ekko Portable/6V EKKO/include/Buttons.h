#pragma once
#include "Motor.h"
#include "Arduino.h"

extern volatile long lastDebounceTimeUp;
extern volatile long lastDebounceTimeDown;
extern int debounceDelay;

volatile long lastDebounceTimeUp = 0;
volatile long lastDebounceTimeDown = 0;
int debounceDelay = 350;

void up()
{
    if ((millis() - lastDebounceTimeUp) > debounceDelay)
    {
        if (motorSpeed < 10 && motorSpeed >= 0)
        {
            Serial.println("Up");

            motorSpeed += 1;
            Serial.print("Up Pressed, motorSpeed:");

            Serial.println(motorSpeed);

            writeMotorSpeedPwm();
        }
    }
    lastDebounceTimeUp = millis();
}

void down()
{

    if ((millis() - lastDebounceTimeDown) > debounceDelay)
    {
        if (motorSpeed <= 10 && motorSpeed > 0)
        {
            Serial.println("Down");

            motorSpeed -= 1;
            Serial.print("Down Pressed, motorSpeed:");
            Serial.println(motorSpeed);

            writeMotorSpeedPwm();
        }
    }
    lastDebounceTimeDown = millis();

    {
        Serial.println("1 RECEIVED 2");
    }
}

void speed_level()
{
    if (motorSpeed >= 0 && motorSpeed <= 10)
    {
        motorSpeed = motorSpeed;
    }
}

void initButtons()
{
    pinMode(26, INPUT_PULLDOWN); //16
    pinMode(27, INPUT_PULLDOWN); //17

    attachInterrupt(digitalPinToInterrupt(26), up, FALLING);
    attachInterrupt(digitalPinToInterrupt(27), down, FALLING);
}
