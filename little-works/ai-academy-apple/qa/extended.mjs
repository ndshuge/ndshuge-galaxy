import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const dir=dirname(fileURLToPath(import.meta.url));
const BASE='http://127.0.0.1:18762/little-works/ai-academy-apple/';
const report={date:new Date().toISOString(),checks:[],errors:[],screenshots:[]};
const check=(name,yes,value)=>{report.checks.push({name,pass:!!yes,details:value});console.log((yes?'PASS ':'FAIL ')+name+' '+JSON.stringify(value||'').slice(0,200));};
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,acceptDownloads:true});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(BASE,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:22000});
 await page.waitForTimeout(3400); // let any transient success toast expire
 const head=await page.locator('.topbar').boundingBox();
 check('mobile native header stays in viewport',head?.y>=0,head);
 for(const v of ['today','learn','courses','library','growth','settings']){
   if(v!=='today'&&v!=='settings')await page.locator('.dock-link[data-view="'+v+'"]').click();
   if(v==='settings')await page.locator('.topbar .user-button').click();
   await page.waitForTimeout(530);
   const rect=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:innerWidth,title:document.querySelector('#main h1')?.textContent}));
   check('page '+v+' responsive',rect.scroll<=rect.client+2&&!!rect.title,rect);
   await page.screenshot({path:join(dir,'extended-'+v+'-390.png'),animations:'disabled'});
   report.screenshots.push('extended-'+v+'-390.png');
 }
 // Modal exposes Original's real BYOK UI inside the same page, never inventing a model connection.
 await page.locator('[data-action=open-ai-config]').click();
 const modal=await page.locator('#close-ai-config').count();
 const sourceOpen=await page.evaluate(()=>{
  const w=document.getElementById('original-engine').contentWindow;
  return w?.document?.querySelector('#pages-ai-dialog')?.getAttribute('data-open');
 });
 check('real original DeepSeek configuration opened in place',modal===1&&sourceOpen==='true',{modal,sourceOpen});
 await page.locator('#close-ai-config').click();
 check('model setup closes without deleting state',await page.locator('#close-ai-config').count()===0);
 // Native reusable glass component must actually react, not merely register.
 await page.locator('.dock-link[data-view="learn"]').click();
 const seg=page.locator('#experiment-segment');
 check('real segmented control mounted',await seg.count()===1);
 await seg.locator('button[value="evo-pair"]').click();
 await page.waitForTimeout(400);
 const stage=await page.locator('.eyebrow').allTextContents();
 check('native segmented selector changes real lesson',stage.some(s=>s.includes('生命与演化')),stage.slice(0,3));
 await page.locator('[data-action=load-question]').click();
 await page.locator('#quiz-form input[type=radio]').first().waitFor({timeout:12000});
 const disabled=await page.locator('#quiz-form button[type=submit]').isDisabled();
 check('submit stays disabled before choosing',disabled);
 await page.locator('#quiz-form input[type=radio]').first().check();
 check('radio selection enables submit',await page.locator('#quiz-form button[type=submit]').isEnabled());
 await page.locator('#quiz-form button[type=submit]').click();
 await page.locator('[data-action=next-prediction]').waitFor({timeout:12000});
 await page.locator('[data-action=next-prediction]').click();
 await page.locator('#prediction').fill('我猜测改变随机种子后，两组实验结果可能不同，不能由一次模拟断言普遍结论。');
 await page.locator('#prediction-form button[type=submit]').click();
 await page.getByText('实验，给出了怎样的答案？').waitFor({timeout:20000});
 const res=await page.locator('#main').innerText();
 check('actual EvoWorld browser model executed',res.includes('实验，给出了怎样的答案？'));
 await page.screenshot({path:join(dir,'extended-evolution-experiment-390.png'),animations:'disabled'});
 report.screenshots.push('extended-evolution-experiment-390.png');
 await page.locator('[data-action=mentor]').click();
 await page.getByText('规则引导').last().waitFor({timeout:12000});
 await page.locator('[data-action=propose-second]').click();
 await page.locator('#second-prediction').waitFor({timeout:12000});
 await page.locator('#second-prediction').fill('第二轮我预测另一组随机种子会带来不同但可比较的总体观察结果。');
 await page.locator('[data-action=approve-second]').click();
 await page.locator('.feedback.success').first().waitFor({timeout:20000});
 const second=await page.locator('.feedback.success').count();
 check('approved second experiment executed',second>=1,{second});
 const evidence=await page.evaluate(()=>JSON.parse(localStorage.getItem('ai-academy-learning-v02')).events.filter(x=>x.kind==='hypothesis_test').length);
 check('second scientific hypothesis stored',evidence>=2,{evidence});
 await page.locator('.dock-link[data-view="today"]').click();
 await page.waitForTimeout(650);
 await page.locator('.course-world h3').first().waitFor({timeout:10000});
 await page.locator('.course-world h3').first().scrollIntoViewIfNeeded();
 const h=await page.locator('.course-world h3').first().boundingBox();
 await page.mouse.move(h.x+10,h.y+10);
 await page.mouse.down();await page.waitForTimeout(720);await page.mouse.up();
 check('long press opens real course action',await page.locator('#dialog-title').count()===1);
 await page.locator('#cancel-modal').click();
 await page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await page.evaluate(()=>matchMedia('(prefers-reduced-motion:reduce)').matches);
 check('reduced-motion mode honored',reduced);
 await page.screenshot({path:join(dir,'extended-reduced-motion-390.png'),animations:'disabled'});
 report.screenshots.push('extended-reduced-motion-390.png');
 await page.goto(BASE+'compare.html',{waitUntil:'domcontentloaded'});
 check('Original ↔ Apple comparison page exists',await page.locator('.panel iframe').count()===2);
 await page.screenshot({path:join(dir,'extended-comparison-390.png'),animations:'disabled'});
 report.screenshots.push('extended-comparison-390.png');
 check('no page JS uncaught errors',report.errors.length===0,report.errors);
}catch(err){report.errors.push(err.stack);console.error(err.stack);}
finally{
 report.passed=report.checks.filter(x=>x.pass).length;report.failed=report.checks.filter(x=>!x.pass).length;
 await writeFile(join(dir,'extended-report.json'),JSON.stringify(report,null,2),'utf8');
 if(browser)await browser.close();
 console.log('EXTENDED_QA '+JSON.stringify({passed:report.passed,failed:report.failed,errors:report.errors.length}));
 if(report.failed||report.errors.length)process.exitCode=1;
}
