/* Stable segment selection: wait for toolbar DOM and avoid copies of text. */
function install(){
 const control=document.querySelector(".calendar-controls lg-segmented.segment");
 if(!control)return false;
 if(control.querySelector(".shixu-segment-indicator"))return true;
 const labels=[...control.querySelectorAll(":scope > button")];
 if(labels.length!==2)return false;
 const indicator=document.createElement("span");
 indicator.className="shixu-segment-indicator";
 indicator.setAttribute("aria-hidden","true");
 control.prepend(indicator);
 const reduced=matchMedia("(prefers-reduced-motion: reduce)");
 let initialized=false;
 const sync=()=>{
  const active=labels.find(b=>b.getAttribute("aria-checked")==="true")||labels[0];
  const r=control.getBoundingClientRect(),b=active.getBoundingClientRect();
  if(!r.width||!b.width)return;
  indicator.style.transition=initialized&&!reduced.matches?"transform .27s cubic-bezier(.2,.83,.28,1),width .27s cubic-bezier(.2,.83,.28,1)":"none";
  indicator.style.width=b.width+"px";
  indicator.style.height=b.height+"px";
  indicator.style.top=(b.top-r.top)+"px";
  indicator.style.transform="translate3d("+(b.left-r.left)+"px,0,0)";
  initialized=true;
 };
 const observer=new MutationObserver(()=>requestAnimationFrame(sync));
 labels.forEach(b=>observer.observe(b,{attributes:true,attributeFilter:["aria-checked"]}));
 const resize=new ResizeObserver(()=>requestAnimationFrame(sync));
 resize.observe(control);
 control.addEventListener("change",()=>requestAnimationFrame(sync));
 requestAnimationFrame(sync);
 return true;
}
function boot(){if(install())return;setTimeout(boot,60)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
