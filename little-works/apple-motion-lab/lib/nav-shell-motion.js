/**
 * R2.5 · Whole-dock response is intentionally a DIFFERENT interaction from
 * segmented/square buttons: the shell participates with its own restrained
 * two-axis springs. It never substitutes or duplicates the optical lens.
 */
import {createSpring} from './liquid-glass.js';

export function installNavShellMotion(wrapper,nav) {
  if(!wrapper||!nav)throw new Error('Nav shell needs the existing wrapper and lg-navbar');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let press=0, lean=0, target=0, active=false, lastX=.5;
  let touchBounds={left:0,width:1};
  // Only transform & light variables: none of these force layout measurements.
  function paint(){
    const p=reduced.matches?0:Math.max(-.12,Math.min(1.14,press));
    const l=reduced.matches?0:Math.max(-1,Math.min(1,lean));
    const x=(p*l*3.2), y=-2.6*p;
    const sx=1+0.014*p-0.0015*Math.abs(l), sy=1-.022*p;
    wrapper.style.setProperty('--dock-x',x.toFixed(3)+'px');
    wrapper.style.setProperty('--dock-y',y.toFixed(3)+'px');
    wrapper.style.setProperty('--dock-sx',sx.toFixed(4));
    wrapper.style.setProperty('--dock-sy',sy.toFixed(4));
    wrapper.style.setProperty('--dock-tilt',(p*l*.20).toFixed(3)+'deg');
    nav.style.setProperty('--dock-shell-energy',Math.max(0,p).toFixed(3));
    nav.style.setProperty('--dock-shell-touch',Math.round(lastX*100)+'%');
  }
  const pressSpring=createSpring(0,v=>{press=v;paint()},
    {stiffness:175,damping:27,mass:1});
  const leanSpring=createSpring(0,v=>{lean=v;paint()},
    {stiffness:155,damping:25,mass:1});
  // Capture geometry once on pointerdown; scrub moves never force layout reads.
  const fraction=x=>Math.max(0,Math.min(1,
    (x-touchBounds.left)/Math.max(1,touchBounds.width)));
  function begin(x){
    const b=nav.getBoundingClientRect();touchBounds={left:b.left,width:b.width};
    active=true;lastX=fraction(x);
    wrapper.dataset.dockState='pressed';
    pressSpring.set(reduced.matches?0:1);
    leanSpring.set(reduced.matches?0:(lastX-.5)*1.65);
    paint();
  }
  function move(x,velocity=0){
    if(!active)return;
    lastX=fraction(x);
    target=Math.max(-1,Math.min(1,(lastX-.5)*1.75+velocity/5000));
    leanSpring.set(reduced.matches?0:target);
    paint();
  }
  function end(){
    active=false;
    wrapper.dataset.dockState='settling';
    leanSpring.set(0);
    pressSpring.set(0);
    // Cleanup stays tied to the actual spring state, not a hard timeout.
    const verify=()=>{
      if(active)return;
      if(Math.abs(press)<.002&&Math.abs(lean)<.002){
        wrapper.dataset.dockState='rest';lastX=.5;paint();
      }else requestAnimationFrame(verify);
    };
    requestAnimationFrame(verify);
  }
  wrapper.dataset.dockState='rest';
  paint();
  return {begin,move,end,state:()=>({active,press,lean,touch:lastX,
    transform:getComputedStyle(wrapper).transform})};
}
