const fs=require("fs"),path=require("path"),{spawn}=require("child_process");
const base=process.env.MOOD_BASE_URL||"http://127.0.0.1:19861/little-works/mood-journal/";
const browser="C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",port=19867;
const profile=path.join(__dirname,"..",".mood-qa-profile");
const child=spawn(browser,["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--remote-debugging-port="+port,"--user-data-dir="+profile,"about:blank"],{windowsHide:true,stdio:"ignore"});
let ws,id=0;const pending=new Map(),results=[],errors=[];const sleep=n=>new Promise(r=>setTimeout(r,n));
function assert(condition,name){results.push({name,pass:Boolean(condition)});if(!condition)throw Error(name);}
function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));setTimeout(()=>{if(pending.has(key)){pending.delete(key);reject(Error("timeout "+method));}},10000);});}
async function evalJS(code){const r=await send("Runtime.evaluate",{expression:code,returnByValue:true,awaitPromise:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;}
async function view(w){await send("Emulation.setDeviceMetricsOverride",{width:w,height:850,deviceScaleFactor:1,mobile:w<=768});await sleep(190);}
async function capture(name){const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});const dir=path.join(__dirname,"..",".mood-evidence");fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name),Buffer.from(shot.result.data,"base64"));}
async function navigate(){await send("Page.navigate",{url:base});await sleep(750);}
async function main(){
let page;for(let i=0;i<60;i++){try{const pages=await(await fetch("http://127.0.0.1:"+port+"/json/list")).json();page=pages.find(p=>p.type==="page");if(page)break;}catch{}await sleep(200);}
if(!page)throw Error("Edge CDP unavailable");
ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});ws.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg);}if(msg.method==="Runtime.exceptionThrown")errors.push(msg.params.exceptionDetails.text);};
await send("Runtime.enable");await send("Page.enable");await navigate();assert(await evalJS("document.title.includes('心绪')"),"page title and JS load");assert(await evalJS("document.querySelectorAll('.mood').length===5"),"five moods");
for(const w of [320,390,768,1440]){await view(w);const state=await evalJS("({inner:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,shown:getComputedStyle(document.querySelector('.editor-column')).display,headline:document.querySelector('#pageTitle').getBoundingClientRect().height})");assert(state.documentWidth<=w+1&&state.bodyWidth<=w+1,"no horizontal overflow at "+w);assert(state.shown!=="none","editor visible at "+w);await capture("mood-"+w+".png");}
await view(390);
await evalJS("localStorage.clear();location.reload()");await sleep(420);
assert(await evalJS("document.querySelector('#recentEntries').textContent.includes('白纸')"),"empty calendar state");
await evalJS("document.querySelector('#saveEntry').click()");assert(await evalJS("document.querySelector('#toast').textContent.includes('先选')"),"reject save without mood");
await evalJS("document.querySelector('[data-mood=good]').click();document.querySelector('#entryTitle').value='自动化测试记录';document.querySelector('#entryTitle').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#entryBody').value='今天认真地写了几句话。';document.querySelector('#entryBody').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#saveEntry').click();");
assert(await evalJS("Object.values(JSON.parse(localStorage.getItem('shuge.mood-journal.v1')||'{}')).some(x=>x.title==='自动化测试记录')"),"save persists to localStorage");
assert(await evalJS("document.querySelector('#recordCount').textContent.includes('1')"),"calendar counts entry");
await send("Page.reload",{ignoreCache:true});await sleep(520);
assert(await evalJS("document.querySelector('#entryTitle').value==='自动化测试记录'"),"reload restores title");
assert(await evalJS("document.querySelector('[data-mood=good]').getAttribute('aria-pressed')==='true'"),"reload restores mood");
await evalJS("document.querySelector('.mobile-tabs [data-nav=calendar]').click()");
assert(await evalJS("document.body.dataset.view==='calendar'&&getComputedStyle(document.querySelector('#calendarView')).display!=='none'"),"mobile calendar tab");
const old=await evalJS("document.querySelector('#monthTitle').textContent");await evalJS("document.querySelector('#prevMonth').click()");
assert(await evalJS("document.querySelector('#monthTitle').textContent")!==old,"calendar previous month");
await evalJS("document.querySelector('#nextMonth').click()");
assert(await evalJS("document.querySelector('#monthTitle').textContent")===old,"calendar next month");
await evalJS("document.querySelector('.day.today').click()");
assert(await evalJS("document.body.dataset.view==='write'"),"calendar click opens editor");
await evalJS("document.querySelector('#mobileBackup').click()");
assert(await evalJS("document.querySelector('#backupDialog').open"),"backup dialog opens");
await evalJS("document.querySelector('#closeDialog').click()");
assert(!await evalJS("document.querySelector('#backupDialog').open"),"backup dialog closes");
assert(errors.length===0,"no JS exceptions");
console.log(JSON.stringify({pass:results.filter(x=>x.pass).length,total:results.length,results,errors},null,2));}
main().catch(e=>{console.error("QA FAIL",e.stack||e,JSON.stringify(results));process.exitCode=1}).finally(async()=>{await sleep(400);if(ws&&ws.readyState===1)ws.close();child.kill();});
