"use strict";
// Isolated headless Edge CDP verification; no user browser profile, no foreground windows.
const fs=require("node:fs"),path=require("node:path"),http=require("node:http"),assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const ROOT=__dirname,PORT=53741,DEBUG=53742;
const EDGE="C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const get=url=>new Promise((res,rej)=>http.get(url,r=>{let s="";r.on("data",c=>s+=c);r.on("end",()=>res(s));}).on("error",rej));
let server,edge,socket,id=0;const waiting=new Map(),errors=[],reports=[];
function send(method,params={}){const n=++id;return new Promise((resolve,reject)=>{waiting.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(waiting.has(n)){waiting.delete(n);reject(Error(method+" timed out"));}},12000);});}
async function ev(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function waitFor(fn){for(let i=0;i<50;i++){if(await fn())return;await sleep(120);}throw Error("Page not ready");}
async function scenario(w,h){
 await send("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:"http://127.0.0.1:"+PORT+"/index.html"});
 await waitFor(async()=>await ev("document.readyState==='complete' && document.querySelectorAll('.lyric').length===11"));
 await sleep(350);
 const baseline=await ev(`(()=>{const r=document.querySelector('.control-zone').getBoundingClientRect();const art=document.querySelector('.art-side').getBoundingClientRect();return {w:innerWidth,h:innerHeight,scroll:document.documentElement.scrollWidth,controlsBottom:r.bottom,artVisible:getComputedStyle(document.querySelector('.art-side')).display!=='none',artSize:art.width,filter:getComputedStyle(document.querySelector('#large-cover')).filter,coverLoaded:document.querySelector('#large-cover').naturalWidth>0,engine:!!window.__albumLens,title:document.querySelector('#song-title').textContent}})()`);
 assert.equal(baseline.w,w);assert(baseline.scroll<=w+1,"horizontal overflow");
 assert(baseline.controlsBottom<=h+4,"controls clipped: "+w+" "+baseline.controlsBottom);
 assert(baseline.coverLoaded,"cover not loaded");
 if(w===390){assert(baseline.artVisible&&baseline.artSize>140,"mobile hero missing");assert(baseline.engine,"optical engine not initialized");}
 await ev("document.querySelector('#play').click()");
 assert((await ev("document.querySelector('#play').getAttribute('aria-label')")).includes("继续"),"pause failed");
 await ev("document.querySelector('#next').click()");
 assert.equal(await ev("document.querySelector('#song-title').textContent"),"潮汐来信","next failed");
 const opticsAfter=await ev("({engine:!!window.__albumLens,filter:getComputedStyle(document.querySelector('#large-cover')).filter})");
 if(w===390)assert(opticsAfter.filter.includes("url("),"track change removed refraction");
 await ev("document.querySelector('#queue').click()");
 assert.equal(await ev("document.querySelector('#queue-drawer').classList.contains('hidden')"),false,"queue did not open");
 await ev("document.querySelector('#close-queue').click()");
 assert.equal(await ev("document.querySelector('#queue-drawer').classList.contains('hidden')"),true,"queue did not close");
 await ev("document.querySelector('#favorite').click()");
 assert.equal(await ev("document.querySelector('#favorite').getAttribute('aria-pressed')"),"true","favorite failed");
 await ev("document.querySelector('#toggle-lyrics').click()");
 assert.equal(await ev("document.querySelector('#lyrics-viewport').style.visibility"),"hidden","lyrics toggle failed");
 const report={viewport:[w,h],baseline,afterSwitch:opticsAfter,checks:["layout","art","play","next","queue","favorite","lyrics"]};
 reports.push(report);return report;
}
(async()=>{
 server=http.createServer((req,res)=>{const relative=decodeURIComponent((req.url||"/").split("?")[0]);const f=path.resolve(ROOT,"."+relative);if(!f.startsWith(ROOT+path.sep)&&f!==ROOT){res.writeHead(403);return res.end();}fs.readFile(f,(err,b)=>{if(err){res.writeHead(404);return res.end();}const ext=path.extname(f);res.writeHead(200,{"Content-Type":ext===".html"?"text/html; charset=utf-8":ext===".css"?"text/css":ext===".js"?"text/javascript":ext===".svg"?"image/svg+xml":"application/octet-stream"});res.end(b);});});
 await new Promise(r=>server.listen(PORT,"127.0.0.1",r));
 const profile=path.join(require("node:os").tmpdir(),"moonlight-cdp-qa-"+process.pid);
 edge=spawn(EDGE,["--headless=new","--no-first-run","--no-default-browser-check","--remote-debugging-port="+DEBUG,"--remote-allow-origins=*","--user-data-dir="+profile,"--window-size=1440,900","about:blank"],{stdio:"ignore",windowsHide:true});
 let target;
 for(let i=0;i<80;i++){try{const tabs=JSON.parse(await get("http://127.0.0.1:"+DEBUG+"/json"));target=tabs.find(t=>t.type==="page"&&t.webSocketDebuggerUrl);if(target)break;}catch{}await sleep(150);}
 assert(target,"Edge unavailable");socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.addEventListener("open",r,{once:true});socket.addEventListener("error",j,{once:true});});
 socket.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.id){const w=waiting.get(m.id);if(w){waiting.delete(m.id);m.error?w.reject(Error(JSON.stringify(m.error))):w.resolve(m.result);}}if(m.method==="Runtime.exceptionThrown")errors.push(m.params.exceptionDetails.text);});
 await send("Page.enable");await send("Runtime.enable");
 for(const v of [[320,700],[390,844],[768,900],[1440,900]])await scenario(...v);
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"},{name:"prefers-reduced-transparency",value:"reduce"}]});
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:"http://127.0.0.1:"+PORT+"/index.html?reduced=1"});
 await waitFor(async()=>await ev("document.readyState===\u0027complete\u0027 && document.querySelectorAll(\u0027.lyric\u0027).length===11"));
 await sleep(400);
 const reduced=await ev("({lens:!!window.__albumLens,ambAnimation:getComputedStyle(document.querySelector(\u0027.ambient-a\u0027)).animationName,filter:getComputedStyle(document.querySelector(\u0027#large-cover\u0027)).filter})");
 assert.equal(reduced.lens,false,"reduced transparency must disable optics");
 assert.equal(reduced.ambAnimation,"none","reduced motion must disable ambient animation");
 reports.push({viewport:[390,844],reducedMedia:reduced,checks:["reduced-motion","reduced-transparency"]});
 assert.equal(errors.length,0,"JS runtime errors: "+errors.join(" | "));
 fs.writeFileSync(path.join(ROOT,"qa-browser-results.json"),JSON.stringify({pass:true,errors,reports},null,2));
 console.log("PASS: four Edge viewports, real refraction, controls and zero JS exceptions");
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(async()=>{try{socket?.close()}catch{}try{edge?.kill()}catch{}try{server?.close()}catch{}});
