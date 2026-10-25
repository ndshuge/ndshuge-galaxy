"use strict";
const fs=require("node:fs"),path=require("node:path"),http=require("node:http"),os=require("node:os"),assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
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
 if(!source.includes('<lg-segmented')||!source.includes('src="./refined.js"'))errors.push("real glass component wiring absent");
 if(!fs.existsSync(path.join(ROOT,"LIQUID_GLASS_LICENSE.txt")))errors.push("upstream license missing");
 if(!engine.includes("feDisplacementMap")||!components.includes("createGlass(")||!components.includes("createSpring("))errors.push("actual refraction and spring engine missing");
 if(!script.includes('import "./components.js"')||!script.includes('createSpring('))errors.push("real Skill-based motion unavailable");
 if(!css.includes("@media(prefers-reduced-motion:reduce)")||!css.includes("font-size:13px"))errors.push("motion accessibility / typography missing");
 return errors;
}
assert.deepEqual(requirements(html),[], "calendar core requirements");
const mutant=requirements(html.replace('src="./refined.js"','src="./fake.js"').replace('<lg-segmented','<div'));
assert(mutant.length>0,"NEGATIVE TEST: sabotaged skill integration must be rejected");
if(process.argv.includes("--static")){console.log("PASS: requirements and intentional sabotage rejection");process.exit(0)}
let server,edge,ws,id=0;const callbacks=new Map(),faults=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function send(method,params={}){const n=++id;return new Promise((resolve,reject)=>{callbacks.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(callbacks.has(n)){callbacks.delete(n);reject(new Error("timeout "+method))}},9000)})}
async function evaluate(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function checkViewport(w,h){
 await send("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:"http://127.0.0.1:"+PORT+"/index.html?qa="+w});
 for(let i=0;i<50;i++){if(await evaluate("document.readyState === 'complete' && !!document.querySelector('#grid .day')"))break;await sleep(110)}
 await sleep(400);
 const state=await evaluate(`(()=>{const a=document.querySelector('.actions').getBoundingClientRect(),s=document.querySelector('lg-segmented'),c=s?.querySelector('.lg-refract');return {width:innerWidth,scroll:document.documentElement.scrollWidth,month:document.querySelector('#month').textContent,actionRight:a.right,glass:!!c,filter:c?getComputedStyle(c).filter:null,spring:typeof s?.xs?.set==='function',css:!!document.querySelector('link[href="./refined.css"]'),titleSize:parseFloat(getComputedStyle(document.querySelector('.top h1')).fontSize)}})()`);
 assert(state.scroll<=w+1,"horizontal overflow "+w);
 assert(state.actionRight<=w+1,"action buttons out of viewport "+w);
 assert(state.glass&&state.spring&&state.css,"Skill runtime failed "+JSON.stringify(state));
 assert(state.filter&&state.filter.includes("url("),"real SVG refraction not applied "+JSON.stringify(state));
 assert(state.titleSize>=20,"title text too small");
 await evaluate("document.querySelector('#weekMode').click()");
 assert.equal(await evaluate("document.querySelectorAll('#grid .day').length"),7,"week mode failed");
 await evaluate("document.querySelector('#monthMode').click()");
 assert.equal(await evaluate("document.querySelectorAll('#grid .day').length"),42,"month mode failed");
 if(w<=390){
   assert.equal(await evaluate("getComputedStyle(document.querySelector('.shixu-dock')).display"),"block","mobile glass dock absent");
   assert.equal(await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');return !!d?.surface&&!!d?.lens&&typeof d?.xs?.set==='function'})()"),true,"installed optical Dock component not initialized");
   await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');const r=d.getBoundingClientRect();d.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));})()");
   await sleep(160);
   assert.equal(await evaluate("(()=>{const d=document.querySelector('.shixu-dock lg-dock');return d?.presence>0.02&&d?.lens!==null})()"),true,"optical Dock spring did not respond to pointer");
   await evaluate("document.querySelector('#dockView').click()");
   assert.equal(await evaluate("document.querySelectorAll('#grid .day').length"),7,"dock week switch failed");
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
 ws.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id){const cb=callbacks.get(m.id);if(cb){callbacks.delete(m.id);m.error?cb.reject(Error(JSON.stringify(m.error))):cb.resolve(m.result)}}if(m.method==="Runtime.exceptionThrown")faults.push(m.params.exceptionDetails.text)});
 await send("Page.enable");await send("Runtime.enable");
 const reports=[];
 for(const [w,h] of [[320,700],[390,844],[768,900],[1440,900]])reports.push(await checkViewport(w,h));
 await send("Page.navigate",{url:"http://127.0.0.1:"+PORT+"/glass-lab.html"});
 for(let i=0;i<40;i++){if(await evaluate("document.readyState===\u0027complete\u0027 && customElements.get(\u0027lg-lens\u0027)!==undefined"))break;await sleep(130)}
 await sleep(450);
 const optical=await evaluate("(()=>{const l=document.querySelector(\u0027lg-lens\u0027);const c=l?.querySelector(\u0027.lg-lens__content\u0027);return {lens:!!l?.glass,spring:typeof l?.xs?.set===\u0027function\u0027,height:c?.getBoundingClientRect().height,filter:c?getComputedStyle(c).filter:null}})()");
 assert(optical.lens&&optical.spring&&optical.height>100&&optical.filter?.includes("url("),"live optics demo did not render "+JSON.stringify(optical));
 reports.push({opticsLab:optical});
 assert.equal(faults.length,0,"runtime errors: "+faults.join(";"));
 console.log("PASS: four viewports, real SVG refraction + spring, creation/edit/delete, week/month, mutation test");
 fs.writeFileSync(path.join(ROOT,"qa-local.json"),JSON.stringify({pass:true,reports,faults},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(()=>{try{ws?.close()}catch{}try{edge?.kill()}catch{}try{server?.close()}catch{}});
