import{test}from'node:test';
import assert from'node:assert/strict';
import{createRequire}from'node:module';
const{chromium,webkit}=createRequire(process.env.ZX_PLAYWRIGHT_PACKAGE||'E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const url=process.env.ZX_TEST_BASE||'http://127.0.0.1:19525/little-works/ai-academy-v4/';
for(const [name,engine]of[['Edge',chromium],['WebKit',webkit]]){
 test(name+': route transition keeps content visible with a small staggered reveal',async()=>{
  const b=await engine.launch(name==='Edge'?{channel:'msedge',headless:true}:{headless:true});
  try{
   const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await p.goto(url+'#today',{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready===true,null,{timeout:15000});
   await p.locator('#mobile-tabs [data-route=library]').click();
   await p.locator('main[data-page=library]').waitFor();
   const state=await p.evaluate(()=>{
    const stage=document.querySelector('#screen'),first=stage.firstElementChild;
    return {rootOpacity:Number(getComputedStyle(stage).opacity),animation:getComputedStyle(first).animationName,headerTransform:getComputedStyle(first).transform,bodyText:stage.innerText,ghosts:document.querySelectorAll('#screen .previous-snapshot').length};
   });
   assert.ok(state.rootOpacity>=.92,'main content must remain readable');
   assert.ok(state.animation.includes('zx-v4-reveal'),'per-element visual feedback needs to run');
   assert.equal(state.headerTransform,'none','large heading should stay pixel-sharp without subpixel translation');
   assert.match(state.bodyText,/资料与错题/);
   assert.equal(state.ghosts,0,'no duplicate outgoing page');
   const mid=await p.evaluate(()=>document.getAnimations().filter(a=>(a.effect?.pseudoElement||'').includes('view-transition')).length);
   assert.equal(mid,0,'no screenshot-based view transitions');
   await p.waitForTimeout(420);
   assert.equal(await p.locator('#screen').getAttribute('data-page'),'library');
   await p.goBack({waitUntil:'domcontentloaded'}).catch(()=>{});
   await p.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='today',null,{timeout:4000});
  }finally{await b.close()}
 });
}
test('reduced motion disables reveal and preserves immediate navigation',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await p.goto(url+'#today',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready===true,null,{timeout:15000});
 await p.locator('#mobile-tabs [data-route=courses]').click();
 await p.locator('main[data-page=courses]').waitFor();
 assert.notEqual(await p.locator('#screen').getAttribute('data-entering'),'true');
 assert.equal(await p.locator('#mobile-tabs [data-route=courses]').getAttribute('aria-current'),'page');
 }finally{await b.close()}
});