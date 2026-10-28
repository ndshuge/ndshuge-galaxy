import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const root='https://ndshuge.github.io/ndshuge-galaxy/little-works/ai-academy-apple/';
const b=await chromium.launch({channel:'msedge',headless:true});
const checks=[];const ck=(name,ok,data)=>{checks.push({name,ok:!!ok,data});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(data||{}).slice(0,220))};
try{
const page=await b.newPage({viewport:{width:390,height:844},hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const asset of ['doctor-companion.js','doctor-companion.css','assets/zhixu-doctor/idle.webp','assets/zhixu-doctor/welcome.webp']){
 const r=await page.request.get(root+asset+'?r23=3a29d39');
 ck('asset '+asset,r.status()===200,{status:r.status(),bytes:(await r.body()).byteLength});
}
await page.goto(root+'?r23=3a29d39',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.documentElement.dataset.engineReady==='true',{timeout:25000});
const doc=page.locator('#zx-doctor-open');
await doc.waitFor();
await page.waitForFunction(()=>document.querySelector('#zx-doctor-avatar')?.naturalWidth>0,{timeout:14000});
ck('doctor on production',await doc.isVisible()&&await doc.locator('img').evaluate(i=>i.naturalWidth>0));
await doc.click();
ck('production dialog opens',await page.locator('#zx-doctor-panel').isVisible());
ck('unconfigured BYOK honestly disabled',await page.locator('#zx-doctor-send').isDisabled());
await page.screenshot({path:'little-works/ai-academy-apple/qa/r23-online-390.png',animations:'disabled'});
await page.keyboard.press('Escape');
ck('dialog closes',await page.locator('#zx-doctor-panel').isHidden());
await page.locator('#mobile-nav button[data-view=learn]').click();
ck('Original study flow remains',await page.locator('#main .lesson-paper').count()===1);
await page.locator('[data-action=load-question]').click();
await page.locator('#quiz-form input[type=radio]').first().waitFor({timeout:12000});
ck('real Original question available and blank',await page.locator('#quiz-form input:checked').count()===0);
ck('page has no runtime exceptions',errors.length===0,errors);
const original=await page.request.get('https://ndshuge.github.io/zhixu-ai-academy/');
ck('Original Edition intact',original.status()===200,{status:original.status()});
await page.close();
}finally{await b.close()}
await writeFile('little-works/ai-academy-apple/qa/r23-online-report.json',JSON.stringify(checks,null,2));
console.log('ONLINE_R23_SUMMARY '+JSON.stringify({passed:checks.filter(x=>x.ok).length,failed:checks.filter(x=>!x.ok).length}));
if(checks.some(x=>!x.ok))process.exitCode=1;
