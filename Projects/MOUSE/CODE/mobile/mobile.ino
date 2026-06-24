#include <BleMouse.h>

BleMouse bleMouse("ESP32 Mouse", "Espressif", 100);

const int xPin = 9;   // Joystick X-axis
const int yPin = 10;  // Joystick Y-axis
const int swPin = 11; // Joystick button (switch)

const int threshold = 10;  // Threshold for joystick movement
const int debounceDelay = 200; // Debounce delay for button press

void setup() {
  Serial.begin(115200);
  
  // Initialize BLE Mouse
  bleMouse.begin();
  Serial.println("Starting BLE Mouse...");
  
  // Setup joystick pins
  pinMode(xPin, INPUT);
  pinMode(yPin, INPUT);
  pinMode(swPin, INPUT_PULLUP);
}

void loop() {
  // Wait for BLE connection
  if (bleMouse.isConnected()) {
    // Read joystick X and Y positions
    int xValue = analogRead(xPin);
    int yValue = analogRead(yPin);
    int switchState = digitalRead(swPin);

    // Map joystick values to mouse movements
    // Joystick centered at ~2048, so we subtract 2048 to center the values
    int8_t xMove = map(xValue - 2048, -2048, 2047, -127, 127);
    int8_t yMove = map(yValue - 2048, -2048, 2047, -127, 127);

    // Check if there's actual joystick movement
    if (abs(xMove) > threshold || abs(yMove) > threshold) {
      // Reduce sensitivity if there's significant movement
      xMove = (abs(xMove) > threshold) ? xMove / 8 : 0;
      yMove = (abs(yMove) > threshold) ? yMove / 8 : 0;

      // Move the mouse
      bleMouse.move(xMove, yMove);
    }

    // Handle mouse click
    if (switchState == LOW) {  // Button pressed
      static unsigned long lastDebounceTime = 0;
      if ((millis() - lastDebounceTime) > debounceDelay) {
        // Simulate a left click
        bleMouse.click(MOUSE_LEFT);
        delay(50); // Debounce delay

        lastDebounceTime = millis();
      }
    }
  }

  delay(10);  // Polling delay to avoid high CPU usage
}
