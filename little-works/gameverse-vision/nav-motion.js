/** Apple-style interruptible navigation geometry.
 * Uses the original createSpring from our bundled liquid-glass Skill engine.
 * Native buttons remain functional/accessible; the indicator is decorative only.
 */
import {createSpring} from './glasslib/liquid-glass.js';
const selectors=['.mobile-pills','.mobile-dock'];
function installIndicator(selector) {
  const navigation=document.querySelector(selector);
  if(!navigation) return;
  navigation.style.position=selector==='.mobile-dock'?'fixed':'relative';
  const indicator=document.createElement('span');
  indicator.className='navigation-indicator';
  indicator.setAttribute('aria-hidden','true');
  navigation.prepend(indicator);
  let x=0, width=0, started=false, queued=0;
  const update=()=>{indicator.style.transform='translate3d('+x.toFixed(2)+'px,0,0)';indicator.style.width=Math.max(1,width).toFixed(2)+'px'};
  const springX=createSpring(0,value=>{x=value;update()},{stiffness:480,damping:42});
  const springW=createSpring(0,value=>{width=value;update()},{stiffness:480,damping:42});
  function align(immediate=false) {
    if(getComputedStyle(navigation).display==='none')return;
    const active=navigation.querySelector('button.selected');
    if(!active){indicator.style.opacity='0';return}
    const navRect=navigation.getBoundingClientRect();
    const btnRect=active.getBoundingClientRect();
    // Scroll offsets are needed for the horizontally scrollable category strip.
    const dx=btnRect.left-navRect.left+(selector==='.mobile-pills'?navigation.scrollLeft:0);
    if(!Number.isFinite(dx)||btnRect.width<1)return;
    indicator.style.opacity='1';
    springX.set(dx,{immediate:immediate||!started});
    springW.set(btnRect.width,{immediate:immediate||!started});
    started=true;
    navigation.dataset.springReady='true';
  }
  function request(immediate=false) {
    cancelAnimationFrame(queued);
    queued=requestAnimationFrame(()=>align(immediate));
  }
  const observer=new MutationObserver(()=>request());
  observer.observe(navigation,{subtree:true,attributes:true,attributeFilter:['class','aria-current']});
  navigation.addEventListener('scroll',()=>request(true),{passive:true});
  window.addEventListener('resize',()=>request(true),{passive:true});
  document.addEventListener('click',event=>{if(event.target.closest('[data-view]'))request()});
  request(true);
  return {align:request};
}
const controls=selectors.map(installIndicator);
document.documentElement.dataset.navSpring=controls.some(Boolean)?'ready':'unavailable';
