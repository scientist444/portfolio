#include <SPI.h>
#include <LoRa.h>

#define ss 4  // GPIO 15 for ESP32 (NSS)
#define rst 15 // GPIO 16 for ESP32 (RESET)
#define dio0 2 // GPIO 4 for ESP32 (DIO0)
#define MOSI 23
#define MISO 19
#define SCK 18
String outgoing;
byte msgCount = 0;            // count of outgoing messages
byte localAddress = 0xFF;     // address of this device
byte destination = 0xBB;      // destination to send to
long lastSendTime = 0;        // last send time
int interval = 2000;          // interval between sends

void setup() {
  Serial.begin(9600);  // Initialize Serial for MH-ET Live Scanner
  while (!Serial);

  Serial.println("Two Way Communication");

  LoRa.setPins(ss, rst, dio0);

  if (!LoRa.begin(433E6)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }
}

void loop() {
  if (millis() - lastSendTime > interval) {
    // Read data from MH-ET Live Scanner
    if (Serial.available()) {
      String sensorData = Serial.readStringUntil('\n');  // Assuming data is newline-terminated
      sendMessage(sensorData);

      Serial.println("Sending: " + sensorData);
      lastSendTime = millis();  // timestamp the message
    }
  }

  // parse for a packet, and call onReceive with the result:
  onReceive(LoRa.parsePacket());
}

void sendMessage(String outgoing) {
  LoRa.beginPacket();                   // start packet
  LoRa.write(destination);              // add destination address
  LoRa.write(localAddress);             // add sender address
  LoRa.write(msgCount);                 // add message ID
  LoRa.write(outgoing.length());        // add payload length
  LoRa.print(outgoing);                 // add payload
  LoRa.endPacket();                     // finish packet and send it
  msgCount++;                           // increment message ID
  
  // Print the message being sent
 // Serial.print("Message sent: ");
  //Serial.println(outgoing);
}

void onReceive(int packetSize) {
  if (packetSize == 0) return;          // if there's no packet, return

  // Read packet header bytes:
  int recipient = LoRa.read();          // recipient address
  byte sender = LoRa.read();            // sender address
  byte incomingMsgId = LoRa.read();     // incoming msg ID
  byte incomingLength = LoRa.read();    // incoming msg length

  // Check if the packet is for this device
  if (recipient != localAddress) {
    Serial.println("This message is not for me.");
    return;
  }

  // Try to parse packet
  String LoRaData = LoRa.readString();

  // Received a packet
  Serial.print("Received packet: '");
  Serial.print(LoRaData);

  // Read packet
  while (LoRa.available()) {
    Serial.print((char)LoRa.read());
  }

  // Print RSSI of packet
  Serial.print("' with RSSI ");
  Serial.println(LoRa.packetRssi());
}
