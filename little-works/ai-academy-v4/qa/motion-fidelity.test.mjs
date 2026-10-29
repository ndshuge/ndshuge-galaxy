import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(process.env.ZX_PLAYWRIGHT_PACKAGE || import.meta.url)('playwright');
const url=process.env.ZX_TEST_BASE || 'http://127.0.0.1:19523/little-works/ai-academy-v4/';


test('iPhone editable controls avoid input-focus page zoom',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:10000});
  await p.evaluate(()=>window.ZHIXU_V4_NAVIGATE('learn'));
  const values=await p.locator('textarea,input[type=text],input[type=number]').evaluateAll(nodes=>nodes.map(el=>({id:el.id,font:Number.parseFloat(getComputedStyle(el).fontSize)})));
  assert.ok(values.every(v=>v.font>=16),JSON.stringify(values));
 }finally{await b.close()}
});

test('original refractive engine is really mounted on a single backdrop layer',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>getComputedStyle(document.querySelector('#mobile-tabs .nav-optics')).backdropFilter.includes('url('),null,{timeout:9000});
  const proof=await p.evaluate(()=>({
   filter:getComputedStyle(document.querySelector('#mobile-tabs .nav-optics')).backdropFilter,
   displacement:document.querySelectorAll('feDisplacementMap').length,
   copies:document.querySelectorAll('#mobile-tabs .lg-nav__copy').length
  }));
  assert.ok(proof.filter.includes('url(')&&proof.displacement>0,'actual MIT SVG refractive backdrop');
  assert.equal(proof.copies,0);
 }finally{await b.close()}
});

test('reduced motion retains correct selection without spring movement',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:10000});
  await p.locator('#mobile-tabs [data-route=library]').click();
  const x=await p.evaluate(()=>{
   const button=document.querySelector('#mobile-tabs [data-route=library]').getBoundingClientRect();
   const indicator=document.querySelector('#mobile-tabs .tab-lens').getBoundingClientRect();
   return Math.abs(button.left-indicator.left);
  });
  assert.ok(x<3,'reduced motion takes immediate selection position');
 }finally{await b.close()}
});


test('explicit chat input focus switches the sheet to keyboard-safe layout',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:10000});
 await p.locator('#doctor-launch').click();
 await p.evaluate(()=>{
  // Layout-only simulation of an authenticated model; no keys or network calls.
  const q=document.querySelector('#doctor-question');
  q.disabled=false;document.querySelector('#doctor-panel').classList.add('ai-ready');
  q.focus();document.documentElement.style.setProperty('--visible-height','475px');
 });
 await p.waitForTimeout(80);
 assert.equal(await p.evaluate(()=>document.body.classList.contains('keyboard-visible')),true);
 const panel=await p.locator('#doctor-panel').boundingBox();
 assert.ok(panel.height<=440,'form remains inside visual viewport');
 }finally{await b.close()}
});

test('single nav layer and physically aligned spring lens, never duplicated labels',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:10000});
 const nav=p.locator('#mobile-tabs');
 assert.equal(await nav.locator('.lg-nav__copy').count(),0,'no duplicated navigation icon/label copy');
 assert.equal(await nav.locator('[data-route]').count(),5);
 assert.equal(await nav.locator('.tab-lens').count(),1,'single shared indicator');
 const before=await p.locator('.tab-lens').boundingBox();
 await nav.locator('[data-route=library]').click();await p.waitForTimeout(700);
 const after=await p.locator('.tab-lens').boundingBox();
 assert.ok(after.x>before.x+90,'spring indicator follows new tab');
 const result=await nav.evaluate(n=>{
  const buttons=[...n.querySelectorAll('button[data-route]')];
  const lens=n.querySelector('.tab-lens').getBoundingClientRect();
  const active=n.querySelector('button[aria-current=page]').getBoundingClientRect();
  return {lensX:lens.x,activeX:active.x,lensWidth:lens.width,activeWidth:active.width,buttonWidths:buttons.map(b=>b.getBoundingClientRect().width)};
 });
 assert.ok(Math.abs(result.lensX-result.activeX)<7,'lens aligns to active tab');
 assert.ok(result.buttonWidths.every(w=>w>=44),'44px minimum tap targets');
 }finally{await b.close()}
});

test('doctor sheet opens without auto keyboard and respects visual viewport',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:10000});
 await p.locator('#doctor-launch').click();await p.waitForTimeout(400);
 assert.equal(await p.locator('#doctor-panel').isVisible(),true);
 assert.notEqual(await p.evaluate(()=>document.activeElement?.id),'doctor-question','do not summon keyboard on open');
 assert.equal(await p.locator('#doctor-form').isVisible(),false,'unverified model does not show unusable chat input');
 assert.equal(await p.locator('#doctor-setup').isVisible(),true,'offer settings action instead');
 await p.evaluate(()=>{document.documentElement.style.setProperty('--visible-height','475px');document.body.classList.add('keyboard-visible')});
 const box=await p.locator('#doctor-panel').boundingBox();
 assert.ok(box.height<=475-35,'panel fits visible viewport');
 assert.equal(await p.locator('#mobile-tabs').evaluate(n=>getComputedStyle(n).pointerEvents),'none','dock should not compete with keyboard');
 }finally{await b.close()}
});


test('touch hold makes one connected lens breathe, and drag scrubs it into another tab',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try {
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:10000});
 const nav=p.locator('#mobile-tabs'),lens=p.locator('.tab-lens');
 await p.waitForTimeout(200);
 const normal=await lens.boundingBox();
 const btn=nav.locator('[data-route=today]');
 const from=await btn.boundingBox(),to=await nav.locator('[data-route=library]').boundingBox();
 await p.mouse.move(from.x+from.width/2,from.y+from.height/2);
 await p.mouse.down();await p.waitForTimeout(120);
 const pressed=await lens.boundingBox();
 await p.waitForTimeout(340);
 const held=await lens.boundingBox();
 assert.ok(held.width>pressed.width*1.025,'a sustained hold changes material shape, not just a static press');
 await p.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:12});
 await p.waitForTimeout(130);
 const scrubbing=await lens.boundingBox();
 assert.ok(scrubbing.x>normal.x+85,'glass follows horizontal finger drag before release');
 await p.mouse.up();await p.waitForTimeout(750);
 assert.equal(await p.locator('main').getAttribute('data-page'),'library');
 const settled=await lens.boundingBox();
 assert.ok(Math.abs(settled.width-normal.width)<3,'releases to normal shape');
 }finally{await b.close()}
});


test('cancelled horizontal gesture springs home without triggering navigation',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:10000});
  const home=await p.locator('#mobile-tabs [data-route=today]').boundingBox();
  const lib=await p.locator('#mobile-tabs [data-route=library]').boundingBox();
  await p.evaluate(({x,y})=>{
   const start=document.querySelector('#mobile-tabs [data-route=today]');
   start.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:8,button:0,clientX:x,clientY:y}));
  },{x:home.x+home.width/2,y:home.y+home.height/2});
  await p.evaluate(({x,y})=>{
   document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:8,button:0,clientX:x,clientY:y}));
  },{x:lib.x+lib.width/2,y:lib.y+lib.height/2});
  await p.evaluate(({x,y})=>{
   document.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:8,clientX:x,clientY:y}));
  },{x:lib.x+lib.width/2,y:lib.y+lib.height/2});
  await p.waitForTimeout(670);
  assert.equal(await p.locator('main').getAttribute('data-page'),'today','cancel is not a navigation command');
  const lens=await p.locator('.tab-lens').boundingBox();
  const btn=await p.locator('#mobile-tabs [data-route=today]').boundingBox();
  assert.ok(Math.abs(lens.x-btn.x)<7,'lens retargets the last committed tab');
 }finally{await b.close()}
});

test('rapid nav routes settle to the last destination',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:10000});
 await p.locator('#mobile-tabs [data-route=courses]').click();await p.locator('#mobile-tabs [data-route=growth]').click();await p.waitForTimeout(740);
 assert.equal(await p.locator('main[data-page=growth]').count(),1);
 assert.equal(await p.locator('#mobile-tabs .tab-lens').count(),1);
 assert.equal(await p.locator('#mobile-tabs [data-route=growth]').getAttribute('aria-current'),'page');
 assert.equal(await p.evaluate(()=>window.ZHIXU_V4_ENGINES?.motion),'Motion');
 }finally{await b.close()}
});
