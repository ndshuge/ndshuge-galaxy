/* Repeatable Chromium CDP test for the iOS-like hold-and-slide nav interaction.
   Only requires Playwright installed outside this repository.
   This is a *simulated* touch test, not an iPhone Safari assertion. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||
  'E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core');
const fs=require('fs'),path=require('path');
const outDir=path.resolve(__dirname,'../evidence/nav-scrub');
fs.mkdirSync(outDir,{recursive:true});
const base=process.env.TEST_BASE_URL||
 'http://127.0.0.1:5233/little-works/apple-motion-lab/';
const checks=[],errors=[];
function check(name,ok,detail){
 checks.push({name,pass:!!ok,detail});
 console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(detail).slice(0,230));
}
const sleep=t=>new Promise(r=>setTimeout(r,t));
(async()=>{
const browser=await chromium.launch({headless:true,
  executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
for(const width of [320,390,768,1440]){
 const mobile=width<600, height=width===320?700:width===390?844:width===768?1024:900;
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(width+':'+e.message));
 page.on('console',e=>{if(e.type()==='error')errors.push(width+':console:'+e.text())});
 await page.goto(base,{waitUntil:'networkidle',timeout:25000});
 await page.waitForFunction(()=>window.__motionLab?.diagnostic()?.navScrub);
 let coords=await page.locator('#navigation > button').evaluateAll(a=>a.map(el=>{let r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,w:r.width}}));
 let y=coords[0].y,x0=coords[0].x,x1=coords[1].x,x2=coords[2].x;
 let ses;
 if(mobile){
  ses=await context.newCDPSession(page);
  await ses.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y}]});
 }else{await page.mouse.move(x0,y);await page.mouse.down()}
 await sleep(340);
 const down=await page.evaluate(()=>({nav:__motionLab.diagnostic().navScrub,
   initialTitle:document.querySelector('.intro h1').innerText,aria:[...document.querySelectorAll('#navigation>button')].map(b=>b.getAttribute('aria-current'))}));
 check(width+' hold enters scrub state',down.nav.pressed&&down.nav.preview===0,down);
 if(width===390)await page.screenshot({path:path.join(outDir,'390-held.png')});
 // Move 25%, 50%, 75%, 100% along three tab centers WITHOUT lifting.
 let motion=[];
 for(let i=1;i<=8;i++){
  const x=x0+(x2-x0)*i/8;
  if(mobile){await ses.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]})}
  else await page.mouse.move(x,y);
  await sleep(36);
  motion.push(await page.evaluate(()=>({nav:__motionLab.diagnostic().navScrub,
    aria:[...document.querySelectorAll('#navigation>button')].map(b=>b.getAttribute('aria-current')),
    title:document.querySelector('.intro h1').innerText,
    css:getComputedStyle(document.querySelector('#navigation .lg-nav__copy')).filter})));
  if(width===390&&i===4)await page.screenshot({path:path.join(outDir,'390-scrub-mid.png')});
 }
 const prev=motion.at(-1),first=motion[0],mid=motion[3];
 check(width+' indicator follows intermediate x continuously',
   first.nav.x<mid.nav.x&&mid.nav.x<prev.nav.x,
   {first:first.nav.x,mid:mid.nav.x,last:prev.nav.x});
 check(width+' finger previews tab 3 while leaving page unchanged',prev.nav.preview===2&&
   prev.aria[0]==='page'&&prev.title===down.initialTitle,
   {preview:prev.nav.preview,aria:prev.aria,title:prev.title});
 check(width+' native SVG refraction stays attached',prev.css.includes('url('),{filter:prev.css});
 if(width===390)await page.screenshot({path:path.join(outDir,'390-scrub-last.png')});
 if(mobile)await ses.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 else await page.mouse.up();
 await sleep(470);
 const result=await page.evaluate(()=>({nav:__motionLab.diagnostic().navScrub,
  title:document.querySelector('.intro h1').innerText,
  aria:[...document.querySelectorAll('#navigation>button')].map(b=>b.getAttribute('aria-current'))}));
 check(width+' releasing selects last tab (not originally pressed tab)',
   !result.nav.pressed&&result.nav.current===2&&result.aria[2]==='page'&&
   result.title.includes('收藏'),result);
 if(width===390)await page.screenshot({path:path.join(outDir,'390-released.png')});
 // Then a normal click must still work.
 await page.locator('#navigation>button').nth(1).click();
 await sleep(150);
 const tap=await page.evaluate(()=>({index:__motionLab.diagnostic().navScrub.current,
 title:document.querySelector('.intro h1').innerText}));
 check(width+' normal clicking remains functional',tap.index===1&&tap.title.includes('发现'),tap);
 if(width===390){
  // Long-hold without moving must leave the current tab selected.
  let c=await page.locator('#navigation>button').nth(1).boundingBox();
  await ses.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:c.x+c.width/2,y:c.y+c.height/2}]});
  await sleep(500); await ses.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await sleep(100);
  check('390 stationary long hold does not change tab',await page.evaluate(()=>__motionLab.diagnostic().navScrub.current)===1,{});
  // Cancel after scrubbing must restore previous selection.
  c=await page.locator('#navigation>button').nth(1).boundingBox();
  let other=await page.locator('#navigation>button').nth(2).boundingBox();
  await ses.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:c.x+c.width/2,y:c.y+c.height/2}]});
  await sleep(80);
  await ses.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:other.x+other.width/2,y:c.y+c.height/2}]});
  await sleep(110);
  await ses.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await sleep(320);
  const afterCancel=await page.evaluate(()=>__motionLab.diagnostic().navScrub);
  check('390 pointercancel restores previous selection',afterCancel.current===1&&!afterCancel.pressed,afterCancel);
  // Keyboard remains unaffected.
  await page.locator('#navigation>button').first().focus();
  await page.keyboard.press('Enter');await sleep(150);
  check('390 keyboard Enter still selects first tab',await page.evaluate(()=>__motionLab.diagnostic().navScrub.current)===0,{});
 }
 await context.close();
}
}finally{await browser.close()}
check('No uncaught JS errors',errors.length===0,errors);
let result={date:new Date().toISOString(),environment:'Windows Edge Chromium via Playwright CDP; touch emulated, not iPhone Safari',checks,errors,
 summary:{passed:checks.filter(a=>a.pass).length,total:checks.length}};
fs.writeFileSync(path.join(outDir,'qa-nav-scrub.json'),JSON.stringify(result,null,2));
console.log('SUMMARY '+JSON.stringify(result.summary));if(result.summary.passed!==result.summary.total)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=2});
