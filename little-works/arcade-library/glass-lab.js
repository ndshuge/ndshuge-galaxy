import { engine } from './glasslib/components.js';
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
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function initialPosition(){
 const sw=stage.clientWidth,sh=stage.clientHeight,w=panel.offsetWidth,h=panel.offsetHeight;
 return sw<=780?{x:(sw-w)/2,y:sh*.42}:{x:sw*.54,y:sh*.31};
}
function place(x,y,manual=true){
 const sw=stage.clientWidth,sh=stage.clientHeight,w=panel.offsetWidth,h=panel.offsetHeight;
 pos.x=Math.round(clamp(x,7,Math.max(7,sw-w-7)));
 pos.y=Math.round(clamp(y,7,Math.max(7,sh-h-7)));
 panel.style.left=pos.x+'px';panel.style.top=pos.y+'px';
 if(manual)hasMoved=true;
 panel.surface?.update();
}
function reset(){const p=initialPosition();hasMoved=false;place(p.x,p.y,false)}
function setMode(next){
 if(!(next in modeNames))return;
 mode=next;document.body.dataset.mode=next;
 document.querySelectorAll('[data-mode]').forEach(el=>{const selected=el.dataset.mode===next;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected))});
 $('#modeBadge').textContent=modeNames[next];
 $('#materialNote').textContent=modeDescriptions[next];
 $('#engineLabel').textContent=next==='l2'?'SVG 折射 · 已知背景副本':next==='l1'?'CSS 背景模糊 · 非折射':'不透明材质 · 无折射';
 strength.disabled=next!=='l2';
 $('#filterStatus').textContent=next==='l2'?'L2 滤镜已启用':next==='l1'?'无，使用模糊':'无';
 $('#surfaceStatus').textContent=next==='l2'?(panel.surface?.mode==='copy'?'已对齐图像副本':'检查中'):'无需图像副本';
}
function press(on){
 holding=on;
 panel.classList.toggle('pressed',on);
 $('#interactionStatus').textContent=on?'按压形变中':'准备就绪';
 if(panel.surface) panel.surface.setDelta(on?{x:-7,y:4,w:14,h:-8}:{x:0,y:0,w:0,h:0});
}
document.querySelectorAll('.material-choices [data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
strength.addEventListener('input',()=>{
 const n=Number(strength.value);
 $('#refractionValue').textContent=n+'px';
 if(panel.surface?.glass)panel.surface.glass.update({refraction:n});
});
$('#resetLens').addEventListener('click',reset);
$('#togglePress').addEventListener('click',()=>{
 const b=$('#togglePress');b.setAttribute('aria-pressed','true');
 press(true);clearTimeout(pressTimer);
 pressTimer=setTimeout(()=>{press(false);b.setAttribute('aria-pressed','false')},680);
});
panel.addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.pointerType!=='touch')return;
 e.preventDefault();
 grab={id:e.pointerId,x:e.clientX,y:e.clientY,left:pos.x,top:pos.y};
 panel.setPointerCapture(e.pointerId);
 panel.classList.add('dragging');
 press(true);
});
panel.addEventListener('pointermove',e=>{
 if(!grab||e.pointerId!==grab.id)return;
 place(grab.left+e.clientX-grab.x,grab.top+e.clientY-grab.y);
 $('#interactionStatus').textContent='正在跟随拖动';
});
function release(e){
 if(!grab||e.pointerId!==grab.id)return;
 grab=null;panel.classList.remove('dragging');
 press(false);$('#interactionStatus').textContent='已释放 · 位置已更新';
}
panel.addEventListener('pointerup',release);panel.addEventListener('pointercancel',release);panel.addEventListener('lostpointercapture',()=>{if(grab){grab=null;press(false);panel.classList.remove('dragging')}});
panel.setAttribute('tabindex','0');panel.setAttribute('role','group');panel.setAttribute('aria-label','可拖动的液态玻璃面板，使用方向键移动');
panel.addEventListener('keydown',e=>{
 const moves={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]};
 if(moves[e.key]){e.preventDefault();const [dx,dy]=moves[e.key];place(pos.x+dx,pos.y+dy);$('#interactionStatus').textContent='键盘位置已更新'}
});
new ResizeObserver(()=>{if(!hasMoved)requestAnimationFrame(reset);else requestAnimationFrame(()=>place(pos.x,pos.y,false))}).observe(stage);
await customElements.whenDefined('lg-panel');
requestAnimationFrame(()=>{
 reset();setMode('l2');
 $('#engine').textContent=engine==='blink'?'Chromium / Blink':engine==='webkit'?'Safari / WebKit':engine==='gecko'?'Firefox / Gecko':String(engine);
 $('#engineLabel').textContent='Engine: '+engine+' · Known-backdrop copy';
 let checks=0;
 const timer=setInterval(()=>{
   checks++;
   const glass=panel.querySelector('.lg-surface__glass');
   const filter=glass?getComputedStyle(glass).filter:'none';
   const copied=!!panel.querySelector('.lg-surface__copy');
   const ready=filter.includes('url(')&&copied&&panel.surface?.mode==='copy';
   $('#filterStatus').textContent=ready?'SVG 位移滤镜已加载':'初始化中';
   $('#surfaceStatus').textContent=copied?'已对齐原图副本':'等待背景副本';
   if(mode==='l2')$('#engineLabel').textContent=ready?'SVG 折射已激活 · '+engine:'正在初始化折射 · '+engine;
   if(ready||checks>30)clearInterval(timer);
 },150);
});
window.glassLab={setMode,reset,place,get mode(){return mode},get engine(){return engine},get diagnostics(){return {engine,mode,surfaceMode:panel.surface?.mode,filter:getComputedStyle(panel.querySelector('.lg-surface__glass')).filter,copy:!!panel.querySelector('.lg-surface__copy'),pos}}};
