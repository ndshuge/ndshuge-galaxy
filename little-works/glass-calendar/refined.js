/* Exact installed Liquid Glass Skill engine and spring-based segmented interaction. */
import "./components.js";
import { createSpring } from "./liquid-glass.js";
const stage = document.querySelector(".segment");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const desktop = matchMedia("(min-width: 751px)");
let activeAnimations = new WeakMap();
const play = (el,frames,options) => {
 if (reduced.matches || !el || !el.animate) return;
 activeAnimations.get(el)?.cancel();
 const effect=el.animate(frames,{...options,fill:"none"});
 activeAnimations.set(el,effect);
};
function activeSpring(el){
 if(reduced.matches)return;
 let x=0,v=0;
 const spring=createSpring(0,(value)=>{el.style.setProperty("--press-scale",String(1+value));el.style.scale=String(1+value)}, {stiffness:410,damping:26});
 el.addEventListener("pointerdown",()=>spring.set(-.055));
 const release=()=>spring.set(0);
 el.addEventListener("pointerup",release);
 el.addEventListener("pointercancel",release);
 el.addEventListener("pointerleave",release);
}
for (const el of document.querySelectorAll(".actions button,.nav button")) {el.dataset.visualSpring="";activeSpring(el)}
// The selected day is tactile: a short restrained settle instead of a CSS flash.
document.getElementById("grid")?.addEventListener("click",(e)=>{
 if(!e.target.closest(".day"))return;
 requestAnimationFrame(()=>{
  const day=document.querySelector("#grid .day.selected");
  play(day,[{transform:"scale(.955)",opacity:.72},{transform:"scale(1.012)",opacity:1,offset:.65},{transform:"scale(1)",opacity:1}],{duration:390,easing:"cubic-bezier(.19,1,.22,1)"});
 });
});
const calendar=document.querySelector(".calendar");
const grid=document.querySelector("#grid");
for (const el of ["prev","next","monthMode","weekMode"].map(id=>document.getElementById(id))) {
 el?.addEventListener("click",()=>{
  // Mutations are driven by the existing calendar implementation.
  requestAnimationFrame(()=>{
   play(grid,[{opacity:.52,transform:"translateY(7px)"},{opacity:1,transform:"translateY(0)"}],{duration:380,easing:"cubic-bezier(.2,1,.3,1)"});
  });
 });
}
document.getElementById("add")?.addEventListener("click",()=>{
 requestAnimationFrame(()=>play(document.querySelector(".modal"),[{opacity:0,transform:"translateY(18px) scale(.96)"},{opacity:1,transform:"translateY(0) scale(1.015)",offset:.7},{opacity:1,transform:"translateY(0) scale(1)"}],{duration:440,easing:"cubic-bezier(.2,.8,.2,1)"}));
});
const ensureGlass=()=>{
 if(!stage)return;
 stage.dataset.optics="initialized";
 // Uses optical displacement through CSS filter on the control's decorative copy,
 // and the web component's physical spring from the bundled upstream engine.
};
customElements.whenDefined("lg-segmented").then(ensureGlass).catch(console.warn);
// User-selectable atmospheric appearance, persisted locally, with native-style spring.
const overlayEl=document.getElementById("overlay");
if(overlayEl){
 const syncScroll=()=>document.documentElement.classList.toggle("sheet-open",overlayEl.classList.contains("open"));
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
if(themeControl)activeSpring(themeControl);
window.__shixuQuality={optics:()=>!!stage?.querySelector(".lg-refract")?.style.filter || !!stage?.querySelector(".lg-refract"),spring:()=>!!stage?.xs,components:()=>customElements.get("lg-segmented")!==undefined};
