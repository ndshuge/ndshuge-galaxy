// Real Microsoft Edge headless CDP QA: no WebDriver, no simulated assertions without browser.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawn}=require('node:child_process');const assert=require('node:assert/strict');
const BASE=path.resolve(__dirname,'..'),OUT=path.join(BASE,'qa');
const edgePath='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT=5277, DEBUG=53174;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const get=url=>new Promise((resolve,reject)=>http.get(url,r=>{let s='';r.on('data',c=>s+=c);r.on('end',()=>resolve({status:r.statusCode,body:s}));}).on('error',reject));
let edge,socket,seq=0;const waiting=new Map(),consoleErrors=[],checks=[],perf=[];
function send(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{waiting.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(waiting.has(id)){waiting.delete(id);reject(Error(method+' timed out'))}},15000)})}
async function evalJs(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result?.value}
async function waitUntil(fn,max=90){for(let i=0;i<max;i++){if(await fn())return true;await sleep(140)}throw Error('waitUntil timed out')}
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name)}
async function shot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name),Buffer.from(r.data,'base64'))}
async function goto(w,h,mobile){await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:mobile,scale:1});await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:1});await send('Page.navigate',{url:'http://127.0.0.1:'+PORT+'/index.html'});await waitUntil(async()=>!!(await evalJs("document.readyState==='complete' && !!document.querySelector('#time-canvas')")));await sleep(800);}
async function move(type,x,y,buttons=0){await send('Input.dispatchMouseEvent',{type,x,y,button:'left',buttons,clickCount:['mousePressed','mouseReleased'].includes(type)?1:0})}
async function touch(type,x,y){await send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:0}]})}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 for(const f of ['index.html','style.css','experience.js','assets/glass-shadow.jpg','assets/paper-shadow.jpg','assets/book-light.jpg','assets/slide-1.webp','assets/slide-2.webp','assets/slide-3.webp','assets/cover.webp','Light-Paper-Time.pptx']){
  const x=await get('http://127.0.0.1:'+PORT+'/'+f);await check('asset '+f,()=>assert.equal(x.status,200));
 }
 const ppt=fs.readFileSync(path.join(BASE,'Light-Paper-Time.pptx'));await check('real PowerPoint signature',()=>{assert.equal(ppt.subarray(0,2).toString(),'PK');assert(ppt.length>100000)});
 edge=spawn(edgePath,['--headless=new','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-component-extensions-with-background-pages','--disable-background-networking','--disable-features=Translate','--remote-debugging-port='+DEBUG,'--remote-allow-origins=*','--user-data-dir='+path.join(OUT,'cdp-art-profile'),'--window-size=1440,900','about:blank'],{stdio:'ignore',windowsHide:true});
 let target;for(let i=0;i<70;i++){try{target=JSON.parse((await get('http://127.0.0.1:'+DEBUG+'/json')).body).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(target)break}catch{}await sleep(190)}
 assert(target,'Edge DevTools unavailable');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((yes,no)=>{socket.addEventListener('open',yes,{once:true});socket.addEventListener('error',no,{once:true})});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const f=waiting.get(m.id);if(f){waiting.delete(m.id);m.error?f.reject(Error(JSON.stringify(m.error))):f.resolve(m.result)}}if(m.method==='Runtime.exceptionThrown')consoleErrors.push(m.params.exceptionDetails.text);if(m.method==='Log.entryAdded'&&m.params.entry.level==='error'&&!/Unchecked runtime\\.lastError: The message port closed before a response was received/.test(m.params.entry.text))consoleErrors.push(m.params.entry.text)});
 await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
 for(const [w,h,mobile] of [[1440,900,false],[768,1024,false],[390,844,true],[320,700,true]]){
  await goto(w,h,mobile);
  await check('no page overflow '+w,async()=>{const v=await evalJs("({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,inner:innerWidth})");assert(v.doc<=v.inner+1,JSON.stringify(v));assert(v.body<=v.inner+1,JSON.stringify(v))});
  await check('all exhibition rooms '+w,async()=>assert.equal(await evalJs("document.querySelectorAll('.gallery-section').length"),4));
  perf.push(await evalJs("(()=>{const n=performance.getEntriesByType('navigation')[0];return {viewport:innerWidth,loadMs:Math.round(n?.loadEventEnd||0),resources:performance.getEntriesByType('resource').length,webgl:document.querySelector('#optics-frame').dataset.optics||'fallback',scrollWidth:document.documentElement.scrollWidth}})()"));
  await check('images loaded '+w,async()=>{const r=await evalJs("[...document.images].filter(i=>!i.loading||i.loading!=='lazy').every(i=>i.complete&&i.naturalWidth>0)");assert(r)});
  if(w===1440||w===390){await shot('round2-hero-'+w+'.png');await evalJs("document.querySelector('#paper').scrollIntoView({behavior:'instant'})");await sleep(330);await shot('round2-paper-'+w+'.png');}
  await evalJs("document.querySelector('#optics-frame').scrollIntoView({behavior:'instant',block:'center'})");await sleep(420);
  const label=await evalJs("document.querySelector('#optics-status').textContent");
  console.log('OPTICS',w,label);
  if(w===1440||w===390){
   await shot('round2-light-before-'+w+'.png');
   const r=await evalJs("(()=>{const r=document.querySelector('#optics-frame').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()");
   const x=r.x+r.w*.44,y=r.y+r.h*.49;
   if(mobile){await touch('touchStart',x,y)}else{await move('mouseMoved',x,y);await move('mousePressed',x,y,1)}await sleep(240);
   const pressed=await evalJs("parseFloat(document.querySelector('#lens-overlay').style.width)");
   if(mobile){await touch('touchMove',x+r.w*.14,y+r.h*.11);await sleep(240);await touch('touchEnd',x+r.w*.14,y+r.h*.11)}else{await move('mouseMoved',x+r.w*.14,y+r.h*.11,1);await sleep(240);await move('mouseReleased',x+r.w*.14,y+r.h*.11)};
   const moved=await evalJs("parseFloat(document.querySelector('#lens-overlay').style.left)");
   await sleep(800);const settled=await evalJs("parseFloat(document.querySelector('#lens-overlay').style.width)");
   await check('lens dragged '+w,()=>assert(moved>48,'lens position did not change: '+moved));
   await check('press and rebound '+w,()=>assert(pressed>settled+4,'press '+pressed+' release '+settled));
   await shot('round2-light-after-'+w+'.png');
   await evalJs("document.querySelector('#lens-reset').click()");await sleep(800);
   await check('lens reset '+w,async()=>assert(Math.abs(await evalJs("parseFloat(document.querySelector('#lens-overlay').style.left)")-43)<2));
   if(w===1440){
    await check('WebGL optical refraction active',async()=>assert.equal(await evalJs("document.querySelector('#optics-frame').dataset.optics"),'webgl'));
    await check('WebGL backing frame exposed',async()=>assert(await evalJs("document.querySelector('#refraction-canvas').width>300")));
   }
   await evalJs("document.querySelector('#time-theatre').scrollIntoView({behavior:'instant',block:'center'})");await sleep(200);
   await shot('round2-time-'+w+'.png');
   const scrollBefore=Number(await evalJs("document.querySelector('#time-range').value"));
   await evalJs("window.scrollBy({top:180,behavior:'instant'})");await sleep(190);
   const scrollAfter=Number(await evalJs("document.querySelector('#time-range').value"));
   await check('scroll-linked narrative '+w,()=>assert(scrollAfter>scrollBefore+10,'scroll before '+scrollBefore+' after '+scrollAfter));
   await evalJs("document.querySelector('#time-theatre').scrollIntoView({behavior:'instant',block:'center'})");
   await evalJs("(()=>{const e=document.querySelector('#time-range');e.value=750;e.dispatchEvent(new Event('input',{bubbles:true}))})()");
   await check('time scrub narrative '+w,async()=>assert.equal(await evalJs("document.querySelector('.time-story-line.is-current')?.dataset.moment"),'3'));
   await check('time scrub progress '+w,async()=>assert.equal(parseFloat(await evalJs("document.querySelector('#time-fill').style.width")),75));
   await evalJs("document.querySelector('#time-toggle').click()");await sleep(410);
   await check('time play advances '+w,async()=>assert(Number(await evalJs("document.querySelector('#time-range').value"))>750));
   await evalJs("document.querySelector('#time-toggle').click()");
   const stop=Number(await evalJs("document.querySelector('#time-range').value"));await sleep(270);
   await check('time pause interrupts '+w,async()=>assert(Math.abs(Number(await evalJs("document.querySelector('#time-range').value"))-stop)<2));
   await evalJs("document.querySelector('#edition').scrollIntoView({behavior:'instant'})");await sleep(200);await shot('round2-edition-'+w+'.png');
   await check('download points to PPTX '+w,async()=>assert((await evalJs("document.querySelector('.download-link').href")).endsWith('.pptx')));
  }
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await goto(390,844,true);
 await check('reduced-motion fallback',async()=>assert(await evalJs("document.querySelector('#optics-frame').classList.contains('is-fallback')")));
 await check('no JavaScript exceptions',()=>assert.equal(consoleErrors.length,0,consoleErrors.join(';')));
 fs.writeFileSync(path.join(OUT,'browser-qa.json'),JSON.stringify({timestamp:new Date().toISOString(),checks,perf,consoleErrors,environment:'Headless Microsoft Edge via CDP (not physical mobile Safari)'},null,2));
 console.log('BROWSER_QA_PASS',checks.length,'consoleErrors',consoleErrors.length);
})().catch(e=>{console.error('BROWSER_QA_FAILED',e);process.exitCode=1}).finally(async()=>{try{socket?.close()}catch{}try{edge?.kill()}catch{}});
