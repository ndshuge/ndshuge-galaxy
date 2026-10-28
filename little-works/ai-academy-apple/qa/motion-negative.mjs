import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const url='http://127.0.0.1:18886/little-works/ai-academy-apple/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const checks=[];const check=(name,ok,extra)=>{checks.push({name,pass:!!ok,extra});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(extra??{}).slice(0,210))};
try{
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
await page.goto(url,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.documentElement.dataset.engineReady==='true',{timeout:22000});
check('No transient success toast covers lesson',!(await page.locator('.toast').evaluate(el=>el.classList.contains('show'))));
const navbar=page.locator('#mobile-nav');
const getRect=async view=>await navbar.locator('button[data-view='+view+']').boundingBox();
const a=await getRect('today'),b=await getRect('growth');
await page.evaluate(()=>{document.addEventListener('pointerdown',e=>window._testPid=e.pointerId,{capture:true,once:true})});
await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:10});
check('Drag preview does not change learning view before release',await page.evaluate(()=>location.hash==='#today'));
await page.evaluate(()=>document.querySelector('#mobile-nav').dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,isPrimary:true,pointerId:window._testPid})));
await page.mouse.up();await page.waitForTimeout(150);
const cancelled=await page.evaluate(()=>({tab:document.querySelector('#mobile-nav button[aria-current=page]')?.dataset.view,hash:location.hash,scrubbing:document.querySelector('#mobile-nav').classList.contains('is-scrubbing'),copy:getComputedStyle(document.querySelector('#mobile-nav .lg-nav__copy')).visibility}));
check('Pointercancel restores selected tab, avoids route change',cancelled.hash==='#today'&&cancelled.tab==='today'&&!cancelled.scrubbing&&cancelled.copy==='hidden',cancelled);
await navbar.locator('button[data-view=learn]').focus();
await page.keyboard.press('Enter');await page.waitForFunction(()=>location.hash==='#learn',{timeout:4000});
check('Keyboard Enter navigates using genuine control',await page.locator('#main .lesson-paper').count()===1);
await page.emulateMedia({reducedMotion:'reduce'});
await navbar.locator('button[data-view=courses]').click();
await page.waitForFunction(()=>location.hash==='#courses',{timeout:4000});
const reduced=await page.evaluate(()=>({copy:getComputedStyle(document.querySelector('#mobile-nav .lg-nav__copy')).visibility,active:document.querySelector('#mobile-nav button[aria-current=page]')?.dataset.view,vt:document.getAnimations().filter(a=>String(a.effect?.pseudoElement||'').includes('view-transition')).length}));
check('Reduced motion stable, no double text, correct navigation',reduced.copy==='hidden'&&reduced.active==='courses'&&reduced.vt===0,reduced);
await page.emulateMedia({reducedMotion:'no-preference'});
for(let i=0;i<60;i++){
 const name=['today','learn','courses','growth','library'][i%5];
 await navbar.locator('button[data-view='+name+']').click();
 await page.waitForFunction(v=>location.hash==='#'+v,name,{timeout:2000});
}
const stress=await page.evaluate(()=>({hash:location.hash,selected:[...document.querySelectorAll('#mobile-nav button[aria-current=page]')].map(x=>x.dataset.view),numViews:document.querySelectorAll('#main>.page').length,renderCopies:document.querySelectorAll('.lg-nav__copy').length,ink:getComputedStyle(document.querySelector('#mobile-nav .lg-nav__copy')).visibility}));
check('60 rapid view retargets preserve a single view and selected state',stress.hash==='#library'&&stress.selected.join('')==='library'&&stress.numViews===1&&stress.ink==='hidden',stress);
await page.close();
}finally{await browser.close();await writeFile('little-works/ai-academy-apple/qa/motion-negative-report.json',JSON.stringify(checks,null,2));console.log('NEGATIVE_SUMMARY '+JSON.stringify({passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length}));if(checks.some(x=>!x.pass))process.exitCode=1}
