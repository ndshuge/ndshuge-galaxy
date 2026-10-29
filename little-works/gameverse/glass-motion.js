// Shared optical lens & physical spring from the already-deployed SHUGE Liquid Glass engine.
// Only the small floating mobile selection indicator uses GPU/optical displacement;
// keeping moving/large regions as frosted CSS glass avoids Safari scroll jank.
import {createGlass,createSpring,reducedMotion} from '../arcade-library/glasslib/liquid-glass.js';
const nav=document.querySelector('.mobile-tabs');
const lens=document.querySelector('#tabLens');
const tabs=[...document.querySelectorAll('.mobile-tab')];
const index=()=>Math.max(0,tabs.findIndex(t=>t.classList.contains('active')));
let current=index(),position=current,pressure=0,pressed=null;
const paint=()=>{const p=reducedMotion.matches?0:pressure;lens.style.transform='translate3d('+position*100+'%,0,0) scaleX('+(1+p*.115).toFixed(4)+') scaleY('+(1-p*.095).toFixed(4)+')';lens.style.setProperty('--glass-pressure',p.toFixed(3));};
const spring=createSpring(current,value=>{position=value;paint();},{stiffness:440,damping:36,mass:1});
const pressSpring=createSpring(0,value=>{pressure=value;paint();},{stiffness:540,damping:34,mass:1});
paint();
let optics;
try{
  optics=createGlass(lens,{mode:'backdrop',fit:true,radius:18,refraction:5,bezel:.45,chroma:.08,specular:.36,mapScale:1,fallback:'blur(20px) saturate(1.5)'});
}catch(e){console.info('GameVerse optical glass fallback:',e.message);}
nav.addEventListener('click',event=>{
  if(!event.target.closest('.mobile-tab'))return;
  queueMicrotask(()=>{
    const next=index();
    if(next!==current){current=next;spring.set(next,{immediate:reducedMotion.matches});}
  });
});
// Touch/keyboard press deforms only the overlay: tab hit boxes never move.
function release(){
  if(pressed?.tab)pressed.tab.removeAttribute('data-pressed');
  pressed=null;
  nav.removeAttribute('data-pressed');
  pressSpring.set(0,{immediate:reducedMotion.matches});
}
nav.addEventListener('pointerdown',event=>{
  const tab=event.target.closest('.mobile-tab');
  if(!tab||event.button>0)return;
  release();
  pressed={id:event.pointerId,tab,x:event.clientX,y:event.clientY};
  tab.setAttribute('data-pressed','');
  nav.setAttribute('data-pressed','');
  pressSpring.set(1,{immediate:reducedMotion.matches});
},{passive:true});
window.addEventListener('pointerup',event=>{if(pressed?.id===event.pointerId)release();},{passive:true});
window.addEventListener('pointercancel',event=>{if(pressed?.id===event.pointerId)release();},{passive:true});
nav.addEventListener('pointermove',event=>{
  if(pressed?.id!==event.pointerId)return;
  if(Math.abs(event.clientY-pressed.y)>32||Math.abs(event.clientX-pressed.x)>42)release();
},{passive:true});
nav.addEventListener('keydown',event=>{
  if(event.target.closest('.mobile-tab')&&(event.key===' '||event.key==='Enter'))pressSpring.set(1,{immediate:reducedMotion.matches});
});
nav.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter')release();});
nav.addEventListener('focusout',event=>{if(!nav.contains(event.relatedTarget))release();});
reducedMotion.addEventListener?.('change',()=>{
  spring.set(current,{immediate:true});pressSpring.set(0,{immediate:true});release();
});
window.addEventListener('pagehide',()=>{release();spring.stop();pressSpring.stop();optics?.destroy?.();},{once:true});