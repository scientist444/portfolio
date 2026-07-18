const PORTFOLIO_DATA = {
  featured: [
    {
      slug: "ankle-band",
      title: "Connected Ankle Band",
      eyebrow: "Wearable sensing · MVP",
      status: "Completed",
      stage: "MVP",
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
      stage: "MVP",
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
        type: "Interface schematic",
        src: "assets/projects/aqi-monitor/interface-schematic.svg",
        title: "Sensor, display and power interfaces",
        caption: "The ESP32 brings the gas, particulate and climate sensors into one acquisition path, drives the local OLED and forwards readings over Wi-Fi.",
        points: ["Analog, UART and I²C sensor paths", "Local display remains useful offline", "USB and battery power feed the complete sensor node"]
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
      stage: "Product",
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
        caption: "This is the MAX30102 sensing block and its local low-voltage supply. It shows the sensor interface, rail generation and decoupling approach.",
        points: ["Dedicated 1.8 V sensor rail", "Local decoupling around the sensor", "Digital interface returned to the controller domain"]
      },
      validation: [
        "Checked the main power rails and controller bring-up.",
        "Confirmed the acquisition paths on manufactured hardware.",
        "Used prototype results to guide the final board iteration."
      ],
      testing: "I brought up the power, controller and acquisition paths on manufactured hardware and used the results to guide the final board iteration.",
      result: "I completed EPIC as a product-level embedded platform with a compact fabrication-ready board.",
      nextStep: "Future work would concentrate on production test coverage and larger user datasets rather than changing the core architecture.",
      links: []
    },
    {
      slug: "ergonomic-mouse",
      title: "Ergonomic BLE Mouse",
      eyebrow: "Assistive input · MVP",
      status: "Completed",
      stage: "MVP",
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
        type: "Control schematic",
        src: "assets/projects/ergonomic-mouse/interface-schematic.svg",
        title: "Dual-joystick and BLE HID interface",
        caption: "Both joysticks and the button inputs feed the ESP32, which translates the sampled controls into BLE HID reports for the host.",
        points: ["Two analog X/Y joystick paths", "Digital switch and button inputs", "BLE HID output with USB-C power and debug access"]
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
      stage: "MVP",
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
        caption: "This circuit section shows the controller, external switching devices and feedback area of the buck stage.",
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
      stage: "MVP",
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
        type: "Power schematic",
        src: "assets/projects/pd-charger/power-schematic.svg",
        title: "USB-C input and regulated load rails",
        caption: "The negotiated USB-C input passes through protection before the conversion stages create the main and auxiliary rails used by the embedded load.",
        points: ["PD negotiation and input protection", "Separated high-current conversion path", "9 V, 5 V and 3.3 V load domains"]
      },
      validation: [
        "Completed schematic and layout checks for the power tree.",
        "Reviewed placement and high-current routing in 3D.",
        "Checked the design for fabrication and bring-up access."
      ],
      testing: "I completed schematic, layout and 3D review, including the power tree, placement and fabrication access checks.",
      result: "I completed a compact, fabrication-ready USB-C power-control MVP.",
      nextStep: "The next step would be a production-oriented thermal and load test matrix on assembled units.",
      links: []
    },
    {
      slug: "smart-stethoscope",
      title: "Smart Stethoscope",
      eyebrow: "Medical sensing · MVP",
      status: "In progress",
      stage: "MVP",
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
      stage: "MVP",
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
    },
    {
      slug: "ekko-therapy-system",
      title: "EKKO Therapy System",
      eyebrow: "Medical therapy · Product",
      status: "Completed",
      stage: "Product",
      period: "2024–2026",
      duration: "~4 months per major revision",
      context: "RISETech",
      role: "Solo embedded product engineer",
      summary: "I worked across the electronics and control interfaces for EKKO, a therapy system built around two independently controlled applicator channels.",
      hero: "images/ekko-device.jpg",
      gallery: ["images/ekko-device.jpg"],
      video: "assets/motion/ekko-therapy-system.mp4",
      tags: ["Medical device", "Embedded control", "Raspberry Pi", "Touch UI", "PCB"],
      challenge: "The system needed two therapy channels to operate independently while the operator still had one clear interface for setup, timing and status. Hardware revisions also had to remain practical to manufacture and service.",
      requirements: [
        "Control two applicator channels independently.",
        "Provide a touch interface for session setup and status.",
        "Supervise timing, power and system state during operation.",
        "Carry hardware changes through schematic, layout and manufacturing review."
      ],
      decisions: [
        "I separated the two applicator channels in the control structure so one session would not depend on the other.",
        "I kept the operator workflow on a dedicated touch interface while the embedded controller handled timing and supervision.",
        "I treated manufacturing and service access as design inputs during PCB revisions."
      ],
      architecture: ["Touch interface", "Main controller", "Channel supervision", "Dual applicators"],
      engineering: [
        "Maintained and improved embedded firmware across hardware revisions.",
        "Updated schematics and multi-layer PCB implementation.",
        "Reviewed signal integrity, connectors and manufacturing feedback.",
        "Supported production bring-up and fault investigation."
      ],
      schematic: {
        type: "Control schematic",
        src: "assets/projects/ekko/system-schematic.svg",
        title: "Dual-channel therapy control structure",
        caption: "The interface configures a session while the main controller supervises two independent applicator paths and the shared power and safety functions.",
        points: ["Independent applicator channels", "Central timing and status supervision", "Shared power and safety monitoring"]
      },
      validation: [
        "Checked independent channel operation and session timing.",
        "Used manufacturing feedback to improve board revisions.",
        "Supported system-level bring-up across the interface, control and applicator paths."
      ],
      testing: "I validated the control flow and hardware revisions as part of the complete product lifecycle, from board changes through assembled-system checks.",
      result: "I completed the assigned electronics and embedded-control work for a production-oriented medical therapy product.",
      nextStep: "Further work would focus on production test automation and service diagnostics.",
      links: []
    },
    {
      slug: "avionics-atp",
      title: "Avionics Automated Test Procedures",
      eyebrow: "Test engineering · MVP",
      status: "Completed",
      stage: "MVP",
      period: "Jun–Aug 2025",
      duration: "~3 months",
      context: "RIMS · NASTP Alpha",
      role: "Embedded test engineer",
      summary: "I built Python-based ATP tools for avionics LRUs and portable field testing, alongside a system-health interface for the supporting computer.",
      hero: "images/python-gui-system-monitor.JPG",
      gallery: ["images/python-gui-system-monitor.JPG"],
      video: "assets/motion/avionics-atp.mp4",
      tags: ["Python", "LabVIEW", "Avionics", "Test automation", "NI hardware"],
      challenge: "Manual checks make repeatability, traceability and field diagnosis difficult. I needed a test workflow that could guide an operator, acquire the required signals and keep results understandable after the test.",
      requirements: [
        "Run repeatable test sequences for an avionics LRU.",
        "Support a portable tester workflow for field diagnostics.",
        "Collect measurements and compare them with defined limits.",
        "Monitor CPU, GPS and Ethernet state on the Ubuntu host."
      ],
      decisions: [
        "I used Python for the ATP sequence, result handling and operator workflow.",
        "I separated the test executive from the instrumentation interface so the sequence remained maintainable.",
        "I presented health data per subsystem instead of reducing it to one ambiguous status light."
      ],
      architecture: ["Avionics LRU", "Portable test interface", "Python ATP", "Results + health view"],
      engineering: [
        "Implemented test steps, limits and result reporting in Python.",
        "Connected measurement hardware and portable tester interfaces.",
        "Built real-time CPU temperature, GPS and Ethernet monitoring.",
        "Structured the interface for operator-led diagnostics."
      ],
      schematic: {
        type: "Test interface schematic",
        src: "assets/projects/avionics-atp/system-schematic.svg",
        title: "LRU, instrumentation and test-executive path",
        caption: "The portable interface sits between the unit under test and the Python executive, while the health monitor keeps the supporting computer visible during the procedure.",
        points: ["Separated stimulus and measurement interface", "Step, limit and result handling", "Host health and connectivity monitoring"]
      },
      validation: [
        "Exercised the ATP sequence against the intended test workflow.",
        "Checked measurement presentation and operator prompts.",
        "Verified live CPU, GPS and Ethernet monitoring on Ubuntu."
      ],
      testing: "I completed and exercised the ATP and monitoring tools in the RIMS test environment using the available instrumentation and target workflows.",
      result: "I delivered working automated-test and host-monitoring tools for avionics maintenance workflows.",
      nextStep: "The next improvement would be a reusable test-definition layer for adding new LRU procedures faster.",
      links: [{label:"RIMS experience", url:"RIMS-EXPERIENCE.pdf"}]
    },
    {
      slug: "gnu-radio-sdr",
      title: "GNU Radio SDR Pipeline",
      eyebrow: "RF instrumentation · MVP",
      status: "Completed",
      stage: "MVP",
      period: "Jun–Aug 2025",
      duration: "~3 months",
      context: "RIMS · NASTP Alpha",
      role: "SDR systems engineer",
      summary: "I built GNU Radio transmit, receive and spectral-analysis workflows around a USRP X310 for real-time RF experimentation.",
      hero: "images/gnu-radio-usrp-x310.jpeg",
      gallery: ["images/gnu-radio-usrp-x310.jpeg"],
      video: "assets/motion/gnu-radio-sdr.mp4",
      tags: ["GNU Radio", "USRP X310", "UHD", "DSP", "Spectrum analysis"],
      challenge: "The RF chain had to stay understandable from generated samples to the air interface and back to analysis. Sample rate, host transport, tuning and gain settings all affected whether the flowgraph behaved in real time.",
      requirements: [
        "Create repeatable transmit and receive flowgraphs.",
        "Control frequency, gain and sample rate through UHD.",
        "Inspect received signals in time and frequency domains.",
        "Keep host transport and processing within real-time limits."
      ],
      decisions: [
        "I separated waveform generation, rate conversion, UHD transport and analysis into clear blocks.",
        "I used the X310 as the RF frontend and kept tuning parameters exposed in GNU Radio Companion.",
        "I verified the chain progressively before combining transmit and receive experiments."
      ],
      architecture: ["Waveform source", "GNU Radio DSP", "UHD + X310", "Spectrum analysis"],
      engineering: [
        "Built and configured transmit and receive flowgraphs.",
        "Set UHD device, sample-rate, center-frequency and gain parameters.",
        "Added filtering, resampling and FFT-based inspection.",
        "Diagnosed host and radio settings affecting real-time flow."
      ],
      schematic: {
        type: "Flowgraph schematic",
        src: "assets/projects/gnu-radio-sdr/flowgraph-schematic.svg",
        title: "Transmit, radio and receive signal path",
        caption: "The flowgraph keeps generation and transmit processing separate from the receive and analysis chain, with UHD connecting both sides to the X310.",
        points: ["Explicit TX and RX processing blocks", "UHD device control at the radio boundary", "FFT, spectrum and logging at the analysis end"]
      },
      validation: [
        "Confirmed UHD communication with the X310.",
        "Observed generated and received spectra in GNU Radio.",
        "Checked flowgraph behavior while changing rate, tuning and gain."
      ],
      testing: "I exercised the transmit, receive and analysis paths on the X310 in the RIMS instrumentation lab.",
      result: "I completed a reusable SDR workflow for RF generation, reception and spectral inspection.",
      nextStep: "I would next package the common radio settings and captures into repeatable experiment profiles.",
      links: [{label:"RIMS experience", url:"RIMS-EXPERIENCE.pdf"}]
    },
    {
      slug: "arduino-opta-plc",
      title: "Arduino Opta PLC Control",
      eyebrow: "Industrial control · MVP",
      status: "Completed",
      stage: "MVP",
      period: "Jun–Aug 2025",
      duration: "~3 months",
      context: "RIMS · NASTP Alpha",
      role: "Embedded control engineer",
      summary: "I programmed an Arduino Opta PLC and built a LabVIEW control interface that exchanged commands and live status over TCP and UDP.",
      hero: "images/arduino-opta-labview.jpg",
      gallery: ["images/arduino-opta-labview.jpg"],
      video: "assets/motion/arduino-opta-plc.mp4",
      tags: ["Arduino Opta", "PLC", "Structured Text", "Ladder Logic", "LabVIEW"],
      challenge: "The controller had to combine deterministic field I/O with a networked operator interface. I needed a clean boundary between PLC logic, communications and the LabVIEW controls used to observe the system.",
      requirements: [
        "Implement field logic using PLC programming methods.",
        "Expose commands and status over TCP and UDP.",
        "Provide a LabVIEW interface for control and monitoring.",
        "Recover cleanly from missing or delayed network messages."
      ],
      decisions: [
        "I kept time-critical I/O behavior inside the Opta controller.",
        "I used Structured Text and Ladder Logic where each was easiest to inspect.",
        "I treated the network API as a defined interface between the PLC and LabVIEW."
      ],
      architecture: ["Field inputs", "Arduino Opta PLC", "TCP / UDP API", "LabVIEW VI"],
      engineering: [
        "Programmed controller behavior in Structured Text and Ladder Logic.",
        "Implemented TCP and UDP communication paths.",
        "Built the LabVIEW controls and live status indicators.",
        "Exercised peripheral control through the complete network path."
      ],
      schematic: {
        type: "Control schematic",
        src: "assets/projects/arduino-opta/control-schematic.svg",
        title: "PLC, network API and LabVIEW boundary",
        caption: "The Opta owns the field I/O and control logic. LabVIEW sends operator commands and receives live state through the TCP and UDP interface.",
        points: ["Deterministic field logic remains in the PLC", "Defined TCP and UDP command boundary", "LabVIEW operator control and monitoring"]
      },
      validation: [
        "Checked input-to-output behavior on the controller.",
        "Exercised TCP and UDP commands from LabVIEW.",
        "Observed peripheral state and communication status in the VI."
      ],
      testing: "I completed the controller and LabVIEW integration and tested the full command-and-status path with the connected peripherals.",
      result: "I delivered a working industrial-control MVP spanning PLC logic, networking and the operator interface.",
      nextStep: "The next revision would add a formal message schema and automated communication fault tests.",
      links: [{label:"RIMS experience", url:"RIMS-EXPERIENCE.pdf"}]
    },
    {
      slug: "line-following-robot",
      title: "Competition Line-Following Robot",
      eyebrow: "Robotics · MVP",
      status: "Completed",
      stage: "MVP",
      period: "2024",
      duration: "~3 months",
      context: "AirTech '24 · 1st place",
      role: "Solo electronics and control engineer",
      summary: "I designed the STM32 controller board and control loop for a five-sensor line-following robot that won first place at AirTech '24 Roboline.",
      hero: "images/lfr-airtech24-winner.jpeg",
      gallery: ["images/lfr-airtech24-winner.jpeg"],
      video: "assets/motion/line-following-robot.mp4",
      tags: ["STM32F103", "TCRT5000", "TB6612FNG", "PID control", "Robotics"],
      challenge: "The robot had to read the track quickly, correct its path without oscillation and keep the motor power stage reliable during aggressive direction changes.",
      requirements: [
        "Read a five-channel infrared sensor array.",
        "Run a fast and tunable steering-control loop.",
        "Drive two motors independently from a battery supply.",
        "Keep the controller compact and easy to repair during competition."
      ],
      decisions: [
        "I used an STM32F103 for fast sensor sampling and PWM generation.",
        "I selected a dual H-bridge so direction and speed for both motors stayed under one control interface.",
        "I tuned the control response against the real track instead of relying only on a static bench test."
      ],
      architecture: ["5-channel IR array", "STM32 control loop", "Dual motor driver", "Differential drive"],
      engineering: [
        "Designed the two-layer controller PCB in EasyEDA.",
        "Integrated the TCRT5000 sensor array and TB6612FNG motor stage.",
        "Implemented and tuned the line-position control loop.",
        "Manufactured, repaired and tested the complete robot."
      ],
      schematic: {
        type: "Controller schematic",
        src: "assets/projects/line-following-robot/controller-schematic.svg",
        title: "Sensor, STM32 and motor-drive path",
        caption: "Five reflected-light channels feed the STM32 control loop, which produces the direction and PWM signals for the dual motor driver.",
        points: ["Five sensor inputs", "Real-time steering correction", "Independent PWM and direction control for both motors"]
      },
      validation: [
        "Checked all five sensor channels over the track surface.",
        "Tuned motor response and steering behavior on the competition course.",
        "Completed the AirTech '24 Roboline event in first place."
      ],
      testing: "I tested the complete robot on real track layouts and refined the control response through competition runs.",
      result: "The completed robot won first place at AirTech '24 Roboline.",
      nextStep: "I would add logged line-position and motor-command data to make tuning faster and more repeatable.",
      links: [{label:"Public PCB notes", url:"https://github.com/scientist444/pcb-portfolio/tree/main/projects/line-following-robot"}]
    },
    {
      slug: "p2p-lora",
      title: "Long-Range P2P LoRa Device",
      eyebrow: "Wireless systems · MVP",
      status: "Completed",
      stage: "MVP",
      period: "2024–2025",
      duration: "~3 months",
      context: "Independent",
      role: "Solo embedded engineer",
      summary: "I built a battery-powered ATmega328P and SX1278 device for direct long-range data transfer without relying on local network infrastructure.",
      hero: "images/p2p-lora-device.jpeg",
      gallery: ["images/p2p-lora-device.jpeg"],
      video: "assets/motion/p2p-lora.mp4",
      tags: ["LoRa", "SX1278", "ATmega328P", "SPI", "RF"],
      challenge: "The link had to carry small field payloads reliably over long distance using a compact battery-powered board and an external antenna.",
      requirements: [
        "Exchange payloads directly between two nodes.",
        "Interface the radio and controller through a stable SPI path.",
        "Support an SMA-connected external antenna.",
        "Operate from a single-cell Li-ion supply in a compact enclosure."
      ],
      decisions: [
        "I paired the ATmega328P with the SX1278 for a simple and inspectable node architecture.",
        "I kept packet framing and retry behavior in the controller firmware.",
        "I used an external antenna connection so the RF element could match the deployment."
      ],
      architecture: ["Data input", "ATmega packet layer", "SX1278 radio", "Remote peer"],
      engineering: [
        "Designed the two-layer controller and radio PCB.",
        "Implemented the SPI radio interface and packet workflow.",
        "Integrated the Li-ion power path and SMA connector.",
        "Built and tested the peer-to-peer link outdoors."
      ],
      schematic: {
        type: "Radio schematic",
        src: "assets/projects/p2p-lora/radio-schematic.svg",
        title: "Controller, SX1278 and antenna interface",
        caption: "The controller frames the payload and exchanges it with the SX1278 over SPI; the radio then drives the external antenna through the SMA interface.",
        points: ["SPI control and radio interrupts", "Packet sequence and retry handling", "External antenna and battery-powered node"]
      },
      validation: [
        "Checked packet exchange between both hardware nodes.",
        "Tested the link outdoors over distances up to 10 km.",
        "Verified the complete controller, radio and antenna path."
      ],
      testing: "I tested the assembled pair in outdoor deployments and achieved communication over distances up to 10 km.",
      result: "I completed a working long-range P2P communication MVP with custom hardware and firmware.",
      nextStep: "The next improvement would add logged RSSI, sequence-loss and battery measurements across repeatable routes.",
      links: [{label:"Public PCB notes", url:"https://github.com/scientist444/pcb-portfolio/tree/main/projects/lora-p2p-device"}]
    }
  ],
  earlier: []
};

if (typeof window !== "undefined") window.PORTFOLIO_DATA = PORTFOLIO_DATA;
