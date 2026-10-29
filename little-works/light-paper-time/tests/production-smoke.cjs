// Production-only headless Edge CDP smoke: tests actual GitHub Pages, not local server.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawn}=require('node:child_process');const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');const OUT=path.join(ROOT,'qa');
const URL='https://ndshuge.github.io/ndshuge-galaxy/little-works/light-paper-time/';
const EXE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';const PORT=53175;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const request=url=>new Promise((yes,no)=>http.get(url,r=>{let s='';r.on('data',c=>s+=c);r.on('end',()=>yes(s))}).on('error',no));
let proc,socket,n=0;const pending=new Map(),errors=[],results=[];
async function call(method,params={}){const id=++n;return await new Promise((yes,no)=>{pending.set(id,{yes,no});socket.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);no(Error(method+' timeout'))}},18000)})}
async function js(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function until(fn,count=110){for(let i=0;i<count;i++){if(await fn())return;await sleep(130)}throw Error('Production page timed out')}
async function test(name,fn){const value=await fn();results.push({name,value:value??'ok'});console.log('LIVE_PASS',name,typeof value==='object'?JSON.stringify(value):value??'')}
async function visit(w,h,touch){await call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:touch});await call('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:1});await call('Page.navigate',{url:URL+'?release=0dd58bb'});await until(async()=>await js("document.readyState==='complete' && document.querySelector('#optics-frame')?.dataset.optics==='webgl'"));await until(async()=>await js("document.querySelector('.opening-image img')?.complete && document.querySelector('.opening-image img')?.naturalWidth>0"));}
async function screenshot(name){const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name),Buffer.from(r.data,'base64'))}
(async()=>{
 proc=spawn(EXE,['--headless=new','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-extensions','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port='+PORT,'--remote-allow-origins=*','--user-data-dir='+path.join(OUT,'cdp-prod-profile'),'--window-size=1440,900','about:blank'],{stdio:'ignore',windowsHide:true});
 let target;for(let i=0;i<90;i++){try{target=JSON.parse(await request('http://127.0.0.1:'+PORT+'/json')).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(target)break}catch{}await sleep(140)}
 assert(target,'Edge CDP did not start');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((yes,no)=>{socket.addEventListener('open',yes,{once:true});socket.addEventListener('error',no,{once:true})});
 socket.addEventListener('message',e=>{const msg=JSON.parse(e.data);if(msg.id){const x=pending.get(msg.id);if(x){pending.delete(msg.id);msg.error?x.no(Error(JSON.stringify(msg.error))):x.yes(msg.result)}}if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text)});
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 for(const [w,h,touch] of [[1440,900,false],[390,844,true]]){
  await visit(w,h,touch);
  await test('public page '+w,async()=>{const x=await js("({title:document.title,width:document.documentElement.scrollWidth,viewport:innerWidth,sections:document.querySelectorAll('.gallery-section').length})");assert(x.title.includes('折光档案'));assert(x.width<=x.viewport+1);assert(x.sections===4);return x});
  await test('WebGL optics public '+w,async()=>assert.equal(await js("document.querySelector('#optics-frame').dataset.optics"),'webgl'));
  await test('public slide download binary '+w,async()=>{
   const o=await js("(async()=>{const r=await fetch('./Light-Paper-Time.pptx',{cache:'no-store'});const b=new Uint8Array(await r.arrayBuffer());const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',b));return {status:r.status,size:b.length,magic:String.fromCharCode(b[0],b[1]),sha256:[...hash].map(x=>x.toString(16).padStart(2,'0')).join('')}})()");
   assert.equal(o.status,200);assert.equal(o.magic,'PK');assert(o.size>200000);return o;
  });
  await test('public gallery catalog '+w,async()=>{const o=await js("(async()=>{const r=await fetch('../catalog.json',{cache:'no-store'});const j=await r.json();return {status:r.status,count:j.length,exists:j.some(x=>x.slug==='light-paper-time')}})()");assert.equal(o.status,200);assert(o.exists);return o});
  await screenshot('production-'+w+'.png');
 }
 await test('no public JS exceptions',async()=>assert.equal(errors.length,0,JSON.stringify(errors)));
 fs.writeFileSync(path.join(OUT,'production-smoke.json'),JSON.stringify({url:URL,at:new Date().toISOString(),checks:results,exceptions:errors},null,2));
 console.log('PRODUCTION_SMOKE_PASS',results.length,'exceptions',errors.length);
})().catch(e=>{console.error('PRODUCTION_SMOKE_FAILED',e);process.exitCode=1}).finally(()=>{try{socket?.close()}catch{}try{proc?.kill()}catch{}});
