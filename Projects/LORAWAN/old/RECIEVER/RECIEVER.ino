#include <STM32LoRaWAN.h>

// Define the LoRa parameters
#define LORA_FREQUENCY 868E6  // LoRa frequency for EU868
#define LORA_TX_POWER 14      // Transmission power in dBm

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("LoRa Transmitter");

  if (!LoRaWAN.begin(LORA_FREQUENCY)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }

  LoRaWAN.setTxPower(LORA_TX_POWER);
}

void loop() {
  Serial.println("Sending packet: Hello World!");

  LoRaWAN.beginPacket();
  LoRaWAN.print("Hello World!");
  LoRaWAN.endPacket();

  delay(5000);
}
