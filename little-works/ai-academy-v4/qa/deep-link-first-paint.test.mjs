import{test}from'node:test';
import assert from'node:assert/strict';
import{createRequire}from'node:module';
const{chromium,webkit}=createRequire(process.env.ZX_PLAYWRIGHT_PACKAGE||'E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const base=process.env.ZX_TEST_BASE||'http://127.0.0.1:19529/little-works/ai-academy-v4/';
for(const [label,engine]of[['Edge',chromium],['WebKit',webkit]]){
 test(label+': deep links render correct route before module arrives',async()=>{
  const b=await engine.launch(label==='Edge'?{channel:'msedge',headless:true}:{headless:true});
  try{
   const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await p.route('**/ai-academy-v4/v4.js**',r=>r.abort('failed'));
   for(const [hash,expected]of[['library','资料与错题'],['learn','从判断开始'],['settings','设置'],['growth','学习进度']]){
    // Each hash is a fresh deep-link visit, not a hashchange with the app intentionally blocked.
    await p.goto('about:blank');
    await p.goto(base+'#'+hash,{waitUntil:'domcontentloaded',timeout:14000});
    assert.equal(await p.locator('#screen').getAttribute('data-page'),hash);
    assert.match(await p.locator('#screen').innerText(),new RegExp(expected));
    if(hash==='settings')assert.equal(await p.locator('#toolbar-title').innerText(),'设置');
    else assert.equal(await p.locator('#mobile-tabs [data-route='+hash+']').getAttribute('aria-current'),'page');
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   }
  }finally{await b.close()}
 });
}
test('when module loads, correct deep link hydrates to working original science page',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(base+'#learn',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready===true,null,{timeout:15000});
 assert.equal(await p.locator('#screen').getAttribute('data-page'),'learn');
 assert.equal(await p.locator('#screen [data-action=load-question]').count(),1);
 }finally{await b.close()}
});