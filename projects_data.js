const projectsData = [
    {
        "id": "ekko-device",
        "title": "EKKO Device (Portable & Clinical)",
        "category": "Medical Device \u2022 RISETech \u2022 EN 60601-1",
        "description": "Therapeutic device using vibrational waves (5\u2013100 Hz) based on Neurotransmission Cognitive Theory. Hardware maintainer delivering 15% PCB defect reduction via Multi-Layer PCB and Signal Integrity improvements. EN 60601-1 certified. Firmware on Renesas MCUs; two versions \u2014 portable and clinical. EKKO-portable is an innovative therapeutic device specifically designed for speech therapy of children at home. This medical-grade device is completely controlled through a comprehensive mobile application that assists parents in performing effective therapy sessions. The device has been rigorously tested against safety standards EN 60601-1:2006+AMD1:2013 by 3rd Party CTI (Centre Testing International) labs, Shenzhen, China.",
        "techStack": ["Renesas MCU", "RTOS", "BLE", "Signal Integrity", "Medical Grade PCB", "EN 60601-1"],
        "facts": [
            "Operating Frequency: 5\u2013100 Hz vibrational waves",
            "15% PCB defect reduction via Multi-Layer PCB improvements",
            "EN 60601-1:2006+AMD1:2013 certified by CTI Labs, Shenzhen",
            "Two versions delivered: Portable and Clinical",
            "Approved by Pakistan Innovation and Testing Centre (PITC)",
            "Firmware on Renesas MCUs with BLE connectivity"
        ],
        "mainImage": "images/ekko-device.jpg",
        "architectureImage": "images/ekko_architecture.png"
    },
    {
        "id": "epic",
        "title": "Epilepsy Detection Device (EPIC)",
        "category": "Medical Device \u2022 AI/ML \u2022 Active Project",
        "description": "Real-time epilepsy detection system (Feb 2025 \u2013 present) with 30% accuracy improvement over baseline via biosensor fusion and ML algorithms. Achieved 25% faster early-warning alerts through optimized signal processing pipeline. Deployed for continuous seizure monitoring and prediction. The system uses PPG, accelerometer, gyroscope, and EMG sensors for comprehensive physiological monitoring with a Python-based GUI visualizer for real-time data display.",
        "techStack": ["Biosensors", "Machine Learning", "Real-time Processing", "Python", "PPG", "EMG"],
        "facts": [
            "+30% accuracy improvement over baseline",
            "25% faster early-warning alerts",
            "Multi-sensor fusion: PPG, accelerometer, gyroscope, EMG",
            "Real-time serial data at 115200 baud",
            "Python GUI visualizer for vitals: HR, SpO2, RMSSD, SDNN",
            "Continuous seizure monitoring and prediction system"
        ],
        "mainImage": "images/epic.png",
        "architectureImage": "images/epic_architecture.png"
    },
    {
        "id": "vehicle-profiling",
        "title": "Vehicle Profiling Device \u2014 FYP (V1 & V2)",
        "category": "Automotive \u2022 Surveillance \u2022 Edge AI",
        "description": "Final Year Project: covert underground vehicle classification system achieving 95% accuracy via sensor fusion (seismic, magnetic, IR, ultrasonic) and Edge AI inference. V1 proof-of-concept; V2 with dual-version firmware (UART + BLE), 40% faster edge data processing, and SD card storage for field deployment.",
        "techStack": ["STM32", "Edge AI", "Sensor Fusion", "BLE", "UART", "SD Card"],
        "facts": [
            "95% vehicle classification accuracy",
            "Sensor fusion: seismic, magnetic, IR, ultrasonic",
            "40% faster edge data processing in V2",
            "Dual firmware versions: UART + BLE",
            "SD card storage for field deployment",
            "Covert underground installation design"
        ],
        "mainImage": "images/vehicle-profiling-v1.png",
        "architectureImage": "images/vehicle_profiling_architecture.png"
    },
    {
        "id": "aqi-monitor",
        "title": "Multi-Gas AQI Monitor",
        "category": "Environmental \u2022 IoT",
        "description": "Comprehensive air quality monitoring system tracking 9 atmospheric variables: CO2, TVOC, humidity, NH3, SO2, alcohol, toluene, smoke, and particulate matter (PM1.0, PM2.5, PM10.0). Achieves <5% calibration error with real-time cloud data logging and Wi-Fi connectivity. Built on ESP32 platform with custom PCB design.",
        "techStack": ["ESP32", "Multi-Gas Sensors", "PM Sensors", "Data Logging", "Wi-Fi", "Custom PCB"],
        "facts": [
            "Tracks 9 atmospheric variables simultaneously",
            "<5% calibration error across all sensors",
            "Monitors CO2, TVOC, NH3, SO2, alcohol, toluene, smoke",
            "Particulate matter tracking: PM1.0, PM2.5, PM10.0",
            "Real-time cloud data logging via Wi-Fi",
            "Custom PCB with I2C and UART sensor interfaces"
        ],
        "mainImage": "images/aqi-monitor.png",
        "architectureImage": "images/aqi_architecture.png"
    },
    {
        "id": "avionics-atp",
        "title": "Avionics ATP & System Health Monitor",
        "category": "Python \u2022 LabVIEW \u2022 RIMS / NASTP Alpha",
        "description": "Two Python-based Automated Test Procedure (ATP) tools developed at RIMS (NASTP Alpha): Avionics LRU ATP for testing aerospace-grade Line Replaceable Units, and Portable Tester ATP for field diagnostics. Complemented by an Ubuntu system health monitor with military-standard ports \u2014 real-time CPU temperature per core, GPS data, and Ethernet monitoring via LabVIEW frontend.",
        "techStack": ["Python ATP Tools", "Avionics LRU Testing", "LabVIEW Frontend", "NI myRIO / myDAQ", "Military Standard Ports", "GPS / Ethernet"],
        "facts": [
            "Developed for RIMS Test & Measurement Department at NASTP Alpha",
            "Avionics LRU ATP for aerospace-grade Line Replaceable Units",
            "Portable Tester ATP for field diagnostics",
            "Real-time CPU temperature per core monitoring",
            "GPS data acquisition and Ethernet monitoring",
            "Military-standard port interfaces"
        ],
        "mainImage": "images/python-gui-system-monitor.JPG",
        "architectureImage": "images/avionics_architecture.png"
    },
    {
        "id": "p2p-lora",
        "title": "P2P LoRa Communication Device",
        "category": "Communication \u2022 Security",
        "description": "LoRa-based P2P device with QR code scanning capability. Engineered for environments with signal jammers, enabling reliable wireless data transmission to PC when conventional channels are compromised.",
        "techStack": ["LoRa", "QR Code Scanner", "P2P Communication", "Anti-Jamming", "Wireless Data Transfer"],
        "facts": [
            "Designed for signal-jammed environments",
            "QR code scanning and wireless transmission",
            "Peer-to-peer communication without infrastructure",
            "Reliable data transfer when conventional channels fail",
            "Custom hardware design for field deployment"
        ],
        "mainImage": "images/p2p-lora-device.jpeg",
        "architectureImage": "images/p2p_lora_architecture.png"
    },
    {
        "id": "arduino-opta",
        "title": "Arduino OPTA Embedded Controller API",
        "category": "PLC \u2022 LabVIEW \u2022 RIMS / Aerospace",
        "description": "Arduino OPTA PLC programmed in Structured Text and Ladder Logic with peripheral control via TCP and UDP. Developed Opta Embedded Controller API in LabVIEW for the RIMS Test & Measurement Department at NASTP Alpha \u2014 enabling aerospace-grade hardware control and monitoring workflows.",
        "techStack": ["Arduino OPTA", "Structured Text", "Ladder Logic", "TCP/UDP Control", "LabVIEW VI"],
        "facts": [
            "PLC programmed in Structured Text and Ladder Logic",
            "Peripheral control via TCP and UDP protocols",
            "Developed for RIMS Test & Measurement Department",
            "Aerospace-grade hardware control and monitoring",
            "Full LabVIEW Virtual Instrument (VI) integration"
        ],
        "mainImage": "images/arduino-opta-labview.jpg",
        "architectureImage": "images/arduino_opta_architecture.png"
    },
    {
        "id": "motor-controller",
        "title": "Motor Controller (Position & Speed)",
        "category": "Control Systems \u2022 Hardware",
        "description": "Complete motor control system with position and speed control capabilities. Custom PCB design with STM32, encoder feedback, and MATLAB GUI integration for real-time control and monitoring.",
        "techStack": ["STM32", "Encoder Motor", "Motor Driver", "MATLAB GUI", "Position/Speed Control"],
        "facts": [
            "Custom PCB design with STM32 microcontroller",
            "Encoder-based position and speed feedback",
            "Real-time MATLAB GUI for control and visualization",
            "PID control algorithm implementation",
            "Hardware and software co-design"
        ],
        "mainImage": "images/motor-controller-hardware.png",
        "architectureImage": "images/motor_controller_architecture.png"
    },
    {
        "id": "gnu-radio-sdr",
        "title": "GNU Radio SDR System",
        "category": "SDR \u2022 GNU Radio Companion",
        "description": "Software Defined Radio system using USRP X310 operating up to 5 GHz with 580 Mbps throughput via GNU Radio Companion. Full transmission and receiving pipeline for RF signal processing and spectral analysis \u2014 deployed for aerospace & defense instrumentation at RIMS.",
        "techStack": ["USRP X310", "GNU Radio Companion", "5 GHz / 580 Mbps", "Signal Processing", "UHD Python API"],
        "facts": [
            "USRP X310 operating up to 5 GHz frequency",
            "580 Mbps throughput via GNU Radio Companion",
            "Full Tx/Rx pipeline for RF signal processing",
            "Spectral analysis for aerospace & defense",
            "Deployed at RIMS instrumentation lab"
        ],
        "mainImage": "images/gnu-radio-usrp-x310.jpeg",
        "architectureImage": "images/sdr_architecture.png"
    },
    {
        "id": "t-power-divider",
        "title": "T Power Divider",
        "category": "RF Design \u2022 HFSS Simulation",
        "description": "RF power divider design with ANSYS HFSS electromagnetic simulation followed by hand-etched PCB realization. Full RF design pipeline from EM simulation to physical prototyping and verification.",
        "techStack": ["ANSYS HFSS", "RF Simulation", "Hand Etched PCB", "Power Divider", "EM Design"],
        "facts": [
            "Full RF design pipeline: simulation to fabrication",
            "ANSYS HFSS electromagnetic simulation",
            "Hand-etched PCB prototyping and verification",
            "Microstrip transmission line design",
            "S-parameter measurement and validation"
        ],
        "mainImage": "images/t-power-divider-simulation.png",
        "architectureImage": "images/t_power_divider_architecture.png"
    },
    {
        "id": "heartrate-ecg",
        "title": "Heart Rate Monitor from ECG Dataset",
        "category": "Signal Processing \u2022 MIT Dataset",
        "description": "Signal processing implementation using MIT ECG dataset to extract heart rate information. Applied digital filters and DSP techniques for accurate heart rate detection and analysis from ECG waveforms.",
        "techStack": ["MIT ECG Dataset", "Digital Filters", "Signal Processing", "Heart Rate Extraction", "ECG Analysis"],
        "facts": [
            "MIT-BIH Arrhythmia Database analysis",
            "Digital filter design for noise rejection",
            "R-peak detection algorithm implementation",
            "Heart rate variability analysis",
            "MATLAB-based signal processing pipeline"
        ],
        "mainImage": "images/heartrate-ecg-dataset.png",
        "architectureImage": "images/heartrate_architecture.png"
    },
    {
        "id": "lfr",
        "title": "Line Following Robot (LFR)",
        "category": "Robotics \u2022 Competition Winner",
        "description": "Award-winning autonomous robot designed for line-following competition. First place winner at AirTech 24 Roboline with optimized sensor placement and precision control algorithms.",
        "techStack": ["Microcontroller", "IR Sensors", "Motor Control", "Competition Winner", "Algorithm Optimization"],
        "facts": [
            "1st Place Winner at AirTech 24 Roboline",
            "Shield and cash prize awarded",
            "Optimized IR sensor array placement",
            "PID-based precision control algorithm",
            "Autonomous navigation on complex tracks"
        ],
        "mainImage": "images/lfr-airtech24-winner.jpeg",
        "architectureImage": "images/lfr_architecture.png"
    },
    {
        "id": "tarantula-mouse",
        "title": "Tarantula Mouse PCB",
        "category": "PCB Design \u2022 BLE \u2022 Embedded \u2022 RISETech",
        "description": "Custom internal PCB for the Tarantula ergonomic mouse (RISETech product) with BLE wireless connectivity. Integrated joystick controls with highly optimized multi-layer component placement within strict ergonomic form-factor constraints. Manufactured via JLCPCB with full production lifecycle ownership.",
        "techStack": ["BLE Connectivity", "Joystick Controls", "Ergonomic Layout", "Custom PCB", "Component Optimization"],
        "facts": [
            "RISETech commercial product",
            "BLE wireless connectivity",
            "Dual joystick integration",
            "Multi-layer PCB within strict form-factor",
            "Manufactured via JLCPCB for production"
        ],
        "mainImage": "images/ergonomic-mouse-pcb.png",
        "architectureImage": "images/ergonomic-mouse-pcb.png"
    },
    {
        "id": "amplifier",
        "title": "5W Audio Amplifier",
        "category": "Analog Design \u2022 Audio PCB",
        "description": "Two-stage audio amplifier (preamp and power stage) for 5W 6\u03a9 speaker. Extensive datasheet analysis and component tuning for optimal audio performance with careful analog design methodology.",
        "techStack": ["Two-Stage Design", "Preamp & Power Stage", "5W 6\u03a9 Speaker", "Component Tuning", "Analog Circuit"],
        "facts": [
            "Two-stage amplifier: preamp + power stage",
            "5W output into 6\u03a9 speaker load",
            "Extensive datasheet-driven component selection",
            "Careful analog PCB layout methodology",
            "Full audio frequency range coverage"
        ],
        "mainImage": "images/Amplifier.jpg",
        "architectureImage": "images/Amplifier.jpg"
    },
    {
        "id": "agribot",
        "title": "Agribot \u2014 Precision Agriculture System",
        "category": "IoT \u2022 LoRaWAN \u2022 Embedded",
        "description": "Smart agriculture system using STM32 and LoRaWAN for remote crop monitoring. Features soil moisture, temperature, and humidity sensors with low-power design achieving 5 days on a single charge. The microcontroller enters stop mode when idle, drawing an average current of 7-12 mA for extended field deployment.",
        "techStack": ["STM32", "LoRa", "FreeRTOS", "Arduino", "PCB", "DHT22", "Dragino"],
        "facts": [
            "5 days battery life on a single charge",
            "Average idle current of 7-12 mA in stop mode",
            "LoRaWAN long-range connectivity via Dragino gateway",
            "Multi-sensor: soil moisture, temperature, humidity",
            "FreeRTOS-based task scheduling"
        ],
        "mainImage": "images/projects/Agribot_Project_Report_Internship.pdf_3_0.png",
        "architectureImage": "images/agribot_architecture.png"
    },
    {
        "id": "lorawan-iot",
        "title": "LoRaWAN IoT Node (WiseNode)",
        "category": "IoT \u2022 LoRaWAN \u2022 STM32WL",
        "description": "End-to-end LoRaWAN IoT node system using STM32WL (Seeed LoRa-E5) with custom firmware, gateway integration, and ultra-low-power operation. Designed for industrial IoT deployments with STM32CubeProgrammer-based firmware uploading via ST-LinkV2. Includes ESP32-based LoRa sender/receiver pair for point-to-point communication.",
        "techStack": ["STM32WL", "LoRaWAN", "FreeRTOS", "SPI", "ST-LinkV2", "ESP32 LoRa"],
        "facts": [
            "Average current of 5.65 mA active, 885 nA sleep",
            "Battery life: 1 month 21 days on 700 mAh Li-SOCL2",
            "Max pulse current: 30.0 mA",
            "Seeed LoRa-E5 module (STM32WL SoC)",
            "Includes ESP32-based P2P LoRa pair",
            "ST-LinkV2 firmware programming workflow"
        ],
        "mainImage": "images/projects/IoT_Wise_Firmware Uploading Documentation.pdf_0_0.jpeg",
        "architectureImage": "images/lorawan_architecture.png"
    },
    {
        "id": "ekko-clinic",
        "title": "EKKO Clinical Interface",
        "category": "Medical \u2022 Raspberry Pi \u2022 GUI",
        "description": "Control interface for the EKKO dual-applicator therapy device, built for Raspberry Pi 3B+ with a 7-inch 800\u00d7480 touchscreen. Features dual independent applicators running completely independently with 30-minute timed therapy sessions.",
        "techStack": ["Python", "Raspberry Pi 3B+", "Touchscreen GUI", "Dual Applicators"],
        "facts": [
            "7-inch 800\u00d7480 touchscreen interface",
            "Dual independent applicators",
            "30-minute timed therapy sessions",
            "Raspberry Pi 3B+ based control system",
            "Touch-optimized clinical UI"
        ],
        "mainImage": "images/ekko-device.jpg",
        "architectureImage": "images/ekko_architecture.png"
    },
    {
        "id": "glucometer",
        "title": "Non-Invasive Glucometer",
        "category": "Medical \u2022 Biosensors",
        "description": "Non-invasive blood glucose monitoring system using infrared LED technology. Addresses the WHO estimate of 177 million diabetes sufferers globally, providing a pain-free alternative to traditional invasive glucometers that require blood sampling 2-3 times daily.",
        "techStack": ["Arduino", "IR LED", "PCB", "Biosensors", "Signal Processing"],
        "facts": [
            "Non-invasive infrared LED-based measurement",
            "Eliminates need for blood sampling",
            "Custom Arduino-based hardware platform",
            "Addresses WHO diabetes monitoring challenge",
            "Custom PCB design for medical accuracy"
        ],
        "mainImage": "images/projects/Glucometer_Design_and_development_of_infrared_LED_based_non_invasive_blood_glucometer.pdf_1_0.png",
        "architectureImage": "images/glucometer_architecture.png"
    },
    {
        "id": "pd-controller",
        "title": "USB-C PD Controller Board",
        "category": "Power Electronics \u2022 PCB Design",
        "description": "ESP32-based USB-C Power Delivery source controller with multi-rail buck converter design. Features 9V/4A and 3.3V/1.6A buck converters, 5V/2A auxiliary rail, reverse polarity protection, and pogo pin interface. Full deliverables including Gerber files, BOM, pick-and-place, 3D renderings, and STEP files.",
        "techStack": ["ESP32", "USB-C PD", "Buck Converters", "Altium", "JLCPCB"],
        "facts": [
            "Multi-rail power: 9V/4A, 5V/2A, 3.3V/1.6A",
            "USB-C Power Delivery source controller",
            "Reverse polarity protection",
            "Pogo pin interface for docking",
            "Full production deliverables: Gerber, BOM, pick-and-place"
        ],
        "mainImage": "images/projects/PD_CONTROLLER_3D-TOP-view.png",
        "architectureImage": "images/pd_controller_architecture.png"
    },
    {
        "id": "precision-agriculture",
        "title": "Precision Agriculture \u2014 LoRaWAN RTOS",
        "category": "IoT \u2022 LoRaWAN \u2022 FreeRTOS",
        "description": "Advanced precision agriculture system using STM32 with FreeRTOS and LoRaWAN connectivity. Features CMSIS RTOS multi-threaded task management, PSA Crypto driver integration, and Dragino gateway for long-range telemetry. 5-day battery life with 7-12 mA average current draw.",
        "techStack": ["STM32", "FreeRTOS", "LoRaWAN", "CMSIS RTOS", "Dragino", "DHT22"],
        "facts": [
            "5 days battery life on a single charge",
            "7-12 mA average current in stop mode",
            "CMSIS RTOS multi-threaded firmware",
            "PSA Crypto driver for secure communication",
            "Dragino gateway for LoRaWAN telemetry"
        ],
        "mainImage": "images/projects/Precision_Agriculture_Project_Report_Internship.pdf_3_0.png",
        "architectureImage": "images/projects/Precision_Agriculture_Project_Report_Internship.pdf_3_1.jpeg"
    },
    {
        "id": "stethoscope",
        "title": "Smart Stethoscope",
        "category": "Medical \u2022 Biosensors \u2022 PCB Design",
        "description": "Product-grade smart stethoscope design with dual Infineon analog MEMS microphones for acoustic sensing, PVDF piezoelectric sensor for direct diaphragm vibration sensing, low-noise analog front-end, multi-channel ADC, and BLE mobile app connectivity. Features contact-quality detection and battery monitoring.",
        "techStack": ["PCB", "BLE", "MEMS Microphones", "PVDF Sensor", "Analog Front-End"],
        "facts": [
            "Dual Infineon analog MEMS microphones",
            "PVDF piezoelectric diaphragm vibration sensor",
            "Low-noise analog front-end design",
            "BLE connectivity for mobile app",
            "1S LiPo 1000-1500 mAh battery",
            "Contact-quality detection system"
        ],
        "mainImage": "images/projects/Stethoscope_stethoscope.pdf_1_0.png",
        "architectureImage": "images/stethoscope_architecture.png"
    }
];
