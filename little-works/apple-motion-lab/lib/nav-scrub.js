/**
 * Apple-like tab press-and-scrub behavior, layered on the installed Skill's
 * <lg-navbar> (createSpring + createGlass). Never re-implements the optics.
 *
 * Invariant: hover/drag is PREVIEW only. ARIA current + content commit on
 * pointer release. Native keyboard focus/click behavior remains available.
 */
export function installNavbarScrub(nav, {onCommit, onPressChange=()=>{}}={}) {
  if (!nav || typeof nav.xs?.set !== 'function' || typeof nav.setCurrent !== 'function')
    throw new Error('lg-navbar Skill component is required for press-and-scrub');
  const tabs = [...nav.querySelectorAll(':scope > button[data-view]')];
  if (tabs.length < 2) throw new Error('At least two navbar buttons are required');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let gesture = null;
  let blockClickUntil = 0;
  let lastSelection = nav.current ?? 0;

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
    nav.xs.set(desiredLeft,{immediate:true});
    const index=nearest(x,pts);
    if (gesture.preview!==index) {
      gesture.preview=index;
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
      moved:false,cancelled:false,pointerType:e.pointerType};
    lastSelection=nav.current;
    nav.classList.add('is-scrubbing');
    onPressChange(index);
    try { button.setPointerCapture(e.pointerId); } catch {}
    // Don't jump the lens on pointer-down. The selection gently lifts in place.
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
    nav.classList.remove('is-scrubbing');
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
      target:nav.target}),
    cancel:()=>{if(gesture)end({pointerId:gesture.id},true)}
  };
}
