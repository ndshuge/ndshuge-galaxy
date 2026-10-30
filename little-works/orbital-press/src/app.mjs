import {createBodies,stepBodies} from './physics.mjs';
import {sanitizeText,normalizePieces,planPoster,renderPoster,downloadPoster} from './poster.mjs';
const $=id=>document.getElementById(id);
const app=$('app'),field=$('field'),board=$('boardArt'),press=document.querySelector('.press');
const words=['字','O','墨','漂','重','A','印','浮','R','P','轨','道','片','T','空','白','∞'];
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let motionOn=!reduce.matches,stage='attract',bodies=[],floatNodes=[],pieces=[],nodes=[],selected=-1,drag=null,fieldTarget=null,activeLayout='orbit',edition=1,printTimer=null,printed=false;
function initField(){
 field.replaceChildren();bodies=createBodies(words,field.clientWidth,field.clientHeight);const fw=field.clientWidth,fh=field.clientHeight;if(fw>700){bodies.forEach(b=>{b.x=clamp(fw*(.50+.49*b.x/fw),12,fw-12);b.y=clamp(fh*(.07+.86*b.y/fh),12,fh-12);});}else{bodies.forEach(b=>{b.y=clamp(fh*(.34+.58*b.y/fh),12,fh-12);});}
 floatNodes=bodies.map((b,i)=>{
  const el=document.createElement('span');el.className='float-word';el.textContent=b.text;el.style.fontSize='clamp(27px, '+(b.size/14)+'vw, '+b.size+'px)';el.tabIndex=0;el.setAttribute('aria-label','漂浮活字 '+b.text);
  if(i===0)el.style.color='#bb5236';field.appendChild(el);
  el.addEventListener('pointerdown',e=>{e.stopPropagation();const pos=fieldPoint(e);drag={kind:'float',i,offX:b.x-pos.x,offY:b.y-pos.y};el.setPointerCapture(e.pointerId);el.classList.add('is-dragging');fieldTarget={...pos,active:true,repulse:false};});
  el.addEventListener('pointermove',e=>{if(drag?.kind==='float'&&drag.i===i){const p=fieldPoint(e);b.x=clamp(p.x+drag.offX,15,field.clientWidth-15);b.y=clamp(p.y+drag.offY,15,field.clientHeight-15);b.vx=0;b.vy=0;fieldTarget={...p,active:true}}});
  const end=e=>{if(drag?.kind==='float'&&drag.i===i){el.classList.remove('is-dragging');drag=null;fieldTarget=null}};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  el.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();b.x=clamp(b.x+(e.key==='ArrowRight'?16:e.key==='ArrowLeft'?-16:0),15,field.clientWidth-15);b.y=clamp(b.y+(e.key==='ArrowDown'?16:e.key==='ArrowUp'?-16:0),15,field.clientHeight-15)}});
  return el;
 });
 updateFloat();
}
function fieldPoint(e){const r=field.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
field.addEventListener('pointermove',e=>{if(stage!=='attract')return;if(drag?.kind==='float')return;fieldTarget={...fieldPoint(e),active:true,repulse:$('gravityBtn').getAttribute('aria-pressed')==='false'}});
field.addEventListener('pointerdown',e=>{if(e.target!==field)return;fieldTarget={...fieldPoint(e),active:true,repulse:false}});
field.addEventListener('pointerleave',()=>{if(!drag)fieldTarget=null});
field.addEventListener('pointerup',()=>{if(!drag&&matchMedia('(pointer: coarse)').matches)fieldTarget=null});
function updateFloat(){
 for(let i=0;i<bodies.length;i++){const b=bodies[i],el=floatNodes[i];if(!el)continue;el.style.transform='translate3d('+b.x+'px,'+b.y+'px,0) translate(-50%,-50%) rotate('+b.rotation+'deg)'}
}
let last=performance.now();
function tick(now){
 const dt=Math.min(.033,(now-last)/1000);last=now;
 if(stage==='attract'&&motionOn){const locked=drag?.kind==='float'?{i:drag.i,x:bodies[drag.i].x,y:bodies[drag.i].y}:null;
 stepBodies(bodies,fieldTarget,field.clientWidth,field.clientHeight,dt);
 if(locked){bodies[locked.i].x=locked.x;bodies[locked.i].y=locked.y}
 updateFloat();}
 requestAnimationFrame(tick);
}
function switchStage(next){
 stage=next;app.dataset.stage=next;
 for(const name of ['attract','compose','imprint'])$('scene-'+name).hidden=name!==next;
 const idx={attract:'01',compose:'02',imprint:'03'},labels={attract:'ATTRACTION / 引字',compose:'COMPOSITION / 排版',imprint:'IMPRESSION / 落印'};
 $('stepNumber').textContent=idx[next];$('stepLabel').textContent=labels[next];
 window.scrollTo({top:0,behavior:'instant'});
}
$('motionToggle').addEventListener('click',()=>{motionOn=!motionOn;$('motionToggle').textContent='动态 / '+(motionOn?'ON':'OFF');$('motionToggle').setAttribute('aria-pressed',String(!motionOn));});
reduce.addEventListener?.('change',e=>{motionOn=!e.matches;$('motionToggle').textContent='动态 / '+(motionOn?'ON':'OFF')});
$('gravityBtn').addEventListener('click',()=>{
 const isAttract=$('gravityBtn').getAttribute('aria-pressed')!=='false';
 $('gravityBtn').setAttribute('aria-pressed',String(!isAttract));$('gravityBtn').textContent=isAttract?'引力：排斥':'引力：吸附';
});
$('toCompose').addEventListener('click',()=>{
 const w=Math.max(1,field.clientWidth),h=Math.max(1,field.clientHeight);
 pieces=bodies.map(b=>({text:b.text,x:clamp(b.x/w*100,10,90),y:clamp(b.y/h*100,10,90),size:clamp(b.size*.76,28,74),rotation:b.rotation}));
 selected=-1;activeLayout='scatter';renderBoard();switchStage('compose');
});
function renderBoard(){
 board.replaceChildren();nodes=pieces.map((p,i)=>{
  const el=document.createElement('button');el.type='button';el.className='word'+(selected===i?' selected':'');el.textContent=p.text;el.dataset.index=String(i);el.setAttribute('aria-label','字块 '+p.text+'，拖动改变位置，方向键微调');el.setAttribute('aria-pressed',String(selected===i));
  board.appendChild(el);
  el.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;e.preventDefault();select(i);
   const r=board.getBoundingClientRect(),offX=p.x-(e.clientX-r.left)/r.width*100,offY=p.y-(e.clientY-r.top)/r.height*100;
   drag={kind:'board',i,offX,offY};el.setPointerCapture(e.pointerId);el.classList.add('dragging');
  });
  el.addEventListener('pointermove',e=>{if(drag?.kind!=='board'||drag.i!==i)return;const r=board.getBoundingClientRect();p.x=clamp((e.clientX-r.left)/r.width*100+drag.offX,5,95);p.y=clamp((e.clientY-r.top)/r.height*100+drag.offY,5,95);place(el,p)});
  const end=()=>{if(drag?.kind==='board'&&drag.i===i){el.classList.remove('dragging');drag=null}};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  el.addEventListener('click',()=>select(i));
  el.addEventListener('keydown',e=>{
    const n=e.shiftKey?5:1.5;
    if(['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();p.x=clamp(p.x+(e.key==='ArrowRight'?n:e.key==='ArrowLeft'?-n:0),5,95);p.y=clamp(p.y+(e.key==='ArrowDown'?n:e.key==='ArrowUp'?-n:0),5,95);select(i);place(el,p)}
  });
  place(el,p);return el;
 });
 refreshSize();refreshLayoutButtons();
}
function place(el,p){el.style.left=p.x+'%';el.style.top=p.y+'%';el.style.fontSize='clamp(21px, '+(p.size/610*100)+'cqw, '+p.size+'px)';el.style.transform='translate(-50%,-50%) rotate('+p.rotation+'deg)';}
function select(i){
 selected=i;nodes.forEach((n,j)=>{n.classList.toggle('selected',i===j);n.setAttribute('aria-pressed',String(i===j))});refreshSize();
}
function refreshSize(){$('sizeValue').textContent=selected>=0?pieces[selected].size+' px':'—'}
function scaleSelected(delta){
 if(selected<0){selected=0;select(0)}
 const p=pieces[selected];p.size=clamp(p.size+delta,24,120);place(nodes[selected],p);refreshSize();
}
$('smaller').addEventListener('click',()=>scaleSelected(-8));
$('bigger').addEventListener('click',()=>scaleSelected(8));
function arrange(mode){
 activeLayout=mode;
 pieces.forEach((p,i)=>{
  const n=pieces.length,a=i*2*Math.PI/n;
  if(mode==='orbit'){p.x=50+33*Math.cos(a-.65);p.y=50+35*Math.sin(a-.65);p.rotation=Math.round(a*180/Math.PI)*.4;}
  if(mode==='column'){const columns=Math.min(4,Math.ceil(Math.sqrt(n*.64))),rows=Math.ceil(n/columns);p.x=18+(i%columns)*(64/Math.max(1,columns-1));p.y=14+Math.floor(i/columns)*(70/Math.max(1,rows-1));p.rotation=0}
  if(mode==='scatter'){p.x=12+((i*37)%77);p.y=12+((i*47)%75);p.rotation=(i%7-3)*13}
 });
 renderBoard();
}
function refreshLayoutButtons(){document.querySelectorAll('[data-layout]').forEach(b=>b.classList.toggle('active',b.dataset.layout===activeLayout))}
document.querySelectorAll('[data-layout]').forEach(b=>b.addEventListener('click',()=>arrange(b.dataset.layout)));
function addWord(){
 const text=sanitizeText($('wordInput').value);if(!text){$('wordInput').focus();return}
 if(pieces.length>=32){$('wordInput').setCustomValidity('最多放入32个字块');$('wordInput').reportValidity();return}
 $('wordInput').setCustomValidity('');pieces.push({text,x:50,y:50,size:clamp(Math.round(180/Math.max(1,Array.from(text).length)),24,54),rotation:-7});selected=pieces.length-1;$('wordInput').value='';renderBoard();nodes[selected]?.focus();
}
$('addWord').addEventListener('click',addWord);
$('wordInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addWord()}});
$('backAttract').addEventListener('click',()=>switchStage('attract'));
$('toPrint').addEventListener('click',()=>{printed=false;clearTimeout(printTimer);press.classList.remove('pressing','ready');$('posterPreview').style.display='none';$('sheetPlaceholder').hidden=false;$('downloadBtn').hidden=true;$('printBtn').hidden=false;$('printBtn').disabled=false;$('printStatus').textContent='印刷机已就位。按下印刷，即可封存这次编排。';switchStage('imprint')});
$('backCompose').addEventListener('click',()=>{clearTimeout(printTimer);press.classList.remove('pressing','ready');$('printBtn').disabled=false;switchStage('compose')});
$('restartBtn').addEventListener('click',()=>{clearTimeout(printTimer);press.classList.remove('pressing','ready');drag=null;fieldTarget=null;initField();switchStage('attract')});
$('printBtn').addEventListener('click',()=>{
 if(printed||$('printBtn').disabled)return;
 $('printBtn').disabled=true;press.classList.add('pressing');$('printStatus').textContent='正在压印……纸张将记住此刻的字序。';
 const delay=motionOn&&!reduce.matches?1250:0;
 printTimer=setTimeout(()=>{
  try{
   const measured=normalizePieces(pieces,100,100);
   const model=planPoster(measured,String(edition++));
   renderPoster($('posterPreview'),model);
   press.classList.add('ready');press.classList.remove('pressing');
   $('posterPreview').style.display='block';$('sheetPlaceholder').hidden=true;
   $('downloadBtn').hidden=false;$('printBtn').hidden=true;printed=true;
   $('printStatus').textContent='落印完成。你的字、位置与编排已被封存在这张海报中。';
  }catch(e){$('printBtn').disabled=false;$('printStatus').textContent='印刷遇到问题，请重试。';console.error(e)}
 },delay);
});
$('downloadBtn').addEventListener('click',async()=>{
 try{$('downloadBtn').disabled=true;await downloadPoster($('posterPreview'),'orbital-press-edition-'+(edition-1)+'.png');$('printStatus').textContent='PNG 已生成并交给浏览器保存。';}catch(e){$('printStatus').textContent='保存失败，请重试。';console.error(e)}finally{$('downloadBtn').disabled=false}
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(stage==='imprint')$('backCompose').click();else if(stage==='compose'&&document.activeElement!==$('wordInput'))$('backAttract').click()}});
window.addEventListener('resize',()=>{if(stage==='attract'){const w=field.clientWidth,h=field.clientHeight;bodies.forEach(b=>{b.x=clamp(b.x,12,w-12);b.y=clamp(b.y,12,h-12)});updateFloat()}});
initField();$('motionToggle').textContent='动态 / '+(motionOn?'ON':'OFF');$('motionToggle').setAttribute('aria-pressed',String(!motionOn));requestAnimationFrame(tick);
window.__orbital={get stage(){return stage},get pieces(){return pieces.map(x=>({...x}))},get printed(){return printed},get motionOn(){return motionOn}};
