/* View continuity driven by the ORIGINAL native click, with no event replay.
   Old grid is captured during capture phase; inline handlers then update real
   state normally; transition runs in a microtask after the real click. */
const grid=document.querySelector("#grid");
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
if(grid){
 const stage=document.createElement("div");
 stage.className="shixu-grid-stage";
 grid.before(stage);
 stage.append(grid);
 let active=null,sequence=0;
 function settle(){
  if(!active)return;
  active.animations.forEach(a=>{try{a.cancel()}catch{}});
  active.ghost.remove();
  stage.style.height="";
  stage.dataset.motionPhase="idle";
  active=null;
 }
 document.addEventListener("click",event=>{
  const button=event.target.closest?.("#monthMode,#weekMode");
  if(!button||!button.closest(".calendar-controls")||reduced.matches)return;
  const isWeek=grid.querySelectorAll(".day").length===7;
  const nextWeek=button.id==="weekMode";
  if(isWeek===nextWeek)return;
  settle();
  const previousHeight=grid.getBoundingClientRect().height;
  const ghost=grid.cloneNode(true);
  ghost.removeAttribute("id");
  ghost.classList.add("shixu-grid-ghost");
  ghost.setAttribute("aria-hidden","true");
  ghost.inert=true;
  ghost.style.height=previousHeight+"px";
  stage.style.height=previousHeight+"px";
  stage.append(ghost);
  const state={ghost,animations:[]};
  active=state;
  stage.dataset.motionPhase="transitioning";
  stage.dataset.transitionCount=String(++sequence);
  // Original click continues unmodified: LgSegmented selects + inline onclick renders.
  queueMicrotask(()=>{
   if(active!==state)return;
   const nextHeight=grid.getBoundingClientRect().height;
   if(!previousHeight||!nextHeight||grid.querySelectorAll(".day").length===(isWeek?7:42)){
    settle();return;
   }
   const direction=nextWeek?-1:1;
   const opts={duration:320,easing:"cubic-bezier(.2,.82,.22,1)",fill:"both"};
   state.animations=[
    stage.animate([{height:previousHeight+"px"},{height:nextHeight+"px"}],opts),
    grid.animate([
      {opacity:.12,transform:"translate3d(0,"+(direction*8)+"px,0)"},
      {opacity:1,transform:"translate3d(0,0,0)"}
    ],{duration:295,easing:"cubic-bezier(.2,.85,.25,1)",fill:"both"}),
    ghost.animate([
      {opacity:1,transform:"translate3d(0,0,0)"},
      {opacity:0,transform:"translate3d(0,"+(-direction*7)+"px,0)"}
    ],{duration:220,easing:"ease-out",fill:"both"})
   ];
   Promise.allSettled(state.animations.map(a=>a.finished)).then(()=>{if(active===state)settle()});
  });
 },true);
 reduced.addEventListener?.("change",()=>{if(reduced.matches)settle()});
}
