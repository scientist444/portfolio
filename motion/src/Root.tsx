import React from "react";
import {Composition} from "remotion";
import {SystemPreview, type SystemPreviewProps} from "./SystemPreview";

const projects: Array<{id: string; props: SystemPreviewProps}> = [
  {id:"ankle-band",props:{title:"CONNECTED ANKLE BAND",subtitle:"WEARABLE SENSING",image:"projects/ankle-band.jpg",nodes:["MOTION","PRESSURE","BLE CORE","COMPANION"],accent:"#b9f542"}},
  {id:"aqi-monitor",props:{title:"MULTI-SENSOR AQI",subtitle:"ENVIRONMENTAL SENSING",image:"projects/aqi-monitor.png",nodes:["SENSORS","ESP32","WI-FI","DASHBOARD"],accent:"#79e6bd"}},
  {id:"epic",props:{title:"EPIC BIOSIGNAL PLATFORM",subtitle:"MIXED-SIGNAL PRODUCT",image:"projects/epic.png",nodes:["BIOSIGNALS","AFE","MCU + IMU","TRANSPORT"],accent:"#b9f542"}},
  {id:"ergonomic-mouse",props:{title:"ERGONOMIC BLE MOUSE",subtitle:"ASSISTIVE INPUT",image:"projects/ergonomic-mouse.jpg",nodes:["JOYSTICKS","FILTERING","BLE HID","HOST"],accent:"#79e6bd"}},
  {id:"embedded-microscope",props:{title:"MICROSCOPE CONTROLLER",subtitle:"IMAGING HARDWARE",image:"projects/embedded-microscope.png",nodes:["IMAGING","ESP32","CONTROL","INTERFACES"],accent:"#b9f542"}},
  {id:"pd-charger",props:{title:"USB-C PD CONTROLLER",subtitle:"POWER ELECTRONICS",image:"projects/pd-charger.png",nodes:["USB-C PD","PROTECTION","BUCK RAILS","LOAD"],accent:"#79e6bd"}},
  {id:"smart-stethoscope",props:{title:"SMART STETHOSCOPE",subtitle:"ACTIVE DEVELOPMENT",image:"projects/smart-stethoscope.png",nodes:["MEMS + PVDF","LOW-NOISE AFE","ADC + BLE","APP"],accent:"#b9f542"}},
  {id:"vehicle-profiling",props:{title:"VEHICLE PROFILING NODE",subtitle:"EDGE SENSOR FUSION",image:"projects/vehicle-profiling.png",nodes:["SENSOR ARRAY","CONDITIONING","STM32","ANALYSIS"],accent:"#79e6bd"}},
  {id:"ekko-therapy-system",props:{title:"EKKO THERAPY SYSTEM",subtitle:"MEDICAL PRODUCT",image:"projects/ekko-therapy-system.jpg",nodes:["TOUCH UI","CONTROLLER","SUPERVISION","APPLICATORS"],accent:"#b9f542"}},
  {id:"avionics-atp",props:{title:"AVIONICS ATP",subtitle:"TEST ENGINEERING",image:"projects/avionics-atp.jpg",nodes:["LRU","TEST I/O","PYTHON ATP","REPORT"],accent:"#79e6bd"}},
  {id:"gnu-radio-sdr",props:{title:"GNU RADIO SDR",subtitle:"RF INSTRUMENTATION",image:"projects/gnu-radio-sdr.jpg",nodes:["WAVEFORM","GNU RADIO","USRP X310","SPECTRUM"],accent:"#b9f542"}},
  {id:"arduino-opta-plc",props:{title:"ARDUINO OPTA PLC",subtitle:"INDUSTRIAL CONTROL",image:"projects/arduino-opta-plc.jpg",nodes:["FIELD I/O","OPTA PLC","TCP / UDP","LABVIEW"],accent:"#79e6bd"}},
  {id:"line-following-robot",props:{title:"LINE-FOLLOWING ROBOT",subtitle:"COMPETITION ROBOTICS",image:"projects/line-following-robot.jpg",nodes:["IR ARRAY","STM32","MOTOR DRIVER","DRIVE"],accent:"#b9f542"}},
  {id:"p2p-lora",props:{title:"P2P LORA DEVICE",subtitle:"LONG-RANGE RADIO",image:"projects/p2p-lora.jpg",nodes:["PAYLOAD","ATMEGA","SX1278","REMOTE PEER"],accent:"#79e6bd"}}
];

export const Root: React.FC = () => <>{projects.map(({id,props}) => <Composition key={id} id={id} component={SystemPreview} durationInFrames={210} fps={30} width={960} height={600} defaultProps={props}/>)}</>;
