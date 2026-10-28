const {chromium}=require('E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core');
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../evidence/r26');fs.mkdirSync(root,{recursive:true});
const checks=[],errors=[];const ok=(name,pass,data)=>{checks.push({name,pass:!!pass,data});console.log((pass?'PASS ':'FAIL ')+name,JSON.stringify(data).slice(0,260));};
(async()=>{let b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
let c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let p=await c.newPage();
p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5239/little-works/apple-motion-lab/',{waitUntil:'networkidle'});
await p.waitForFunction(()=>window.__motionLab?.diagnostic()?.navScrub);
let tabs=await p.locator('#navigation>button').evaluateAll(a=>a.map(x=>{let r=x.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}}));
let client=await c.newCDPSession(p);let touch=(type,x)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y:tabs[0].y}]});
let state=()=>p.evaluate(()=>{let n=document.querySelector('#navigation');return {optics:n.classList.contains('is-scrubbing'),active:n.hasAttribute('data-scrub-active'),preview:n.hasAttribute('data-scrub-preview'),selected:__motionLab.diagnostic().navScrub.current,pressed:__motionLab.diagnostic().navScrub.pressed}});
for(const delay of [0,20,60,140]){
  await touch('touchStart',tabs[0].x);if(delay)await p.waitForTimeout(delay);
  await touch('touchEnd',tabs[0].x);await p.waitForTimeout(900);
  let s=await state();
  ok('tap '+delay+'ms leaves clean single-ink rest',!s.optics&&!s.active&&!s.preview&&!s.pressed&&s.selected===0,s);
}
await touch('touchStart',tabs[0].x);await p.waitForTimeout(150);
await touch('touchMove',tabs[2].x);await p.waitForTimeout(40);await touch('touchEnd',tabs[2].x);
await p.waitForTimeout(100);await touch('touchStart',tabs[2].x);
let retaken=await state();ok('next touch can take over while releasing',retaken.pressed,retaken);
await p.waitForTimeout(180);await touch('touchEnd',tabs[2].x);
await p.waitForTimeout(1000);let final=await state();
ok('repeated press settles without stale optical layers',!final.optics&&!final.active&&!final.preview&&!final.pressed&&final.selected===2,final);
await c.close();
}finally{await b.close()}
ok('no uncaught errors',errors.length===0,errors);
let summary={passed:checks.filter(x=>x.pass).length,total:checks.length};
fs.writeFileSync(path.join(root,'fast-tap-interruption.json'),JSON.stringify({at:new Date().toISOString(),environment:'Windows Edge CDP touch emulation, NOT iPhone Safari',checks,errors,summary},null,2));
console.log('SUMMARY',JSON.stringify(summary));if(summary.passed!==summary.total)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=2});