import { engine } from './glasslib/components.js';
import { createGpuGlass } from './gpu-glass.js';
const $=q=>document.querySelector(q);
const stage=$('#scene'),panel=$('#lensPanel'),strength=$('#refraction');
const modeNames={l0:'L0 · Solid',l1:'L1 · Frosted',l2:'L2 · Refractive'};
const modeDescriptions={
 l0:'不透明材质：没有光学位移，背景不会透过面板。',
 l1:'仅通过 backdrop-filter 模糊下方图像；这不是物理折射。',
 l2:'Skill 的 SVG feDisplacementMap 改变下方图像的真实采样位置，边缘弯曲、中部相对清晰。'
};
let mode='l2',grab=null,hasMoved=false,holding=false,pressTimer=0;
let pos={x:0,y:0};
let moveFrame=0, pendingMove=null;
let lastDragFrame=0, slowDragFrames=0;
function adaptiveDragGuard(time){
 if(!gpu||mode!=='l2')return;
 if(lastDragFrame){
  const dt=time-lastDragFrame;
  // Trigger only on sustained slow dragging, not one transient hitch.
  slowDragFrames=dt>32?slowDragFrames+1:Math.max(0,slowDragFrames-1);
  if(slowDragFrames>=5){
   gpu.destroy();gpu=null;rendererChoice='fallback';
   document.body.dataset.renderer='fallback';
   setMode('l1');
   $('#engine').textContent='已切换 L1 · 流畅优先';
   $('#engineLabel').textContent='检测到持续掉帧 · 已自动减轻负载';
   $('#interactionStatus').textContent='流畅优先模式';
  }
 }
 lastDragFrame=time;
}
let gpu=null;
let rendererChoice='svg';
let gpuError='';
let opticalPress=false;
const lightweight = matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 780px)').matches;
function tuneOptics(){
  // Keep the actual Skill SVG refraction; reduce map resolution on touch devices.
  // chroma=0 turns three feDisplacementMap passes into one; specular rim remains.
  const opts=lightweight
    ? {mapScale:1,chroma:0,refraction:Number(strength.value)}
    : {mapScale:1.25,chroma:.08,refraction:Number(strength.value)};
  panel.surface?.glass?.update(opts);
}

const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function initialPosition(){
 const sw=stage.clientWidth,sh=stage.clientHeight,w=panel.offsetWidth,h=panel.offsetHeight;
 return sw<=780?{x:(sw-w)/2,y:sh*.42}:{x:sw*.54,y:sh*.31};
}
function place(x,y,manual=true){
 const sw=stage.clientWidth,sh=stage.clientHeight,w=panel.offsetWidth,h=panel.offsetHeight;
 pos.x=Math.round(clamp(x,7,Math.max(7,sw-w-7)));
 pos.y=Math.round(clamp(y,7,Math.max(7,sh-h-7)));
 // Translate on the compositor instead of invalidating layout with left/top.
 panel.style.transform='translate3d('+pos.x+'px,'+pos.y+'px,0)';
 if(manual)hasMoved=true;
 if(gpu)gpu.move(pos.x,pos.y);
 else panel.surface?.update();
}
function queueMove(x,y){
 pendingMove={x,y};
 if(moveFrame)return;
 moveFrame=requestAnimationFrame((time)=>{
   moveFrame=0;
   adaptiveDragGuard(time);
   const next=pendingMove;
   pendingMove=null;
   if(next)place(next.x,next.y);
 });
}
function flushMove(){
 if(!pendingMove)return;
 if(moveFrame)cancelAnimationFrame(moveFrame);
 moveFrame=0;
 const next=pendingMove;pendingMove=null;
 place(next.x,next.y);
}

function reset(){const p=initialPosition();hasMoved=false;place(p.x,p.y,false)}
function setMode(next){
 if(!(next in modeNames))return;
 // On an unsupported phone prioritize responsiveness over re-enabling costly SVG.
 if(next==='l2' && lightweight && rendererChoice==='fallback')next='l1';
 mode=next;document.body.dataset.mode=next;
 document.querySelectorAll('[data-mode]').forEach(el=>{const selected=el.dataset.mode===next;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected))});
 $('#modeBadge').textContent=modeNames[next];
 $('#materialNote').textContent=next==='l2'&&gpu?'GPU 单次光学折射：位移贴图缓存、背景纹理只上传一次，拖动不再重建 SVG 滤镜。':modeDescriptions[next];
 $('#engineLabel').textContent=gpu?(next==='l2'?'GPU Shader · 实时折射':next==='l1'?'GPU 已暂停 · 模糊':'GPU 已暂停 · 不透明'):(rendererChoice==='fallback'?'GPU 不可用 · 流畅模式':next==='l2'?'SVG 光学折射':next==='l1'?'CSS 模糊':'不透明材质');
 strength.disabled=next!=='l2';
 gpu?.setMode(next);
 $('#filterStatus').textContent=next==='l2'?(gpu?'WebGL GPU 光学折射':'SVG 滤镜已启用'):next==='l1'?'关闭 SVG · 背景模糊':'关闭折射';
 $('#surfaceStatus').textContent=next==='l2'?(gpu?'静态背景只上传一次':panel.surface?.mode==='copy'?'SVG 已对齐背景':'检查中'):'无需实时纹理';
}
function press(on, optical=false){
 holding=on;
 panel.classList.toggle('pressed',on);
 $('#interactionStatus').textContent=on?'按压形变中':'准备就绪';
 // Avoid generating new displacement PNGs on every touch-down/up.
 // Only the explicit optical press demo changes lens geometry.
 if(!gpu && panel.surface && optical)panel.surface.setDelta(on?{x:-7,y:4,w:14,h:-8}:{x:0,y:0,w:0,h:0});
}
document.querySelectorAll('.material-choices [data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
strength.addEventListener('input',()=>{
 const n=Number(strength.value);
 $('#refractionValue').textContent=n+'px';
 if(gpu)gpu.strength(n);
 else if(panel.surface?.glass)panel.surface.glass.update({refraction:n});
});
$('#resetLens').addEventListener('click',reset);
$('#togglePress').addEventListener('click',()=>{
 const b=$('#togglePress');b.setAttribute('aria-pressed','true');
 press(true,true);clearTimeout(pressTimer);
 pressTimer=setTimeout(()=>{press(false,true);b.setAttribute('aria-pressed','false')},680);
});
panel.addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.pointerType!=='touch')return;
 e.preventDefault();
 grab={id:e.pointerId,x:e.clientX,y:e.clientY,left:pos.x,top:pos.y};
 lastDragFrame=0;slowDragFrames=0;
 panel.setPointerCapture(e.pointerId);
 panel.classList.add('dragging');
 press(true);
});
panel.addEventListener('pointermove',e=>{
 if(!grab||e.pointerId!==grab.id)return;
 queueMove(grab.left+e.clientX-grab.x,grab.top+e.clientY-grab.y);
 $('#interactionStatus').textContent='正在跟随拖动';
});
function release(e){
 if(!grab||e.pointerId!==grab.id)return;
 flushMove();
 grab=null;panel.classList.remove('dragging');
 press(false);$('#interactionStatus').textContent='已释放 · 位置已更新';
}
panel.addEventListener('pointerup',release);panel.addEventListener('pointercancel',release);panel.addEventListener('lostpointercapture',()=>{if(grab){grab=null;press(false);panel.classList.remove('dragging')}});
panel.setAttribute('tabindex','0');panel.setAttribute('role','group');panel.setAttribute('aria-label','可拖动的液态玻璃面板，使用方向键移动');
panel.addEventListener('keydown',e=>{
 const moves={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]};
 if(moves[e.key]){e.preventDefault();const [dx,dy]=moves[e.key];place(pos.x+dx,pos.y+dy);$('#interactionStatus').textContent='键盘位置已更新'}
});
new ResizeObserver(()=>{
 if(!hasMoved)requestAnimationFrame(reset);
 else requestAnimationFrame(()=>place(pos.x,pos.y,false));
 if(gpu)requestAnimationFrame(()=>gpu?.resize(pos.x,pos.y));
}).observe(stage);
await customElements.whenDefined('lg-panel');
requestAnimationFrame(async()=>{
 // Keep the supplied Skill SVG implementation intact as a comparison/fallback.
 panel.style.left='0px';panel.style.top='0px';
 reset();
 $('#engine').textContent=engine==='blink'?'Chromium / Blink':engine==='webkit'?'Safari / WebKit':engine==='gecko'?'Firefox / Gecko':String(engine);
 if(lightweight && !matchMedia('(prefers-reduced-transparency:reduce)').matches){
   try{
     gpu=await createGpuGlass({stage,source:$('#stageArt'),panel});
     // Turn off the prior SVG engine and its scroll/resize observers.
     panel.surface?.detach();
     rendererChoice='webgl';
     document.body.dataset.renderer='webgl';
     gpu.move(pos.x,pos.y);
     gpu.strength(Number(strength.value));
     $('#engine').textContent='WebGL · GPU Shader';
     $('#filterStatus').textContent='GPU 实时折射';
     $('#surfaceStatus').textContent='静态纹理一次上传';
     $('#engineLabel').textContent='GPU Shader · 静态材质缓存';
   }catch(error){
     gpuError=String(error);
     rendererChoice='fallback';
     document.body.dataset.renderer='fallback';
     $('#engine').textContent='轻量降级 · L1';
     $('#engineLabel').textContent='GPU 不可用 · 自动流畅模式';
     $('#filterStatus').textContent='关闭高成本 SVG';
   }
 }else{
   tuneOptics();
 }
 setMode(rendererChoice==='fallback'?'l1':'l2');
 let checks=0;
 const timer=setInterval(()=>{
   checks++;
   const glass=panel.querySelector('.lg-surface__glass');
   const filter=glass?getComputedStyle(glass).filter:'none';
   const copied=!!panel.querySelector('.lg-surface__copy');
   if(rendererChoice==='webgl'||rendererChoice==='fallback'){
     clearInterval(timer);
     return;
   }
   const ready=filter.includes('url(')&&copied&&panel.surface?.mode==='copy';
   $('#filterStatus').textContent=ready?'SVG 位移滤镜已加载':'初始化中';
   $('#surfaceStatus').textContent=copied?'已对齐原图副本':'等待背景副本';
   if(mode==='l2')$('#engineLabel').textContent=ready?'SVG 折射已激活 · '+engine:'正在初始化折射 · '+engine;
   if(ready||checks>30)clearInterval(timer);
 },150);
});
window.addEventListener('shuge:glass-gpu-lost',()=>{
 gpu=null;rendererChoice='fallback';document.body.dataset.renderer='fallback';
 setMode('l1');$('#engineLabel').textContent='GPU 上下文丢失 · 已自动切换流畅模式';
});
window.glassLab={setMode,reset,place,get mode(){return mode},get engine(){return gpu?'gpu-webgl':engine},
 get diagnostics(){return {engine:gpu?'gpu-webgl':engine,mode,renderer:rendererChoice,
 gpuReady:!!gpu,sourceStatic:!!gpu, gpuError, gpuLens:gpu?.lens,gpuStats:gpu?.stats,
 surfaceMode:panel.surface?.mode,filter:getComputedStyle(panel.querySelector('.lg-surface__glass')).filter,
 copy:!!panel.querySelector('.lg-surface__copy'),pos}}
};
