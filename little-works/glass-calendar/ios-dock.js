/* iOS-like quick actions: real interaction, not a screenshot or decorative overlay. */
import "./components.js";
import {createSpring} from "./liquid-glass.js";
const dock=document.createElement("nav");
dock.className="shixu-dock";
dock.setAttribute("aria-label","日历快捷操作");
dock.innerHTML=`<lg-dock class="shixu-dock__rim" radius="30" refraction="17" bezel=".65" chroma=".09">
  <button type="button" class="shixu-dock__item" id="dockToday" aria-label="回到今天">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.2" width="17" height="15" rx="3.4"/><path d="M7.5 3.3v4M16.5 3.3v4M4 10h16"/></svg><span>今天</span>
  </button>
  <button type="button" class="shixu-dock__item" id="dockView" aria-label="切换周视图">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.2" width="17" height="16" rx="3.2"/><path d="M4 10h16M10 10v10M15.6 10v10"/></svg><span id="dockViewLabel">月视图</span>
  </button>
  <button type="button" class="shixu-dock__new" id="dockCreate" aria-label="新建日程">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>
  </button>
</lg-dock>`;
document.body.append(dock);
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
function tapSpring(el){
 if(reduced.matches)return;
 const spring=createSpring(0,value=>{el.style.transform=`scale(${1+value})`},{stiffness:480,damping:29});
 el.addEventListener("pointerdown",()=>spring.set(-0.065));
 const release=()=>spring.set(0);
 ["pointerup","pointercancel","pointerleave"].forEach(event=>el.addEventListener(event,release));
}
for(const btn of dock.querySelectorAll("button"))tapSpring(btn);
const press=id=>document.getElementById(id)?.click();
dock.querySelector("#dockToday").addEventListener("click",()=>press("today"));
dock.querySelector("#dockCreate").addEventListener("click",()=>press("add"));
const update=()=>{
 const week=!!document.getElementById("weekMode")?.classList.contains("on");
 const view=dock.querySelector("#dockView");
 dock.querySelector("#dockViewLabel").textContent=week?"周视图":"月视图";
 view.setAttribute("aria-label",week?"切换月视图":"切换周视图");
 view.setAttribute("aria-pressed",String(week));
};
dock.querySelector("#dockView").addEventListener("click",()=>{
 const week=document.getElementById("weekMode")?.classList.contains("on");
 press(week?"monthMode":"weekMode");requestAnimationFrame(update);
});
["monthMode","weekMode"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>requestAnimationFrame(update)));
update();
// The upstream Dock hides its lens entirely at rest. Keep a restrained optical
// presence for touch-first devices; pointer and keyboard interaction still
// increase it naturally. Do not simulate refraction with an idle CSS blur.
customElements.whenDefined("lg-dock").then(()=>{
 const glass=dock.querySelector("lg-dock");
 if(!glass?.ps || matchMedia("(prefers-reduced-transparency: reduce)").matches)return;
 const bounds=glass.items?.getBoundingClientRect();
 if(bounds?.width)glass.xs.set(bounds.width*.49,{immediate:true});
 glass.ps.set(.34,{immediate:reduced.matches});
 glass.addEventListener("pointerleave",()=>glass.ps.set(.34));
 glass.addEventListener("focusout",()=>requestAnimationFrame(()=>{if(!glass.contains(document.activeElement))glass.ps.set(.34)}));
});
