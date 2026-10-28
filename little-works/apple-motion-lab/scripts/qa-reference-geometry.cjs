// R2.3 direct geometry regression against qualitative geometry seen in user's 16.13s iPhone reference.
// Uses CDP touch on Windows Edge. NOT native iPhone Safari and does not infer Apple private spring values.
const {chromium}=require('E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core');
const fs=require('fs'),path=require('path');const out=path.resolve(__dirname,'../evidence/nav-scrub-r23');
const checks=[],errors=[],observations=[];
const check=(n,p,d)=>{checks.push({name:n,pass:!!p,detail:d});console.log((p?'PASS ':'FAIL ')+n+' '+JSON.stringify(d).slice(0,185))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
for(const width of [320,390,768,1440]){
const height=width===320?700:width===390?844:width===768?1024:900;
const ctx=await browser.newContext({viewport:{width,height},isMobile:width<=390,hasTouch:width<=390,deviceScaleFactor:1});
const page=await ctx.newPage();page.on('pageerror',e=>errors.push(width+': '+e.message));
await page.goto('http://127.0.0.1:5236/little-works/apple-motion-lab/',{waitUntil:'networkidle',timeout:26000});
await page.waitForFunction(()=>document.querySelector('#navigation')?.glass);
const pts=await page.locator('#navigation>button').evaluateAll(a=>a.map(el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}}));
let client;if(width<=390)client=await ctx.newCDPSession(page);
const act=async(type,x)=>{if(width<=390)await client.send('Input.dispatchTouchEvent',{type:type==='down'?'touchStart':type==='move'?'touchMove':'touchEnd',touchPoints:type==='up'?[]:[{x,y:pts[0].y}]});else if(type==='down'){await page.mouse.move(x,pts[0].y);await page.mouse.down()}else if(type==='move')await page.mouse.move(x,pts[0].y);else await page.mouse.up()};
const measure=()=>page.evaluate(()=>{const n=document.querySelector('#navigation'),r=n.getBoundingClientRect(),p=n.glass.params,s=__motionLab.diagnostic().navScrub;return {height:r.height,lensW:p.width,lensH:p.height,lensTop:p.y-16,lensBottom:p.y-16+p.height,preview:s.preview,selected:s.current,lift:s.lift,chroma:p.chroma,scroll:document.documentElement.scrollWidth,inner:innerWidth}});
const idle=await measure();await act('down',pts[0].x);await sleep(300);
const press=await measure();await act('move',(pts[0].x+pts[1].x)/2);await sleep(80);
const half=await measure();await act('move',pts[2].x);await sleep(100);
const drag=await measure();if(width===390)await page.screenshot({path:path.join(out,'r23-390-lift-drag.png')});
await act('up',pts[2].x);await sleep(950);const released=await measure();
observations.push({width,idle,press,half,drag,released});
check(width+' press lifts lens beyond bar',press.lift>=16 && press.lensH>idle.lensH+13 && press.height>=56 && press.height<=62 && press.lensTop<0 && press.lensBottom>press.height-1,{idle,press});
check(width+' drag tracks finger and previews last tab',drag.preview===2 && drag.selected===0 && drag.lensW>=idle.lensW,{half,drag});
check(width+' release returns glass to resting dimensions',Math.abs(released.lensW-idle.lensW)<1&&Math.abs(released.lensH-idle.lensH)<1&&released.selected===2,{released,idle});
check(width+' no horizontal page overflow',released.scroll<=released.inner+2,{scroll:released.scroll,width:released.inner});
await ctx.close();
}
}finally{await browser.close()}
check('No uncaught JS exceptions',errors.length===0,errors);const summary={passed:checks.filter(x=>x.pass).length,total:checks.length};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'reference-geometry-qa.json'),JSON.stringify({at:new Date().toISOString(),environment:'Windows Edge CDP simulation, not true iPhone Safari',checks,observations,errors,summary},null,2));console.log('SUMMARY '+JSON.stringify(summary));
if(summary.passed!==summary.total)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=2});
