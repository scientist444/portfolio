#pragma once
#include "Arduino.h"
extern int motorSpeed;

void initMotor();

int motorSpeed = 1;

constexpr int MOTOR_PWM_CHANNEL = 0;
constexpr int MOTOR_PWM_FREQUENCY = 30000;
constexpr int MOTOR_PWM_RESOLUTION_BITS = 8;
constexpr int MOTOR_PWM_MAX_DUTY = (1 << MOTOR_PWM_RESOLUTION_BITS) - 1;
constexpr int MOTOR_SPEED_MIN_LEVEL = 0;
constexpr int MOTOR_SPEED_MAX_LEVEL = 10;
constexpr int MOTOR_PWM_BY_LEVEL[MOTOR_SPEED_MAX_LEVEL + 1] = {
    80, 100, 121, 140, 150, 170, 183, 195, 207, 220, 226};

int motorSpeedToPwm(int speed)
{
    if (speed < MOTOR_SPEED_MIN_LEVEL)
    {
        return 0;
    }

    if (speed > MOTOR_SPEED_MAX_LEVEL)
    {
        return MOTOR_PWM_MAX_DUTY;
    }

    return MOTOR_PWM_BY_LEVEL[speed];
}

void writeMotorSpeedPwm()
{
    ledcWrite(MOTOR_PWM_CHANNEL, motorSpeedToPwm(motorSpeed));
}

void initMotor()
{
    ledcSetup(MOTOR_PWM_CHANNEL, MOTOR_PWM_FREQUENCY, MOTOR_PWM_RESOLUTION_BITS);

    ledcAttachPin(33, MOTOR_PWM_CHANNEL); //18
}
