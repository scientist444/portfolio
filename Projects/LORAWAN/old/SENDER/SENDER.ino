#include <LoRa.h>

#define SENDER_FREQ 868E6  // Frequency of the sender (868 MHz)
#define SENDER_SF 7       // Spreading factor of the sender (7)
#define SENDER_SBW 125E3  // Signal bandwidth of the sender (125 kHz)
#define SENDER_CR 5       // Coding rate of the sender (4/5)
#define SENDER_PWR 14     // Transmission power of the sender (14 dBm)

void setup() {
  Serial.begin(9600);
  while (!Serial);

  LoRa.setPins();  // Use default pins
  if (!LoRa.begin(SENDER_FREQ)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }

  LoRa.setSpreadingFactor(SENDER_SF);
  LoRa.setSignalBandwidth(SENDER_SBW);
  LoRa.setCodingRate4(SENDER_CR);
  LoRa.setTxPower(SENDER_PWR);
}

void loop() {
  String message = "Hello, LoRa!";
  LoRa.beginPacket();
  LoRa.print(message);
  LoRa.endPacket();

  Serial.print("Sending packet: ");
  Serial.println(message);
  delay(1000);
}