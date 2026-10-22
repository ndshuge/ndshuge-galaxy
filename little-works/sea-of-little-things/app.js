(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('sea');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx || !window.GlassSea) {
    $('world-state').textContent = '这片海暂时无法绘制';
    return;
  }
  const TAU = Math.PI * 2;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sea = new GlassSea(4721);
  const sound = window.SeaSound ? new SeaSound() : null;
  const poems = window.SeaPoems || ['海很小，足够放下一次走神。'];
  const species = ['灯伞 · 一种透明的浮游想象', '游翼 · 把海水当作天空', '星种 · 尚未决定去往哪里'];
  const colors = [[146,217,210],[183,212,215],[238,198,139]];
  const modes = { tide:'缓慢的潮汐', orbit:'围绕彼此的星群', dream:'一场没有岸的梦' };
  let paused = reduced.matches;
  let quiet = false;
  let selected = null;
  let size = 0, radius = 1, cx = 0, cy = 0;
  let lastFrame = 0, accumulator = 0, frameId = 0;
  let lastHud = 0, lastPoem = 0, poemIndex = 0;
  let toastTimer = 0, pointer = null, lastTrailLight = 0;
  let busyImport = false;
  let downloadBusy = false;
  const FIXED_DT = 1 / 60;
  // The composed initial still has tails and a little history, even with motion reduced.
  for (let i = 0; i < 150; i++) sea.step(FIXED_DT);
  const dust = Array.from({ length: 320 }, (_, i) => {
    const a = hash(i * 9.71) * TAU;
    const r = Math.sqrt(hash(i * 3.14 + 8)) * .985;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: hash(i * 5.29 + 12), phase: hash(i + 2) * TAU };
  });

  function hash(n) { const h = Math.sin(n * 127.1 + 311.7) * 43758.5453; return h - Math.floor(h); }
  function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`; }
  function arc(x,y,r,start=0,end=TAU) { ctx.beginPath(); ctx.arc(x,y,Math.max(.01,r),start,end); }
  function toast(message) {
    $('toast').textContent = message;
    $('toast').dataset.show = 'true';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').dataset.show = 'false'; }, 3500);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    size = Math.max(1, bounds.width);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cx = cy = size / 2;
    radius = size * .435;
    draw();
  }

  function draw() {
    ctx.clearRect(0,0,size,size);
    const t = sea.time;
    drawVessel(t);
    ctx.save();
    arc(cx,cy,radius*.995); ctx.clip();
    drawWater(t);
    drawLights(t);
    // Sparse, curved filaments appear only around an observed resident.
    if (selected !== null) drawBonds();
    for (const e of sea.entities) drawCreature(e,t);
    ctx.restore();
    drawGlass(t);
    if (selected !== null) drawSelection();
  }

  function drawVessel(t) {
    const halo = ctx.createRadialGradient(cx,cy,radius*.75,cx,cy,radius*1.12);
    halo.addColorStop(0,'rgba(38,92,97,0)');
    halo.addColorStop(.74,'rgba(57,119,123,.06)');
    halo.addColorStop(.9,'rgba(82,133,135,.025)');
    halo.addColorStop(1,'rgba(7,20,25,0)');
    ctx.fillStyle=halo; arc(cx,cy,radius*1.12);ctx.fill();
    const bowl=ctx.createRadialGradient(cx-radius*.32,cy-radius*.35,0,cx,cy,radius);
    bowl.addColorStop(0,'#173a40'); bowl.addColorStop(.45,'#102f36'); bowl.addColorStop(.82,'#0c242d'); bowl.addColorStop(1,'#0a1d25');
    ctx.fillStyle=bowl;arc(cx,cy,radius);ctx.fill();
    ctx.save();ctx.translate(cx,cy);
    ctx.strokeStyle='rgba(149,197,191,.11)';ctx.lineWidth=.7;
    arc(0,0,radius*1.058);ctx.stroke();
    ctx.setLineDash([1,7]);ctx.strokeStyle='rgba(167,202,196,.14)';arc(0,0,radius*1.08);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<72;i++) {
      const a=i*TAU/72;
      const inner=i%6===0?1.019:1.031;
      const outer=i%6===0?1.043:1.041;
      ctx.strokeStyle=i%6===0?'rgba(174,206,199,.32)':'rgba(174,206,199,.12)';
      ctx.beginPath();ctx.moveTo(Math.cos(a)*radius*inner,Math.sin(a)*radius*inner);ctx.lineTo(Math.cos(a)*radius*outer,Math.sin(a)*radius*outer);ctx.stroke();
    }
    // A small travelling mark makes the glass read as an instrument, without rotating the whole world.
    const marker=t*.009-.8;
    ctx.fillStyle='rgba(229,193,141,.8)';arc(Math.cos(marker)*radius*1.058,Math.sin(marker)*radius*1.058,2);ctx.fill();
    ctx.restore();
  }

  function drawWater(t) {
    ctx.lineWidth=.45;
    for(let i=0;i<19;i++) {
      ctx.beginPath();
      for(let k=0;k<=80;k++) {
        const x=-1.1+k/80*2.2;
        const wave=Math.sin(x*3.1+i*.28+t*.025)*.055+Math.sin(x*6.2-i*.33+t*.019)*.018;
        const y=(i-9)*.096+wave;
        const px=cx+x*radius,py=cy+y*radius;
        if(k===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.strokeStyle=`rgba(107,165,166,${.018+.014*Math.sin(i*.7)**2})`;ctx.stroke();
    }
    for(const d of dust) {
      const twinkle=.5+.5*Math.sin(t*.38+d.phase);
      const drift=Math.sin(t*.027+d.phase)*.009;
      ctx.fillStyle=d.z>.85?`rgba(220,202,163,${.14+twinkle*.22})`:`rgba(133,190,188,${.07+d.z*.18})`;
      arc(cx+(d.x+drift)*radius,cy+d.y*radius,.35+d.z*.7);ctx.fill();
    }
    // Very broad caustic ribbons: hand-drawn water paths, not an animated gradient backdrop.
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-.48+Math.sin(t*.01)*.05);
    for(let i=0;i<5;i++) {
      ctx.beginPath();ctx.ellipse(radius*.1,(i-2)*radius*.22,radius*.88,radius*(.1+i*.012),0,0,TAU);
      ctx.strokeStyle=`rgba(147,201,187,${.011+i*.001})`;ctx.lineWidth=5+i*2;ctx.stroke();
    }
    ctx.restore();
  }

  function drawLights() {
    for(const light of sea.lights) {
      const x=cx+light.x*radius,y=cy+light.y*radius;
      const fade=Math.max(0,1-light.age/light.life);
      const r=radius*(.045+Math.min(light.age,3)*.04);
      const glow=ctx.createRadialGradient(x,y,0,x,y,r);
      glow.addColorStop(0,`rgba(238,195,130,${fade*.3})`);glow.addColorStop(.22,`rgba(227,184,121,${fade*.09})`);glow.addColorStop(1,'rgba(227,184,121,0)');
      ctx.fillStyle=glow;arc(x,y,r);ctx.fill();
      ctx.strokeStyle=`rgba(229,193,141,${fade*.25})`;ctx.lineWidth=.6;
      arc(x,y,Math.min(.22,.01+light.age*.028)*radius);ctx.stroke();
      ctx.fillStyle=`rgba(255,225,174,${fade*.9})`;arc(x,y,1.6);ctx.fill();
    }
  }

  function drawBonds() {
    for(const b of sea.bonds) {
      if(b.a!==selected&&b.b!==selected)continue;
      const a=sea.entities.find(e=>e.id===b.a),c=sea.entities.find(e=>e.id===b.b);
      if(!a||!c)continue;
      const ax=cx+a.x*radius,ay=cy+a.y*radius,bx=cx+c.x*radius,by=cy+c.y*radius;
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo((ax+bx)/2+8,(ay+by)/2-12,bx,by);
      ctx.strokeStyle='rgba(229,193,141,.2)';ctx.lineWidth=.65;ctx.setLineDash([2,5]);ctx.stroke();ctx.setLineDash([]);
    }
  }

  function drawCreature(e,t) {
    const col=colors[e.kind];
    const x=cx+e.x*radius,y=cy+e.y*radius;
    const featured=e.id%13===1;
    const s=Math.max(1.8,e.size*radius*(featured?2.8:1.45));
    const pulse=.92+Math.sin(e.phase+t*(e.kind===0?1.25:.8))*.13;
    if(e.trail.length>1) {
      ctx.beginPath();e.trail.forEach((p,i)=>{if(i===0)ctx.moveTo(cx+p.x*radius,cy+p.y*radius);else ctx.lineTo(cx+p.x*radius,cy+p.y*radius);});
      ctx.strokeStyle=rgba(col,featured?.16:.08);ctx.lineWidth=featured?1:.6;ctx.stroke();
    }
    const aura=ctx.createRadialGradient(x,y,0,x,y,s*3.7);
    aura.addColorStop(0,rgba(col,.075+e.glow*.04));aura.addColorStop(1,rgba(col,0));ctx.fillStyle=aura;arc(x,y,s*3.7);ctx.fill();
    ctx.save();ctx.translate(x,y);ctx.rotate(e.angle+Math.PI/2);
    ctx.lineWidth=featured?.75:.55;ctx.lineCap='round';
    if(e.kind===0) {
      // The umbrella opens in the direction of travel; the tentacles lag behind it.
      ctx.beginPath();ctx.moveTo(-s*pulse,0);
      ctx.bezierCurveTo(-s*1.05*pulse,-s*1.65,s*1.05*pulse,-s*1.65,s*pulse,0);
      ctx.quadraticCurveTo(s*.48,s*.4,0,s*.12);ctx.quadraticCurveTo(-s*.55,s*.4,-s*pulse,0);
      const shell=ctx.createLinearGradient(0,-s*1.2,0,s*.3);shell.addColorStop(0,rgba(col,.12));shell.addColorStop(.7,rgba(col,.025));shell.addColorStop(1,rgba(col,.17));
      ctx.fillStyle=shell;ctx.fill();ctx.strokeStyle=rgba(col,.55+e.glow*.18);ctx.stroke();
      for(let n=-2;n<=2;n++) {
        const z=n/2;ctx.beginPath();ctx.moveTo(z*s*.76,s*.1);
        for(let k=1;k<=16;k++) {const p=k/16;const sway=Math.sin(p*4+t*1.1+e.phase+n*.42)*s*.5*p;ctx.lineTo(z*s*.76+sway,s*.1+p*s*(3.5-Math.abs(z)*.8));}
        ctx.strokeStyle=rgba(col,.18+(.1-Math.abs(z)*.07));ctx.lineWidth=Math.abs(n)===0?.8:.45;ctx.stroke();
      }
      for(let n=-1;n<=1;n++){ctx.beginPath();ctx.moveTo(n*s*.56,0);ctx.quadraticCurveTo(n*s*.42,-s*.7,0,-s*1.08);ctx.strokeStyle=rgba(col,.13);ctx.lineWidth=.4;ctx.stroke();}
      ctx.fillStyle=rgba(col,.85);arc(0,-s*.26,Math.max(.6,s*.12));ctx.fill();
    } else if(e.kind===1) {
      const wing=Math.sin(e.phase+t*1.35)*s*.35;
      ctx.beginPath();ctx.moveTo(0,-s*.85);ctx.bezierCurveTo(s*.45,-s*.2,s*1.9,-s*.15-wing,s*1.8,s*.65-wing);ctx.quadraticCurveTo(s*.7,s*.12,0,s*.7);ctx.quadraticCurveTo(-s*.7,s*.12,-s*1.8,s*.65-wing);ctx.bezierCurveTo(-s*1.9,-s*.15-wing,-s*.45,-s*.2,0,-s*.85);
      ctx.fillStyle=rgba(col,.035);ctx.fill();ctx.strokeStyle=rgba(col,.43+e.glow*.15);ctx.lineWidth=.65;ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-s*.7);ctx.quadraticCurveTo(s*.2,s*.4,0,s*.7);ctx.bezierCurveTo(Math.sin(t+e.phase)*s,s*2.4,-s*.7,s*2.8,Math.sin(t*.7+e.phase)*s*.4,s*3.8);ctx.strokeStyle=rgba(col,.25);ctx.lineWidth=.6;ctx.stroke();
      ctx.fillStyle=rgba(col,.8);arc(0,-s*.15,Math.max(.65,s*.1));ctx.fill();
    } else {
      const glimmer=.65+Math.sin(e.phase+t*.8)*.2;
      const core=ctx.createRadialGradient(0,0,0,0,0,s*1.15);core.addColorStop(0,rgba(col,.8));core.addColorStop(.22,rgba(col,.25));core.addColorStop(1,rgba(col,0));ctx.fillStyle=core;arc(0,0,s*1.15);ctx.fill();
      for(let n=0;n<5;n++){const a=n*TAU/5+t*.09+e.phase;ctx.beginPath();ctx.moveTo(Math.cos(a)*s*.24,Math.sin(a)*s*.24);ctx.quadraticCurveTo(Math.cos(a+.35)*s*.8,Math.sin(a+.35)*s*.8,Math.cos(a+.2)*s*1.38,Math.sin(a+.2)*s*1.38);ctx.strokeStyle=rgba(col,glimmer*.55);ctx.lineWidth=.55;ctx.stroke();}
      ctx.fillStyle=rgba(col,.95);arc(0,0,Math.max(.75,s*.15));ctx.fill();
    }
    ctx.restore();
  }

  function drawGlass() {
    const edge=ctx.createLinearGradient(cx-radius,cy-radius,cx+radius,cy+radius);
    edge.addColorStop(0,'rgba(172,212,199,.48)');edge.addColorStop(.22,'rgba(117,183,185,.1)');edge.addColorStop(.48,'rgba(150,200,191,.16)');edge.addColorStop(.7,'rgba(214,192,146,.28)');edge.addColorStop(1,'rgba(106,160,164,.12)');
    ctx.lineWidth=1.05;ctx.strokeStyle=edge;arc(cx,cy,radius);ctx.stroke();
    ctx.strokeStyle='rgba(174,215,207,.055)';ctx.lineWidth=3;arc(cx,cy,radius*.985);ctx.stroke();
    ctx.strokeStyle='rgba(198,223,211,.22)';ctx.lineWidth=1.3;arc(cx,cy,radius*.991,Math.PI*1.13,Math.PI*1.38);ctx.stroke();
    ctx.strokeStyle='rgba(229,193,141,.12)';ctx.lineWidth=.6;arc(cx,cy,radius*.978,.3,.72);ctx.stroke();
  }

  function drawSelection() {
    const e=sea.entities.find(e=>e.id===selected);
    if(!e){selected=null;$('creature-label').hidden=true;return;}
    const x=cx+e.x*radius,y=cy+e.y*radius;
    ctx.strokeStyle='rgba(229,193,141,.6)';ctx.lineWidth=.65;arc(x,y,15,0,TAU);ctx.setLineDash([2,4]);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(x+17,y);ctx.lineTo(x+30,y-12);ctx.lineTo(x+47,y-12);ctx.strokeStyle='rgba(229,193,141,.4)';ctx.stroke();
    // Keep the DOM label inside the vessel on every size, without measuring on every frame.
    const label=$('creature-label');
    label.style.left=`${Math.max(8,Math.min(size-170,x+32))}px`;
    label.style.top=`${Math.max(10,Math.min(size-72,y-58))}px`;
  }

  function updateHud() {
    $('population').textContent=String(sea.entities.length);
    const seconds=Math.floor(sea.time);
    $('elapsed').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    $('seed-label').textContent=`SEED ${sea.seed}`;
    $('mode-caption').textContent=modes[sea.mode];
    $('world-state').textContent=paused?'时间停在这里':'海正在呼吸';
    $('pause').setAttribute('aria-pressed',String(paused));
    $('pause').setAttribute('aria-label',paused?'让时间继续':'暂停时间');
    $('pause-icon').innerHTML=paused?'<path d="m8 5 11 7-11 7V5Z"/>':'<path d="M8 5v14M16 5v14"/>';
    document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===sea.mode)));
  }

  function frame(now) {
    frameId=0;
    const delta=lastFrame?Math.min(.12,(now-lastFrame)/1000):0;
    lastFrame=now;
    if(!paused) {
      accumulator+=delta;
      let steps=0;
      while(accumulator>=FIXED_DT&&steps<7){sea.step(FIXED_DT);accumulator-=FIXED_DT;steps++;}
      draw();
      if(sea.time-lastPoem>22){poemIndex=(poemIndex+1)%poems.length;showPoem();lastPoem=sea.time;}
    }
    if(now-lastHud>500){updateHud();lastHud=now;}
    if(!paused&&!document.hidden)frameId=requestAnimationFrame(frame);
  }
  function schedule(){if(!frameId&&!paused&&!document.hidden){lastFrame=0;frameId=requestAnimationFrame(frame);}}
  function setPause(value,notify=false) {
    paused=Boolean(value);accumulator=0;
    if(paused&&frameId){cancelAnimationFrame(frameId);frameId=0;}
    updateHud();draw();schedule();
    if(notify)toast(paused?'时间停下了。海还在。':'这片海继续流动。');
  }
  function showPoem(){ $('poem').textContent=poems[poemIndex];$('poem-index').textContent=`${String(poemIndex+1).padStart(2,'0')} / ${poems.length}`; }
  function changeMode(mode) {sea.setMode(mode);sound?.setMode(mode);updateHud();draw();const lines={tide:'让潮水慢慢经过。',orbit:'这一次，绕着彼此走。',dream:'把夜晚调得轻一些。'};toast(lines[mode]);}
  function addLight(x,y,notify=false) {
    sea.addLight(x,y);sound?.touch(x,y,2);draw();updateHud();
    if(notify)toast(paused?'光留在这里。让时间继续，它们就会靠近。':'留下一点光，看看谁会过来。');
  }
  function randomLight(){const angle=hash(sea.time+sea.lights.length*13.7)*TAU;const r=.2+hash(sea.time*7.1+sea.entities.length)*.44;addLight(Math.cos(angle)*r,Math.sin(angle)*r,true);}

  function point(event){const rect=canvas.getBoundingClientRect();return{x:(event.clientX-rect.left-cx)/radius,y:(event.clientY-rect.top-cy)/radius};}
  function releasePointer(){sea.setPointer(0,0,false);pointer=null;}
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||pointer)return;
    const p=point(event);if(Math.hypot(p.x,p.y)>.99)return;
    pointer={id:event.pointerId,x:p.x,y:p.y,dragged:false};
    canvas.setPointerCapture(event.pointerId);sea.setPointer(p.x,p.y,true);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const p=point(event);
    if(Math.hypot(p.x-pointer.x,p.y-pointer.y)>.025)pointer.dragged=true;
    sea.setPointer(p.x,p.y,true);
    if(pointer.dragged&&performance.now()-lastTrailLight>260){addLight(p.x,p.y);lastTrailLight=performance.now();}
  });
  canvas.addEventListener('pointerup',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const p=point(event);const dragged=pointer.dragged;
    releasePointer();
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    if(!dragged) {
      const e=sea.pick(p.x,p.y,.052);
      if(e){selected=e.id;$('creature-name').textContent=e.name;$('creature-kind').textContent=species[e.kind];$('creature-label').hidden=false;sound?.touch(e.x,e.y,e.kind);draw();}
      else {selected=null;$('creature-label').hidden=true;addLight(p.x,p.y);}
    }
  });
  canvas.addEventListener('pointercancel',releasePointer);
  canvas.addEventListener('lostpointercapture',releasePointer);
  window.addEventListener('blur',releasePointer);
  $('unselect').addEventListener('click',()=>{selected=null;$('creature-label').hidden=true;draw();canvas.focus({preventScroll:true});});

  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>changeMode(button.dataset.mode)));
  $('light').addEventListener('click',randomLight);
  $('pause').addEventListener('click',()=>setPause(!paused,true));
  $('sound').addEventListener('click',async()=>{
    const button=$('sound');button.disabled=true;
    const wasEnabled=!!sound?.enabled;
    let enabled=false;
    try{enabled=sound?await sound.toggle():false;}catch{enabled=false;}
    button.setAttribute('aria-pressed',String(enabled));
    button.setAttribute('aria-label',enabled?'关闭声音':'开启声音');
    $('sound-label').textContent=enabled?'声音开启':'声音关闭';
    $('sound-waves').setAttribute('d',enabled?'M17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14':'m17 9 5 6m0-6-5 6');
    button.disabled=false;
    toast(enabled?'声音很轻。可以把音量留低一点。':wasEnabled?'声音已关闭。':'浏览器暂时无法播放声音，可以继续静静看海。');
  });
  function setQuiet(value) {
    quiet=value;document.body.dataset.quiet=String(value);$('return').hidden=!value;$('quiet').setAttribute('aria-pressed',String(value));
    document.querySelectorAll('.interface').forEach(element=>{element.inert=value;});
    if(value)$('return').focus({preventScroll:true});else $('quiet').focus({preventScroll:true});
  }
  $('quiet').addEventListener('click',()=>setQuiet(true));$('return').addEventListener('click',()=>setQuiet(false));
  $('new-sea').addEventListener('click',()=>{
    const seed=window.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Date.now()>>>0;
    sea.reset(seed);for(let i=0;i<150;i++)sea.step(FIXED_DT);
    selected=null;$('creature-label').hidden=true;releasePointer();sound?.setMode(sea.mode);lastPoem=sea.time;poemIndex=(poemIndex+1)%poems.length;showPoem();updateHud();draw();toast('另一片海，刚刚醒来。');
  });

  function openDialog(id){releasePointer();$(id).showModal();}
  $('about').addEventListener('click',()=>openDialog('about-dialog'));
  $('keepsake').addEventListener('click',()=>openDialog('keepsake-dialog'));
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();}}));

  function download(blob,name){
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function bottle() {
    const world=sea.snapshot();
    world.pointer={x:0,y:0,active:false};
    return {artwork:'sea-of-little-things',version:1,world};
  }
  $('save-world').addEventListener('click',()=>{
    try{download(new Blob([JSON.stringify(bottle())],{type:'application/json'}),`little-sea-${sea.seed}.json`);$('bottle-status').textContent='瓶子已交给浏览器保存。下次可以在这里打开。';}
    catch{$('bottle-status').textContent='这次没有保存成功，请再试一次。';}
  });
  $('save-image').addEventListener('click',async()=>{
    if(downloadBusy)return;downloadBusy=true;$('save-image').disabled=true;
    try{
      const card=document.createElement('canvas');card.width=1600;card.height=1800;const c=card.getContext('2d');
      c.fillStyle='#071419';c.fillRect(0,0,1600,1800);
      c.fillStyle='#a2b7b7';c.textAlign='center';c.font='20px "Segoe UI", "Microsoft YaHei", sans-serif';c.fillText('玻 璃 宇 宙  /  A SMALL, UNNECESSARY WORLD',800,104);
      c.drawImage(canvas,100,175,1400,1400);
      c.fillStyle='#e4ece7';c.font='62px "Songti SC", SimSun, serif';c.fillText('无 用 之 海',800,1552);
      c.fillStyle='#b5c8c5';c.font='26px "Songti SC", SimSun, serif';c.fillText(poems[poemIndex],800,1625);
      c.fillStyle='#9baead';c.font='17px Consolas, monospace';c.fillText(`SEED ${sea.seed}  /  ${modes[sea.mode]}  /  ${$('elapsed').textContent}`,800,1710);
      const blob=await new Promise(resolve=>card.toBlob(resolve,'image/png'));
      if(!blob)throw new Error('empty image');
      download(blob,`little-sea-${sea.seed}.png`);$('bottle-status').textContent='明信片已交给浏览器保存。';
    }catch{$('bottle-status').textContent='画面保存失败，请尝试装进瓶子。';}
    finally{downloadBusy=false;$('save-image').disabled=false;}
  });
  $('load-world').addEventListener('click',()=>{if(!busyImport)$('world-file').click();});
  $('world-file').addEventListener('change',async(event)=>{
    const file=event.target.files?.[0];if(!file||busyImport)return;
    busyImport=true;$('load-world').disabled=true;
    try{
      if(file.size>3*1024*1024)throw new Error('这只瓶子太大了，请选择 3 MB 以内的海洋文件。');
      const data=JSON.parse(await file.text());
      if(!data||typeof data!=='object'||data.artwork!=='sea-of-little-things'||data.version!==1||!data.world)throw new Error('这不是这片海保存的瓶子，请选择之前导出的 JSON 文件。');
      sea.restore(data.world);sea.setPointer(0,0,false);releasePointer();selected=null;$('creature-label').hidden=true;
      accumulator=0;lastFrame=0;lastPoem=sea.time;sound?.setMode(sea.mode);updateHud();draw();
      $('bottle-status').textContent='瓶子打开了。上次留下的海，仍在这里。';toast('上次的海，接上了今天的时间。');
    }catch(error){$('bottle-status').textContent=error instanceof SyntaxError?'瓶子里的文字无法读取，请选择完整的 JSON 文件。':error.message||'这只瓶子暂时打不开。';}
    finally{busyImport=false;$('load-world').disabled=false;event.target.value='';}
  });

  document.addEventListener('keydown',event=>{
    const tag=event.target.tagName;
    if(event.ctrlKey||event.metaKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(tag)||event.target.isContentEditable||document.querySelector('dialog[open]'))return;
    if(event.key==='Escape'){if(quiet)setQuiet(false);else{selected=null;$('creature-label').hidden=true;draw();}return;}
    if(event.code==='Space'&&!['BUTTON','A'].includes(tag)){event.preventDefault();if(!event.repeat)setPause(!paused,true);}
    else if(event.key.toLowerCase()==='g'&&!event.repeat){randomLight();}
    else if(event.key.toLowerCase()==='h'&&!event.repeat){setQuiet(!quiet);}
  });
  document.addEventListener('visibilitychange',()=>{
    releasePointer();lastFrame=0;accumulator=0;
    if(document.hidden){if(frameId){cancelAnimationFrame(frameId);frameId=0;}}else schedule();
  });
  reduced.addEventListener?.('change',event=>{if(event.matches)setPause(true);});
  window.addEventListener('pagehide',event=>{releasePointer();if(!event.persisted)sound?.dispose();if(frameId)cancelAnimationFrame(frameId);frameId=0;lastFrame=0;});
  window.addEventListener('pageshow',event=>{if(event.persisted){frameId=0;lastFrame=0;accumulator=0;schedule();}});
  if(window.ResizeObserver)new ResizeObserver(resize).observe($('vessel'));else window.addEventListener('resize',resize);
  showPoem();updateHud();resize();schedule();
  // Read-only observation surface for accessibility/QA; mutations stay with the real controls.
  window.seaObservation=Object.freeze({get state(){return{seed:sea.seed,mode:sea.mode,time:sea.time,paused,population:sea.entities.length,lights:sea.lights.length,selected,sound:!!sound?.enabled,quiet};}});
})();
