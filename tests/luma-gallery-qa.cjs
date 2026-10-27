const {spawn}=require("node:child_process");
const fs=require("node:fs");
const path=require("node:path");
const os=require("node:os");
const BASE=process.env.LUMA_URL||"http://127.0.0.1:8931/little-works/luma-gallery/";
const chrome="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const folder=path.resolve(__dirname,"..");
const profile=path.join(os.tmpdir(),"luma-qa-"+process.pid);
const child=spawn(chrome,["--headless=new","--no-first-run","--no-default-browser-check","--disable-extensions","--disable-background-networking","--no-proxy-server","--remote-debugging-port=8933","--user-data-dir="+profile,"about:blank"],{windowsHide:true,stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(cond,message)=>{if(!cond)throw Error("ASSERT: "+message);console.log("PASS:",message);};
(async()=>{
 let ws;const pending=new Map();let seq=0,dialogs=0;
 async function cmd(method,params={}){
  const id=++seq;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{pending.delete(id);reject(Error("CDP timed out "+method));},12000);
   pending.set(id,{resolve,reject,timer});
   ws.send(JSON.stringify({id,method,params}));
  });
 }
 let version;
 for(let i=0;i<60;i++){try{const r=await fetch("http://127.0.0.1:8933/json/version");version=await r.json();break}catch(e){await sleep(200);}}
 assert(!!version,"headless Chromium available");
 const tab=await (await fetch("http://127.0.0.1:8933/json/new?"+encodeURIComponent(BASE),{method:"PUT"})).json();
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
 ws.addEventListener("message",e=>{
  const obj=JSON.parse(e.data);
  if(obj.id&&pending.has(obj.id)){const p=pending.get(obj.id);clearTimeout(p.timer);pending.delete(obj.id);obj.error?p.reject(Error(JSON.stringify(obj.error))):p.resolve(obj.result);return;}
  if(obj.method==="Page.javascriptDialogOpening"){dialogs++;cmd("Page.handleJavaScriptDialog",{accept:true}).catch(console.error);}
  if(obj.method==="Runtime.exceptionThrown")console.error("BROWSER EXCEPTION",JSON.stringify(obj.params.exceptionDetails).slice(0,600));
 });
 await cmd("Page.enable");await cmd("Runtime.enable");await cmd("Network.enable");
 async function ev(expression){
  const r=await cmd("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true,userGesture:true});
  if(r.exceptionDetails)throw Error("EVALUATE: "+r.exceptionDetails.text+" / "+(r.exceptionDetails.exception?.description||""));
  return r.result.value;
 }
 async function waitFor(expr,max=9000){
  const begin=Date.now();while(Date.now()-begin<max){if(await ev(expr))return;await sleep(130);}throw Error("Wait timeout: "+expr);
 }
 async function shot(name,width,height){
  await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<500,screenWidth:width,screenHeight:height});
  await sleep(250);
  const r=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  fs.writeFileSync(path.join(folder,"luma-"+name+".png"),Buffer.from(r.data,"base64"));
  const overflow=await ev("document.documentElement.scrollWidth > window.innerWidth + 1");
  assert(!overflow,name+" viewport has no horizontal overflow ("+width+")");
 }
 await waitFor("document.querySelectorAll('.cat').length===5");
 assert(await ev("document.getElementById('emptyState').hidden===false"),"initial empty state visible");
 await shot("empty-390",390,844);
 await shot("empty-320",320,760);
 await shot("empty-768",768,1024);
 await shot("empty-1440",1440,900);
 await ev("(async()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const c=canvas.getContext('2d');const g=c.createLinearGradient(0,0,640,480);g.addColorStop(0,'#eab9a0');g.addColorStop(1,'#536f60');c.fillStyle=g;c.fillRect(0,0,640,480);c.fillStyle='#fbe8b2';c.beginPath();c.arc(420,140,75,0,7);c.fill();const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));const f=new File([blob],'日落湖畔.png',{type:'image/png'});const input=document.getElementById('photoInput');Object.defineProperty(input,'files',{configurable:true,value:[f]});input.dispatchEvent(new Event('change',{bubbles:true}));return true;})()");
 await waitFor("document.querySelectorAll('.photo-card').length===1");
 assert(await ev("document.querySelector('.photo-overlay strong').textContent==='日落湖畔'"),"photo import and tile name");
 await shot("photo-390",390,844);
 await shot("photo-1440",1440,900);
 await ev("document.querySelector('.photo-target').click()");
 assert(await ev("document.getElementById('viewer').open"),"immersive viewer opens");
 assert(await ev("document.getElementById('viewerName').textContent==='日落湖畔'"),"viewer renders correct image");
 await shot("viewer-390",390,844);
 await ev("document.getElementById('viewerClose').click()");
 assert(!(await ev("document.getElementById('viewer').open")),"viewer close works");
 await ev("document.querySelector('.heart-tool').click()");
 await waitFor("document.querySelector('.heart-tool').classList.contains('is-favorite')");
 await ev("document.querySelector('[data-nav=favorites]').click()");
 assert(await ev("document.querySelectorAll('.photo-card').length===1"),"favorites filter shows saved photo");
 await ev("document.querySelector('[data-nav=all]').click()");
 await ev("document.querySelector('.more-tool').click()");
 assert(await ev("!document.getElementById('contextMenu').hidden"),"context menu opens");
 await ev("document.querySelector('[data-action=edit]').click()");
 assert(await ev("document.getElementById('editor').open"),"edit dialog opens");
 await ev("document.getElementById('editName').value='秋天的湖畔';document.getElementById('editCategory').value='__custom';document.getElementById('editCategory').dispatchEvent(new Event('change'));document.getElementById('editCustomCategory').value='周末旅行';document.getElementById('editorForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
 await waitFor("document.getElementById('editor').open===false");
 assert(await ev("document.querySelector('.photo-overlay strong').textContent==='秋天的湖畔'"),"rename persists");
 assert(await ev("Array.from(document.querySelectorAll('.cat')).some(n=>n.textContent==='周末旅行')"),"custom categories appear");
 await ev("document.querySelector('[data-nav=favorites]').click()");
 assert(await ev("document.querySelectorAll('.photo-card').length===1"),"favorite survives edit");
 await ev("document.querySelector('[data-nav=all]').click()");
 await ev("document.getElementById('searchInput').value='不存在';document.getElementById('searchInput').dispatchEvent(new Event('input',{bubbles:true}))");
 assert(await ev("document.getElementById('emptyState').hidden===false"),"empty search state visible");
 await ev("document.getElementById('searchInput').value='湖畔';document.getElementById('searchInput').dispatchEvent(new Event('input',{bubbles:true}))");
 assert(await ev("document.querySelectorAll('.photo-card').length===1"),"search finds renamed photo");
 await ev("document.getElementById('searchInput').value='';document.getElementById('searchInput').dispatchEvent(new Event('input',{bubbles:true}))");
 await ev("document.querySelector('.photo-target').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'touch',clientX:130,clientY:400}))");
 await sleep(150);
 assert(await ev("document.querySelector('.photo-target').classList.contains('is-pressing')"),"long press has sustained held feedback");
 await sleep(410);
 assert(await ev("!document.getElementById('contextMenu').hidden"),"long press opens context menu");
 await ev("document.querySelector('.photo-target').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,pointerType:'touch',clientX:130,clientY:400}))");
 assert(!(await ev("document.querySelector('.photo-target').classList.contains('is-pressing')")),"held feedback ends on release");
 await ev("document.body.click()");
 await ev("window.__clickNative=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__backupURL=this.href;};document.getElementById('backupBtn').click()");
 await waitFor("!!window.__backupURL");
 const backup=await ev("(async()=>{const j=await (await fetch(window.__backupURL)).json();window.__backupJSON=j;return [j.format,j.photos.length,j.photos[0].favorite,j.photos[0].category]})()");
 assert(backup[0]==="luma-gallery-backup"&&backup[1]===1&&backup[2]===true&&backup[3]==="周末旅行","backup includes original photo and metadata");
 await ev("sessionStorage.setItem('luma-qa-backup',JSON.stringify(window.__backupJSON))");
 await cmd("Page.reload",{ignoreCache:true});
 await waitFor("document.querySelectorAll('.photo-card').length===1");
 assert(await ev("document.querySelector('.photo-overlay strong').textContent==='秋天的湖畔'"),"IndexedDB persists after reload");
 await ev("document.querySelector('.more-tool').click();document.querySelector('[data-action=delete]').click()");
 await waitFor("document.getElementById('emptyState').hidden===false");
 assert(dialogs>0,"destructive delete confirmation dialog occurred");
 assert(await ev("document.querySelectorAll('.photo-card').length===0"),"photo deletion works");
 await ev("(()=>{const json=sessionStorage.getItem('luma-qa-backup');const file=new File([json],'Luma-test.json',{type:'application/json'});const input=document.getElementById('restoreInput');Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await waitFor("document.querySelectorAll('.photo-card').length===1",12000);
 assert(await ev("document.querySelector('.photo-overlay strong').textContent==='秋天的湖畔'"),"backup restore returns original photo and metadata");
 assert(await ev("document.querySelector('.heart-tool').classList.contains('is-favorite')"),"backup restores favorite state");
 await shot("photo-390-compact",390,844);
 console.log("ALL TESTS PASSED");
 ws.close();child.kill();
 process.exit(0);
})().catch(err=>{console.error(err.stack||err);child.kill();process.exit(1);});
