// XiaoYa three-version comparison: real-browser functional + responsive acceptance.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const site=process.env.XIAOYA_COMPARE_TEST_URL||'http://127.0.0.1:18925/little-works/';
const widths=[320,390,768,1440],errors=[],checks=[],screens=[];
const out=path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});
async function test(name,fn){console.log('START',name);try{const result=await fn();checks.push({name,pass:true,...(result?{result}: {})});console.log('PASS',name)}catch(e){checks.push({name,pass:false,error:e.message?.slice(0,320)});console.log('FAIL',name,e.message?.slice(0,160))}}
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:width<=390?844:900},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(5500);page.setDefaultTimeout(5000);
 page.on('pageerror',e=>errors.push({scope:'gallery-'+width,error:e.message}));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(site))errors.push({scope:'gallery-'+width,http:r.status(),url:r.url()})});
 await test('Gallery loads '+width,async()=>{const r=await page.goto(site,{waitUntil:'networkidle',timeout:20000});assert.equal(r.status(),200);assert.equal(await page.locator('.gallery .card').count(),8)});
 await test('Three XiaoYa buttons '+width,async()=>{
    const card=page.locator('.xiaoya-card');assert.equal(await card.count(),1);
    const links=card.locator('nav a');assert.equal(await links.count(),3);
    const hrefs=await links.evaluateAll(els=>els.map(e=>e.href));
    assert(hrefs[0].endsWith('/xiaoya-lifelab/'));
    assert(hrefs[1].endsWith('/little-works/xiaoya-apple/'));
    assert(hrefs[2].endsWith('/little-works/xiaoya-studio/'));
    assert.equal(await card.locator('a a').count(),0);return hrefs;
 });
 await test('Gallery no overflow '+width,async()=>{const scroll=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));assert(scroll.scroll<=scroll.inner+1,JSON.stringify(scroll))});
 if(width===390){await page.locator('.xiaoya-card').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'xiaoya-gallery-buttons-mobile.png'),animations:'disabled'});}
 await context.close();
 for(const variant of ['xiaoya-apple','xiaoya-studio']){
   const ctx=await browser.newContext({viewport:{width,height:width<=390?844:900},deviceScaleFactor:1,reducedMotion:'reduce'});
   const p=await ctx.newPage();p.setDefaultTimeout(5000); const scope=variant+'-'+width;
   p.on('pageerror',e=>errors.push({scope,error:e.message}));
   p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(site))errors.push({scope,http:r.status(),url:r.url()})});
   await test(scope+' loads',async()=>{
    const r=await p.goto(site+variant+'/?judge=1',{waitUntil:'networkidle',timeout:25000});
    assert.equal(r.status(),200);await p.waitForSelector('#view-today.active',{timeout:10000});
    await p.waitForTimeout(550);if(await p.locator('#xy-skip').isVisible()) await p.locator('#xy-skip').click();assert((await p.title()).includes('\u5c0f\u82bd'));
   });
   await test(scope+' viewport',async()=>{const s=await p.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth,html:document.documentElement.clientWidth}));assert(s.scroll<=s.inner+1,JSON.stringify(s));return s;});
   await test(scope+' source+theme+switcher',async()=>{
    assert.equal(await p.locator('.comparison-nav a').count(),4);
    assert.equal(await p.locator('link[href*="comparison.css"]').count(),1);
    const body=await p.locator('body').getAttribute('class');assert(body.includes(variant==='xiaoya-apple'?'design-apple':'design-studio'));
    const color=await p.locator('.hero').evaluate(e=>getComputedStyle(e).backgroundColor);return {body,color};
   });
   await test(scope+' navigation',async()=>{
    if(await p.locator('#xy-skip').isVisible())await p.locator('#xy-skip').click();
    for(const route of ['tasks','schedule','goals','review','settings','today']){
      const target=(width<=860?'.mobile-tabs button':'.sidebar .nav-link')+'[data-view="'+route+'"]';
      await p.locator(target+':visible').first().click();
      assert.equal(await p.locator('#view-'+route).evaluate(e=>e.classList.contains('active')),true,route);
    }
   });
   await test(scope+' isolated storage',async()=>{
    const ks=await p.evaluate(()=>Object.keys(localStorage));assert(!ks.includes('xiaoya:personal:v1'));assert(!ks.includes('xiaoya.byok.credential.v1'));
    assert(ks.some(k=>k.includes('xiaoya-comparison:'+variant+':')));return ks.filter(k=>k.includes(variant));
   });
   if(width===390||width===1440){await p.waitForTimeout(230);const dest=path.join(out,variant+'-'+width+'-after.png');await p.screenshot({path:dest,animations:'disabled'});screens.push(dest);}
   await ctx.close();
 }
}
await browser.close();
const report={checkedAt:new Date().toISOString(),checks,screens,errors,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length};
fs.writeFileSync(path.join(out,'xiaoya-compare-qa.json'),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify({passed:report.passed,failed:report.failed,failures:checks.filter(c=>!c.pass),errors,screens},null,2));
if(report.failed||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
