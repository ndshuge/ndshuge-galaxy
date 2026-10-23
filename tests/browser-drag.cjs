// Actual Chromium/Edge CDP gesture QA, headless and no foreground focus.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'), OUT=path.resolve(ROOT,'../../outputs/galaxy-upgrade');
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port=53671, debugPort=53672;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const get=url=>new Promise((resolve,reject)=>http.get(url,r=>{
 let s='';r.on('data',c=>s+=c);r.on('end',()=>resolve(s));}).on('error',reject));
let server,edge,socket,seq=0;
const waiting=new Map();const errors=[];
function send(method,params={}){
 const id=++seq;
 return new Promise((resolve,reject)=>{
  waiting.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
  setTimeout(()=>{if(waiting.has(id)){waiting.delete(id);reject(Error(method+' timeout'));}},10000);
 });
}
async function evalJs(expression){
 const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));
 return r.result.value;
}
async function waitFor(check,loops=80){
 for(let i=0;i<loops;i++){if(await check())return;await sleep(120);}throw Error('waitFor failed');
}
async function mouse(type,x,y,buttons=0){await send('Input.dispatchMouseEvent',{type,x,y,button:'left',buttons,clickCount:type==='mousePressed'||type==='mouseReleased'?1:0});}
async function touch(type,x,y){await send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1}]});}
async function screenshot(name){
 const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),Buffer.from(r.data,'base64'));
}
async function setup(w,h,mobile){
 // Explicit CSS viewport; touch input is independently emulated below.
 await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:1});
 await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/index.html'});
 await waitFor(async()=>!!(await evalJs("typeof window.__gx === 'function' && document.querySelectorAll('.destination').length===8")));
 await sleep(350);
}
(async()=>{
 server=http.createServer((req,res)=>{
  const relative=decodeURIComponent((req.url||'/').split('?')[0]);
  const full=path.resolve(ROOT,'.'+relative);
  if(!full.startsWith(ROOT+path.sep)&&full!==ROOT){res.writeHead(403);return res.end();}
  fs.readFile(full,(err,data)=>{
   if(err){res.writeHead(404);return res.end();}
   res.writeHead(200,{'Content-Type':full.endsWith('.html')?'text/html; charset=utf-8':full.endsWith('.css')?'text/css':'application/javascript'});
   res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 edge=spawn(EDGE,[
  '--headless=new','--disable-gpu','--disable-software-rasterizer=false',
  '--no-first-run','--no-default-browser-check','--disable-features=Translate',
  '--remote-debugging-port='+debugPort,'--remote-allow-origins=*',
  '--user-data-dir='+path.join(OUT,'cdp-temp-profile'),
  '--window-size=1440,900','about:blank'
 ],{stdio:'ignore',windowsHide:true});
 let target=null;
 for(let i=0;i<75;i++){
  try{
   const tabs=JSON.parse(await get('http://127.0.0.1:'+debugPort+'/json'));
   target=tabs.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
   if(target)break;
  }catch(e){}
  await sleep(180);
 }
 assert(target,'Edge remote debugging not ready');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});
 });
 socket.addEventListener('message',e=>{
  const m=JSON.parse(e.data);
  if(m.id){const w=waiting.get(m.id);if(w){waiting.delete(m.id);m.error?w.reject(Error(JSON.stringify(m.error))):w.resolve(m.result);}}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
 });
 await send('Page.enable');await send('Runtime.enable');
 const results=[];
 for(const [w,h,mobile] of [[1440,900,false],[375,812,true]]){
  await setup(w,h,mobile);
  const before=await evalJs('window.__gx()');
  const viewportMetrics=await evalJs("(()=>{let c=document.getElementById('controls').getBoundingClientRect();return{innerWidth,innerHeight,visualHeight:visualViewport.height,controlTop:c.top,controlBottom:c.bottom,scrollY:scrollY,docHeight:document.documentElement.scrollHeight}})()");
  assert.equal(viewportMetrics.innerWidth,w);
  assert.equal(viewportMetrics.innerHeight,h);
  assert(viewportMetrics.controlBottom<=h,'controls must be visible in device viewport');
  assert.equal(before.explore,false);
  assert.equal(before.destinations,8);
  const aBefore=await evalJs("(()=>{const r=document.querySelector('.destination').getBoundingClientRect();return{x:r.x,y:r.y}})()");
  const shipBefore=await evalJs('({x:rocket.x,y:rocket.y})');
  const headingsBefore=await evalJs("[...document.querySelectorAll('.constellation')].map(n=>({x:parseFloat(n.style.left),y:parseFloat(n.style.top)}))");
  if(mobile){
   await touch('touchStart',160,280);
   await touch('touchMove',205,310);
   await touch('touchMove',260,345);
   await touch('touchEnd',260,345);
  } else {
   await mouse('mouseMoved',180,280);
   await mouse('mousePressed',180,280,1);
   await mouse('mouseMoved',230,320,1);
   await mouse('mouseMoved',290,350,1);
   await mouse('mouseReleased',290,350);
  }
  await sleep(850); // Original 1.5/sec camera follow: allow its natural easing.
  const moved=await evalJs('window.__gx()');
  assert(moved.explore,'drag must enable explore');
  assert(Math.abs(moved.cam[0])>15,'drag must pan the camera');
  assert.equal(moved.warpActive,false,'drag must not warp');
  const aAfter=await evalJs("(()=>{const r=document.querySelector('.destination').getBoundingClientRect();return{x:r.x,y:r.y}})()");
  const shipAfter=await evalJs('({x:rocket.x,y:rocket.y})');
  const headingsAfter=await evalJs("[...document.querySelectorAll('.constellation')].map(n=>({x:parseFloat(n.style.left),y:parseFloat(n.style.top),hidden:n.hidden}))");
  assert(Math.abs(aAfter.x-aBefore.x)>10,'labels must follow starfield');
  assert(Math.hypot(shipAfter.x-shipBefore.x,shipAfter.y-shipBefore.y)>10,'original rocket must visibly follow the pointer');
  assert(headingsAfter.some((g,i)=>Math.hypot(g.x-headingsBefore[i].x,g.y-headingsBefore[i].y)>10),'grey cluster headings must travel with the world');
  const correctGroups=await evalJs("[...document.querySelectorAll('.constellation')].every((el,i)=>{const g=groupWorld[i];const x=((g[0]-CX)*M.zoom+CX-M.driveX)*sceneWidth/W;const y=((g[1]-CY)*M.zoom+CY-M.driveY)*sceneHeight/H;return Math.abs(parseFloat(el.style.left)-x)<.1&&Math.abs(parseFloat(el.style.top)-y)<.1;})");
  assert(correctGroups,'each group heading must share the exact galaxy-camera transform');
  await screenshot(mobile?'gesture-qa-mobile.png':'gesture-qa-desktop.png');
  const beforeReset=moved.cam[0];
  await send('Runtime.evaluate',{expression:"document.getElementById('homeBtn').click()"});
  await sleep(280);
  const reset=await evalJs('window.__gx()');
  assert.equal(reset.explore,false);
  assert.equal(reset.cam[0],0);
  // Swiping a real HTML link must pan and suppress synthetic click navigation.
  const linkRect=await evalJs("(()=>{const r=document.querySelector('.destination').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");
  const lx=Math.round(linkRect.x),ly=Math.round(linkRect.y);
  if(mobile){
    await touch('touchStart',lx,ly);
    await touch('touchMove',lx+28,ly+18);
    await touch('touchMove',lx+50,ly+30);
    await touch('touchEnd',lx+50,ly+30);
  }else{
    await mouse('mouseMoved',lx,ly);
    await mouse('mousePressed',lx,ly,1);
    await mouse('mouseMoved',lx+28,ly+18,1);
    await mouse('mouseMoved',lx+50,ly+30,1);
    await mouse('mouseReleased',lx+50,ly+30);
  }
  await sleep(180);
  const linkDrag=await evalJs('window.__gx()');
  assert(linkDrag.explore&&!linkDrag.warpActive,'link swipe must roam without warp');
  // Tap after reset must preserve destination navigation behavior.
  await evalJs('setExplore(false)');
  await sleep(200);
  const linkTap=await evalJs("(()=>{const r=document.querySelector('.destination').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");
  const tx=Math.round(linkTap.x),ty=Math.round(linkTap.y);
  if(mobile){await touch('touchStart',tx,ty);await touch('touchEnd',tx,ty);}
  else{await mouse('mouseMoved',tx,ty);await mouse('mousePressed',tx,ty,1);await mouse('mouseReleased',tx,ty);}
  await sleep(70);
  assert((await evalJs('window.__gx()')).warpActive,'link tap must initiate warp');
  results.push({size:[w,h],cameraBeforeReset:beforeReset,linkOffset:Math.round(aAfter.x-aBefore.x),resetCam:reset.cam,linkSwipePass:true,linkTapPass:true,viewportMetrics});
 }
 assert.equal(errors.length,0,'No JS exceptions');
 fs.writeFileSync(path.join(OUT,'browser-drag-qa.json'),JSON.stringify({passed:true,results,errors},null,2));
 console.log(JSON.stringify({passed:true,results,errors}));
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(async()=>{
 try{socket?.close()}catch(e){}
 try{edge?.kill()}catch(e){}
 try{server?.close()}catch(e){}
});