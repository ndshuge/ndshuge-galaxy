import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(process.env.ZX_PLAYWRIGHT_PACKAGE||'E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const url=process.env.ZX_TEST_BASE||'http://127.0.0.1:19525/little-works/ai-academy-v4/';
test('Motion asset is module-preloaded rather than deferred until the boot handler',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(url,{waitUntil:'domcontentloaded'});
 const preload=await p.locator('link[rel=modulepreload][href*="motion.bundle.js"]').count();
 assert.equal(preload,1,'The optical/motion bundle should start loading during HTML parsing');
 }finally{await b.close()}
});
test('navigation works even while slow Motion bundle is still downloading',async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 let blocked=0;
 await p.route('**/motion.bundle.js',async route=>{blocked++;await new Promise(r=>setTimeout(r,1350));await route.continue()});
 await p.goto(url+'#today',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>!!window.ZHIXU_V4_DEBUG,null,{timeout:10000});
 await p.locator('#mobile-tabs [data-route=library]').click();
 await p.locator('main[data-page=library]').waitFor();
 assert.equal(await p.locator('#mobile-tabs [data-route=library]').getAttribute('aria-current'),'page');
 assert.ok(blocked>0,'The test must actually delay the requested asset');
 await p.waitForFunction(()=>window.ZHIXU_V4_ENGINES?.motion==='Motion',null,{timeout:8000});
 }finally{await b.close()}
});