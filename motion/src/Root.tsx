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
  {id:"vehicle-profiling",props:{title:"VEHICLE PROFILING NODE",subtitle:"EDGE SENSOR FUSION",image:"projects/vehicle-profiling.png",nodes:["SENSOR ARRAY","CONDITIONING","STM32","ANALYSIS"],accent:"#79e6bd"}}
];

export const Root: React.FC = () => <>{projects.map(({id,props}) => <Composition key={id} id={id} component={SystemPreview} durationInFrames={210} fps={30} width={960} height={600} defaultProps={props}/>)}</>;
