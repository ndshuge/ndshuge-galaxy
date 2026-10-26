/* Real press-and-hold feedback using the bundled liquid-glass createSpring.
   Hit targets and label glyphs stay stationary; only optical feedback deforms. */
import {createSpring} from "./liquid-glass.js";
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
function installSegment(){
 const group=document.querySelector(".calendar-controls lg-segmented.segment");
 const selected=group?.querySelector(".shixu-segment-indicator");
 const buttons=group?[...group.querySelectorAll(":scope > button")]:[];
 if(!group||!selected||buttons.length!==2)return false;
 if(group.querySelector(".shixu-touch-lens"))return true;
 const lens=document.createElement("span");
 lens.className="shixu-touch-lens";
 lens.setAttribute("aria-hidden","true");
 group.insertBefore(lens,buttons[0]);
 let pressing=null, timer=null;
 const pressure=createSpring(0,v=>lens.style.setProperty("--press",v.toFixed(3)),{stiffness:560,damping:40});
 const hold=createSpring(0,v=>lens.style.setProperty("--hold",v.toFixed(3)),{stiffness:370,damping:34});
 function release(){
  pressing=null;
  clearTimeout(timer);
  pressure.set(0,{immediate:reduced.matches});
  hold.set(0,{immediate:reduced.matches});
 }
 buttons.forEach(button=>{
  button.addEventListener("pointerdown",event=>{
   if(event.button>0||button.disabled)return;
   release();
   pressing=button;
   const root=group.getBoundingClientRect(),rect=button.getBoundingClientRect();
   lens.style.width=button.offsetWidth+"px";
   lens.style.height=button.offsetHeight+"px";
   lens.style.top=button.offsetTop+"px";
   lens.style.left=button.offsetLeft+"px";
   lens.style.transform="none";
   pressure.set(event.pointerType==="mouse"?.55:1,{immediate:reduced.matches});
   if(!reduced.matches)timer=setTimeout(()=>{if(pressing===button)hold.set(1)},220);
  });
  for(const type of ["pointerup","pointercancel","pointerleave"])button.addEventListener(type,release);
  button.addEventListener("blur",release);
 });
 reduced.addEventListener?.("change",()=>{if(reduced.matches)release()});
 return true;
}
function boot(){
 if(installSegment())return;
 setTimeout(boot,70);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();

// Soft touch response for the other system controls; no button scaling.
const active=new Map();
document.addEventListener("pointerdown",event=>{
 const button=event.target.closest?.(".calendar-nav button,#themeToggle,.shixu-dock button,#grid .number");
 if(!button||button.disabled||event.button>0)return;
 if(active.has(button))return;
 const pressure=createSpring(0,v=>button.style.setProperty("--sh-press",v.toFixed(3)),{stiffness:550,damping:38});
 const sustain=createSpring(0,v=>button.style.setProperty("--sh-hold",v.toFixed(3)),{stiffness:340,damping:32});
 const session={pressure,sustain,timer:null};
 active.set(button,session);
 pressure.set(event.pointerType==="mouse"?.45:1,{immediate:reduced.matches});
 if(!reduced.matches)session.timer=setTimeout(()=>{if(active.get(button)===session)sustain.set(1)},230);
},{passive:true});
function releaseAll(){
 for(const [button,s] of active){
  clearTimeout(s.timer);
  s.pressure.set(0,{immediate:reduced.matches});
  s.sustain.set(0,{immediate:reduced.matches});
  active.delete(button);
 }
}
document.addEventListener("pointerup",releaseAll,{passive:true});
document.addEventListener("pointercancel",releaseAll,{passive:true});
window.addEventListener("blur",releaseAll);
reduced.addEventListener?.("change",()=>{if(reduced.matches)releaseAll()});
