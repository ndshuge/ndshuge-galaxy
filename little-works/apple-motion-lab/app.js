import './lib/components.js';
import { createGlassRenderer } from './lib/glass-webgl.js';
import { engine as svgEngine } from './lib/liquid-glass.js';
import { animate, motionValue } from './vendor/motion.js';
import { installNavbarScrub } from './lib/nav-scrub.js';

const $ = (id) => document.getElementById(id);
const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp = (a,b,p)=>a+(b-a)*p;
const tracks=[
 {title:'Afterlight',artist:'Motion Lab Originals',duration:192,freq:[174.61,261.63,349.23]},
 {title:'Slow Orbit',artist:'Motion Lab Originals',duration:168,freq:[146.83,220.0,293.66]},
 {title:'Daybreak',artist:'Motion Lab Originals',duration:206,freq:[196.0,293.66,392.0]}
];
let trackIndex=0, playing=false, currentTime=0, lastStamp=0;
let audio=null, gain=null, oscillators=[], renderer=null, gpuReady=false, gpuRenders=0, glError='', quality='auto', pointerActive=false;
let rect={w:innerWidth,h:innerHeight}, geometry={};
let dockTopCache=null, layoutReads=0;
const player=$('player'),scrim=$('scrim'),art=$('artwork'),info=document.querySelector('.song-info'),controls=document.querySelector('.full-controls');
const miniActions=document.querySelector('.mini-actions'), navWrap=$('navWrap'), source=$('artSource'), glCanvas=$('artGL');
const progress=motionValue(0);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const lowTransparency=matchMedia('(prefers-reduced-transparency: reduce)');
const highContrast=matchMedia('(prefers-contrast: more)');
const travelState={drag:false,last:0,start:0,px:0,t:0,pressedAt:0,velocity:0,gesture:false,pointerId:null};
let frames=0, measuredFps=0, fpsWindow=performance.now();
function viewport(){const w=innerWidth,h=innerHeight;const bottom=Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom'))||0;return {w,h,bottom};}
function getRects(){
 const {w,h}=viewport();
 const miniW = w>650?Math.min(450,w-36):w-24;
 const miniH=68;
 // Get the actual dock geometry so iPhone Safari bottom safe-area insets cannot cause overlap.
 const dockTop = dockTopCache ?? (dockTopCache=navWrap.getBoundingClientRect().top,layoutReads++);
 const fallbackY = h-(w>900?20:12)-74-12;
 const miniY = (dockTop>h*.45?dockTop:fallbackY)-12-miniH;
 return { mini:{x:(w-miniW)/2,y:miniY,w:miniW,h:miniH,r:20}, full:{x:0,y:0,w,h,r:0}};
}
function render(p){
 p=clamp(p);const {mini,full}=getRects();
 const w=lerp(mini.w,full.w,p),h=lerp(mini.h,full.h,p),x=lerp(mini.x,full.x,p),y=lerp(mini.y,full.y,p),r=lerp(mini.r,full.r,p);
 player.style.left=x+'px';player.style.top=y+'px';player.style.width=w+'px';player.style.height=h+'px';player.style.borderRadius=r+'px';player.style.setProperty('--p',p.toFixed(4));
 player.style.touchAction=p>.6?'none':'none';
 // R2: a single album geometry drives both endpoints; never duplicate the cover.
 const artworkSize=Math.min(full.w*.82,full.h*.342,360);
 const aSize=lerp(54,artworkSize,p);
 const aX=lerp(9,(w-aSize)/2,p);
 const aY=lerp(7,Math.max(66,Math.min(99,full.h*.105)),p);
 art.style.left=aX+'px';art.style.top=aY+'px';art.style.width=aSize+'px';art.style.height=aSize+'px';art.style.borderRadius=lerp(9,12,p)+'px';
 const infoX=lerp(74,(w-aSize)/2,clamp(p*1.7));
 const infoY=lerp(14,aY+aSize+20,clamp(p*1.75));
 // Hide shared copy while the album expands through its former position.
 const infoVisibility=p<.04?1:p<.15?1-(p-.04)/.11:p<.58?0:clamp((p-.58)/.32);
 info.style.opacity=String(infoVisibility);
 info.style.left=infoX+'px';info.style.top=infoY+'px';
 info.style.width=Math.max(85,lerp(w-198,aSize,clamp(p*1.7)))+'px';
 controls.style.bottom='auto';
 const controlsTop=aY+aSize+Math.max(82,Math.min(103,full.h*.105));
 controls.style.top=controlsTop+'px';
 const controlVisibility=clamp((p-.64)/.30);
 // The bundled WebGL shader is intended for a fixed canvas rectangle. During
 // geometry interpolation, use the original sharp artwork (not a stretched stale GPU frame).
 // GPU refraction fades back in only when the destination geometry is stable.
 const opticalMix=(p<.10)?1:clamp((p-.90)/.09);
 glCanvas.style.opacity=String(opticalMix);
 $('artFallback').style.visibility=gpuReady && quality==='auto' && (p<.10 || p>.99)?'hidden':'visible';
 controls.style.opacity=String(controlVisibility);
 controls.style.pointerEvents=p>.85?'auto':'none';
 miniActions.style.opacity=String(clamp(1-p*5));
 $('glowButton').style.opacity=String(clamp((p-.74)/.20));
 miniActions.style.pointerEvents=p<.2?'auto':'none';
 scrim.style.opacity=String(p*.84);
 scrim.style.pointerEvents=p>.8?'auto':'none';
 navWrap.style.opacity=String(clamp(1-p*2));
 navWrap.style.pointerEvents=p>.45?'none':'auto';
 player.dataset.state=p>.85?'full':p<.12?'mini':'transition';
 player.setAttribute('aria-modal',p>.85?'true':'false');
 geometry={p,x,y,w,h,r,artX:aX,artY:aY,artSize:aSize,infoY,controlsTop,infoVisibility,controlVisibility};
 // GPU source texture upload is expensive on mobile: render only at endpoint size changes.
 if(gpuReady&&quality==='auto'&&!pointerActive&&(p>.998||p<.01)&&Math.abs(aSize-lastGPUsize)>2){drawGPU();}
}
progress.on('change',render);
function settle(target,velocity=0){
 target=clamp(target);
 if(reduced.matches){progress.set(target);return;}
 // MotionValue retargeting automatically cancels the prior spring and retains its presentation value.
 // Critically damped candidate, measured against R1, not claimed as Apple's private parameters.
 animate(progress,target,{type:'spring',stiffness:500,damping:41,mass:1,velocity,restSpeed:.02,restDelta:.001});
}
function startGesture(e){
 if(e.button!=null&&e.button!==0)return;
 if(e.target.closest('button,input,lg-segmented'))return;
 if(progress.get()>.14 && !e.target.closest('.player-handle,.artwork'))return;
 if(e.pointerType==='mouse'&&!e.target.closest('.artwork,.player-handle')&&progress.get()>.7)return;
 progress.stop();
 travelState.drag=true;travelState.pointerId=e.pointerId;travelState.last=e.clientY;travelState.start=e.clientY;
 travelState.px=progress.get();travelState.t=performance.now();travelState.pressedAt=travelState.t;travelState.velocity=0;travelState.gesture=false;
 player.setPointerCapture(e.pointerId);pointerActive=true;
}
function moveGesture(e){
 if(!travelState.drag || e.pointerId!==travelState.pointerId)return;
 const dy=e.clientY-travelState.start;
 if(Math.abs(dy)>7) travelState.gesture=true;
 const now=performance.now(),dt=Math.max(8,now-travelState.t);
 const next=clamp(travelState.px-dy/Math.max(280,innerHeight*.64));
 const instantVelocity=(travelState.last-e.clientY)/Math.max(.008,dt/1000)/Math.max(280,innerHeight*.64);
 travelState.velocity=lerp(travelState.velocity,instantVelocity,dt>50?.75:.38);
 travelState.last=e.clientY;travelState.t=now;progress.set(next);
 if(e.cancelable)e.preventDefault();
}
function finishGesture(e,cancel=false){
 if(!travelState.drag || e.pointerId!==travelState.pointerId)return;
 travelState.drag=false;pointerActive=false;
 if(player.hasPointerCapture(e.pointerId))player.releasePointerCapture(e.pointerId);
 const p=progress.get(),idleMs=performance.now()-travelState.t;
 const decay=idleMs<65?1:Math.exp(-(idleMs-65)/48);
 const v=clamp(travelState.velocity*decay,-3,3);
 // Project the release velocity into the immediate future, then choose the nearest well.
 const projected=clamp(p+v*.16);
 // Tap/long-hold on expanded album does not unexpectedly dismiss the player.
 const target=cancel?(travelState.px>.5?1:0):(!travelState.gesture?1:(projected>.51?1:0));
 settle(target, v);
}
player.addEventListener('pointerdown',startGesture);
player.addEventListener('pointermove',moveGesture);
player.addEventListener('pointerup',e=>finishGesture(e));
player.addEventListener('pointercancel',e=>finishGesture(e,true));
player.addEventListener('lostpointercapture',e=>{if(travelState.drag)finishGesture(e,true)});
function open(){settle(1)}function close(){settle(0)}
$('heroOpen').addEventListener('click',open);$('sidebarOpen').addEventListener('click',open);
$('expandMini').addEventListener('click',open);$('collapseButton').addEventListener('click',close);
scrim.addEventListener('click',close);
addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='ArrowUp'&&document.activeElement===document.body)open();if(e.key==='ArrowDown'&&document.activeElement===document.body)close()});
function showMessage(message){$('labIndicator').textContent=message;$('labIndicator').classList.add('visible');clearTimeout(showMessage.timer);showMessage.timer=setTimeout(()=>$('labIndicator').classList.remove('visible'),2600)}
function format(seconds){seconds=Math.max(0,Math.floor(seconds));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
function showTrack(){
 const t=tracks[trackIndex];$('songTitle').textContent=t.title;$('songArtist').textContent=t.artist;
 $('seek').max=t.duration;$('seek').value=currentTime;$('elapsed').textContent=format(currentTime);$('remaining').textContent='−'+format(t.duration-currentTime);
 document.querySelectorAll('[data-track]').forEach((el,i)=>el.classList.toggle('selected',i===trackIndex));
 if(oscillators.length){const now=audio.currentTime;oscillators.forEach((osc,i)=>osc.frequency.setTargetAtTime(t.freq[i],now,.4));}
}
function setTrack(i){trackIndex=(i+tracks.length)%tracks.length;currentTime=0;showTrack();showMessage(tracks[trackIndex].title);}
document.querySelectorAll('[data-track]').forEach((el)=>el.addEventListener('click',()=>{setTrack(Number(el.dataset.track));open()}));
$('prev').addEventListener('click',()=>setTrack(trackIndex-1));$('next').addEventListener('click',()=>setTrack(trackIndex+1));
function createAudio(){
 if(audio)return;
 const AudioCtor=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtor){showMessage('此浏览器不支持 Web Audio');return;}
 audio=new AudioCtor();gain=audio.createGain();gain.gain.value=0;gain.connect(audio.destination);
 tracks[trackIndex].freq.forEach((f,i)=>{
  const osc=audio.createOscillator();osc.type=['sine','triangle','sine'][i];osc.frequency.value=f;
  const v=audio.createGain();v.gain.value=[.27,.10,.15][i];osc.connect(v);v.connect(gain);osc.start();oscillators.push(osc);
 });
}
function updateTransport(){
 for(const id of ['playMini','playFull']){const btn=$(id),use=btn.querySelector('use');use.setAttribute('href',playing?'#i-pause':'#i-play');btn.setAttribute('aria-label',playing?'暂停':'播放');}
}
function toggleAudio(){
 if(!audio)createAudio();
 if(!audio)return;audio.resume();
 playing=!playing;gain.gain.setTargetAtTime(playing?Number($('volume').value)/100*.095:0,audio.currentTime,.04);updateTransport();
 lastStamp=performance.now();if(playing)requestAnimationFrame(tick);
}
function tick(now){if(!playing)return;const dt=Math.min(1,(now-lastStamp)/1000);lastStamp=now;currentTime+=dt;if(currentTime>=tracks[trackIndex].duration){setTrack(trackIndex+1)}
 $('seek').value=currentTime;$('elapsed').textContent=format(currentTime);$('remaining').textContent='−'+format(tracks[trackIndex].duration-currentTime);
 requestAnimationFrame(tick);
}
$('playMini').addEventListener('click',toggleAudio);$('playFull').addEventListener('click',toggleAudio);
$('seek').addEventListener('input',e=>{currentTime=Number(e.target.value);showTrack()});
$('volume').addEventListener('input',e=>{if(audio)gain.gain.setTargetAtTime(playing?Number(e.target.value)/100*.095:0,audio.currentTime,.03)});
function viewChange(view){
 const pages={listen:['让声音','有形。','滑动不是切换，而是一种连续的触感。打开播放器，然后试着在动画中途改变方向。'],
 discover:['发现','另一面。','三段独立合成的声音风景。轻点列表中的曲目，观看共用画面怎样被唤起。'],
 library:['收藏','每一刻。','这是一个不连接帐号的本地实验。所有播放、动画与光学实验都在你的浏览器里发生。']};
 if(!pages[view])return;
 const [a,b,c]=pages[view];
 document.querySelector('.intro h1').innerHTML=a+'<br><i>'+b+'</i>';
 document.querySelector('.intro-desc').textContent=c;
 document.querySelectorAll('.side-link').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
 const navbar=$('navigation');navbar?.setCurrent?.(['listen','discover','library'].indexOf(view));
 animate(document.querySelector('.intro'),{opacity:[.78,1],y:[7,0]},{duration:.35,ease:'easeOut'});
}
document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>viewChange(el.dataset.view)));
// R2.1 press-and-scrub uses the Skill's real refractive indicator and native spring.
const navButtons=[...document.querySelectorAll('#navigation > button')];
const tabPress=new WeakMap();
function scaleTab(index){
 navButtons.forEach((btn,i)=>{
  tabPress.get(btn)?.stop();
  tabPress.set(btn,animate(btn,{scale:i===index?.94:1},{
   type:'spring',stiffness:i===index?650:560,damping:i===index?43:32
  }));
 });
}
navButtons.forEach((btn,index)=>{
 btn.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' ')scaleTab(index);
 });
 btn.addEventListener('keyup',e=>{
  if(e.key==='Enter'||e.key===' ')scaleTab(-1);
 });
 btn.addEventListener('blur',()=>scaleTab(-1));
});
const navScrub=installNavbarScrub($('navigation'),{
 onCommit:viewChange,
 onPressChange:scaleTab
});

function sampleFps(now){frames++;if(now-fpsWindow>=1200){measuredFps=Math.round(frames*1000/(now-fpsWindow));frames=0;fpsWindow=now;}requestAnimationFrame(sampleFps)}requestAnimationFrame(sampleFps);
let lens={x:40,y:40,width:100,height:100,radius:50,refraction:10,bezel:.55,curvature:4,chroma:.055,specular:.24,specularWidth:1.2};
let artW=200,artH=200,lastDraw=0,lastGPUsize=0;
function drawGPU(x=null,y=null){
 if(!renderer || quality!=='auto')return;
 artW=glCanvas.clientWidth;artH=glCanvas.clientHeight;
 if(artW<1||artH<1)return;
 renderer.updateLens(0,{x:x==null?(artW-100)/2:x,y:y==null?(artH-100)/2:y});
 renderer.render();gpuRenders++;lastDraw=performance.now();lastGPUsize=artW;
}
function initGraphics(){
 const img=new Image();img.onload=()=>{
  const ctx=source.getContext('2d',{willReadFrequently:false});ctx.drawImage(img,0,0,720,720);
  try{
   renderer=createGlassRenderer(glCanvas,source,{pixelRatio:1});
   renderer.setLenses([lens]);gpuReady=true;player.dataset.gpu='ok';drawGPU();
   $('engineLabel').textContent='WebGL + SVG · 已启用';
   $('qualityMessage').textContent='GPU 折射正在运行；Safari 无 WebGL 时自动回退。';
  }catch(e){glError=String(e);gpuReady=false;player.dataset.gpu='fail';$('engineLabel').textContent='L1 静态降级';$('qualityMessage').textContent='GPU 不可用，已显示原始封面。'}
 };
 img.onerror=()=>{glError='cover.svg load failed';player.dataset.gpu='fail';$('qualityMessage').textContent='图像加载失败：已启用 CSS 封面回退。';};
 img.src='./cover.svg';
}

art.addEventListener('pointermove',e=>{
 if(!gpuReady || quality!=='auto'||pointerActive||progress.get()<.98||performance.now()-lastDraw<70)return;
 const rc=art.getBoundingClientRect();
 drawGPU(clamp(e.clientX-rc.left-50,0,Math.max(0,rc.width-100)),clamp(e.clientY-rc.top-50,0,Math.max(0,rc.height-100)));
});
// R2: no idle WebGL polling; the Skill renderer runs on size endpoints and direct pointer input.
const qualityControl=$('quality');
qualityControl.addEventListener('change',e=>{
 quality=e.detail?.value||qualityControl.value||'auto';
 const enabled=gpuReady&&quality==='auto';
 player.dataset.gpu=enabled?'ok':'off';
 if(enabled)drawGPU();
 $('qualityMessage').textContent=enabled?'L2 · WebGL 真实折射运行中':quality==='lite'?'L1 · 使用原始封面，暂停 GPU 折射':'L1 · GPU 当前不可用';
});
$('glowButton').addEventListener('click',()=>showMessage('折射引擎：'+(gpuReady?'WebGL · '+svgEngine:'L1 fallback')));
const resize=()=>{rect={w:innerWidth,h:innerHeight};dockTopCache=null;render(progress.get());if(gpuReady&&quality==='auto')drawGPU();};
addEventListener('resize',resize);
window.visualViewport?.addEventListener('resize',resize);
lowTransparency.addEventListener?.('change',()=>{if(lowTransparency.matches){qualityControl.value='lite';quality='lite';player.dataset.gpu='off';}});
highContrast.addEventListener?.('change',()=>{if(highContrast.matches){qualityControl.value='lite';quality='lite';player.dataset.gpu='off';}});
if(lowTransparency.matches||highContrast.matches){quality='lite';qualityControl.value='lite';player.dataset.gpu='off';}
render(0);showTrack();updateTransport();initGraphics();
window.__motionLab={
 progress:()=>progress.get(),settle:(p,v=0)=>settle(p,v),navigation:(n)=>viewChange(n),chooseTrack:setTrack,
 diagnostic:()=>({version:'1.0.0',svgEngine,webgl:gpuReady,quality,gpuRenders,glError,interpolatedGeometry:geometry,motionValue:typeof progress.get==='function',navScrub:navScrub.state(),componentNavbar:customElements.get('lg-navbar')?.name||null,componentSegmented:customElements.get('lg-segmented')?.name||null,engineHasWebGL:typeof createGlassRenderer==='function',fps:measuredFps,layoutReads,playing,track:trackIndex,gesture:{drag:travelState.drag,start:travelState.start,last:travelState.last,gesture:travelState.gesture,velocity:travelState.velocity}}),
 pixel:()=>{if(renderer&&quality==='auto')drawGPU();const gl=glCanvas.getContext('webgl');if(!gl)return null;const p=new Uint8Array(4);gl.readPixels(Math.max(0,Math.floor(glCanvas.width/2)),Math.max(0,Math.floor(glCanvas.height/2)),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return [...p];}
};
