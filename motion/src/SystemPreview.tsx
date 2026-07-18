import React from "react";
import {AbsoluteFill,Easing,Img,interpolate,staticFile,useCurrentFrame} from "remotion";

export type SystemPreviewProps={title:string;subtitle:string;image:string;nodes:string[];accent:string};
const clamp={extrapolateLeft:"clamp" as const,extrapolateRight:"clamp" as const};

export const SystemPreview:React.FC<SystemPreviewProps>=({title,subtitle,image,nodes,accent})=>{
  const frame=useCurrentFrame();
  const intro=interpolate(frame,[0,30],[0,1],{...clamp,easing:Easing.bezier(.16,1,.3,1)});
  const imageShift=interpolate(frame,[0,210],[0,-18],clamp);
  const imageScale=interpolate(frame,[0,210],[1.02,1.08],clamp);
  const sweep=interpolate(frame,[18,150],[-220,980],{...clamp,easing:Easing.inOut(Easing.quad)});
  const outro=interpolate(frame,[180,208],[1,0],{...clamp,easing:Easing.inOut(Easing.quad)});
  return <AbsoluteFill style={{backgroundColor:"#f7f5ee",fontFamily:"Arial, sans-serif",color:"#101a17",overflow:"hidden",opacity:outro}}>
    <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(16,26,23,.055) 1px, transparent 1px),linear-gradient(90deg,rgba(16,26,23,.055) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
    <div style={{position:"absolute",right:35,top:30,width:390,height:330,borderRadius:26,overflow:"hidden",border:"1px solid rgba(16,26,23,.14)",boxShadow:"0 24px 60px rgba(16,26,23,.12)",background:"#fff",transform:`translateY(${(1-intro)*35}px)`,opacity:intro}}>
      <Img src={staticFile(image)} style={{width:"100%",height:"100%",objectFit:"cover",transform:`translateX(${imageShift}px) scale(${imageScale})`,filter:"saturate(.78) contrast(1.05)"}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 58%,rgba(247,245,238,.82))"}}/>
    </div>
    <div style={{position:"absolute",left:52,top:50,width:500,transform:`translateY(${(1-intro)*28}px)`,opacity:intro}}>
      <div style={{fontFamily:"monospace",fontSize:14,letterSpacing:2.2,color:"#527a0c"}}>SYSTEM / {subtitle}</div>
      <div style={{fontSize:47,lineHeight:.96,fontWeight:800,letterSpacing:-2.2,marginTop:18,maxWidth:510,color:"#101a17"}}>{title}</div>
    </div>
    <div style={{position:"absolute",left:52,right:52,bottom:72,display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:24}}>
      {nodes.map((node,i)=>{const start=48+i*20;const p=interpolate(frame,[start,start+28],[0,1],{...clamp,easing:Easing.bezier(.16,1,.3,1)});return <React.Fragment key={node}><div style={{position:"relative",height:84,border:`1px solid ${i===2?"#6f9a17":"rgba(16,26,23,.16)"}`,background:i===2?`${accent}44`:"rgba(255,255,255,.92)",boxShadow:"0 12px 30px rgba(16,26,23,.07)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace",fontSize:14,letterSpacing:1.2,color:i===2?"#385609":"#26342f",opacity:p,transform:`translateY(${(1-p)*22}px)`}}><span style={{position:"absolute",left:10,top:8,fontSize:9,color:"#708079"}}>0{i+1}</span>{node}</div>{i<3&&<div style={{position:"absolute",left:`calc(${(i+1)*25}% - 18px)`,bottom:104,width:36,height:2,background:"#6f9a17",transform:`scaleX(${p})`,transformOrigin:"left"}}/>}</React.Fragment>})}
    </div>
    <div style={{position:"absolute",left:sweep,top:0,width:160,height:600,background:`linear-gradient(90deg,transparent,${accent}22,transparent)`,transform:"skewX(-10deg)"}}/>
    <div style={{position:"absolute",left:52,bottom:30,fontFamily:"monospace",fontSize:11,letterSpacing:1.5,color:"#66736e"}}>SELECTED ARCHITECTURE · IMPLEMENTATION DETAILS WITHHELD</div>
  </AbsoluteFill>;
};
