import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const base=process.env.ZX_TEST_BASE||'http://127.0.0.1:19531/little-works/ai-academy-v4/';
for(const [name,engine] of [['Edge',chromium],['WebKit',webkit]]){
 test(name+': the doctor is a true round, edge-to-edge portrait, with no floating status dot',async()=>{
   const browser=await engine.launch(name==='Edge'?{channel:'msedge',headless:true}:{headless:true});
   try{
    const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const failures=[];
    page.on('pageerror',e=>failures.push(e.message));
    await page.goto(base+'#growth',{waitUntil:'domcontentloaded',timeout:18000});
    await page.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:15000});
    const avatar=page.locator('#doctor-launch');
    assert.equal(await avatar.locator('.doctor-avatar__media img').count(),1,'head-and-shoulder portrait must be its own circular media');
    const portrait=await avatar.locator('img').evaluate(async el=>({
      loaded:el.complete&&el.naturalWidth>0,
      src:el.currentSrc,
      radius:getComputedStyle(el.parentElement).borderRadius,
      objectFit:getComputedStyle(el).objectFit,
      shape:getComputedStyle(el.parentElement).overflow
    }));
    assert.ok(portrait.loaded&&portrait.src.includes('doctor-avatar.webp'),JSON.stringify(portrait));
    assert.equal(portrait.shape,'hidden');
    assert.equal(portrait.objectFit,'cover');
    assert.ok(portrait.radius.includes('%')||portrait.radius==='999px');
    const size=await avatar.boundingBox();
    const gear=await page.locator('.toolbar-trailing [data-route=settings]').boundingBox();
    assert.ok(size.width>=40&&size.width<=46,'portrait should be a clear 40-46px tap target');
    assert.ok(Math.abs(size.width-size.height)<=1,'portrait is a circle');
    assert.ok(Math.abs(size.width-gear.width)<=2,'doctor and gear have matching visual frames');
    assert.ok(Math.abs(size.y-gear.y)<3,'doctor and gear align on the toolbar baseline');
    const dot=await page.locator('#connected-dot').evaluate(el=>getComputedStyle(el).visibility==='hidden'||el.getBoundingClientRect().width<=1||getComputedStyle(el).display==='none');
    assert.ok(dot,'the green status dot is not floating beside the avatar');
    await avatar.click();
    assert.equal(await page.locator('#doctor-panel').isVisible(),true,'doctor interaction survives the redesign');
    await page.locator('#doctor-close').click();
    await page.locator('#doctor-panel').waitFor({state:'hidden',timeout:1700});
    assert.deepEqual(failures,[]);
   }finally{await browser.close()}
 });
}
