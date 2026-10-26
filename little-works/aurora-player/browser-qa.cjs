"use strict";
const fs=require("node:fs"),path=require("node:path"),http=require("node:http"),assert=require("node:assert/strict");
const {spawn}=require("node:child_process");const ROOT=__dirname,PORT=53831,DEBUG=53832;
const EDGE="C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const wait=ms=>new Promise(r=>setTimeout(r,ms));const get=u=>new Promise((resolve,reject)=>http.get(u,r=>{let s="";r.on("data",c=>s+=c);r.on("end",()=>resolve(s))}).on("error",reject));
let server,edge,socket,id=0;const pending=new Map(),errors=[],reports=[];
function call(method,params={}){const n=++id;return new Promise((resolve,reject)=>{pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.has(n)){pending.delete(n);reject(Error("Timeout "+method))}},14000)})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function until(test){for(let i=0;i<65;i++){if(await test())return;await wait(120)}throw Error("Page never became ready")}
async function screenshot(w){const r=await call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.writeFileSync(path.join(ROOT,"qa-edge-"+w+".png"),Buffer.from(r.data,"base64"))}
async function scenario(w,h){await call("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:false});
await call("Page.navigate",{url:"http://127.0.0.1:"+PORT+"/index.html?size="+w});
await until(async()=>await ev("document.readyState==='complete'&&!!window.__auroraPlayer&&document.querySelector('#audio').readyState>=1"));await wait(1700);
const measure=await ev("(()=>{const dock=document.querySelector('.player-dock').getBoundingClientRect(); const art=document.querySelector('#art-cover').getBoundingClientRect(); const audio=document.querySelector('#audio');return {width:innerWidth,scroll:document.documentElement.scrollWidth,dockBottom:dock.bottom,dockTop:dock.top,artWidth:art.width,artHeight:art.height,glass:!!window.__auroraGlass,filter:getComputedStyle(document.querySelector('#cover-art')).filter,displacement:document.querySelectorAll('feDisplacementMap').length,coverLoaded:document.querySelector('#cover-art').naturalWidth>0,audioReady:audio.readyState,audioDuration:audio.duration,navVisible:getComputedStyle(document.querySelector('.library-nav')).display!=='none',title:getComputedStyle(document.querySelector('h1')).fontSize}})()");
assert(measure.coverLoaded,"Missing cover");assert(measure.width===w);assert(measure.scroll<=w+1,"Horizontal overflow "+w+" "+measure.scroll);
assert(measure.dockBottom<=h+4&&measure.dockBottom>h-95,"Dock out of view "+w);
assert(measure.artWidth>185,"Art too small "+w);
assert(measure.audioDuration>35,"Audio decode metadata incorrect "+measure.audioDuration);
assert(measure.glass&&measure.displacement>0&&measure.filter.includes("url("),"SVG optical engine not active "+w+" "+measure.filter+" "+await ev("JSON.stringify({error:window.__glassError,ready:document.readyState,size:document.querySelector(\u0027#cover-art\u0027).clientWidth,reduced:matchMedia(\u0027(prefers-reduced-transparency: reduce)\u0027).matches,glass:typeof window.__auroraGlass})"));
await screenshot(w);
await ev("document.querySelector('#play-pause').click()");await until(async()=>await ev("document.querySelector('#audio').currentTime>0.04"));
const playback=await ev("({playing:!document.querySelector('#audio').paused,time:document.querySelector('#audio').currentTime,duration:document.querySelector('#audio').duration})");
assert(playback.playing&&playback.time>0,"Audio did not actually play "+w+" "+JSON.stringify(playback));
await ev("document.querySelector('#seek').value='42';document.querySelector('#seek').dispatchEvent(new Event('input',{bubbles:true}))");await wait(120);
assert((await ev("document.querySelector('#audio').currentTime"))>10,"Seek failed");
await ev("document.querySelector('#next').click()");await wait(200);
assert.equal(await ev("document.querySelector('#track-title').textContent"),"潮汐之间","Next failed");
await ev("document.querySelector('#favorite-button').click()");assert.equal(await ev("document.querySelector('#favorite-button').getAttribute('aria-pressed')"),"true");
await ev("document.querySelector('#toggle-lyrics').click()");assert.equal(await ev("document.querySelector('#lyrics-panel').hidden"),false);
await ev("document.querySelector('#queue-toggle').click()");assert.equal(await ev("document.querySelector('#queue-toggle').getAttribute('aria-expanded')"),w<=1030?"true":"false");
await ev("document.querySelector('#repeat').click();document.querySelector('#shuffle').click()");assert.equal(await ev("document.querySelector('#shuffle').getAttribute('aria-pressed')"),"true");
await ev("document.querySelector('#play-pause').click()");await wait(50);reports.push({viewport:[w,h],measure,playback,checks:["layout","cover","real-audio","seek","next","favorite","lyrics","queue","shuffle","loop","svg-refraction"]});}
(async()=>{
server=http.createServer((req,res)=>{const relative=decodeURIComponent((req.url||"/").split("?")[0]);const f=path.resolve(ROOT,"."+relative);if(!f.startsWith(ROOT+path.sep)&&f!==ROOT){res.writeHead(403);return res.end()}fs.stat(f,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);return res.end()}const ext=path.extname(f),kind=({".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".ogg":"audio/ogg",".mp3":"audio/mpeg"})[ext]||"application/octet-stream";const match=/bytes=(\\d+)-(\\d*)/.exec(req.headers.range||"");if(match){const start=Number(match[1]),end=match[2]?Number(match[2]):st.size-1;res.writeHead(206,{"Content-Type":kind,"Accept-Ranges":"bytes","Content-Range":`bytes ${start}-${end}/${st.size}`,"Content-Length":end-start+1});fs.createReadStream(f,{start,end}).pipe(res)}else{res.writeHead(200,{"Content-Type":kind,"Accept-Ranges":"bytes","Content-Length":st.size});fs.createReadStream(f).pipe(res)}})});
await new Promise(r=>server.listen(PORT,"127.0.0.1",r));
const profile=path.join(require("node:os").tmpdir(),"aurora-qa-"+process.pid);
edge=spawn(EDGE,["--headless=new","--no-first-run","--disable-gpu-sandbox","--autoplay-policy=no-user-gesture-required","--remote-debugging-port="+DEBUG,"--remote-allow-origins=*","--user-data-dir="+profile,"--window-size=1440,900","about:blank"],{stdio:"ignore",windowsHide:true});
let target;for(let i=0;i<75;i++){try{target=JSON.parse(await get("http://127.0.0.1:"+DEBUG+"/json")).find(t=>t.type==="page"&&t.webSocketDebuggerUrl);if(target)break}catch{}await wait(130)}assert(target,"Cannot start Edge");
socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener("open",r,{once:true});socket.addEventListener("error",j,{once:true})});
socket.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.id){const q=pending.get(m.id);if(q){pending.delete(m.id);m.error?q.reject(Error(JSON.stringify(m.error))):q.resolve(m.result)}}if(m.method==="Runtime.exceptionThrown")errors.push(m.params.exceptionDetails.text)});
await call("Page.enable");await call("Runtime.enable");
for(const dims of [[320,700],[390,844],[768,900],[1440,900]])await scenario(...dims);
await ev("window.__auroraPlayer.importFiles([new File([new Uint8Array(1000)],'test-audio.wav',{type:'audio/wav'})])");
assert.equal(await ev("window.__auroraPlayer.getState().tracks"),4,"Import failed");
await call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"},{name:"prefers-reduced-transparency",value:"reduce"}]});
await call("Page.navigate",{url:"http://127.0.0.1:"+PORT+"/index.html?reduced"});
await until(async()=>await ev("document.readyState==='complete'&&!!window.__auroraPlayer"));await wait(200);
const reduced=await ev("({glass:!!window.__auroraGlass,animation:getComputedStyle(document.querySelector('.aurora-one')).animationName})");
assert(!reduced.glass&&reduced.animation==="none","Reduced media fallback broken");
reports.push({reduced,checks:["reduced-motion","reduced-transparency","local-file-import"]});
assert.equal(errors.length,0,errors.join(" | "));
fs.writeFileSync(path.join(ROOT,"qa-browser-results.json"),JSON.stringify({pass:true,reports,errors},null,2));
console.log("PASS: 320/390/768/1440 real audio and controls, import, SVG optics, reduced settings, 0 exceptions");
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(()=>{try{socket?.close()}catch{}try{edge?.kill()}catch{}try{server?.close()}catch{}});
