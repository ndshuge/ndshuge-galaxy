// Shared optical lens & physical spring from the already-deployed SHUGE Liquid Glass engine.
// Only the small floating mobile selection indicator uses GPU/optical displacement;
// keeping moving/large regions as frosted CSS glass avoids Safari scroll jank.
import {createGlass,createSpring,reducedMotion} from '../arcade-library/glasslib/liquid-glass.js';
const nav=document.querySelector('.mobile-tabs');
const lens=document.querySelector('#tabLens');
const tabs=[...document.querySelectorAll('.mobile-tab')];
const index=()=>Math.max(0,tabs.findIndex(t=>t.classList.contains('active')));
let current=index();
const spring=createSpring(current,value=>{lens.style.transform='translate3d('+value*100+'%,0,0)';},{stiffness:440,damping:36,mass:1});
lens.style.transform='translate3d('+current*100+'%,0,0)';
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
window.addEventListener('pagehide',()=>{spring.stop();optics?.destroy?.();},{once:true});