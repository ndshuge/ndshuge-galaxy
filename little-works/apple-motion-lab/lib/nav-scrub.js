/**
 * Apple-like tab press-and-scrub behavior, layered on the installed Skill's
 * <lg-navbar> (createSpring + createGlass). Never re-implements the optics.
 *
 * Invariant: hover/drag is PREVIEW only. ARIA current + content commit on
 * pointer release. Native keyboard focus/click behavior remains available.
 */
import { createSpring } from './liquid-glass.js';

export function installNavbarScrub(nav, {onCommit, onPressChange=()=>{}, onShell=()=>{}}={}) {
  if (!nav || typeof nav.xs?.set !== 'function' || typeof nav.setCurrent !== 'function')
    throw new Error('lg-navbar Skill component is required for press-and-scrub');
  const tabs = [...nav.querySelectorAll(':scope > button[data-view]')];
  if (tabs.length < 2) throw new Error('At least two navbar buttons are required');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let gesture = null;
  let blockClickUntil = 0;
  let lastSelection = nav.current ?? 0;
  let restTimer=0, opticalFrame=0;
  // Optical shapes use quantized presets so the original displacement map cache is reused.
  // Actual position stays one-to-one with the finger; the edges lag through a native spring.
  const shapeSpring=createSpring(0,(value)=>{
    const discrete=reduceMotion.matches?0:Math.round(Math.max(0,Math.min(32,value))/4)*4;
    if(discrete!==nav.scrubStretch){
      nav.scrubStretch=discrete;
      nav.style.setProperty('--scrub-energy',String(Math.min(1,discrete/32)));
      if(nav.glass)nav.render();
    }
    if(!gesture)finishVisualRelease();
  },{stiffness:265,damping:33,mass:1});

  // Lift the original refractive lens off the navbar's surface, like a pressed
  // iOS 26 tab. The vertical shape is a *separate Skill spring*, never a scale.
  const liftSpring=createSpring(0,(value)=>{
    const snapped=reduceMotion.matches?0:Math.round(Math.max(0,Math.min(28,value))/4)*4;
    if(nav.scrubLift!==snapped){nav.scrubLift=snapped;if(nav.glass)nav.render();}
    if(!gesture)finishVisualRelease();
  },{stiffness:190,damping:27.5,mass:1});

  // No abrupt optics-to-original icon swap at pointer-up. Only switch
  // once the actual geometric lift and stretch have reached rest.
  function finishVisualRelease(){
    if(gesture || !nav.classList.contains('is-scrubbing'))return;
    if((nav.scrubStretch||0)!==0 || (nav.scrubLift||0)!==0)return;
    nav.classList.remove('is-scrubbing');
    nav.removeAttribute('data-scrub-active');
    nav.removeAttribute('data-scrub-preview');
    if(nav.glass)nav.render();
  }

  function centers() {
    const base = nav.getBoundingClientRect().left;
    return tabs.map(t => ({
      left: t.offsetLeft,
      center: t.offsetLeft + t.offsetWidth/2,
      screenCenter: t.getBoundingClientRect().left+t.offsetWidth/2,
      width: t.offsetWidth
    }));
  }
  const nearest = (x, points) => points.reduce((best,entry,i)=>
    Math.abs(entry.screenCenter-x) < Math.abs(points[best].screenCenter-x) ? i : best,0);

  function update(x) {
    if (!gesture) return;
    const pts=gesture.points;
    const p=pts[0],q=pts[pts.length-1];
    const center=Math.max(p.center,Math.min(q.center,x-gesture.base));
    const desiredLeft=Math.max(p.left,Math.min(q.left,center-pts[0].width/2));
    // This existing Skill spring supports immediate updates for true 1:1 finger
    // following. The same spring takes over on release for a natural settle.
    const now=performance.now(),dt=Math.max(12,now-gesture.lastT);
    const delta=x-gesture.lastX;
    const speed=delta*1000/dt;
    gesture.velocity=.6*gesture.velocity+.4*speed;
    onShell('move',x,gesture.velocity);
    if(Math.abs(delta)>.4)nav.scrubDirection=Math.sign(delta);
    gesture.lastX=x;gesture.lastT=now;
    nav.xs.set(desiredLeft,{immediate:true});
    if(nav.glass)nav.render();
    clearTimeout(restTimer);
    if(!reduceMotion.matches){
      if((nav.scrubLift||0)>=16)shapeSpring.set(Math.min(32,8+Math.abs(gesture.velocity)*.052));
      restTimer=setTimeout(()=>{if(gesture&&(nav.scrubLift||0)>=16)shapeSpring.set(8);},105);
    }
    const index=nearest(x,pts);
    if (gesture.preview!==index) {
      gesture.preview=index;
      nav.dataset.scrubPreview=String(index);
      onPressChange(index);
    }
  }

  nav.addEventListener('pointerdown', e=>{
    const button=e.target.closest('button[data-view]');
    if(!button || !nav.contains(button) || !e.isPrimary || (e.button!==0 && e.pointerType==='mouse'))return;
    // New press is never blocked by the previous gesture's synthetic click.
    blockClickUntil=0;
    const points=centers(), index=tabs.indexOf(button);
    gesture={id:e.pointerId,button,index,preview:index,points,
      base:nav.getBoundingClientRect().left,startX:e.clientX,startY:e.clientY,
      moved:false,cancelled:false,pointerType:e.pointerType,
      lastX:e.clientX,lastT:performance.now(),velocity:0};
    lastSelection=nav.current;
    // Let the existing whole-dock spring paint its first feedback frame
    // before the expensive optical displacement maps are swapped in.
    onShell('begin',e.clientX,0);
    nav.setAttribute('data-scrub-active','');
    cancelAnimationFrame(opticalFrame);
    const touchId=e.pointerId;
    // On a cold first touch, wall-clock 48ms could elapse before even one
    // compositor frame is painted. Instead give the shell's own spring a frame
    // first, then start the genuine Skill optics on the next visible frame.
    opticalFrame=requestAnimationFrame(()=>{
      if(gesture?.id!==touchId)return;
      if(!reduceMotion.matches){
        liftSpring.set(20);
        shapeSpring.set(8);
      }
      opticalFrame=requestAnimationFrame(()=>{
        if(gesture?.id===touchId)nav.classList.add('is-scrubbing');
      });
    });
    nav.scrubDirection=0;
    nav.dataset.scrubPreview=String(index);
    onPressChange(index);
    try { button.setPointerCapture(e.pointerId); } catch {}
    // Pressure starts a restrained, continuous spring response on pointer-down.
  },true);

  nav.addEventListener('pointermove',e=>{
    if(!gesture || gesture.id!==e.pointerId)return;
    const dx=e.clientX-gesture.startX,dy=e.clientY-gesture.startY;
    if(Math.abs(dy)>45 && Math.abs(dy)>Math.abs(dx)*1.4) {
      gesture.cancelled=true;
      return;
    }
    if(gesture.cancelled)return;
    if(Math.abs(dx)>5)gesture.moved=true;
    if(gesture.moved) {
      update(e.clientX);
      if(e.cancelable)e.preventDefault();
    }
  });

  function end(e,cancel=false){
    const g=gesture;
    if(!g || e.pointerId!==g.id)return;
    gesture=null;
    cancelAnimationFrame(opticalFrame);
    if(!nav.classList.contains('is-scrubbing')){
      nav.removeAttribute('data-scrub-active');
      nav.removeAttribute('data-scrub-preview');
    }
    // The glass and whole dock release together; keep one refracted ink
    // layer until their springs have visually finished settling.
    onShell('end',e.clientX||g.lastX,0);
    // Stable optics settings avoid another synchronous map rebuild on pointerup.
    clearTimeout(restTimer);
    shapeSpring.set(0);
    // Release from the current physical state, without freezing the height
    // for 110ms before dropping it.
    liftSpring.set(0);
    onPressChange(-1);
    // A click emitted after pointerup targets the pressed button, not the tab
    // under the finger. Capture it to avoid overwriting the correct selection.
    blockClickUntil=performance.now()+450;
    if(g.button.hasPointerCapture?.(g.id)) {
      try {g.button.releasePointerCapture(g.id)} catch {}
    }
    if(cancel || g.cancelled){
      nav.moveTo(lastSelection);
      return;
    }
    const released=nearest(e.clientX,g.points);
    const target=g.moved?released:g.index;
    if(nav.classList.contains('is-scrubbing'))nav.dataset.scrubPreview=String(target);
    if(tabs[target]?.dataset.view) onCommit(tabs[target].dataset.view);
    else nav.setCurrent(lastSelection);
    nav.moveTo(target,reduceMotion.matches);
  }

  nav.addEventListener('pointerup',e=>end(e));
  nav.addEventListener('pointercancel',e=>end(e,true));
  nav.addEventListener('lostpointercapture',e=>{if(gesture?.id===e.pointerId)end(e,true)});
  nav.addEventListener('click',e=>{
    // Keyboard-synthesized clicks have detail===0; never suppress them.
    if(performance.now()<blockClickUntil && e.detail!==0){
      e.preventDefault();
      e.stopImmediatePropagation();
      blockClickUntil=0;
    }
  },true);

  return {
    state:()=>({pressed:!!gesture,preview:gesture?.preview??null,
      current:nav.current,x:nav.x,moved:gesture?.moved??false,
      target:nav.target,stretch:nav.scrubStretch||0,
      direction:nav.scrubDirection||0,lift:nav.scrubLift||0}),
    cancel:()=>{if(gesture)end({pointerId:gesture.id},true)}
  };
}
