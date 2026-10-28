import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const DIR=dirname(fileURLToPath(import.meta.url));
const base='http://127.0.0.1:18762/little-works/ai-academy-apple/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={browser:'Windows Edge headless',timestamp:new Date().toISOString(),viewport:[390,844],measurements:{},limitations:['headless Windows Edge is not iPhone Safari','no 120Hz, physical GPU or battery measurement','network latency varies','first screen embeds original same-origin app']};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});
 const page=await context.newPage();
 await page.addInitScript(()=>{
  window.__perfAudit={longTasks:[],cls:0};
  try{new PerformanceObserver(entries=>{for(const e of entries.getEntries())window.__perfAudit.longTasks.push(e.duration);}).observe({entryTypes:['longtask']});}catch{}
  try{new PerformanceObserver(entries=>{for(const e of entries.getEntries())if(!e.hadRecentInput)window.__perfAudit.cls+=e.value;}).observe({entryTypes:['layout-shift']});}catch{}
 });
 const start=Date.now();
 await page.goto(base,{waitUntil:'domcontentloaded'});
 report.measurements.domContentLoadedMs=Date.now()-start;
 await page.waitForSelector('.reading-hero');
 report.measurements.firstUsableHeroMs=Date.now()-start;
 await page.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:25000});
 report.measurements.originalBridgeReadyMs=Date.now()-start;
 await page.waitForTimeout(450);
 const client=await context.newCDPSession(page);await client.send('Performance.enable');
 const perf=await client.send('Performance.getMetrics');
 const obj=Object.fromEntries(perf.metrics.map(m=>[m.name,m.value]));
 const stat=await page.evaluate(async()=>{
  const s={longTasks:window.__perfAudit.longTasks,cls:window.__perfAudit.cls,
   interactive:window.ZHIXU_APPLE_MOTION?.engine||'fallback',
   memory:performance.memory?.usedJSHeapSize||null,
   opticalMaps:document.querySelectorAll('feDisplacementMap').length,
   opticFilters:[...document.querySelectorAll('filter')].map(x=>x.id).slice(0,8),
   nSurface:document.querySelectorAll('lg-lens,lg-navbar,lg-segmented').length,
   area:{width:document.documentElement.scrollWidth,screen:innerWidth}};
  const elapsed=[];
  await new Promise(done=>{
   let last=0,c=0;function frame(t){if(last)elapsed.push(t-last);last=t;if(++c<95)requestAnimationFrame(frame);else done();}
   requestAnimationFrame(frame);
  });
  elapsed.sort((a,b)=>a-b);s.idleFrameP95Ms=elapsed[Math.floor(elapsed.length*.95)]||0;s.idleFrameMedianMs=elapsed[Math.floor(elapsed.length*.5)]||0;
  return s;
 });
 Object.assign(report.measurements,{mainThreadTaskDurationSec:obj.TaskDuration,
 layoutDurationSec:obj.LayoutDuration,scriptDurationSec:obj.ScriptDuration,jsHeapUsedBytes:obj.JSHeapUsedSize,
 ...stat});
 await page.getByRole('button',{name:/开始学习/}).first().click();
 await page.waitForTimeout(300);
 report.measurements.navigationAfterClick=await page.evaluate(()=>({view:location.hash,lessonVisible:!!document.querySelector('.lesson-paper')}));
 await page.emulateMedia({reducedMotion:'reduce'});
 report.measurements.reducedMotionMedia=await page.evaluate(()=>matchMedia('(prefers-reduced-motion:reduce)').matches);
 const reduced=await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
 report.measurements.reducedTransparencyNavigation=await page.evaluate(()=>getComputedStyle(document.querySelector('.mobile-dock')).backdropFilter);
 await context.close();
}catch(e){report.error=e.stack||String(e);}finally{await browser.close();await writeFile(join(DIR,'performance-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.error)process.exitCode=1;}
