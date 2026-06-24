#pragma once
#include "Arduino.h"
extern int motorSpeed;

void initMotor();

int motorSpeed = 1;

void initMotor()
{
    ledcSetup(0, 30000, 8);

    ledcAttachPin(33, 0); //18
}