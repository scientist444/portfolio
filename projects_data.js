const PORTFOLIO_DATA = {
  featured: [
    {
      slug: "ankle-band",
      title: "Connected Ankle Band",
      eyebrow: "Wearable sensing · MVP",
      status: "Completed",
      period: "2025–2026",
      duration: "~4 months",
      context: "Independent",
      role: "Solo product engineer",
      summary: "I built this compact BLE ankle band to capture motion and pressure data from one wearable device.",
      hero: "assets/projects/ankle-band/hero.jpg",
      gallery: ["assets/projects/ankle-band/hero.jpg", "assets/projects/ankle-band/board.png"],
      video: "assets/motion/ankle-band.mp4",
      tags: ["DA14531", "BMI270", "BLE", "Embedded C", "Wearables"],
      challenge: "I needed to fit motion sensing, pressure measurement, wireless communication and power management into a small ankle-worn form without making acquisition timing or board assembly difficult.",
      requirements: [
        "Capture motion and pressure in the same time-aware data path.",
        "Keep the electronics compact enough for an ankle-worn enclosure.",
        "Transmit useful packets over a low-power BLE link.",
        "Leave a practical route for board bring-up and firmware iteration."
      ],
      decisions: [
        "I used a DA14531 BLE module as the low-power wireless core.",
        "I paired a BMI270 motion sensor with a separate analog pressure channel.",
        "I organized firmware around 100 Hz acquisition and compact BLE packets."
      ],
      architecture: ["Motion + pressure", "DA14531 acquisition", "BLE packet layer", "Companion interface"],
      engineering: [
        "Brought up the sensors and peripheral interfaces.",
        "Designed the custom PCB around a compact wearable outline.",
        "Defined the BLE service and packet format.",
        "Built timing and event-detection experiments in firmware."
      ],
      schematic: {
        type: "Schematic excerpt",
        src: "assets/projects/ankle-band/schematic-snippet.png",
        title: "BMI270 motion-sensing interface",
        caption: "This is the motion-sensor block I used in the ankle band. I kept the sensor supplies locally decoupled and exposed the I2C and interrupt paths needed by the acquisition firmware.",
        points: ["Local sensor-rail decoupling", "I2C control and data path", "Interrupt output for timed acquisition"]
      },
      validation: [
        "Confirmed board power-up and sensor communication.",
        "Checked the BLE data path from acquisition to received packets.",
        "Used firmware experiments to inspect timing and event behavior."
      ],
      testing: "The electronics, sensors and BLE path are working. Calibration and algorithm performance still need a larger validation set, so I do not present those as finished accuracy claims.",
      result: "I completed a working MVP covering electronics, PCB, firmware and wireless data delivery.",
      nextStep: "With another revision, I would focus on repeatable calibration and a broader motion dataset.",
      links: [{label:"Firmware overview", url:"https://github.com/scientist444/AnkleBandV2-Firmware"}]
    },
    {
      slug: "aqi-monitor",
      title: "Multi-Sensor AQI Monitor",
      eyebrow: "Environmental sensing · MVP",
      status: "Completed",
      period: "2024–2025",
      duration: "~3 months",
      context: "RISETech",
      role: "Solo embedded engineer",
      summary: "I built one ESP32 platform to bring particulate, gas, temperature and humidity measurements into a single portable monitor.",
      hero: "assets/projects/aqi-monitor/hero.png",
      gallery: ["assets/projects/aqi-monitor/hero.png"],
      video: "assets/motion/aqi-monitor.mp4",
      tags: ["ESP32", "Air quality", "Wi-Fi", "Sensors", "PCB"],
      challenge: "The sensors use different interfaces and have different power needs. My main job was to combine them cleanly without leaving the product as a bundle of development boards and wiring.",
      requirements: [
        "Support particulate, gas and climate sensing on one controller.",
        "Keep local readings available without a network connection.",
        "Provide a Wi-Fi route for connected logging.",
        "Package the sensor interfaces on a manufacturable two-layer PCB."
      ],
      decisions: [
        "I used the ESP32 for central acquisition and Wi-Fi connectivity.",
        "I grouped the sensor interfaces by electrical function and connector needs.",
        "I added an OLED so the device remains useful when it is offline."
      ],
      architecture: ["Gas + PM + climate sensors", "ESP32 acquisition", "OLED feedback", "Wi-Fi database path"],
      engineering: [
        "Mapped the mixed sensor interfaces and power needs.",
        "Designed the power, connector and sensor placement on a two-layer PCB.",
        "Implemented local display feedback.",
        "Connected the measurement path to remote logging."
      ],
      schematic: {
        type: "PCB layout detail",
        src: "assets/projects/aqi-monitor/layout-snippet.png",
        title: "Controller and sensor-routing area",
        caption: "This focused layout view shows how I brought the controller headers and sensor connections into one board area. The complete power and battery implementation is intentionally outside the crop.",
        points: ["Controller-centered routing", "Grouped sensor connections", "Clear service and connector access"]
      },
      validation: [
        "Assembled and powered the complete sensing board.",
        "Checked the supported sensor interfaces and local display path.",
        "Verified connected logging as part of the MVP workflow."
      ],
      testing: "I assembled and tested the hardware as a connected sensing MVP. The public material documents the sensor set and the design target, not laboratory-grade air-quality certification.",
      result: "I completed a portable AQI node with both local readings and a connected data path.",
      nextStep: "The next useful step would be a longer controlled comparison against reference instruments.",
      links: [{label:"Public PCB notes", url:"https://github.com/scientist444/pcb-portfolio"}]
    },
    {
      slug: "epic",
      title: "EPIC Biosignal Platform",
      eyebrow: "Biosignal acquisition · Product",
      status: "Completed",
      period: "2024–2025",
      duration: "~4 months",
      context: "RISETech",
      role: "Solo product engineer",
      summary: "I designed EPIC as a compact platform for synchronized physiological and motion sensing, from the signal entry point to the manufactured PCB.",
      hero: "assets/projects/epic/hero.png",
      gallery: ["assets/projects/epic/hero.png", "assets/projects/epic/prototype.jpg"],
      video: "assets/motion/epic.mp4",
      tags: ["Biosignals", "Analog front end", "ESP32", "IMU", "PCB"],
      challenge: "I had to route low-level physiological signals beside digital processing and wireless electronics while controlling noise, board size and assembly risk.",
      requirements: [
        "Acquire physiological and motion signals on one compact platform.",
        "Keep sensitive analog paths separated from digital and radio activity.",
        "Support practical prototype bring-up and manufacturing.",
        "Fit the complete electronics into the intended wearable product envelope."
      ],
      decisions: [
        "I separated signal paths by function and sensitivity.",
        "I kept the controller and radio in a compact central domain.",
        "I limited the public board views so the architecture is understandable without publishing the full product design."
      ],
      architecture: ["Physiological inputs", "Analog front end", "MCU + motion sensing", "Wired / wireless interface"],
      engineering: [
        "Owned component selection and the complete schematic.",
        "Partitioned the mixed-signal board before placement and routing.",
        "Completed PCB layout and DFM review.",
        "Brought up and iterated the manufactured prototype."
      ],
      schematic: {
        type: "Schematic excerpt",
        src: "assets/projects/epic/schematic-snippet.png",
        title: "Optical heart-rate sensing block",
        caption: "This excerpt shows the MAX30102 sensing block and its local low-voltage supply. It is enough to explain the sensor interface and decoupling approach without exposing the rest of the signal chain.",
        points: ["Dedicated 1.8 V sensor rail", "Local decoupling around the sensor", "Digital interface returned to the controller domain"]
      },
      validation: [
        "Checked the main power rails and controller bring-up.",
        "Confirmed the acquisition paths on manufactured hardware.",
        "Used prototype results to guide the final board iteration."
      ],
      testing: "I brought up the power, controller and acquisition paths on manufactured hardware. Detailed signal-chain values and production settings remain private.",
      result: "I completed EPIC as a product-level embedded platform with a compact fabrication-ready board.",
      nextStep: "Future work would concentrate on production test coverage and larger user datasets rather than changing the core architecture.",
      links: []
    },
    {
      slug: "ergonomic-mouse",
      title: "Ergonomic BLE Mouse",
      eyebrow: "Assistive input · MVP",
      status: "Completed",
      period: "2024–2025",
      duration: "~3 months",
      context: "Product engineering",
      role: "Solo embedded engineer",
      summary: "I turned a semicircular ergonomic input concept into a custom BLE mouse with dual joysticks, buttons and its own curved PCB.",
      hero: "assets/projects/ergonomic-mouse/hero.jpg",
      gallery: ["assets/projects/ergonomic-mouse/hero.jpg", "assets/projects/ergonomic-mouse/prototype.jpg"],
      video: "assets/motion/ergonomic-mouse.mp4",
      tags: ["ESP32-S3", "BLE HID", "Arduino", "Human interface", "PCB"],
      challenge: "The unusual enclosure geometry left very little room for a conventional board. I also needed the joystick and button inputs to feel predictable as standard HID controls.",
      requirements: [
        "Map two analog joysticks and buttons to standard mouse behavior.",
        "Fit the controller into the curved mechanical envelope.",
        "Support BLE HID while keeping a wired development route.",
        "Keep connectors and programming access usable after assembly."
      ],
      decisions: [
        "I assigned the two joysticks to pointer and scroll functions.",
        "I used the ESP32-S3 for BLE HID and wired development.",
        "I shaped the PCB around the enclosure instead of forcing a rectangular board into it."
      ],
      architecture: ["Joysticks + buttons", "Input filtering", "ESP32-S3 HID", "BLE / USB host"],
      engineering: [
        "Implemented the HID firmware and input mapping.",
        "Designed the PCB around the mechanical outline.",
        "Placed programming and connector access for assembly.",
        "Tested the manufactured and assembled controller board."
      ],
      schematic: {
        type: "Assembled hardware detail",
        src: "assets/projects/ergonomic-mouse/hardware-snippet.png",
        title: "Curved controller PCB",
        caption: "This close view shows the actual assembled controller. The semicircular outline follows the product geometry while the ESP32 module, USB-C connector and input headers remain accessible.",
        points: ["Mechanical-outline-aware PCB", "Accessible USB-C development port", "Input headers arranged around the curved edge"]
      },
      validation: [
        "Checked joystick, click and scroll behavior in firmware.",
        "Verified BLE HID operation with a host device.",
        "Manufactured, assembled and exercised the two-layer board."
      ],
      testing: "The firmware variants cover joystick movement, click and scroll behavior. I manufactured and tested the custom two-layer board in the intended form factor.",
      result: "I completed a working ergonomic input MVP with custom electronics and BLE firmware.",
      nextStep: "The next revision would be driven by longer user comfort trials and input-curve tuning.",
      links: [{label:"Public PCB notes", url:"https://github.com/scientist444/pcb-portfolio"}]
    },
    {
      slug: "embedded-microscope",
      title: "Embedded Microscope Controller",
      eyebrow: "Imaging hardware · MVP",
      status: "Completed",
      period: "2025–2026",
      duration: "~3 months",
      context: "Independent",
      role: "Solo hardware engineer",
      summary: "I replaced the loose controller, power and USB modules in a compact digital microscope with one purpose-built ESP32 board.",
      hero: "assets/projects/embedded-microscope/hero.png",
      gallery: ["assets/projects/embedded-microscope/hero.png", "assets/projects/embedded-microscope/board.png"],
      video: "assets/motion/embedded-microscope.mp4",
      tags: ["ESP32", "Imaging", "USB", "Power", "PCB"],
      challenge: "The microscope needed a serviceable controller shaped around its connectors, mounting points and physical clearances instead of several loose development modules.",
      requirements: [
        "Centralize power, USB and peripheral connections.",
        "Keep the ESP32 core practical for firmware development.",
        "Respect mounting holes, connector reach and enclosure clearance.",
        "Provide a clean path from schematic to a manufacturable controller."
      ],
      decisions: [
        "I kept a modular ESP32 core so firmware iteration stays practical.",
        "I grouped power and external interfaces by function.",
        "I treated mounting and connector clearance as electrical design constraints from the start."
      ],
      architecture: ["Imaging peripherals", "ESP32 controller", "Power + USB interfaces", "External controls"],
      engineering: [
        "Mapped every system connector and peripheral interface.",
        "Designed the power entry and regulation path.",
        "Created the custom outline and mounting geometry.",
        "Reviewed the assembled board in 3D for clearance."
      ],
      schematic: {
        type: "Schematic excerpt",
        src: "assets/projects/embedded-microscope/schematic-snippet.png",
        title: "Synchronous buck conversion stage",
        caption: "This excerpt shows the controller, external switching devices and feedback area of the buck stage. I kept the crop focused on the conversion structure rather than publishing the complete power tree.",
        points: ["Controller and external switching stage", "Current-sense and feedback path", "Focused power block separated from system interfaces"]
      },
      validation: [
        "Completed schematic and PCB layout review.",
        "Checked connector placement and mechanical clearances in 3D.",
        "Reviewed the controller as part of the complete microscope assembly."
      ],
      testing: "I completed the schematic, layout and 3D mechanical inspection. The public documentation focuses on the controller structure rather than every power and interface value.",
      result: "I completed the controller-board MVP for system-level microscope integration.",
      nextStep: "A later revision could reduce assembly steps after full enclosure and cable-routing feedback.",
      links: []
    },
    {
      slug: "pd-charger",
      title: "USB-C PD Power Controller",
      eyebrow: "Power electronics · MVP",
      status: "Completed",
      period: "2025–2026",
      duration: "~3 months",
      context: "Independent",
      role: "Solo hardware engineer",
      summary: "I designed a compact USB-C Power Delivery board that negotiates its input and creates controlled rails for an embedded load.",
      hero: "assets/projects/pd-charger/hero.png",
      gallery: ["assets/projects/pd-charger/hero.png"],
      video: "assets/motion/pd-charger.mp4",
      tags: ["USB-C PD", "DC/DC", "Power integrity", "ESP32", "PCB"],
      challenge: "I needed PD negotiation, high-current conversion and low-voltage control on one compact board while still leaving sensible test and bring-up access.",
      requirements: [
        "Use USB-C as the single external power entry.",
        "Negotiate and protect the incoming power path.",
        "Create controlled rails for the embedded load.",
        "Keep high-current routing separated from low-voltage control."
      ],
      decisions: [
        "I used USB-C as the single external input.",
        "I separated the conversion and logic domains physically on the board.",
        "I kept test points and edge connectors accessible for bring-up."
      ],
      architecture: ["USB-C PD input", "Negotiation + protection", "Buck conversion", "Embedded load rails"],
      engineering: [
        "Defined the complete power tree.",
        "Selected the protection, negotiation and conversion stages.",
        "Placed and routed the high-current paths.",
        "Completed 3D and DFM review."
      ],
      schematic: {
        type: "PCB layout detail",
        src: "assets/projects/pd-charger/layout-snippet.png",
        title: "Power and control routing area",
        caption: "This layout crop shows the relationship between the control area, high-current routes and accessible interfaces. Exact component values and the complete power design are not included.",
        points: ["Short high-current paths", "Separated control area", "Accessible connector and test regions"]
      },
      validation: [
        "Completed schematic and layout checks for the power tree.",
        "Reviewed placement and high-current routing in 3D.",
        "Checked the design for fabrication and bring-up access."
      ],
      testing: "The completed design includes schematic, layout and 3D review. I keep the exact component values and full power schematic private.",
      result: "I completed a compact, fabrication-ready USB-C power-control MVP.",
      nextStep: "The next step would be a production-oriented thermal and load test matrix on assembled units.",
      links: []
    },
    {
      slug: "smart-stethoscope",
      title: "Smart Stethoscope",
      eyebrow: "Medical sensing · MVP",
      status: "In progress",
      period: "2026–Present",
      duration: "Active development",
      context: "RISETech",
      role: "Solo product engineer",
      summary: "I am building a multi-sensor stethoscope that combines acoustic and contact-vibration sensing with a BLE data path.",
      hero: "assets/projects/smart-stethoscope/hero.png",
      gallery: ["assets/projects/smart-stethoscope/hero.png", "assets/projects/smart-stethoscope/board.png"],
      video: "assets/motion/smart-stethoscope.mp4",
      tags: ["MEMS microphone", "PVDF", "Low-noise AFE", "BLE", "Medical sensing"],
      challenge: "The difficult part is preserving weak body sounds through the analog chain while combining sensing, digitization, wireless communication and battery operation in one handheld system.",
      requirements: [
        "Capture acoustic information from two analog MEMS channels.",
        "Add contact-vibration sensing through a PVDF channel.",
        "Keep the analog front end isolated from BLE and digital activity.",
        "Support battery operation and a practical path to signal-quality testing."
      ],
      decisions: [
        "I am using dual analog MEMS channels for acoustic capture.",
        "I added a PVDF channel for direct diaphragm-vibration sensing.",
        "I separated the analog front end from the BLE and digital domain."
      ],
      architecture: ["MEMS + PVDF sensors", "Low-noise analog front end", "Multi-channel ADC", "BLE companion app"],
      engineering: [
        "Selected the sensors and analog-front-end architecture.",
        "Partitioned the mixed-signal PCB.",
        "Designed the battery and charging path.",
        "Added concepts for contact-quality and system monitoring."
      ],
      schematic: {
        type: "Schematic excerpt",
        src: "assets/projects/smart-stethoscope/schematic-snippet.png",
        title: "Programmable signal-conditioning stage",
        caption: "This is one focused pre-amplifier block from the current design. It uses a mid-rail reference and digitally controlled gain so I can tune the signal path during bring-up.",
        points: ["Mid-rail biased analog signal path", "Digitally controlled gain", "Current focus: noise and signal-quality validation"]
      },
      validation: [
        "Completed the first electronics architecture and PCB implementation.",
        "Started board bring-up and signal-path checks.",
        "Currently evaluating noise, gain and sensor-contact behavior."
      ],
      testing: "The first hardware design is complete. I am now working through board bring-up and signal-quality validation, so I label the project honestly as in progress.",
      result: "The complete first hardware revision is in place and active validation is underway.",
      nextStep: "My immediate next step is controlled acoustic testing followed by the changes needed for the next board revision.",
      links: []
    },
    {
      slug: "vehicle-profiling",
      title: "Edge Vehicle Profiling Node",
      eyebrow: "Sensor fusion · MVP",
      status: "Completed",
      period: "2025–2026",
      duration: "~4 months",
      context: "Independent research",
      role: "Solo embedded engineer",
      summary: "I built a rugged roadside node to capture several complementary vehicle signatures and carry the data into a desktop analysis workflow.",
      hero: "assets/projects/vehicle-profiling/hero.png",
      gallery: ["assets/projects/vehicle-profiling/hero.png", "assets/projects/vehicle-profiling/board.png"],
      video: "assets/motion/vehicle-profiling.mp4",
      tags: ["STM32", "Sensor fusion", "Edge acquisition", "Python", "Enclosure"],
      challenge: "The sensors behave very differently, so I needed time-aligned acquisition, protected field connections and a dataset that stayed understandable after it left the enclosure.",
      requirements: [
        "Capture complementary roadside sensor signals.",
        "Use deterministic controller-side acquisition.",
        "Protect and organize the field-facing connections.",
        "Provide a clear plotting route for inspecting captured datasets."
      ],
      decisions: [
        "I combined seismic, magnetic, infrared and ranging observations.",
        "I centered acquisition on an STM32 for deterministic timing.",
        "I built a Python plotting workflow to inspect datasets before any classification claims."
      ],
      architecture: ["Roadside sensor array", "Signal conditioning", "STM32 acquisition", "Storage / desktop analysis"],
      engineering: [
        "Designed the multi-sensor interfaces.",
        "Created the custom PCB and protected connector layout.",
        "Integrated the electronics into the enclosure.",
        "Built the Python dataset plotting workflow."
      ],
      schematic: {
        type: "Schematic excerpt",
        src: "assets/projects/vehicle-profiling/schematic-snippet.png",
        title: "Magnetic sensing interface",
        caption: "This excerpt shows the MLX90393 magnetic-sensor interface, including the I2C path, pull-ups, interrupt/data-ready line and local protection around the field-facing sensor block.",
        points: ["I2C sensor interface", "Interrupt/data-ready path", "Local protection and decoupling"]
      },
      validation: [
        "Exercised the assembled node through staged captures.",
        "Checked the sensor-to-storage acquisition path.",
        "Inspected captured datasets through the Python plotting workflow."
      ],
      testing: "I tested the assembled node and enclosure through staged captures. I present the completed acquisition workflow, not an unsupported classifier-accuracy number.",
      result: "I completed the field-oriented sensing MVP from hardware through analysis tooling.",
      nextStep: "The next research step would be a larger labeled field dataset before choosing and reporting any classifier.",
      links: [{label:"Python plotter", url:"https://github.com/scientist444/Ploter"}]
    }
  ],
  earlier: [
    {title:"EKKO Wearable System", meta:"RISETech · Product · Completed", summary:"I worked across the connected wearable hardware and product interfaces, then consolidated the story here to avoid repeating the same evidence.", tags:["Wearable", "Embedded", "Product lifecycle"], image:"images/ekko-device.jpg"},
    {title:"Avionics Automated Test Procedures", meta:"RIMS / NASTP Alpha · 2025", summary:"I built Python and LabVIEW test tooling for avionics LRUs, portable diagnostics and Ubuntu system-health monitoring.", tags:["Python", "LabVIEW", "Test engineering"], image:"images/python-gui-system-monitor.JPG"},
    {title:"GNU Radio SDR Pipeline", meta:"RIMS / NASTP Alpha · 2025", summary:"I developed USRP X310 transmit/receive workflows and spectral analysis in GNU Radio Companion.", tags:["GNU Radio", "USRP X310", "RF"], image:"images/gnu-radio-usrp-x310.jpeg"},
    {title:"Competition Line-Following Robot", meta:"AirTech '24 · 1st place", summary:"I designed an STM32 control board with five-channel IR sensing and dual motor drive, then manufactured and tested it.", tags:["STM32", "Robotics", "PCB"], image:"images/lfr-airtech24-winner.jpeg", link:"https://github.com/scientist444/pcb-portfolio"},
    {title:"Long-Range LoRa Link", meta:"Independent · Tested", summary:"I built ATmega328P and SX1278 point-to-point boards and tested the link over distances up to 10 km.", tags:["LoRa", "ATmega328P", "RF"], image:"images/p2p-lora-device.jpeg", link:"https://github.com/scientist444/pcb-portfolio"}
  ]
};

if (typeof window !== "undefined") window.PORTFOLIO_DATA = PORTFOLIO_DATA;
