const { chromium }=require(process.env.PLAYWRIGHT_MODULE_PATH||'E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'evidence');
const url=process.env.TEST_BASE_URL||'http://127.0.0.1:5219/little-works/apple-motion-lab/';
const tests=[],errors=[],perf={},enginePaths={};
function check(name,ok,details){tests.push({name,pass:!!ok,details});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(details).slice(0,240))}
const pause=t=>new Promise(r=>setTimeout(r,t));
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await c.addInitScript(()=>{
    window.__glUploads={map:0,source:0};
    const original=WebGLRenderingContext.prototype.texImage2D;
    WebGLRenderingContext.prototype.texImage2D=function(...args){if(args.length===6&&args[5] instanceof HTMLCanvasElement){if(args[5].id==='artSource')window.__glUploads.source++;else window.__glUploads.map++;}return original.apply(this,args);};
  });
  const page=await c.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
  const response=await page.goto(url,{waitUntil:'networkidle',timeout:22000});await page.waitForFunction(()=>window.__motionLab&&window.__motionLab.diagnostic().webgl,{timeout:10000});
  enginePaths.live=await page.evaluate(()=>({gpu:__motionLab.diagnostic(),uploads:__glUploads,customElements:customElements.get('lg-navbar')?.name||null})); 
  check('GPU lens map uploaded during initial render',enginePaths.live.uploads.map>0,enginePaths.live.uploads);
  await page.evaluate(()=>__motionLab.settle(1));await pause(900);
  let initialUploads=await page.evaluate(()=>({...__glUploads}));
  for(let k=0;k<70;k++){await page.evaluate(i=>__motionLab.settle(i%2),k);await pause(20)}
  await page.evaluate(()=>__motionLab.settle(1));await pause(780);
  let after=await page.evaluate(()=>({p:__motionLab.progress(),diag:__motionLab.diagnostic(),uploads:{...__glUploads}}));
  check('70 interruptible spring retargets settle at full',after.p>.98,{p:after.p,renderCount:after.diag.gpuRenders});
  const material=await page.evaluate(()=>{const nav=document.querySelector('#navigation');const indicator=nav.querySelector('.lg-nav__copy');return {mode:nav.surface?.mode,hasGlass:!!nav.glass,indicatorFilter:getComputedStyle(indicator).filter,glassSurfaceBackdrop:getComputedStyle(nav.querySelector('.lg-surface__glass')).backdropFilter};});
  check('Native navbar runs SVG lens or refractive backdrop',material.hasGlass&&(/url\(/.test(material.indicatorFilter)||/url\(/.test(material.glassSurfaceBackdrop)),material);
  await page.evaluate(()=>__motionLab.settle(.52));await pause(750);await page.screenshot({path:path.join(evidence,'transition-mid-390.png')});
  const midGeometry=await page.evaluate(()=>__motionLab.diagnostic().interpolatedGeometry);
  check('Shared element interpolates size, corner radius, artwork',midGeometry.p>.48&&midGeometry.p<.56&&midGeometry.r>0&&midGeometry.r<20&&midGeometry.artSize>54,{p:midGeometry.p,r:midGeometry.r,artSize:midGeometry.artSize});

  check('Moving/resizing player did not rebuild lens map',after.uploads.map===initialUploads.map,{before:initialUploads,after:after.uploads});
  // Compare at fully expanded state: a transition midpoint may temporarily clip the rendering canvas.
  await page.evaluate(()=>__motionLab.settle(1));await pause(800);
  const canvas=await page.locator('#artGL').screenshot({path:path.join(evidence,'stress-glass-l2.png')});
  await page.locator('#quality button[value="lite"]').click({force:true});await pause(160);
  await page.locator('#artwork').screenshot({path:path.join(evidence,'stress-glass-l1.png')});
  const l2=fs.readFileSync(path.join(evidence,'stress-glass-l2.png')),l1=fs.readFileSync(path.join(evidence,'stress-glass-l1.png'));
  check('L2 output differs from L1 fallback',!l1.equals(l2),{L2bytes:l2.length,L1bytes:l1.length});
  await page.locator('#quality button[value="auto"]').click({force:true});await pause(100);
  await page.evaluate(()=>__motionLab.settle(0));await pause(700);
  await page.locator('#playMini').click();await pause(1100);
  const play=await page.evaluate(()=>({time:document.querySelector('#seek').value,playing:__motionLab.diagnostic().playing}));
  check('Web Audio playback advances time',play.playing&&Number(play.time)>0.5,play);
  await page.locator('#playMini').click();await pause(100);
  const paused=await page.evaluate(()=>({time:document.querySelector('#seek').value,playing:__motionLab.diagnostic().playing}));
  check('Web Audio pause changes transport state',!paused.playing,paused);
  await page.evaluate(()=>__motionLab.settle(1));await pause(950);
  await page.keyboard.press('Escape');await pause(700);
  const escaped=await page.evaluate(()=>__motionLab.progress());
  check('Escape dismisses expanded player',escaped<.1,{p:escaped});
  const downBtn=page.locator('#navigation > button').first();
  const downRect=await downBtn.boundingBox();
  await page.mouse.move(downRect.x+downRect.width/2,downRect.y+downRect.height/2);
  await page.mouse.down();await pause(200);
  const pressedScale=await downBtn.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
  await page.mouse.up();await pause(350);
  const releasedScale=await downBtn.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
  check('Navigation spring maintains press feedback and releases',pressedScale<.98&&releasedScale>.98,{pressedScale,releasedScale});
  
  await page.evaluate(()=>__motionLab.settle(1));await pause(900);
  let samples=await page.evaluate(async()=>{let out=[];let last=performance.now();for(let k=0;k<140;k++){await new Promise(r=>requestAnimationFrame(r));let now=performance.now();out.push(now-last);last=now;}return out;});
  samples.sort((a,b)=>a-b);perf.frameIntervals={samples:samples.length,medianMs:Math.round(samples[Math.floor(samples.length*.5)]*10)/10,p95Ms:Math.round(samples[Math.floor(samples.length*.95)]*10)/10,maxMs:Math.round(samples[samples.length-1]*10)/10,environment:'Windows headless Edge, SwiftShader; not mobile GPU'};
  check('Performance samples captured',samples.length===140,perf.frameIntervals);
  const cpuLoad=await page.evaluate(()=>__motionLab.diagnostic().fps);perf.approxFps=cpuLoad;
  await c.close();
  const reduce=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const rp=await reduce.newPage();rp.on('pageerror',e=>errors.push('reduce '+e.message));
  await rp.goto(url,{waitUntil:'networkidle'});await rp.waitForFunction(()=>!!__motionLab);
  await rp.evaluate(()=>__motionLab.settle(1));const reducedP=await rp.evaluate(()=>__motionLab.progress());
  check('prefers-reduced-motion snaps to target',reducedP===1,{p:reducedP});await reduce.close();
  const noGPU=await browser.newContext({viewport:{width:390,height:844}});
  await noGPU.addInitScript(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='experimental-webgl')return null;return orig.call(this,type,...args)}});
  const gp=await noGPU.newPage();gp.on('pageerror',e=>errors.push('noGPU '+e.message));
  await gp.goto(url,{waitUntil:'networkidle'});await gp.waitForFunction(()=>!!__motionLab);
  const fallback=await gp.evaluate(()=>({diag:__motionLab.diagnostic(),state:document.querySelector('#player').dataset.gpu,visible:getComputedStyle(document.querySelector('#artFallback')).visibility}));
  check('WebGL unavailable keeps album art visible',!fallback.diag.webgl&&fallback.state==='fail'&&fallback.visible==='visible',fallback);
  await noGPU.close();
 }finally{await browser.close()}
 check('No JS uncaught exceptions',errors.length===0,errors);
 const report={testedAt:new Date().toISOString(),environment:'Edge headless, Windows, simulated mobile viewport; NOT Safari/iPhone',url,tests,perf,enginePaths,errors,summary:{passed:tests.filter(x=>x.pass).length,total:tests.length}};
 fs.writeFileSync(path.join(evidence,'stress-report.json'),JSON.stringify(report,null,2));
 console.log('SUMMARY '+JSON.stringify(report.summary));
 if(report.summary.passed!==report.summary.total)process.exitCode=1;
}
main().catch(e=>{console.error(e.stack);process.exitCode=2});
