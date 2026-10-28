import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true});
const dir=dirname(fileURLToPath(import.meta.url));
const out={date:new Date().toISOString(),environment:'Windows Edge headless on local Node preview; NOT an iPhone/iPad Safari benchmark',checks:{}};
try{
 for(const width of [390,1440]){
  const p=await b.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const start=Date.now();
  await p.goto('http://127.0.0.1:18762/little-works/ai-academy-apple/',{waitUntil:'domcontentloaded'});
  let connected=false;
  try{await p.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:25000});connected=true;}catch{}
  const bridgeMs=Date.now()-start;
  const result=await p.evaluate(()=>{
    const nav=performance.getEntriesByType('navigation')[0];
    const paint=performance.getEntriesByType('paint');
    const refs=[...document.querySelectorAll('filter')];
    return {domContentLoadedMs:Math.round(nav?.domContentLoadedEventEnd||-1),fcpMs:Math.round(paint.find(p=>p.name==='first-contentful-paint')?.startTime||-1),
    jsHeapUsedMb:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576*100)/100:null,
    svgFilters:refs.length,components:!!customElements.get('lg-navbar'),layoutViewport:{scroll:document.documentElement.scrollWidth,inner:innerWidth},
    navBackdrop:getComputedStyle(document.querySelector('.mobile-dock')).backdropFilter,
    motion:window.ZHIXU_APPLE_MOTION?.engine};
  });
  out.checks[width]={connected,bridgeMs,...result};
  console.log(width,JSON.stringify(out.checks[width]));
  await p.close();
 }
 const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await p.goto('http://127.0.0.1:18762/little-works/ai-academy-apple/');
 out.reducedMotion=await p.evaluate(()=>({media:matchMedia('(prefers-reduced-motion:reduce)').matches,style:getComputedStyle(document.querySelector('.primary')).transitionDuration}));
 await p.close();
}finally{await b.close();await writeFile(join(dir,'perf-report.json'),JSON.stringify(out,null,2),'utf8');}
