  /*
  Developed by Muhammad Umer Sajid 
  

  TESTED ON: 
  ESP-WROOM-32

  PIN CONNECTIONS: 
  WIFI_LED - GPIO13
  MPU_SENSOR - SCL: GPIO22 , SDA: GPIO21
  EMG_SENSOR - Analog out: GPIO 36
  HEARTRATE_SENSOR - SCL: GPIO22 , SDA: GPIO21

  Libraries required
  - WiFiManager
  - PubSubClient
  - Adafruit_Sensor
  - Adafruit_MPU6050
  - PulseSensorPlayground
  - Max30102


  MQTT SERVER: test.mosquitto.org: 1883
  MQTT TOPIC: EPIC/RawData
  */


  // wifi libraries 
  #include <WiFiManager.h> 
  #include <PubSubClient.h>
  #include "EMGFilters.h"  //https://github.com/oymotion/EMGFilters/tree/master

  // MPU6050 libraries 
  #include <Adafruit_MPU6050.h>
  #include <Adafruit_Sensor.h>
  #include <Wire.h>
  #include "MAX30105.h"
  #include "heartRate.h"
  // #include <PulseSensorPlayground.h>

  //EMG Pin
  const int EMG_INPUT = 36;
  EMGFilters myFilter;
  SAMPLE_FREQUENCY sampleRate = SAMPLE_FREQ_1000HZ;
  NOTCH_FREQUENCY humFreq = NOTCH_FREQ_50HZ;
  static int Threshold = 0;
  unsigned long timeStamp;
  unsigned long timeBudget;


  // PULSESENSORSETUP
  MAX30105 particleSensor;

  const byte RATE_SIZE = 4; //Increase this for more averaging. 4 is good.
  byte rates[RATE_SIZE]; //Array of heart rates
  byte rateSpot = 0;
  long lastBeat = 0; //Time at which the last beat occurred
  long irValue;

  float beatsPerMinute;
  int beatAvg;

  //WIFI SETUP
  const char* mqtt_server = "test.mosquitto.org";
  Adafruit_MPU6050 mpu;
  WiFiClient espClient;
  PubSubClient client(espClient);

  void setup_wifi() {
    WiFiManager wm;
    bool res;
    res = wm.autoConnect("EPIC","@EPIC123"); // password protected ap
    if(!res) {Serial.println("Failed to connect");} 
    else  {
      digitalWrite(13, HIGH);   // Turn the RGB LED white
      }
  }

  void reconnect() {
    while (!client.connected()) {
      Serial.print("Attempting MQTT connection...");
      if (client.connect("ESP32_Client_EPIC_A0000")) {
        Serial.println("connected");
      } else {
        Serial.print("failed, rc=");
        Serial.print(client.state());
        Serial.println(" try again in 5 seconds");
        delay(5000);
      }
    }
  }

  void calculatecurrentBPM(){
     irValue = particleSensor.getIR();

    if (checkForBeat(irValue) == true)
    {
      //We sensed a beat!
      long delta = millis() - lastBeat;
      lastBeat = millis();

      beatsPerMinute = 60 / (delta / 1000.0);

      if (beatsPerMinute < 255 && beatsPerMinute > 20)
      {
        rates[rateSpot++] = (byte)beatsPerMinute; //Store this reading in the array
        rateSpot %= RATE_SIZE; //Wrap variable

        //Take average of readings
        beatAvg = 0;
        for (byte x = 0 ; x < RATE_SIZE ; x++)
          beatAvg += rates[x];
        beatAvg /= RATE_SIZE;

      }
    }
         if (irValue < 50000) {
        Serial.print(" No finger?");
        beatsPerMinute = 0; // Reset BPM to zero if no finger is detected
    }
  }

  void setup(void) {
    analogReadResolution(10);
    Serial.begin(115200);
    pinMode (13,OUTPUT);
    while (!Serial)
      delay(10); 
      
    if (!mpu.begin()) {
      Serial.println("Failed to find MPU6050 chip");
      while (1) {
        delay(10);
      }
    }

    //EMG setup
    myFilter.init(sampleRate, humFreq, true, true, true);
      Serial.begin(115200);
      analogReadResolution(10);

    // Pulse SENSOR
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) //Use default I2C port, 400kHz speed
    {
      Serial.println("MAX30105 was not found. Please check wiring/power. ");
    }
    particleSensor.setup(); //Configure sensor with default settings
    particleSensor.setPulseAmplitudeRed(0x0A); //Turn Red LED to low to indicate sensor is running
    particleSensor.setPulseAmplitudeGreen(0); //Turn off Green LED
    
    // MPU
    Serial.println("MPU6050 Found!");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_5_HZ);
    
    // MQTT
    setup_wifi();
    client.setServer(mqtt_server, 1883);
  }

  void loop() {
    if (!client.connected()){reconnect();}
    client.loop();
    
    int Value = analogRead(EMG_INPUT);
    int DataAfterFilter = myFilter.update(Value);
    int envlope = sq(DataAfterFilter);
    envlope = (envlope > Threshold) ? envlope : 0;
  
    // Heart Rate sensor data
    calculatecurrentBPM();

    // int currentBPM = pulseSensor.getBeatsPerMinute();

    //MPU DATA
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    String datablock = String(micros())+ ',' +
                      String(a.acceleration.x) + "," +
                      String(a.acceleration.y) +"," + 
                      String(a.acceleration.z) +"," + 
                      String(g.gyro.x)  +"," + 
                      String(g.gyro.y) +"," + 
                      String(g.gyro.z)+"," + 
                      String(beatsPerMinute)+"," +
                      String(DataAfterFilter)+"," +
                      String(envlope)+"\n";
                      
    // Publising the data
    Serial.print(datablock); 
  

    if(client.publish("EPIC/RawData", datablock.c_str())){} //Serial.println("Published");}
    else {Serial.println("Dropped");}

    //delay for each sensor
    delay(10);
    
  }
