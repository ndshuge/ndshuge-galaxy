(() => {
'use strict';
const KEY='focus-aura.v1', defaults={focus:25,short:5,long:15}, themes={
dawn:{label:'晨光',title:'让思绪，慢慢清晰。',hint:'留一段时间，给重要的事',colors:['#102739','#29576b','#a7ac9c'],glows:['#e3bda4','#b8e9d7']},
ocean:{label:'深海',title:'深呼吸，沉入专注。',hint:'让外界的声音渐渐远去',colors:['#051221','#092d49','#0a6276'],glows:['#2bcabf','#2d80c8']},
night:{label:'星夜',title:'今夜，与灵感同行。',hint:'为自己留一片安静星空',colors:['#090e22','#1e244d','#413466'],glows:['#c0a9fd','#6c8fdd']}
};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),now=()=>Date.now();
function load(){try{let d=JSON.parse(localStorage.getItem(KEY)||'{}');if(!d||typeof d!=='object')throw 0;
let durations={...defaults};for(const k of Object.keys(defaults))if(Number.isInteger(+d.durations?.[k]) && +d.durations[k]>=1&&+d.durations[k]<=180)durations[k]=+d.durations[k];
let mode=['focus','short','long'].includes(d.mode)?d.mode:'focus';
let full=durations[mode]*60000;
let activeDurationMs=d.sessionId?(Number.isFinite(d.activeDurationMs)&&d.activeDurationMs>=60000&&d.activeDurationMs<=10800000?d.activeDurationMs:full):null;
return {durations,mode,scene:themes[d.scene]?d.scene:'dawn',glass:['l0','l1','l2'].includes(d.glass)?d.glass:'l2',motion:!!d.motion,transparency:!!d.transparency,running:d.running===true,finished:d.finished===true,remainingMs:clamp(Number.isFinite(Number(d.remainingMs)) && d.remainingMs!==undefined ? Number(d.remainingMs) : full,0,activeDurationMs||full),activeDurationMs,endAt:Number.isFinite(d.endAt)?d.endAt:null,sessionId:d.sessionId||null,sessions:Array.isArray(d.sessions)?d.sessions.filter(x=>x && typeof x.id==='string'&&Number.isFinite(x.endedAt)&&Number.isFinite(x.minutes)&&x.minutes>0).slice(-2000):[]};
}catch{return {durations:{...defaults},mode:'focus',scene:'dawn',glass:'l2',motion:false,transparency:false,running:false,finished:false,remainingMs:25*60000,activeDurationMs:null,endAt:null,sessionId:null,sessions:[]}}}
let state=load();let lastWrite=0,toastTimer,activeSheet=null,hideToken=0,previousFocus=null,lastTimerText='';
const osReducedMotion=matchMedia('(prefers-reduced-motion: reduce)'), osReducedTransparency=matchMedia('(prefers-reduced-transparency: reduce)');
function effectiveMotion(){return state.motion||osReducedMotion.matches}
function effectiveTransparency(){return state.transparency||osReducedTransparency.matches}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));lastWrite=now()}catch(e){toast('浏览器存储不可用，记录可能无法保存')}}
function showToast(msg){const el=$('#toast');clearTimeout(toastTimer);el.textContent=msg;el.classList.add('show');toastTimer=setTimeout(()=>el.classList.remove('show'),2300)}
function toast(msg){showToast(msg)}
function durationMs(mode=state.mode){return state.durations[mode]*60000}
function cycleDurationMs(){return state.activeDurationMs||durationMs()}
function nextMode(){if(state.mode!=='focus')return 'focus';return state.sessions.filter(x=>x.mode==='focus').length%4===0?'long':'short'}
function phaseName(){return {focus:'专注',short:'短休息',long:'长休息'}[state.mode]}
function refreshRemaining(){if(state.running&&Number.isFinite(state.endAt))state.remainingMs=Math.max(0,state.endAt-now())}
function finish(){if(!state.running)return;const finishedAt=state.endAt,creditedMinutes=cycleDurationMs()/60000;state.running=false;state.endAt=null;state.remainingMs=0;state.finished=true;
if(state.mode==='focus' && state.sessionId && !state.sessions.some(s=>s.id===state.sessionId)){
state.sessions.push({id:state.sessionId,mode:'focus',minutes:creditedMinutes,endedAt:finishedAt});state.sessions=state.sessions.slice(-2000)}
state.sessionId=null;state.activeDurationMs=null;save();render();toast(state.mode==='focus'?'专注完成。做得好。':'休息结束，可以继续专注');}
function reconcile(){if(state.running){if(!Number.isFinite(state.endAt)){state.running=false;state.endAt=null;state.remainingMs=durationMs();save()}else if(state.endAt<=now()){finish();return}}render()}
function start(){if(state.finished){selectMode(nextMode(),true)}if(!state.running){state.running=true;state.finished=false;state.endAt=now()+Math.max(1000,state.remainingMs);if(!state.sessionId){state.sessionId='s-'+now()+'-'+Math.random().toString(36).slice(2,7);state.activeDurationMs=durationMs()}save();render()}}
function pause(){if(!state.running)return;refreshRemaining();state.running=false;state.endAt=null;save();render()}
function toggleTimer(){reconcile();if(state.running)pause();else start()}
function reset(){state.running=false;state.finished=false;state.endAt=null;state.sessionId=null;state.activeDurationMs=null;state.remainingMs=durationMs();save();render();toast('计时已重置')}
function selectMode(mode,force=false){if(!defaults.hasOwnProperty(mode))return;
if(!force && mode===state.mode)return;
if(!force && state.running && !window.confirm('切换模式将放弃本轮未完成的进度，确定切换吗？'))return;
state.mode=mode;state.running=false;state.finished=false;state.endAt=null;state.sessionId=null;state.activeDurationMs=null;state.remainingMs=durationMs(mode);save();render()}
function formatTime(ms){const s=Math.ceil(Math.max(0,ms)/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function localKey(ts){const d=new Date(ts);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function totals(){const dates=new Map();for(const s of state.sessions){const date=localKey(s.endedAt);dates.set(date,(dates.get(date)||0)+s.minutes)}let streak=0;const day=new Date();day.setHours(12,0,0,0);if(!dates.has(localKey(day.getTime())))day.setDate(day.getDate()-1);
while(dates.has(localKey(day.getTime()))){streak++;day.setDate(day.getDate()-1)}
return {dates,today:dates.get(localKey(now()))||0,streak}}
function render(){const t=state.running?Math.max(0,state.endAt-now()):state.remainingMs;const f=formatTime(t);
if(lastTimerText!==f){$('#time').textContent=f;document.title=f+' · Focus Aura';lastTimerText=f}
const pct=cycleDurationMs()?clamp(t/cycleDurationMs(),0,1):1;$('#ring-progress').style.strokeDashoffset=String(1193.805*(1-pct));
$('#start-label').textContent=state.running?'暂停':state.finished?'进入下一轮':state.sessionId?'继续':'开始'+phaseName();
$('#start-icon').innerHTML=state.running?'<span class="pause-icon" aria-hidden="true"><i></i><i></i></span>':'<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="m8.1 5.3 11 6.7-11 6.7z"/></svg>';
$('#start').setAttribute('aria-label',state.running?'暂停计时':state.finished?'开始下一轮':state.sessionId?'继续计时':'开始'+phaseName());
$('#timer-hint').textContent=state.finished?'这一段时间，已经属于你':state.running?(state.mode==='focus'?'此刻，心无旁骛': '慢慢休息，恢复能量'):state.sessionId?'一切就绪，随时继续':'现在，开始属于你的时间';
$$('[data-mode]').forEach(el=>{const selected=el.dataset.mode===state.mode;el.classList.toggle('active',selected);el.setAttribute('aria-pressed',String(selected))});
$('#today-count').textContent=totals().today+' 分钟';}
function applyScene(){document.body.dataset.scene=state.scene;const th=themes[state.scene];$('#scene-title').textContent=th.title;$('#session-label').textContent=th.hint;document.querySelectorAll('.scene-button[data-scene]').forEach(el=>{const sel=el.dataset.scene===state.scene;el.classList.toggle('selected',sel);el.setAttribute('aria-pressed',String(sel))});sceneChanged=now();renderWorld(performance.now());}
function applyPrefs(){document.body.dataset.glass=state.glass;document.body.classList.toggle('reduce-motion',effectiveMotion());document.body.classList.toggle('reduce-transparency',effectiveTransparency());$('#glass-level').value=state.glass;$('#motion-reduce').checked=state.motion;$('#transparency-reduce').checked=state.transparency;renderWorld()}
function fillSettings(){for(const m of Object.keys(defaults))$('#duration-'+m).value=state.durations[m]}
function changeDuration(mode,value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>180){fillSettings();toast('时长需为 1–180 分钟的整数');return}
state.durations[mode]=n;if(mode===state.mode && !state.running && !state.sessionId && !state.finished){state.remainingMs=n*60000}save();render();fillSettings();if(mode===state.mode&&(state.running||state.sessionId))toast('新时长将在下一轮生效')}
function openSheet(which){clearTimeout(hideToken);previousFocus=document.activeElement;activeSheet=which;$('#settings-view').hidden=which!=='settings';$('#stats-view').hidden=which!=='stats';$('#sheet-title').textContent=which==='settings'?'偏好设置':'专注回顾';$('#sheet-kicker').textContent=which==='settings'?'PERSONALIZE':'YOUR PROGRESS';if(which==='stats')renderStats();else fillSettings();$('#overlay').hidden=false;requestAnimationFrame(()=>{$('#overlay').classList.add('open');$('#sheet-close').focus({preventScroll:true})})}
function closeSheet(){if(!activeSheet)return;activeSheet=null;$('#overlay').classList.remove('open');clearTimeout(hideToken);hideToken=setTimeout(()=>{if(!activeSheet)$('#overlay').hidden=true},effectiveMotion()?10:590);if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true})}
function renderStats(){const {dates,today,streak}=totals();$('#stat-today').innerHTML=today+' <small>分钟</small>';$('#stat-streak').innerHTML=streak+' <small>天</small>';
const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);days.push({day:['日','一','二','三','四','五','六'][d.getDay()],minutes:dates.get(localKey(d.getTime()))||0,today:i===0})}const max=Math.max(25,...days.map(d=>d.minutes));$('#weekly-total').textContent='累计 '+days.reduce((a,b)=>a+b.minutes,0)+' 分钟';
$('#weekly-bars').replaceChildren(...days.map(d=>{let el=document.createElement('div');el.className='bar-cell'+(d.today?' today':'');el.title=d.minutes+' 分钟';el.innerHTML='<div class="bar-track"><div class="bar-fill" style="height:'+Math.max(d.minutes?4:0,Math.round(d.minutes/max*100))+'%"></div></div><span class="bar-day">周'+d.day+'</span>';return el}));
$('#weekly-bars').setAttribute('aria-label',days.map(d=>'周'+d.day+' '+d.minutes+'分钟').join('，'));
$('#session-total').textContent=state.sessions.length+' 次专注';const hist=$('#history');hist.replaceChildren();if(!state.sessions.length){let e=document.createElement('p');e.className='history-empty';e.textContent='完成第一次专注后，你的记录会出现在这里。';hist.append(e)}else{for(const s of [...state.sessions].reverse().slice(0,12)){let el=document.createElement('div');el.className='history-item';let date=new Date(s.endedAt);el.innerHTML='<strong>'+s.minutes+' 分钟专注</strong><span>'+date.toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'})+' · '+date.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+'</span>';hist.append(el)}}}
const world=$('#world'),ctx=world.getContext('2d',{alpha:false}),opt=$('.optical-canvas'),optCtx=opt.getContext('2d',{willReadFrequently:true});
let vw=0,vh=0,scale=1,sceneChanged=now(),frame=0,lastPaint=0,lastOpt=0,checksum=0;
let sceneSnapshot=null,transitionStarted=0;
const stars=Array.from({length:85},(_,i)=>({x:(Math.sin(i*78.233)*43758.5453)%1,y:(Math.cos(i*34.991)*23758.129)%1,r:.5+(i%6)*.26,phase:i*.71})).map(s=>({...s,x:Math.abs(s.x),y:Math.abs(s.y)}));
function resize(){vw=window.innerWidth;vh=window.innerHeight;scale=Math.min(window.devicePixelRatio||1,1.5);world.width=Math.max(1,Math.round(vw*scale));world.height=Math.max(1,Math.round(vh*scale));world.style.width=vw+'px';world.style.height=vh+'px';ctx.setTransform(scale,0,0,scale,0,0);renderWorld();renderOptical()}
function halo(x,y,r,c,alpha){ctx.save();let gr=ctx.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,colorAlpha(c,alpha));gr.addColorStop(.45,colorAlpha(c,alpha*.35));gr.addColorStop(1,colorAlpha(c,0));ctx.fillStyle=gr;ctx.fillRect(x-r,y-r,2*r,2*r);ctx.restore()}
function colorAlpha(hex,a){let n=parseInt(hex.slice(1),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'}
function renderWorld(time=0){if(!vw||!vh)return;const w=vw,h=vh,p=effectiveMotion()?time:0,th=themes[state.scene];ctx.clearRect(0,0,w,h);const gradient=ctx.createLinearGradient(0,0,w*.75,h);th.colors.forEach((c,i)=>gradient.addColorStop(i/2,c));ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
if(state.scene==='dawn'){halo(w*.68+Math.sin(p*.00011)*w*.04,h*.31,Math.max(w,h)*.69,'#f5c5a5',.34);halo(w*.27,h*.68,Math.max(w,h)*.6,'#75d3d2',.2);halo(w*.55,h*.8,w*.6,'#c3caac',.22);const y=h*.68;ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=w+20;x+=20)ctx.lineTo(x,y+Math.sin(x/240+p*.0002)*16+Math.sin(x/64)*5);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fillStyle='#3b7e8b33';ctx.fill()}
else if(state.scene==='ocean'){halo(w*.68,h*.52,w*.8,'#22a9bc',.22);halo(w*.3,h*.15,Math.max(w,h)*.45,'#66c6ba',.26);for(let j=0;j<9;j++){ctx.beginPath();const yy=h*(.26+j*.095);for(let x=0;x<=w+10;x+=14){const dy=Math.sin(x/(60+j*20)+p*.00018+j*.5)*10+Math.sin(x/190+p*.00009)*12;if(x===0)ctx.moveTo(x,yy+dy);else ctx.lineTo(x,yy+dy)}ctx.strokeStyle='rgba(157,244,237,'+(0.025+j*.006)+')';ctx.lineWidth=1.2;ctx.stroke()}}
else{halo(w*.55,h*.45,Math.max(w,h)*.62,'#7064d0',.18);halo(w*.23,h*.76,w*.65,'#bf8ad2',.16);for(const s of stars){let glow=effectiveMotion()?(.48+.5*Math.sin(p*.0014+s.phase)):.7;ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fillStyle='rgba(227,232,255,'+(.18+.55*glow)+')';ctx.fill()}}
const vign=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.max(w,h)*.87);vign.addColorStop(0,'rgba(2,8,25,0)');vign.addColorStop(1,'rgba(2,7,24,.57)');ctx.fillStyle=vign;ctx.fillRect(0,0,w,h);
if(sceneSnapshot){const progress=effectiveMotion()?clamp((time-transitionStarted)/900,0,1):1;if(progress<1){ctx.save();ctx.globalAlpha=Math.pow(1-progress,1.3);ctx.drawImage(sceneSnapshot,0,0,w,h);ctx.restore()}else sceneSnapshot=null}
}
function renderOptical(){if(state.glass!=='l2'||effectiveTransparency()||!vw||!vh){opt.dataset.refraction='inactive';return}const r=opt.getBoundingClientRect();if(r.width<1||r.height<1)return;
const w=Math.max(1,Math.floor(r.width)),h=Math.max(1,Math.floor(r.height));if(opt.width!==w||opt.height!==h){opt.width=w;opt.height=h}
const sample=document.createElement('canvas');sample.width=w;sample.height=h;const sctx=sample.getContext('2d',{willReadFrequently:true});sctx.drawImage(world,Math.max(0,r.left)*scale,Math.max(0,r.top)*scale,w*scale,h*scale,0,0,w,h);
const src=sctx.getImageData(0,0,w,h),dst=optCtx.createImageData(w,h);let differences=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const edge=Math.min(x,y,w-1-x,h-1-y);const strength=Math.exp(-edge/12);const dx=Math.round(strength*(6*Math.sin(y/15+x/57)+3));const dy=Math.round(strength*(4*Math.cos(x/23-y/37)-1));const sx=clamp(x+dx,0,w-1),sy=clamp(y+dy,0,h-1),i=(y*w+x)*4,j=(sy*w+sx)*4;dst.data[i]=src.data[j];dst.data[i+1]=src.data[j+1];dst.data[i+2]=src.data[j+2];dst.data[i+3]=225;if((dx||dy)&&(Math.abs(src.data[i]-src.data[j])+Math.abs(src.data[i+1]-src.data[j+1])+Math.abs(src.data[i+2]-src.data[j+2])>3))differences++}
optCtx.putImageData(dst,0,0);checksum=differences;opt.dataset.refraction='pixel-displacement';opt.dataset.changedPixels=String(differences);
}
function animate(time){if(time-lastPaint>(effectiveMotion()?44:1500)){renderWorld(time);lastPaint=time}if(time-lastOpt>(effectiveMotion()?110:1500)){renderOptical();lastOpt=time}if(frame++%6===0){if(state.running&&state.endAt<=now())finish();else if(state.running)render();if(state.running&&now()-lastWrite>15000)save();$('#clock').textContent=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})}requestAnimationFrame(animate)}
function makeHoldable(){for(const el of $$('.holdable')){let held=false,releaseAnim=null;const off=()=>{if(!held)return;held=false;el.classList.remove('is-held');el.classList.add('is-release');releaseAnim?.cancel();releaseAnim=el.animate([{filter:'brightness(1.11)'},{filter:'brightness(1)'}],{duration:effectiveMotion()?1:440,easing:'cubic-bezier(.16,1.35,.32,1)'});releaseAnim.onfinish=()=>el.classList.remove('is-release')};
el.addEventListener('pointerdown',e=>{if(e.button!==0)return;releaseAnim?.cancel();el.classList.remove('is-release');held=true;el.classList.add('is-held')});
for(const ev of ['pointerup','pointercancel','pointerleave','lostpointercapture','blur'])el.addEventListener(ev,off);
el.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){held=true;el.classList.add('is-held')}});el.addEventListener('keyup',off)
}}
$('#start').addEventListener('click',toggleTimer);$('#reset').addEventListener('click',reset);$('#skip').addEventListener('click',()=>selectMode(nextMode()));
$$('[data-mode]').forEach(el=>el.addEventListener('click',()=>selectMode(el.dataset.mode)));
document.querySelectorAll('.scene-button[data-scene]').forEach(el=>el.addEventListener('click',()=>{if(state.scene===el.dataset.scene)return;const snapshot=document.createElement('canvas');snapshot.width=world.width;snapshot.height=world.height;snapshot.getContext('2d').drawImage(world,0,0);sceneSnapshot=snapshot;transitionStarted=performance.now();state.scene=el.dataset.scene;save();applyScene()}));
$('#settings-open').addEventListener('click',()=>openSheet('settings'));$('#stats-open').addEventListener('click',()=>openSheet('stats'));$('#sheet-close').addEventListener('click',closeSheet);$('#overlay-backdrop').addEventListener('click',closeSheet);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
for(const m of Object.keys(defaults))$('#duration-'+m).addEventListener('change',e=>changeDuration(m,e.target.value));
$('#glass-level').addEventListener('change',e=>{state.glass=e.target.value;save();applyPrefs()});
$('#motion-reduce').addEventListener('change',e=>{state.motion=e.target.checked;save();applyPrefs()});
$('#transparency-reduce').addEventListener('change',e=>{state.transparency=e.target.checked;save();applyPrefs()});
[osReducedMotion,osReducedTransparency].forEach(q=>q.addEventListener?.('change',applyPrefs));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();else {reconcile();renderWorld();renderOptical()}});window.addEventListener('pagehide',save);window.addEventListener('resize',resize,{passive:true});window.addEventListener('storage',e=>{if(e.key===KEY){state=load();applyPrefs();applyScene();reconcile()}});
makeHoldable();fillSettings();applyPrefs();applyScene();resize();reconcile();requestAnimationFrame(animate);
window.FocusAuraDiagnostics=Object.freeze({snapshot:()=>({mode:state.mode,running:state.running,remainingMs:state.running?Math.max(0,state.endAt-now()):state.remainingMs,endAt:state.endAt,scene:state.scene,glass:state.glass,sessionCount:state.sessions.length,refraction:opt.dataset.refraction,changedPixels:Number(opt.dataset.changedPixels)||0,reducedMotion:effectiveMotion(),reducedTransparency:effectiveTransparency()}),storageKey:KEY});
})();