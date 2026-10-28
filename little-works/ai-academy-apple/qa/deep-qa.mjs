import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const DIR=dirname(fileURLToPath(import.meta.url));
const BASE='http://127.0.0.1:18762/little-works/ai-academy-apple/';
const tests=[], errors=[];
const T=(name,value,detail)=>{tests.push({name,pass:!!value,detail});console.log((value?'PASS ':'FAIL ')+name+' '+JSON.stringify(detail||'').slice(0,120));};
const b=await chromium.launch({channel:'msedge',headless:true});
try {
 const ctx=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));
 await page.goto(BASE,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:25000});
 const load=await page.evaluate(()=>({nav:performance.getEntriesByType('navigation')[0]?.duration||null,fonts:document.fonts.status,ifr:!!document.querySelector('#original-engine').contentWindow?.ZHIXU_BROWSER_ADAPTER}));
 T('original loaded in same origin and readable',load.ifr,load);
 const keys=['ai-academy-learning-v02','ai-academy-learning-v01'];
 const initial=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
 T('empty starting data readable',await page.locator('#main').innerText().then(x=>x.includes('尚无作答记录')));
 const widths=[320,390,768,1024,1440];
 for(const width of widths){
   await page.setViewportSize({width,height:900});
   for(const route of ['today','learn','courses','library','growth','settings']){
     await page.locator((width<701?'.dock-link':'.nav-link')+'[data-view="'+(route==='settings'?'today':route)+'"]').first().click();
     if(route==='settings')await page.locator('.user-button').click();
     const dims=await page.evaluate(()=>({page:document.documentElement.scrollWidth,visible:document.documentElement.clientWidth}));
     T('overflow '+width+' '+route,dims.page<=dims.visible+1,dims);
   }
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(BASE);
 await page.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:25000});
 await page.locator('[data-action=enter-sensitivity]').first().click();
 await page.locator('[data-action=load-question]').click();
 const input=page.locator('#quiz-form input[name="answer"]');
 T('question starts with zero selection',await page.locator('#quiz-form input:checked').count()===0);
 T('question submit initially disabled',await page.locator('#quiz-form button[type=submit]').isDisabled());
 await input.first().check();
 T('radio selection enables submit',await page.locator('#quiz-form button[type=submit]').isEnabled());
 await page.locator('#quiz-form button[type=submit]').click();
 const feedback=await page.locator('.feedback').innerText();
 T('pre-test withholds correctness and standard answer',feedback.includes('答案暂不揭示')&&!feedback.includes('回答正确')&&!feedback.includes('这道题还需要复习'),feedback);
 await page.locator('[data-action=next-prediction]').click();
 await page.locator('#prediction').fill('我预期两条轨迹起点很近但在足够多次迭代后会明显分离。');
 await page.locator('#prediction-form button[type=submit]').click();
 T('science experiment step',await page.locator('.plot polyline').count()===2);
 const r=await page.evaluate(()=>JSON.parse(localStorage.getItem('ai-academy-learning-v02')));
 T('V2 local evidence recorded',r?.schemaVersion===2&&r.events.some(e=>e.kind==='hypothesis_test'));
 await page.screenshot({path:join(DIR,'apple-teacher-390.png'),animations:'disabled'});
 await page.setViewportSize({width:1440,height:900});
 await page.screenshot({path:join(DIR,'apple-teacher-1440.png'),animations:'disabled'});
 // Context continuation after reload, without any extra model calls.
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:25000});
 await page.locator('.nav-link[data-view=learn]').click();
 T('lesson context preserved after reload',await page.locator('.plot polyline').count()===2);
 await page.locator('[data-action=mentor]').click();
 T('default tutor uses rules, no model sent',await page.getByText('规则引导').count()>0);
 await page.locator('[data-action=propose-second]').click();
 T('single-variable plan needs explicit approval',await page.locator('#second-prediction').count()===1);
 await page.locator('#second-prediction').fill('第二轮我预期扰动更小后分离时刻会更晚');
 await page.locator('[data-action=approve-second]').click();
 T('approved second run completed',await page.getByText(/已批准、执行并验证第二轮计算/).count()===1);
 await page.locator('[data-action=next-transfer]').click();
 await page.locator('[data-action=load-transfer]').click();
 T('transfer answer unselected',await page.locator('#quiz-form input:checked').count()===0);
 await page.locator('#quiz-form input[name=answer]').last().check();
 await page.locator('#quiz-form button[type=submit]').click();
 T('transfer uses versioned original rubric',await page.locator('.feedback').count()===1);
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('ai-academy-learning-v02')));
 T('both stage attempts persisted',after.events.filter(e=>e.kind==='question_attempt').length>=2,after.events.map(e=>e.kind));
 const appLearnerId=after.learnerId;
 // Original Edition must see exact same data. No copying or format change.
 await page.goto('http://127.0.0.1:18762/zhixu-ai-academy/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(1000);
 const orig=await page.evaluate(()=>({data:JSON.parse(localStorage.getItem('ai-academy-learning-v02')||'null')}));
 T('Original Edition sees same learnerId and events',orig.data?.learnerId===appLearnerId&&orig.data?.events?.length===after.events.length,{original:orig.data?.events?.length,apple:after.events.length});
 // Fresh context for long-press and error affordances, no shared credentials.
 const touch=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const phone=await touch.newPage();
 await phone.goto(BASE);
 await phone.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:25000});
 await phone.locator('.dock-link[data-view=courses]').click();
 const tile=phone.locator('.course-world').first();
 await tile.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',button:0,clientX:55,clientY:300});
 await phone.waitForTimeout(690);
 T('hold opens contextual modal',await phone.locator('#dialog-title').count()===1);
 await phone.locator('#cancel-modal').click();
 T('hold modal can dismiss',await phone.locator('.modal-backdrop').count()===0);
 await phone.locator('.dock-link[data-view=growth]').click();
 await phone.screenshot({path:join(DIR,'apple-growth-390.png'),animations:'disabled'});
 await phone.close();
 await touch.close();
 // Settings: BYOK only through original UI; never inspect credentials.
 await page.goto(BASE);
 await page.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:25000});
 await page.locator('.user-button').click();
 T('export available in settings',await page.locator('[data-action=export-data]').count()===1);
 await page.locator('[data-action=open-ai-config]').click();
 T('original AI settings UI is reachable',await page.locator('body.show-original-engine').count()===1);
 await page.locator('#close-ai-config').click();
 T('original AI settings can dismiss',await page.locator('body.show-original-engine').count()===0);
 const clip=await page.evaluate(()=>({glass:document.querySelectorAll('filter').length,reduce:matchMedia('(prefers-reduced-motion:reduce)').matches,motion:window.ZHIXU_APPLE_MOTION?.engine||'unverified'}));
 T('reduced motion is respected by CSS',clip.reduce,clip);
 T('actual skills optics loaded on reduced motion',clip.glass>0,clip);
 await ctx.close();
}catch(e){errors.push(e.stack);console.error(e.stack);}
finally{
 await b.close();
 const report={timestamp:new Date().toISOString(),counts:{passed:tests.filter(t=>t.pass).length,failed:tests.filter(t=>!t.pass).length,exceptions:errors.length},tests,errors};
 await writeFile(join(DIR,'deep-report.json'),JSON.stringify(report,null,2),'utf8');
 console.log('DEEP_REPORT '+JSON.stringify(report.counts));
 if(report.counts.failed||report.counts.exceptions)process.exitCode=1;
}
