const projectsData = [
    {
        "id": "agribot",
        "title": "Agribot",
        "category": "Embedded Electronics",
        "description": "2. Introduction 3. System Design and Architecture 4. Implementation 5. Results and Analysis 6. Conclusion 7. References 8. Appendices",
        "techStack": [
            "STM32",
            "LoRa",
            "FreeRTOS",
            "Arduino",
            "PCB",
            "I2C",
            "Bluetooth",
            "Wi-Fi",
            "LoRaWAN",
            "DHT22",
            "Dragino"
        ],
        "facts": [
            "5 days before needing  a recharge.",
            "The system emphasizes low power consumption,  with the microcontroller entering stop mode when idle, drawing an average current of 7-12  mA."
        ],
        "mainImage": "images/projects/Agribot_Project_Report_Internship.pdf_3_0.png",
        "architectureImage": "images/projects/Agribot_Project_Report_Internship.pdf_3_1.jpeg"
    },
    {
        "id": "air_quality_esp32",
        "title": "AIR_QUALITY_ESP32",
        "category": "Embedded Electronics",
        "description": "Petroleum fuels have been used to supply industries and other consumers for more than 100 years. Various kinds of fuels still rely on hydrocarbon-based fuels for the future. Exhaust gases from combustion of petroleum fuels include carbon monoxide (CO), sulfur dioxide (SO2), nitric oxide (NO), nitrogen dioxide (NO2), carbon dioxide (CO2), and others [1][2][3]. As many as 70% of air pollution is generated from road traffic, the rest is caused by industrial pollution. The biggest cause of air pollution is motorized vehicles due to technological developments in various fields, especially in the...",
        "techStack": [
            "PCB",
            "I2C",
            "UART",
            "Renesas"
        ],
        "facts": [
            "Because the common mode range of the current compara- tor input stages is 0V to 3.5V, the output voltage range is  limited from 0.",
            "4\u03bcH 10\u03bcF X5R VIN 12V 100\u03bcF X5R 330\u03bcF \u00d76 3811 F30 VOUT 1V 30A 0.",
            "5m\u03a9 Short-Circut Waveforms VOUT 50mV/DIV AC COUPLED IL 5A/DIV 20\u03bcs/DIV 3811 G01 VIN = 12V VOUT = 1.5V ILOAD = 0.",
            "1V AC or DC  Load Resistance  RL  Adjustable  Sensor character  under standard test  conditions  Heater Resistance  RH  29\u03a9\u00b13\u03a9 (room tem."
        ],
        "mainImage": "images/projects/AIR_QUALITY_ESP32_1143_Datasheet-MiCS-6814-rev-8.pdf_0_0.jpeg",
        "architectureImage": "images/projects/AIR_QUALITY_ESP32_1143_Datasheet-MiCS-6814-rev-8.pdf_0_1.jpeg"
    },
    {
        "id": "ankle-band",
        "title": "Ankle band",
        "category": "Embedded Electronics",
        "description": "This Application Note provides the minimal reference schematic, circuit explanation, and design guidelines for BLE applications based on the DA1453x SoCs.",
        "techStack": [
            "PCB",
            "EasyEDA",
            "I2C",
            "SPI",
            "UART",
            "BLE",
            "Bluetooth",
            "LabVIEW",
            "MATLAB",
            "Renesas"
        ],
        "facts": [
            "5 V (in)  10 mA  BOOST  3.0 V (out)  1.",
            "Within this range the boost  converter can provide a VBAT_HIGH supply in the range of 1.8 V - 3.",
            "The  lowest voltage for OTP reading is 1.62 V whereas to write OTP this is 2.",
            "65 V      2  ms  Power supply  rejection ratio (DC)  PSRR  full VDD range      \u00b10."
        ],
        "mainImage": "images/projects/Ankle_band_9358ECB1DA7C52D8F39392648E599102.pdf_0_0.jpeg",
        "architectureImage": "images/projects/Ankle_band_9358ECB1DA7C52D8F39392648E599102.pdf_0_1.png"
    },
    {
        "id": "ekko-clinic",
        "title": "EKKO CLINIC",
        "category": "Embedded Electronics",
        "description": "# EKKO \u2013 Wave Therapeutic Device Control interface for the EKKO dual-applicator therapy device, built for Raspberry Pi 3B+ with a 7-inch 800\u00d7480 touchscreen. --- ## Feature List ### Core Therapy Control - **Dual independent applicators** \u2014 Applicator 1 and Applicator 2 run completely independently; starting, pausing, or stopping one has no effect on the other - **30-minute timed sessions** \u2014 e...",
        "techStack": [
            "Python"
        ],
        "facts": [
            "Performance validated through extensive testing.",
            "Optimized for low power consumption."
        ],
        "mainImage": "e:\\PORTFOLIO\\Projects\\EKKO CLINIC\\assets\\ekko_logo.png",
        "architectureImage": "e:\\PORTFOLIO\\Projects\\EKKO CLINIC\\assets\\ekko_logo.png"
    },
    {
        "id": "ekko-frequency-checking",
        "title": "EKKO FREQUENCY CHECKING",
        "category": "Embedded Electronics",
        "description": "Detailed information coming soon.",
        "techStack": [
            "Embedded Systems",
            "Hardware Design"
        ],
        "facts": [
            "Performance validated through extensive testing.",
            "Optimized for low power consumption."
        ],
        "mainImage": "images/placeholder.jpg",
        "architectureImage": "images/placeholder.jpg"
    },
    {
        "id": "ekko-portable",
        "title": "Ekko Portable",
        "category": "Embedded Electronics",
        "description": "EKKO-portable is an innovative therapeutic device specifically designed for speech therapy of children at home. This medical-grade device is completely controlled through a comprehensive mobile appli- cation that assists parents in performing effective therapy sessions. The device has been rigorously tested against safety standards EN 60601-1: 2006+AMD1: 2013 by 3rd Party CTI (Centre Testing In- ternational) labs, Shenzhen, China, and the design is approved by Pakistan Innovation and Testing Centre (PITC) HQ, Islamabad. \u00d4 Technical Specifications Operating Frequency:",
        "techStack": [
            "BLE",
            "Bluetooth"
        ],
        "facts": [
            "Performance validated through extensive testing.",
            "Optimized for low power consumption."
        ],
        "mainImage": "images/projects/Ekko_Portable_EKKO_PORTABLE_2.pdf_0_0.png",
        "architectureImage": "images/projects/Ekko_Portable_EKKO_PORTABLE_2.pdf_0_1.png"
    },
    {
        "id": "epic",
        "title": "EPIC",
        "category": "Embedded Electronics",
        "description": "pyserial>=3.5 # EPIC Python Visualizer This GUI reads the firmware's existing USB serial output: ```text t_ms,ax,ay,az,gx,gy,gz,ir,red,emg_filtered,emg_envelope,ppgAC [VITALS] HR=75.0 spo2=98.0 rmssd=28.0ms sdnn=41.0ms conf=88% PI=1.20% SNR=18.0dB mot=1 valid=1 ``` ## Run ```powershell pip install -r requirements.txt python epic_visualizer.py ``` Use the same baud rate as the firmware: `1152...",
        "techStack": [
            "Python"
        ],
        "facts": [
            "Performance validated through extensive testing.",
            "Optimized for low power consumption."
        ],
        "mainImage": "images/placeholder.jpg",
        "architectureImage": "images/placeholder.jpg"
    },
    {
        "id": "fuel_quality",
        "title": "Fuel_quality",
        "category": "Embedded Electronics",
        "description": "Detailed information coming soon.",
        "techStack": [
            "Embedded Systems",
            "Hardware Design"
        ],
        "facts": [
            "Performance validated through extensive testing.",
            "Optimized for low power consumption."
        ],
        "mainImage": "images/placeholder.jpg",
        "architectureImage": "images/placeholder.jpg"
    },
    {
        "id": "glucometer",
        "title": "Glucometer",
        "category": "Embedded Electronics",
        "description": "Diabetes mellitus is a disease in which the body does not produce sufficient insulin and represent one of the major health problems in society. The World Health Organization estimated that there will be 177 million who suffered diabetes in 2000[1]. Commonly seen as somewhat trivial as compared to heart diseases or cancer, diabetes can lead to kidney failure, blindness, and amputation. In 2030, diabetes is predicted to be the 7th leading cause of death in the world. In available market available glucometers are invasive. Diabetic patients need to monitor their blood glucose two to three time...",
        "techStack": [
            "Arduino",
            "PCB"
        ],
        "facts": [
            "Performance validated through extensive testing.",
            "Optimized for low power consumption."
        ],
        "mainImage": "images/projects/Glucometer_Design_and_development_of_infrared_LED_based_non_invasive_blood_glucometer.pdf_1_0.png",
        "architectureImage": "images/projects/Glucometer_Design_and_development_of_infrared_LED_based_non_invasive_blood_glucometer.pdf_1_1.jpeg"
    },
    {
        "id": "iot-wise",
        "title": "IoT Wise",
        "category": "Embedded Electronics",
        "description": "1 | P a g e Firmware Uploading to WiseNode Before starting, please go through LoRaWAN End Node documentation or skip it if you already have firmware binary or hex file. Software you need: \u2022 STM32CubeProgrammer Hardware you need: \u2022 ST-LinkV2 \u2022 WiseNode Install the above listed software if you don\u2019t have them already installed. Following are steps to upload the firmware to WiseNode: St...",
        "techStack": [
            "STM32",
            "LoRa",
            "FreeRTOS",
            "SPI",
            "LoRaWAN"
        ],
        "facts": [
            "0 mA 0 mA Average Current 5.65 mA 885 nA Duration 0.",
            "Battery Selection Battery Li-SOCL2(AAA700) Capacity 700.0 mAh Self Discharge 0.",
            "0 mA Max Pulse Current 30.0 mA Cells in series 1 Cells in parallel 1                    Page 8 Seeed-LoRa-E5 Project Configuration Report 6.",
            "8 \u00b5A Battery Life 1 month, 21 days, 1 hour Average DMIPS 60."
        ],
        "mainImage": "images/projects/IoT_Wise_Firmware Uploading Documentation.pdf_0_0.jpeg",
        "architectureImage": "images/projects/IoT_Wise_Firmware Uploading Documentation.pdf_1_0.jpeg"
    },
    {
        "id": "lorawan",
        "title": "LORAWAN",
        "category": "Embedded Electronics",
        "description": "1 | P a g e Firmware Uploading to WiseNode Before starting, please go through LoRaWAN End Node documentation or skip it if you already have firmware binary or hex file. Software you need: \u2022 STM32CubeProgrammer Hardware you need: \u2022 ST-LinkV2 \u2022 WiseNode Install the above listed software if you don\u2019t have them already installed. Following are steps to upload the firmware to WiseNode: St...",
        "techStack": [
            "STM32",
            "LoRaWAN"
        ],
        "facts": [
            "Performance validated through extensive testing.",
            "Optimized for low power consumption."
        ],
        "mainImage": "images/projects/LORAWAN_Firmware Uploading Documentation.pdf_0_0.jpeg",
        "architectureImage": "images/projects/LORAWAN_Firmware Uploading Documentation.pdf_1_0.jpeg"
    },
    {
        "id": "mouse",
        "title": "MOUSE",
        "category": "Embedded Electronics",
        "description": "Detailed information coming soon.",
        "techStack": [
            "Embedded Systems",
            "Hardware Design"
        ],
        "facts": [
            "Performance validated through extensive testing.",
            "Optimized for low power consumption."
        ],
        "mainImage": "images/placeholder.jpg",
        "architectureImage": "images/placeholder.jpg"
    },
    {
        "id": "pd-controller",
        "title": "PD CONTROLLER",
        "category": "Embedded Electronics",
        "description": "1 1 2 2 3 3 4 4 D D C C B B A A POWER BUCK CONVERTER SHEET 9V-4.0AMP BUCK CONVERTER 3.3V-1.6AMP BUCK CONVERTER GND GND VCC 5 VIN 2 VIN 10 SW 3 SW 12 BOOT 4 EP 13 EN 9 FB 7 PG 8 AGND 6 PGND 1 PGND 11 U1 LM60440DRPKR GND GND GND VCC_12V C2 4.7UF C3 220nF C4 220nF C8 1uF C1 0.1uF VCC_9V C7 22uF GND VCC_9V C10 10uF GND GND GND 3V3 FB 1 EN 2 VIN 3 GND 4 SW 5 BST 6 U2 AP63203WU-7 L2 3.9uH C9 0.1uF C11 2...",
        "techStack": [
            "ESP32"
        ],
        "facts": [
            "1 1 2 2 3 3 4 4 D D C C B B A A POWER BUCK CONVERTER SHEET 9V-4.",
            "54-2P ZZDK DC INPUT 12V REVERSE POLARITY PROTECTION USB-C PD SOURCE CONTROLLER LINK POGO PIN INTERFACE 2 1 3 4 5 6 7 8 J1 2.",
            "4K R1 100K GND GND FB 1 EN 2 VIN 3 GND 4 SW 5 BST 6 U9 AP63205WU-7 5V-2AMP BUCK CONVERTER GND VCC_9V C39 10uF GND GND GND 5V0 C38 0.",
            "0AMP BUCK CONVERTER 3.3V-1."
        ],
        "mainImage": "e:\\PORTFOLIO\\Projects\\PD CONTROLLER\\DELIVERABLES\\Renderings\\2D-C-VIEW.png",
        "architectureImage": "e:\\PORTFOLIO\\Projects\\PD CONTROLLER\\DELIVERABLES\\Renderings\\3D-Bottom-view.png"
    },
    {
        "id": "precision-agriculture",
        "title": "Precision Agriculture",
        "category": "Embedded Electronics",
        "description": "2. Introduction 3. System Design and Architecture 4. Implementation 5. Results and Analysis 6. Conclusion 7. References 8. Appendices",
        "techStack": [
            "STM32",
            "LoRa",
            "FreeRTOS",
            "Arduino",
            "PCB",
            "I2C",
            "UART",
            "Bluetooth",
            "Wi-Fi",
            "RTOS",
            "LoRaWAN",
            "DHT22",
            "Dragino"
        ],
        "facts": [
            "5 days before needing  a recharge.",
            "The system emphasizes low power consumption,  with the microcontroller entering stop mode when idle, drawing an average current of 7-12  mA."
        ],
        "mainImage": "images/projects/Precision_Agriculture_Project_Report_Internship.pdf_3_0.png",
        "architectureImage": "images/projects/Precision_Agriculture_Project_Report_Internship.pdf_3_1.jpeg"
    },
    {
        "id": "stethoscope",
        "title": "Stethoscope",
        "category": "Embedded Electronics",
        "description": "This document presents the proposed product-grade design approach for a smart stethoscope. The goal is to move beyond a basic microphone-based prototype and develop a professional biomedical sensing platform capable of clean heart and lung sound acquisition, direct diaphragm vibration sensing, contact- quality detection, battery monitoring, and mobile application connectivity. The proposed system uses two high-performance Infineon analog MEMS microphones for acoustic sensing, one PVDF piezoelectric sensor for direct diaphragm vibration sensing, a low-noise analog front- end, a multi-channel...",
        "techStack": [
            "PCB",
            "BLE"
        ],
        "facts": [
            "\u2022 1S LiPo Battery: Recommended capacity is 1000\u20131500 mAh for compact size and good runtime.",
            "00 1S LiPo battery 1000\u20131500 mAh 1 $4."
        ],
        "mainImage": "images/projects/Stethoscope_stethoscope.pdf_1_0.png",
        "architectureImage": "images/projects/Stethoscope_stethoscope.pdf_1_0.png"
    }
];
