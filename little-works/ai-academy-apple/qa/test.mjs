import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const dir=dirname(fileURLToPath(import.meta.url));
const base='http://127.0.0.1:18762/little-works/ai-academy-apple/';
const report={startedAt:new Date().toISOString(),checks:[],errors:[],httpErrors:[],screenshots:[],optics:{}};
const check=(name,ok,detail)=>{report.checks.push({name,ok:!!ok,detail:detail||null});console.log((ok?'PASS ':'FAIL ')+name+(detail?' '+JSON.stringify(detail).slice(0,240):''));if(!ok)report.errors.push('Check failed: '+name);};
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-extensions']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,acceptDownloads:true});
 page.on('pageerror',e=>report.errors.push('pageerror '+e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))report.httpErrors.push([r.status(),r.url()])});
 page.on('console',m=>{if(m.type()==='error')report.errors.push('console '+m.text().slice(0,200))});
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForTimeout(1200);
 const initial=await page.locator('#main .reading-hero').count();
 check('first screen renders',initial===1);
 try{await page.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:25000})}catch{}
 const btxt=await page.locator('#bridge-state').innerText();
 check('original live iframe science bridge',btxt.includes('已连接'),btxt);
 try{await page.waitForFunction(()=>!!window.ZHIXU_APPLE_MOTION,{timeout:9000})}catch{}
 const actual=await page.evaluate(()=>({ready:!!document.querySelector('#original-engine').contentWindow?.ZHIXU_BROWSER_ADAPTER,store:!!localStorage.getItem('ai-academy-learning-v02'),components:!!customElements.get('lg-lens'),optic:!!document.querySelector('svg filter[id^="lg"]'),motion:window.ZHIXU_APPLE_MOTION?.engine||'not loaded',lightweight:document.querySelector('#original-engine')?.getAttribute('src')?.endsWith('learning.html'),byok:!!document.querySelector('#original-engine').contentWindow?.ZHIXU_PAGES_AI,engineInfo:window.ZHIXU_APPLE_ENGINE_INFO?.mode}));
 report.optics=actual;check('actual Original API adapter present',actual.ready);check('original learning schema imported',actual.store);check('native Skill glass web component registered',actual.components);check('Motion module',actual.motion==='Motion',actual.motion);check('lean Original learning runtime with original BYOK module',actual.lightweight&&actual.byok&&actual.engineInfo==='same-origin-original-learning',actual);
 for(const width of [320,390,768,1024,1440]){
   await page.setViewportSize({width,height:width<700?844:900});
   await page.waitForTimeout(430);
   await page.screenshot({path:join(dir,'apple-home-'+width+'.png'),fullPage:false,animations:'disabled'});
   report.screenshots.push('apple-home-'+width+'.png');
   const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
   check('horizontal overflow '+width,sizes.scroll<=sizes.client+2,sizes);
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:/开始学习/}).first().click();
 check('learning page',await page.locator('#lesson-paper').count()===1);
 await page.locator('[data-action=load-question]').click();
 await page.waitForTimeout(450);
 const q=await page.locator('#quiz-form input[name=answer]').count();
 const checked=await page.locator('#quiz-form input[name=answer]:checked').count();
 check('Original question loaded',q>=2,{options:q});
 check('no default selected',checked===0);
 if(q>=2){
   await page.locator('#quiz-form input[name=answer]').first().check();
   await page.locator('#quiz-form button[type=submit]').click();
   await page.locator('.feedback').waitFor({timeout:12000});
   check('Original grade + recorded attempt',await page.locator('.feedback').count()>0);
   check('both original pre questions required',await page.locator('[data-action=next-pre]').count()===1);
   if(await page.locator('[data-action=next-pre]').count()){
     await page.locator('[data-action=next-pre]').click();
     await page.waitForFunction(()=>document.querySelector('.assessment-counter')?.textContent?.includes('2 / 2'),{timeout:12000});
     check('second pre starts unselected',(await page.locator('#quiz-form input:checked').count())===0);
     await page.locator('#quiz-form input[name=answer]').first().check();
     await page.locator('#quiz-form button[type=submit]').click();
     await page.locator('[data-action=next-prediction]').waitFor();
   }
   await page.locator('[data-action=next-prediction]').click();
   await page.locator('#prediction').fill('我预测一开始的微小偏差会被相同的迭代公式逐步放大。');
   await page.locator('#prediction-form button[type=submit]').click();
   await page.locator('.metrics-list').waitFor({timeout:12000});
   check('Original scientific experiment returned',await page.locator('.metrics-list').count()===1);
   const poly=await page.locator('.plot polyline').count();
   check('actual measured scientific chart',poly>=1,{series:poly});
   await page.locator('[data-action=mentor]').click();
   await page.getByText('规则引导').last().waitFor({timeout:12000});
   check('rules tutor response displayed',await page.getByText('规则引导').count()>0);
   await page.locator('[data-action=next-transfer]').click();
   await page.locator('[data-action=load-transfer]').click();
   await page.waitForTimeout(250);
   const t=await page.locator('#quiz-form input[type=radio]').count();
   check('Original transfer loaded unselected',t>=2&&(await page.locator('#quiz-form input:checked').count())===0);
   if(t){await page.locator('#quiz-form input[type=radio]').last().check();await page.locator('#quiz-form button[type=submit]').click();}
   await page.locator('.feedback').waitFor({timeout:12000});
   check('Original transfer graded',await page.locator('.feedback').count()>0);
   check('second original transfer question accessible',await page.locator('[data-action=next-transfer-question]').count()===1);
   if(await page.locator('[data-action=next-transfer-question]').count()){
     await page.locator('[data-action=next-transfer-question]').click();
     await page.waitForFunction(()=>document.querySelector('.assessment-counter')?.textContent?.includes('2 / 2'),{timeout:12000});
     check('second transfer starts unselected',(await page.locator('#quiz-form input:checked').count())===0);
     await page.locator('#quiz-form input[name=answer]').last().check();
     await page.locator('#quiz-form button[type=submit]').click();
     await page.locator('[data-action=go-growth]').waitFor();
   }
   const data=await page.evaluate(()=>{
    const x=JSON.parse(localStorage.getItem('ai-academy-learning-v02')||'null');
    return x?{schemaVersion:x.schemaVersion,events:x.events.map(e=>e.kind),count:x.events.length}:null;
   });
   check('real V2 events persisted',data?.schemaVersion===2&&data.events.includes('question_attempt')&&data.events.includes('hypothesis_test')&&data.events.filter(x=>x==='question_attempt').length===4,data);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForTimeout(650);
   await page.getByRole('button',{name:'进度',exact:true}).last().click();
   await page.locator('#main .data-metrics').waitFor({timeout:12000});
   check('progress after reload reads V2 events',(await page.locator('.small-count').count())>=0&&(await page.getByText('独立作答').count())>=1);
 }
 await page.locator('.dock-link[data-view="library"]').click();
 await page.waitForTimeout(350);
 await page.screenshot({path:join(dir,'apple-library-390.png'),animations:'disabled'});
 report.screenshots.push('apple-library-390.png');
 await page.locator('.dock-link[data-view="courses"]').click();
 await page.screenshot({path:join(dir,'apple-courses-390.png'),animations:'disabled'});
 report.screenshots.push('apple-courses-390.png');
 const a=await page.evaluate(()=>({filterCount:document.querySelectorAll('filter').length,navFilter:getComputedStyle(document.querySelector('.mobile-dock')).backdropFilter,webGLSupported:!!document.createElement('canvas').getContext('webgl'),reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches}));
 report.optics={...report.optics,...a};
 check('glass engine SVG filter created',a.filterCount>0,a);
 check('zero blocking JS exceptions',report.errors.length===0,report.errors.slice(0,5));
 check('zero missing HTTP assets',report.httpErrors.length===0,report.httpErrors.slice(0,6));
}catch(e){report.errors.push('FATAL: '+e.stack);console.error(e.stack);}
finally{
 report.endedAt=new Date().toISOString();report.passed=report.checks.filter(x=>x.ok).length;report.failed=report.checks.filter(x=>!x.ok).length;
 await writeFile(join(dir,'browser-report.json'),JSON.stringify(report,null,2),'utf8');
 if(browser)await browser.close();
 console.log('QA_SUMMARY '+JSON.stringify({passed:report.passed,failed:report.failed,errors:report.errors.length,assets:report.httpErrors.length}));
 if(report.failed||report.errors.length||report.httpErrors.length)process.exitCode=1;
}
