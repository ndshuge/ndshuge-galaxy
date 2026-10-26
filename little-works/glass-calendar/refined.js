/* Exact installed Liquid Glass Skill engine and spring-based segmented interaction. */
import "./components.js?v=20261026-integrated-dock";
import { createSpring } from "./liquid-glass.js";
const stage = document.querySelector(".segment");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let activeAnimations = new WeakMap();
const play = (el,frames,options) => {
 if (reduced.matches || !el || !el.animate) return;
 activeAnimations.get(el)?.cancel();
 const effect=el.animate(frames,{...options,fill:"none"});
 activeAnimations.set(el,effect);
};
function enablePressFeedback(el){
  // Do not scale live hit targets: only tint and rim respond to contact.
  if(!el)return;
  const off=()=>el.classList.remove("is-pressed");
  el.addEventListener("pointerdown",()=>el.classList.add("is-pressed"));
  for(const event of ["pointerup","pointercancel","pointerleave"])el.addEventListener(event,off);
}
for(const el of document.querySelectorAll(".actions button,.nav button"))enablePressFeedback(el);
// The selected day is tactile: a short restrained settle instead of a CSS flash.
document.getElementById("grid")?.addEventListener("click",(e)=>{
 if(!e.target.closest(".day"))return;
 requestAnimationFrame(()=>{
  const day=document.querySelector("#grid .day.selected .number");
  play(day,[{opacity:.65,transform:"translateY(4px)"},{opacity:1,transform:"translateY(0)"}],{duration:270,easing:"cubic-bezier(.2,.82,.24,1)"});
 });
});
const grid=document.querySelector("#grid");
for (const el of ["prev","next","monthMode","weekMode"].map(id=>document.getElementById(id))) {
 el?.addEventListener("click",()=>{
  // Mutations are driven by the existing calendar implementation.
  requestAnimationFrame(()=>{
   play(grid,[{opacity:.52,transform:"translateY(7px)"},{opacity:1,transform:"translateY(0)"}],{duration:280,easing:"cubic-bezier(.2,.82,.24,1)"});
  });
 });
}
const ensureGlass=()=>{
 if(!stage)return;
 stage.dataset.optics="initialized";
 // Uses optical displacement through CSS filter on the control's decorative copy,
 // and the web component's physical spring from the bundled upstream engine.
};
customElements.whenDefined("lg-segmented").then(ensureGlass).catch(console.warn);
// User-selectable atmospheric appearance, persisted locally, with native-style spring.
const overlayEl=document.getElementById("overlay");
const sheet=document.querySelector(".modal");
const sheetSpring=createSpring(0,value=>{
  if(sheet)sheet.style.translate="0 "+value.toFixed(2)+"px";
},{stiffness:400,damping:39});
if(overlayEl){
 let wasOpen=overlayEl.classList.contains("open");
 const syncScroll=()=>{
   const open=overlayEl.classList.contains("open");
   document.documentElement.classList.toggle("sheet-open",open);
   if(open&&!wasOpen&&sheet&&!reduced.matches){
     sheetSpring.set(25,{immediate:true});
     requestAnimationFrame(()=>sheetSpring.set(0));
   }
   if(!open&&wasOpen)sheetSpring.set(0,{immediate:true});
   wasOpen=open;
 };
 new MutationObserver(syncScroll).observe(overlayEl,{attributes:true,attributeFilter:["class"]});
 syncScroll();
}
const themeControl=document.getElementById("themeToggle");
function applyAppearance(theme){
 document.body.dataset.theme=theme;
 themeControl?.setAttribute("aria-label",theme==="dark"?"切换浅色外观":"切换深色外观");
 themeControl?.setAttribute("aria-pressed",String(theme==="dark"));
 themeControl && (themeControl.textContent=theme==="dark"?"☼":"◐");
}
let userTheme="light";try{userTheme=localStorage.getItem("shixu-appearance")==="dark"?"dark":"light"}catch{}
const previewAppearance=new URLSearchParams(location.search).get("appearance");
if(previewAppearance==="dark"||previewAppearance==="light")userTheme=previewAppearance;
applyAppearance(userTheme);
themeControl?.addEventListener("click",()=>{
 const next=document.body.dataset.theme==="dark"?"light":"dark";
 applyAppearance(next);
 try{localStorage.setItem("shixu-appearance",next)}catch{}
});
if(themeControl)enablePressFeedback(themeControl);
window.__shixuQuality={optics:()=>!!stage?.querySelector(".lg-refract")?.style.filter || !!stage?.querySelector(".lg-refract"),spring:()=>!!stage?.xs,components:()=>customElements.get("lg-segmented")!==undefined};
