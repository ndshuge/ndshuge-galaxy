"use strict";
const fs=require("node:fs"),path=require("node:path"),http=require("node:http"),os=require("node:os"),assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const REMOTE=process.argv.includes("--remote")?"https://ndshuge.github.io/ndshuge-galaxy/little-works/glass-calendar/":null;
const ROOT=__dirname,PORT=53753,DEBUG=53754,EDGE="C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const css=fs.readFileSync(path.join(ROOT,"refined.css"),"utf8");
const script=fs.readFileSync(path.join(ROOT,"refined.js"),"utf8");
const engine=fs.readFileSync(path.join(ROOT,"liquid-glass.js"),"utf8");
const components=fs.readFileSync(path.join(ROOT,"components.js"),"utf8");
const lab=fs.readFileSync(path.join(ROOT,"glass-lab.html"),"utf8");
assert(lab.includes("<lg-lens")&&lab.includes("src=\"./components.js\""),"optics demonstration is missing");
function requirements(source){
 const errors=[];
 if(!source.includes('<lg-segmented')||!source.includes('src="./refined.js?v=20261026-integrated-dock"'))errors.push("real glass component wiring absent");
 if(!fs.existsSync(path.join(ROOT,"LIQUID_GLASS_LICENSE.txt")))errors.push("upstream license missing");
 if(!engine.includes("feDisplacementMap")||!components.includes("createGlass(")||!components.includes("createSpring("))errors.push("actual refraction and spring engine missing");
 if(!script.includes('import "./components.js?v=20261026-integrated-dock"')||!script.includes('createSpring('))errors.push("real Skill-based motion unavailable");
 if(!css.includes("@media(prefers-reduced-motion:reduce)")||!css.includes("font-size:13px"))errors.push("motion accessibility / typography missing");
 return errors;
}
assert.deepEqual(requirements(html),[], "calendar core requirements");
assert(components.includes("lg-dock__glint")&&!components.includes("this.lens = createGlass(this.items"),"regression: full-text circular magnifier may duplicate labels");
const mutant=requirements(html.replace('src="./refined.js?v=20261026-integrated-dock"','src="./fake.js"').replace('<lg-segmented','<div'));
assert(mutant.length>0,"NEGATIVE TEST: sabotaged skill integration must be rejected");
if(process.argv.includes("--static")){console.log("PASS: requirements and intentional sabotage rejection");process.exit(0)}
let server,edge,ws,id=0;const callbacks=new Map(),faults=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function send(method,params={}){const n=++id;return new Promise((resolve,reject)=>{callbacks.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(callbacks.has(n)){callbacks.delete(n);reject(new Error("timeout "+method))}},9000)})}
async function evaluate(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function checkViewport(w,h){
 await send("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:REMOTE?REMOTE+"?qa="+w+"&v=f1c09f1":"http://127.0.0.1:"+PORT+"/index.html?qa="+w});
 for(let i=0;i<50;i++){if(await evaluate("document.readyState === 'complete' && !!document.querySelector('#grid .day')"))break;await sleep(110)}
 await sleep(400);
 // Wait for the SVG filter to attach, not merely for DOMContentLoaded.
 for(let attempt=0;attempt<32;attempt++){
   if(await evaluate("(()=>{const e=document.querySelector('.segment .lg-refract');return !!e && getComputedStyle(e).filter.includes('url(')})()"))break;
   await sleep(120);
 }
 const state=await evaluate(`(()=>{const a=document.querySelector('.actions').getBoundingClientRect(),s=document.querySelector('lg-segmented'),c=s?.querySelector('.lg-refract');return {width:innerWidth,scroll:document.documentElement.scrollWidth,month:document.querySelector('#month').textContent,actionRight:a.right,glass:!!c,filter:c?getComputedStyle(c).filter:null,spring:typeof s?.xs?.set==='function',css:!!document.querySelector('link[href="./refined.css"]'),titleSize:parseFloat(getComputedStyle(document.querySelector('.top h1')).fontSize)}})()`);
 assert(state.scroll<=w+1,"horizontal overflow "+w);
 if(w<=390) assert((await evaluate("document.documentElement.clientWidth"))>=w-1,"mobile visible document scrollbar "+w);
 if(w<=390 && h<=700)assert.equal(await evaluate("(()=>{const n=document.querySelector('#grid .day.selected .number'),d=document.querySelector('.shixu-dock');return n && n.getBoundingClientRect().bottom+2 < d.getBoundingClientRect().top})()"),true,"floating Dock covers the selected date on compact screens");
 assert(state.actionRight<=w+1,"action buttons out of viewport "+w);
 assert(state.glass&&state.spring&&state.css,"Skill runtime failed "+JSON.stringify(state));
 assert(state.filter&&state.filter.includes("url("),"real SVG refraction not applied "+JSON.stringify(state));
 assert(state.titleSize>=20,"title text too small");
 if(w<=390){
  assert.equal(await evaluate("(()=>{const head=document.querySelector('.calheader'),prev=document.querySelector('#prev'),next=document.querySelector('#next'),nav=head?.querySelector('.calendar-nav'),theme=document.querySelector('#themeToggle'),top=document.querySelector('.top');if(!nav||prev.parentElement!==nav||next.parentElement!==nav||!top.contains(theme))return false;const a=nav.getBoundingClientRect(),m=head.getBoundingClientRect();return a.left>=m.left && a.right<=m.right+1 && prev.getBoundingClientRect().right<=next.getBoundingClientRect().left+2})()"),true,"Calendar navigation is not correctly grouped or overlaps");
  assert.equal(await evaluate("(()=>{const a=document.querySelector('#prev'),b=document.querySelector('#next');return getComputedStyle(a).transform==='none'&&getComputedStyle(b).transform==='none'&&getComputedStyle(a).width!=='0px'})()"),true,"Nav controls must keep stable tap targets");
 }
 if(REMOTE&&w===390){const snapshot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.writeFileSync(path.join(ROOT,"qa-online-cdp-390.png"),Buffer.from(snapshot.data,"base64"));}
 await evaluate("document.querySelector('#weekMode').click()");
 assert.equal(await evaluate("document.querySelectorAll('#grid .day').length"),7,"week mode failed");
 await evaluate("document.querySelector('#monthMode').click()");
 assert.equal(await evaluate("document.querySelectorAll('#grid .day').length"),42,"month mode failed");
 if(w<=390){
   assert.equal(await evaluate("getComputedStyle(document.querySelector('.shixu-dock')).display"),"block","mobile glass dock absent");
   assert.equal(await evaluate("(()=>{const d=document.querySelector('.shixu-dock'),c=document.querySelector('.calendar'),b=document.querySelector('.below');return d.parentElement===c.parentElement && d.getBoundingClientRect().top>=c.getBoundingClientRect().bottom-18 && b.getBoundingClientRect().top>=d.getBoundingClientRect().bottom+10})()"),true,"Dock must stay in normal flow between calendar and agenda, without covering content");
   assert.equal(await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');return !!d?.surface?.glass&&!!d?.glint&&typeof d?.xs?.set==='function'&&d.surface.mode==='backdrop'&&getComputedStyle(d.surface.layer).backdropFilter.includes('url(')})()"),true,"installed optical Dock component not initialized");
   if(w===390) assert.equal(await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');return !!d?.glint && d.presence<0.02 && getComputedStyle(document.querySelector('#dockToday')).transform==='none'})()"),true,"Dock must not show an idle bubble or scale interactive buttons");
   await evaluate("(()=>{const b=document.querySelector('#dockView');const r=b.getBoundingClientRect();b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:r.left+r.width/2,clientY:r.top+r.height/2}));})()");
   for(let retry=0;retry<10;retry++){
     if(await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');return d?.presence>0.02&&!!d?.glint})()"))break;
     await sleep(100);
   }
   assert.equal(await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');return d?.presence>0.02&&!!d?.glint})()"),true,"optical Dock spring did not respond to pointer");
   if(w===390 && !await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")){
     await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');const r=d.getBoundingClientRect();d.dispatchEvent(new PointerEvent('pointerup',{bubbles:false,pointerType:'touch',clientX:r.left+r.width/2,clientY:r.top+r.height/2}));})()");
     await sleep(470);
     assert.equal(await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');return d.presence>0.1 && !!d.glint})()"),true,"glass vanished too soon after release");
     const active=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
     fs.writeFileSync(path.join(ROOT,"qa-glass-hold-390.png"),Buffer.from(active.data,"base64"));
     await sleep(900);
     assert.equal(await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');return d.presence<0.08})()"),true,"glass remained as a stray bubble after hold");
   }
   assert.equal(await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');const r=d.getBoundingClientRect();const h=d.glint.getBoundingClientRect();return d.querySelectorAll('.lg-dock__items > button').length===3 && d.querySelectorAll('.lg-dock__items .lg-refract').length===0 && h.left>=r.left-1 && h.right<=r.right+1 && h.height<=r.height && getComputedStyle(d.querySelector('#dockView')).transform==='none';})()"),true,"Dock highlight detached from buttons or duplicated glyphs");
   await evaluate("document.querySelector('#dockView').click()");
   assert.equal(await evaluate("document.querySelectorAll('#grid .day').length"),7,"dock week switch failed");
   if(w===390 && h===844){
     const x0=await evaluate("(()=>{const b=document.querySelector('#dockToday'),r=b.getBoundingClientRect();b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:r.left+r.width/2,clientY:r.top+r.height/2}));return document.querySelector('.shixu-dock lg-dock').pos})()");
     await sleep(120);
     await evaluate("(()=>{const b=document.querySelector('#dockView'),r=b.getBoundingClientRect();b.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'touch',clientX:r.left+r.width/2,clientY:r.top+r.height/2}))})()");
     await sleep(115);
     const x1=await evaluate("document.querySelector('.shixu-dock lg-dock').pos");
     const xTarget=await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock'),b=document.querySelector('#dockView');return b.getBoundingClientRect().left-d.items.getBoundingClientRect().left+b.offsetWidth/2})()");
     assert(x1>x0+6 && x1<xTarget+4,"optical highlight did not travel elastically");
     const moving=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
     fs.writeFileSync(path.join(ROOT,"qa-motion-travel-390.png"),Buffer.from(moving.data,"base64"));
     await sleep(260);
     const x2=await evaluate("document.querySelector('.shixu-dock lg-dock').pos");
     assert(Math.abs(x2-xTarget)<9,"spring failed to settle to selected control");
     await evaluate("(()=>{const b=document.querySelector('#dockView'),r=b.getBoundingClientRect();b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',clientX:r.left+r.width/2,clientY:r.top+r.height/2}))})()");
   }
   await evaluate("document.querySelector('#dockView').click()");
   assert.equal(await evaluate("document.querySelectorAll('#grid .day').length"),42,"dock month switch failed");
   await evaluate("document.querySelector('#dockCreate').click()");
   assert.equal(await evaluate("document.querySelector('#overlay').classList.contains('open')"),true,"dock create failed");
   await evaluate("document.querySelector('#cancel').click()");
 }
 await evaluate("document.querySelector('#add').click()");
 assert.equal(await evaluate("document.documentElement.classList.contains(\u0027sheet-open\u0027)"),true,"sheet must lock background scroll");
 if(w===390){await sleep(450);const snap=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.writeFileSync(path.join(ROOT,"qa-modal-390.png"),Buffer.from(snap.data,"base64"));}
 assert.equal(await evaluate("document.querySelector('#overlay').classList.contains('open')"),true,"modal didn't open");
 await evaluate("(()=>{document.querySelector('#name').value='日历回归测试';document.querySelector('#date').value='2026-10-25';document.querySelector('#time').value='12:30';document.querySelector('#form').requestSubmit()})()");
 assert.equal(await evaluate("document.querySelectorAll('#agendas .agenda').length"),1,"create failed");
 await evaluate("document.querySelector('#agendas .agenda').click()");
 assert.equal(await evaluate("document.querySelector('#formTitle').textContent"),"编辑日程","edit failed");
 await evaluate("document.querySelector('#remove').click()");
 assert.equal(await evaluate("document.querySelectorAll('#agendas .agenda').length"),0,"delete failed");
 await evaluate("document.querySelector(\u0027#themeToggle\u0027).click()");
 assert.equal(await evaluate("document.body.dataset.theme"),"dark","dark theme failed");
 await evaluate("document.querySelector(\u0027#themeToggle\u0027).click()");
 assert.equal(await evaluate("document.body.dataset.theme"),"light","light theme failed");
 if(w<=390)assert.equal(await evaluate("(()=>{const top=document.querySelector('.top').getBoundingClientRect(),cal=document.querySelector('.calendar').getBoundingClientRect(),m=document.querySelector('.calheader .month').getBoundingClientRect(),controls=document.querySelector('.calendar-controls').getBoundingClientRect(),dock=document.querySelector('.shixu-dock').getBoundingClientRect(),below=document.querySelector('.below').getBoundingClientRect();return cal.top-top.bottom>=12&&controls.top-m.bottom>=8&&dock.top-cal.bottom>=8&&below.top-dock.bottom>=12})()"),true,"Apple spacing: header/toolbar/calendar/dock/agenda gaps incorrect");
 return state;
}
(async()=>{
 assert(fs.existsSync(EDGE),"Edge not found");
 server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent((req.url||"/").split("?")[0])}catch{res.writeHead(400);return res.end()}
  let f=path.resolve(ROOT,"."+pathname);
  if(f===ROOT)f=path.join(ROOT,"index.html");
  if(!f.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end()}
  fs.readFile(f,(err,bytes)=>{if(err){res.writeHead(404);return res.end()}const ext=path.extname(f);res.writeHead(200,{"Content-Type":ext===".js"?"text/javascript":ext===".css"?"text/css":ext===".html"?"text/html; charset=utf-8":"application/octet-stream"});res.end(bytes)})
 });
 await new Promise(ok=>server.listen(PORT,"127.0.0.1",ok));
 const profile=path.join(os.tmpdir(),"shixu-cdp-"+process.pid);
 edge=spawn(EDGE,["--headless=new","--no-first-run","--no-default-browser-check","--remote-debugging-port="+DEBUG,"--remote-allow-origins=*","--user-data-dir="+profile,"about:blank"],{windowsHide:true,stdio:"ignore"});
 let target;
 for(let i=0;i<80;i++){
   try{const tabs=await new Promise((res,rej)=>http.get("http://127.0.0.1:"+DEBUG+"/json",r=>{let s="";r.on("data",c=>s+=c);r.on("end",()=>res(JSON.parse(s)))}).on("error",rej));target=tabs.find(t=>t.type==="page"&&t.webSocketDebuggerUrl);if(target)break}catch{}
   await sleep(120)
 }
 assert(target,"CDP page not available");
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
 ws.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id){const cb=callbacks.get(m.id);if(cb){callbacks.delete(m.id);m.error?cb.reject(Error(JSON.stringify(m.error))):cb.resolve(m.result)}}if(m.method==="Runtime.exceptionThrown")faults.push(m.params.exceptionDetails.exception?.description || JSON.stringify(m.params.exceptionDetails))});
 await send("Page.enable");await send("Runtime.enable");
 const reports=[];
 for(const [w,h] of [[320,650],[320,700],[390,700],[390,844],[768,900],[1440,900]])reports.push(await checkViewport(w,h));
 await send("Page.navigate",{url:REMOTE?REMOTE+"glass-lab.html?v=f1c09f1":"http://127.0.0.1:"+PORT+"/glass-lab.html"});
 for(let i=0;i<40;i++){if(await evaluate("document.readyState===\u0027complete\u0027 && customElements.get(\u0027lg-lens\u0027)!==undefined"))break;await sleep(130)}
 await sleep(450);
 const optical=await evaluate("(()=>{const l=document.querySelector(\u0027lg-lens\u0027);const c=l?.querySelector(\u0027.lg-lens__content\u0027);return {lens:!!l?.glass,spring:typeof l?.xs?.set===\u0027function\u0027,height:c?.getBoundingClientRect().height,filter:c?getComputedStyle(c).filter:null}})()");
 assert(optical.lens&&optical.spring&&optical.height>100&&optical.filter?.includes("url("),"live optics demo did not render "+JSON.stringify(optical));
 reports.push({opticsLab:optical});
 assert.equal(faults.length,0,"runtime errors: "+faults.join(";"));
 console.log("PASS: six viewports, nonduplicating optical surface, traveling spring, modal, calendar CRUD, release hold, mutation test");
 fs.writeFileSync(path.join(ROOT,"qa-local.json"),JSON.stringify({pass:true,reports,faults},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(()=>{try{ws?.close()}catch{}try{edge?.kill()}catch{}try{server?.close()}catch{}});
