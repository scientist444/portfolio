
#include "Arduino.h"
#include "Bluetooth.h"
#include "Buttons.h"
#include "Motor.h"
#include <SPI.h>
#include <Wire.h>
void setup()
{
  Serial.begin(115200);
  initMotor();
  initButtons();
  initBluetooth();
}

void loop()
{
  //redrawDisplay(); 
}
