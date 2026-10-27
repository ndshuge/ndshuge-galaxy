const fs=require("fs"),path=require("path"),{spawn}=require("child_process");
const base=process.env.HABIT_BASE||"http://127.0.0.1:19873/little-works/habit-flow/";
const browser="C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",port=19874;
const profile=path.join(__dirname,"..",".habit-qa-profile");
const child=spawn(browser,["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--remote-debugging-port="+port,"--user-data-dir="+profile,"about:blank"],{windowsHide:true,stdio:"ignore"});
let ws,id=0;const pending=new Map(),results=[],errors=[];const sleep=n=>new Promise(r=>setTimeout(r,n));
function assert(condition,name){results.push({name,pass:Boolean(condition)});if(!condition)throw Error(name);}
function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));setTimeout(()=>{if(pending.has(key)){pending.delete(key);reject(Error("timeout "+method));}},10000);});}
async function evaluate(code){const r=await send("Runtime.evaluate",{expression:code,returnByValue:true,awaitPromise:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;}
async function view(w){await send("Emulation.setDeviceMetricsOverride",{width:w,height:900,deviceScaleFactor:1,mobile:w<=768});await sleep(200);}
async function capture(name){const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});const dir=path.join(__dirname,"..",".habit-evidence");fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name),Buffer.from(shot.result.data,"base64"));}
async function navigate(){await send("Page.navigate",{url:base});await sleep(700);}
async function main(){
 let page;for(let i=0;i<65;i++){try{const pages=await(await fetch("http://127.0.0.1:"+port+"/json/list")).json();page=pages.find(p=>p.type==="page");if(page)break;}catch{}await sleep(200);}
 if(!page)throw Error("Edge CDP unavailable");
 ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
 ws.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg);}if(msg.method==="Runtime.exceptionThrown")errors.push(msg.params.exceptionDetails.text);};
 await send("Runtime.enable");await send("Page.enable");await navigate();await evaluate("localStorage.removeItem('habit-flow:v1');location.reload()");await sleep(450);
 assert(await evaluate("document.title.includes('Habit Flow')"),"page title");
 assert(await evaluate("!!window.HabitFlowQA && document.querySelectorAll('.habit-row').length===4"),"initial habit list");
 for(const w of [320,390,768,1440]){
  await view(w);
  const measure=await evaluate("({w:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,head:document.querySelector('.page-intro h1').getBoundingClientRect().height,hero:document.querySelector('.today-hero').getBoundingClientRect().width,nav:getComputedStyle(document.querySelector('.mobile-nav')).display})");
  assert(measure.documentWidth<=w+1&&measure.bodyWidth<=w+1,"no overflow "+w+": "+JSON.stringify(measure));
  assert(measure.hero>0&&measure.head>0,"content visible "+w);
  await capture("habit-before-"+w+".png");
 }
 await view(390);
 await evaluate("localStorage.removeItem('habit-flow:v1');location.reload()");await sleep(450);
 assert(await evaluate("document.querySelector('#completedCount').textContent.includes('0 / 4')"),"initial progress 0/4");
 await evaluate("document.querySelector('[data-check=reading]').click()");
 assert(await evaluate("HabitFlowQA.getState().records[HabitFlowQA.today()].reading===true"),"tap saves completion");
 assert(await evaluate("document.querySelector('#completedCount').textContent.includes('1 / 4')"),"progress changes to 1/4");
 await evaluate("document.querySelector('[data-check=reading]').click()");
 assert(await evaluate("!HabitFlowQA.getState().records[HabitFlowQA.today()]?.reading"),"tap again unchecks");
 await evaluate("document.querySelector('[data-check=reading]').click()");
 await send("Page.reload",{ignoreCache:true});await sleep(450);
 assert(await evaluate("document.querySelector('[data-check=reading]').getAttribute('aria-pressed')==='true'"),"reload persisted");
 await evaluate("document.querySelector('#mobileAdd').click()");
 assert(await evaluate("document.querySelector('#habitDialog').open"),"new habit dialog opens");
 await evaluate("document.querySelector('#habitName').value='散步一刻钟';document.querySelector('#habitNote').value='空气很新鲜';document.querySelector('#saveHabit').click()");
 await sleep(200);
 assert(await evaluate("HabitFlowQA.getState().habits.length===5"),"new habit added");
 assert(await evaluate("document.querySelectorAll('.habit-row').length===5"),"new habit rendered");
 await evaluate("document.querySelector('[data-edit=reading]').click()");
 assert(await evaluate("document.querySelector('#habitDialog').open"),"edit habit dialog");
 await evaluate("document.querySelector('#habitName').value='每天读书';document.querySelector('#saveHabit').click()");
 assert(await evaluate("HabitFlowQA.getState().habits[0].name==='每天读书'"),"edit persisted");
 await evaluate("document.querySelector('.mobile-nav [data-view=review]').click()");
 assert(await evaluate("!document.querySelector('#reviewView').hidden"),"review accessible");
 assert(await evaluate("document.querySelector('#statDone').textContent==='1'"),"weekly actual completed count");
 await evaluate("document.querySelector('[data-period=month]').click()");
 assert(await evaluate("document.querySelectorAll('.month-day:not(.blank)').length>=28"),"monthly calendar rendered");
 assert(await evaluate("document.querySelector('#statDone').textContent==='1'"),"monthly stats consistent");
 await evaluate("document.querySelector('#prevRange').click()");
 assert(await evaluate("document.querySelector('#nextRange').disabled===false"),"review prev month available");
 await evaluate("document.querySelector('#nextRange').click()");
 assert(await evaluate("document.querySelector('#nextRange').disabled===true"),"next month bounded at today");
 await evaluate("document.querySelector('#mobileBackup').click()");
 assert(await evaluate("document.querySelector('#backupDialog').open"),"backup dialog accessible");
 await evaluate("document.querySelector('#closeBackup').click()");
 assert(await evaluate("!document.querySelector('#backupDialog').open"),"backup dialog closes");
 // Date boundaries, inject fixed sample and verify no future leakage and correct Monday computation
 assert(await evaluate("HabitFlowQA.key(HabitFlowQA.monday(new Date(2026,9,27)))==='2026-10-26'"),"week begins Monday");
 assert(await evaluate("HabitFlowQA.normalize({habits:[],records:{}}).habits.length===0"),"empty import normalizes");
 assert(await evaluate("document.querySelector('#chartSubtitle').textContent.length>0"),"chart has semantic context");
 for(const w of [320,390,768,1440]){await view(w);await capture("habit-review-"+w+".png");}
 assert(errors.length===0,"no JS runtime exceptions: "+errors);
 console.log(JSON.stringify({pass:results.filter(x=>x.pass).length,total:results.length,results,errors},null,2));
}
main().catch(e=>{console.error("QA FAIL",e.stack||e,JSON.stringify(results));process.exitCode=1;}).finally(async()=>{await sleep(400);if(ws&&ws.readyState===1)ws.close();child.kill();});
