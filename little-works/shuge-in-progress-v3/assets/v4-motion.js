/* SHUGE V4 / original authored orchestration around GSAP 3.15.0 + ScrollTrigger. */
(() => {
  'use strict';
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)');
  const el = selector => document.querySelector(selector);
  const all = selector => Array.from(document.querySelectorAll(selector));
  const motionReady = !!(gsap && ScrollTrigger);
  const hasMotion = () => motionReady && !reduced.matches;
  const state = {engine: motionReady ? 'gsap' : 'fallback', version: motionReady ? gsap.version : 'unavailable', scrollTrigger:!!ScrollTrigger, menu:'closed', dialog:'closed', chapter:'top', scripts:'assets/v4-motion.js'};
  window.__shugeV4 = state;
  const svg=(d,c='') => '<svg class="icon-svg '+c+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+d+'</svg>';
  const icons={
    '↗':svg('<path d="M5 19 19 5M8 5h11v11"/>'),
    '↘':svg('<path d="M5 5 19 19M19 8v11H8"/>'),
    '↑':svg('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    '×':svg('<path d="M5 5 19 19M19 5 5 19"/>','icon-close'),
    '+':svg('<path d="M12 4v16M4 12h16"/>'),
    '−':svg('<path d="M4 12h16"/>')
  };
  // Icon geometry is independent of local font/Emoji fallback.
  all('[aria-hidden="true"]').forEach(node => {
    if(node.childElementCount === 0 && icons[node.textContent.trim()])node.innerHTML=icons[node.textContent.trim()];
  });
  const backTop=el('.footer-head a'); if(backTop && backTop.textContent.trim()==='↑')backTop.innerHTML=icons['↑'];
  all('.year-plus').forEach(x=>{if(icons[x.textContent.trim()])x.innerHTML=icons[x.textContent.trim()]});
  const menuButton=el('#menuButton'),menu=el('#mobileMenu');
  if(menuButton){
    menuButton.innerHTML=svg('<path d="M4 8h16M4 16h16"/>','menu-icon');
    menuButton.setAttribute('aria-label','打开导航菜单');
  }
  const hero=el('#heroHeading');
  if(hero){
    const raw=hero.textContent.trim();
    hero.setAttribute('aria-label',raw);
    hero.innerHTML='<span class="hero-word" aria-hidden="true">'+Array.from(raw).map(c=>'<span class="hero-letter">'+c+'</span>').join('')+'</span>';
  }
  // Provide truly distinct mobile touch sizes, not just hover emulation.
  if(motionReady){
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({overwrite:'auto'});
  }

  const pressable='button, .hero-action, .desktop-nav a, .mobile-menu a, .hero-bottom-note a, .footer-head a';
  if(motionReady){
    document.addEventListener('pointerdown', e => {
      const target=e.target.closest(pressable);
      if(!target || target.closest('.project-dialog') && target===el('#projectDialog'))return;
      if(!hasMotion())return;
      gsap.to(target,{scale:.965,duration:.13,ease:'power2.out',overwrite:true});
    },{passive:true});
    const release=e=>{
      const target=e.target?.closest?.(pressable);
      if(!target||!hasMotion())return;
      gsap.to(target,{scale:1,duration:.5,ease:'elastic.out(1,.64)',overwrite:true});
    };
    document.addEventListener('pointerup',release,{passive:true});
    document.addEventListener('pointercancel',release,{passive:true});
    document.addEventListener('pointerleave', e => { if(e.target?.matches?.(pressable))release(e) },true);
  }

  // Menu controls are intercepted in the capture phase to avoid V3 instantaneous hide.
  function setMenu(open, returnFocus=false){
    if(!menu||!menuButton)return;
    const was=state.menu;
    state.menu=open?'open':'closed';
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open?'关闭导航菜单':'打开导航菜单');
    document.body.classList.toggle('menu-visible',open);
    const icon=menuButton.querySelector('svg');
    if(icon)icon.innerHTML=open?'<path d="M5 5 19 19M19 5 5 19"/>':'<path d="M4 8h16M4 16h16"/>';
    if(!hasMotion()){
      menu.hidden=!open;
      if(returnFocus)menuButton.focus();
      return;
    }
    gsap.killTweensOf(menu);
    if(open){
      if(menu.hidden){menu.hidden=false;gsap.set(menu,{autoAlpha:1,y:-10,clipPath:'inset(0 0 100% 0)'})}
      gsap.to(menu,{autoAlpha:1,y:0,clipPath:'inset(0 0 0% 0)',duration:.44,ease:'power3.out',overwrite:true});
    }else if(!menu.hidden){
      gsap.to(menu,{autoAlpha:1,y:-11,clipPath:'inset(0 0 100% 0)',duration:.24,ease:'power2.inOut',overwrite:true,onComplete:()=>{
        if(state.menu==='closed'){menu.hidden=true;gsap.set(menu,{clearProps:'all'})}
      }});
    }
    if(returnFocus)menuButton.focus();
  }
  if(menuButton&&menu){
    menuButton.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();setMenu(state.menu!=='open')},true);
    all('#mobileMenu a').forEach(a=>a.addEventListener('click',()=>setMenu(false),true));
    document.addEventListener('keydown',e=>{if(e.key==='Escape' && state.menu==='open'){e.preventDefault();e.stopImmediatePropagation();setMenu(false,true)}},true);
    window.addEventListener('resize',()=>{if(innerWidth>800 && state.menu==='open')setMenu(false)}, {passive:true});
  }

  const dialog=el('#projectDialog'),dialogClose=el('#dialogClose');
  let modalOrigin=null;
  const oldOpenProject=typeof openProject==='function' ? openProject : null;
  function showProject(key,source){
    if(!dialog || !oldOpenProject)return;
    modalOrigin=source||null;
    if(!dialog.open)oldOpenProject(key,source);
    if(!hasMotion()){state.dialog='open';return}
    dialog.getAnimations().forEach(animation=>animation.cancel());
    gsap.killTweensOf(dialog);
    const src=source?.getBoundingClientRect();
    const dest=dialog.getBoundingClientRect();
    const scale=src?Math.max(.65,Math.min(.93,src.width/Math.max(1,dest.width))):.93;
    const x=src ? src.left+src.width/2-(dest.left+dest.width/2):0;
    const y=src ? src.top+src.height/2-(dest.top+dest.height/2):25;
    state.dialog='opening';
    gsap.fromTo(dialog,{x,y,scale,autoAlpha:.76,rotateX:2,transformOrigin:'50% 50%'},{
      x:0,y:0,scale:1,autoAlpha:1,rotateX:0,duration:.63,ease:'power4.out',overwrite:true,
      onComplete:()=>{state.dialog='open';gsap.set(dialog,{clearProps:'transform,opacity,visibility'})}
    });
  }
  function dismissDialog(){
    if(!dialog?.open || state.dialog==='closing')return;
    state.dialog='closing';
    if(!hasMotion()){dialog.close();return}
    gsap.killTweensOf(dialog);
    const src=modalOrigin?.getBoundingClientRect(),dest=dialog.getBoundingClientRect();
    const scale=src?Math.max(.68,Math.min(.91,src.width/Math.max(1,dest.width))):.93;
    const x=src?src.left+src.width/2-(dest.left+dest.width/2):0;
    const y=src?src.top+src.height/2-(dest.top+dest.height/2):15;
    gsap.to(dialog,{x,y,scale,autoAlpha:.38,duration:.3,ease:'power2.inOut',overwrite:true,
      onComplete:()=>{dialog.close();gsap.set(dialog,{clearProps:'transform,opacity,visibility'});state.dialog='closed'}
    });
  }
  if(dialog){
    document.addEventListener('click',e=>{
      const b=e.target.closest('[data-open]');
      if(!b)return;
      e.preventDefault();e.stopImmediatePropagation();
      showProject(b.dataset.open,b);
    },true);
    if(dialogClose)dialogClose.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();dismissDialog()},true);
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;e.preventDefault();e.stopImmediatePropagation();dismissDialog()},true);
    dialog.addEventListener('cancel',e=>{e.preventDefault();dismissDialog()},true);
    dialog.addEventListener('close',()=>{state.dialog='closed';gsap?.killTweensOf(dialog)},true);
  }

  // Reversible accordion, measuring from its current frame. Existing V3 handler is superseded.
  const year=el('#yearTrigger'),details=el('#yearDetails');
  function toggleYear(){
    if(!year||!details)return;
    const opening=year.getAttribute('aria-expanded')!=='true';
    year.setAttribute('aria-expanded',String(opening));
    const sign=year.querySelector('.year-plus');
    if(sign)sign.innerHTML=opening?icons['−']:icons['+'];
    if(!hasMotion()){details.hidden=!opening;details.style.height='';return}
    gsap.killTweensOf(details);
    if(opening){
      if(details.hidden){details.hidden=false;gsap.set(details,{height:0,opacity:.75})}
      gsap.to(details,{height:details.scrollHeight,opacity:1,duration:.48,ease:'power3.out',overwrite:true,onComplete:()=>{if(year.getAttribute('aria-expanded')==='true')gsap.set(details,{clearProps:'height,opacity'})}});
    }else{
      if(details.hidden)return;
      gsap.set(details,{height:details.getBoundingClientRect().height,overflow:'hidden'});
      gsap.to(details,{height:0,opacity:.5,duration:.3,ease:'power2.inOut',overwrite:true,onComplete:()=>{if(year.getAttribute('aria-expanded')==='false'){details.hidden=true;gsap.set(details,{clearProps:'height,opacity,overflow'})}}});
    }
    if(ScrollTrigger)requestAnimationFrame(()=>ScrollTrigger.refresh());
  }
  if(year&&details){
    year.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();toggleYear()},true);
  }

  // Keep the art-to-story relationship actionable on touch and keyboard.
  all('.project-item .project-cover').forEach(cover=>{
    const item=cover.closest('[data-kind]'), key=item?.dataset.kind;
    if(!key)return;
    const name=item.querySelector('.project-info h3')?.textContent?.trim()||key;
    cover.setAttribute('role','button');cover.setAttribute('tabindex','0');
    cover.setAttribute('aria-label','打开'+name+'的项目故事');
    cover.style.cursor='pointer';
    cover.addEventListener('click',()=>showProject(key,cover));
    cover.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showProject(key,cover)}});
  });
  // Interruptible note-paper replacement; no opacity jump on repeated selection.
  const noteSheet=el('#nowSheet'),noteText=el('#nowText'),noteFoot=el('#nowFoot');
  let noteRevision=0;
  all('.now-tab').forEach(tab=>tab.addEventListener('click',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(tab.getAttribute('aria-pressed')==='true')return;
    all('.now-tab').forEach(t=>{t.classList.toggle('active',t===tab);t.setAttribute('aria-pressed',String(t===tab))});
    const data=(typeof notes!=='undefined')?notes[tab.dataset.note]:null;
    if(!data||!noteText||!noteFoot||!noteSheet)return;
    const revision=++noteRevision;
    if(!hasMotion()){noteText.textContent=data[0];noteFoot.textContent=data[1];return}
    gsap.killTweensOf(noteSheet);
    gsap.to(noteSheet,{y:5,autoAlpha:.55,duration:.14,ease:'power2.inOut',overwrite:true,onComplete:()=>{
      if(revision!==noteRevision)return;
      noteText.textContent=data[0];noteFoot.textContent=data[1];
      gsap.fromTo(noteSheet,{y:10,autoAlpha:.62},{y:0,autoAlpha:1,duration:.4,ease:'power3.out',overwrite:true});
    }});
  },true));

  // A single longitudinal motion grammar: typography, ink aperture, paper passage.
  if(motionReady){
    const mm=gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)',()=>{
      let ctx=gsap.context(()=>{
        const letters=all('.hero-letter');
        const timeline=gsap.timeline({defaults:{ease:'power4.out'},onComplete:()=>gsap.set(letters,{clearProps:'willChange'})});
        timeline.fromTo(letters,{yPercent:135,autoAlpha:.15,rotate:2},{yPercent:0,autoAlpha:1,rotate:0,duration:.95,stagger:.052},.11)
          .fromTo('.hero-top-note',{autoAlpha:0,y:22},{autoAlpha:1,y:0,duration:.78},.24)
          .fromTo('.hero-bottom-note',{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.78},.55);
        gsap.to('.hero-word',{yPercent:-15,scale:.96,transformOrigin:'center 55%',ease:'none',scrollTrigger:{trigger:'.hero.hero-type',start:'top top',end:'bottom top',scrub:true}});
        gsap.fromTo('.signal-scene .hero-instrument',{clipPath:'inset(5% 4% 5% 4%)',scale:.985},{clipPath:'inset(0% 0% 0% 0%)',scale:1,ease:'none',scrollTrigger:{trigger:'#signal',start:'top 95%',end:'top 27%',scrub:true}});
        const subheads=all('#signalHeading,#manifestoHeading,#selectedHeading,#lifeHeading,#yearsHeading,#nowHeading');
        subheads.forEach(h=>{
          gsap.fromTo(h,{y:32,autoAlpha:.7},{y:0,autoAlpha:1,ease:'none',scrollTrigger:{trigger:h,start:'top 95%',end:'top 58%',scrub:true}});
        });
        all('.project-item').forEach((item,i)=>{
          const cover=item.querySelector('.project-cover'),info=item.querySelector('.project-info');
          if(cover)gsap.fromTo(cover,{clipPath:'inset(6% 0 6% 0)',y:35},{clipPath:'inset(0% 0 0% 0)',y:0,ease:'none',scrollTrigger:{trigger:item,start:'top 94%',end:'top 27%',scrub:true}});
          if(info)gsap.fromTo(info,{y:25,autoAlpha:.72},{y:0,autoAlpha:1,ease:'none',scrollTrigger:{trigger:info,start:'top 98%',end:'top 65%',scrub:true}});
        });
        all('.life-panel').forEach((panel,i)=>{
          const art=panel.querySelector('.life-art');
          if(art)gsap.fromTo(art,{yPercent:5,scale:1.045},{yPercent:-4,scale:1,ease:'none',scrollTrigger:{trigger:panel,start:'top bottom',end:'bottom top',scrub:true}});
        });
        const ids=['signal','selected','life','years','now'];
        ids.forEach(id=>ScrollTrigger.create({trigger:'#'+id,start:'top 38%',end:'bottom 38%',onToggle:self=>{
          if(!self.isActive)return;
          state.chapter=id;
          all('.desktop-nav a').forEach(a=>{a.getAttribute('href')==='#'+id?a.setAttribute('aria-current','location'):a.removeAttribute('aria-current')});
        }}));
      });
      return ()=>{ctx.revert();gsap.set('.hero-word,.hero-top-note,.hero-bottom-note,.project-cover,.project-info,.life-art,#signalHeading,#manifestoHeading,#selectedHeading,#lifeHeading,#yearsHeading,#nowHeading',{clearProps:'transform,opacity,visibility,clipPath'})};
    });
    // responsive animation lifecycle is handled by GSAP matchMedia cleanup.
    state.motionSystems=['gsap.timeline','gsap.to','gsap.fromTo','ScrollTrigger','gsap.matchMedia'];
  }else{
    state.motionSystems=[];
  }

  if(reduced.addEventListener){
    reduced.addEventListener('change',()=> {
      if(reduced.matches&&motionReady){
        gsap.killTweensOf([menu,dialog,details,...all(pressable)]);
        gsap.set([menu,dialog,details].filter(Boolean),{clearProps:'transform,opacity,visibility,clipPath'});
        if(menu&&state.menu==='closed')menu.hidden=true;
      }
      if(ScrollTrigger)ScrollTrigger.refresh(true);
    });
  }
  state.ready=true;
  document.documentElement.dataset.v4='ready';
})();
