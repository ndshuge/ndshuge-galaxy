import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
const checks=[];const ck=(name,pass,details)=>{checks.push({name,pass:!!pass,details});console.log((pass?'PASS ':'FAIL ')+name+' '+JSON.stringify(details||{}).slice(0,260))};
try{
await page.goto('http://127.0.0.1:18889/little-works/ai-academy-apple/',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.documentElement.dataset.engineReady==='true',{timeout:23000});
const engine=await page.evaluate(()=>window.ZHIXU_APPLE_MOTION?.engine);
ck('Motion engine native import',engine==='Motion',{engine});
async function press(selector,name){
 const el=page.locator(selector).first();
 await el.scrollIntoViewIfNeeded();
 const r=await el.boundingBox();
 await page.mouse.move(r.x+r.width/2,r.y+r.height/2);
 await page.mouse.down();await page.waitForTimeout(120);
 const during=await el.evaluate(n=>({active:n.matches(':active'),transform:getComputedStyle(n).transform,scale:getComputedStyle(n).scale}));
 await page.mouse.up();
 ck(name,during.active&&(during.transform!=='none'||during.scale!=='none'),during);
}
await press('.reading-hero button.primary','hero primary spring press');
await page.locator('#mobile-nav button[data-view="courses"]').click();
await press('.course-world button.primary','course button tactile press');
await page.locator('#mobile-nav button[data-view="learn"]').click();
await press('.study-stage:not(:disabled)','learning-stage press');
const seg=page.locator('#experiment-segment');
await seg.locator('button[value="logistic"]').click();
ck('segmented real selection',await seg.locator('button[value="logistic"]').getAttribute('aria-checked')==='true');
const hidden=await page.evaluate(()=>getComputedStyle(document.querySelector('#experiment-segment > .lg-refract')).visibility==='hidden');
ck('segmented no duplicate ink',hidden);
// Settings has its own top-right button; the panel is covered by doctor UX tests.
} catch(err){ck('audit unexpected error',false,String(err.message||err))}
await page.close();
await browser.close();
await writeFile('little-works/ai-academy-apple/qa/r23-motion-audit.json',JSON.stringify(checks,null,2));
console.log('MOTION_AUDIT '+JSON.stringify({passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length}));
if(checks.some(x=>!x.pass))process.exitCode=1;
