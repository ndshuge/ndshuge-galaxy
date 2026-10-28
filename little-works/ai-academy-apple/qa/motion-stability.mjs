import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const ROOT='http://127.0.0.1:18886/little-works/ai-academy-apple/';
const out='little-works/ai-academy-apple/qa/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const records=[],fail=[],exceptions=[];
function check(n,ok,x){records.push({n,ok:!!ok,x}); console.log((ok?'PASS ':'FAIL ')+n+' '+JSON.stringify(x??{}).slice(0,360));if(!ok)fail.push(n)}
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:844},hasTouch:width===390});
  page.on('pageerror',e=>exceptions.push(e.message));
  await page.goto(ROOT,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#bridge-state')?.textContent?.includes('已连接'),{timeout:23000});
  const base=await page.evaluate(()=>{
    const n=document.querySelector('#mobile-nav');
    return {hidden:getComputedStyle(n.querySelector('.lg-nav__copy')).visibility, real:getComputedStyle(n.querySelector('button>span')).visibility,
    clones:n.querySelectorAll('.lg-nav__copy').length,viewTransition:document.getAnimations().some(a=>String(a.effect?.pseudoElement||'').includes('view-transition')),
    screens:document.documentElement.scrollWidth, viewport:innerWidth,
    img:!!document.querySelector('.r2-science[role=img]'),
    text:document.querySelector('#main h1')?.textContent,
    originals:document.querySelectorAll('#main .r2-science').length};
  });
  check('single picture and crisp idle ink '+width,base.hidden==='hidden'&&base.real==='visible'&&base.clones===1&&base.img&&base.screens<=width+2,base);
  if(width===390){
    await page.screenshot({path:join(out,'stable-before-390.png'),animations:'disabled'});
    const nav=page.locator('#mobile-nav');
    const tabs=await nav.locator(':scope > button[data-view]').all();
    const a=await tabs[0].boundingBox(),b=await tabs[2].boundingBox();
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.waitForTimeout(130);
    const held=await page.evaluate(()=>({pressed:document.querySelector('#mobile-nav').classList.contains('is-scrubbing'),copy:getComputedStyle(document.querySelector('#mobile-nav .lg-nav__copy')).visibility,original:getComputedStyle(document.querySelector('#mobile-nav>button>span')).visibility}));
    check('Motion Lab press keeps optical layer behind readable labels',held.pressed&&held.copy==='hidden'&&held.original==='visible',held);
    await page.screenshot({path:join(out,'stable-held-390.png')});
    for(let i=0;i<7;i++) await page.mouse.move(a.x+a.width/2+(b.x+b.width/2-a.x-a.width/2)*(i+1)/7,a.y+a.height/2,{steps:2});
    await page.waitForTimeout(80);
    const mid=await page.evaluate(()=>window.ZHIXU_APPLE_NAV_SCRUB?.state?.());
    check('Motion Lab finger-follow targets course tab',mid?.pressed&&mid.preview===2,mid);
    await page.screenshot({path:join(out,'stable-drag-390.png')});
    await page.mouse.up();
    await page.waitForFunction(()=>location.hash==='#courses',{timeout:4000});
    await page.waitForTimeout(350);
    const after=await page.evaluate(()=>({active:[...document.querySelectorAll('#mobile-nav>button[aria-current=page]')].map(x=>x.dataset.view),cloned:getComputedStyle(document.querySelector('.lg-nav__copy')).visibility,ink:getComputedStyle(document.querySelector('#mobile-nav>button>span')).visibility,ghosts:document.getAnimations().filter(x=>String(x.effect?.pseudoElement||'').includes('view-transition')).length,scroll:document.documentElement.scrollWidth}));
    check('release selects course once and restores sharp text',after.active.join(',')==='courses'&&after.cloned==='hidden'&&after.ink==='visible'&&after.ghosts===0,after);
    await page.screenshot({path:join(out,'stable-release-390.png'),animations:'disabled'});
    for(let i=0;i<12;i++){
       const target=i%2?'today':'learn';await page.locator('#mobile-nav>button[data-view='+target+']').click();
       await page.waitForFunction(v=>location.hash==='#'+v,target,{timeout:2500});
    }
    check('12 consecutive taps have stable final route',await page.evaluate(()=>location.hash==='#today'&&document.querySelectorAll('main>.page').length===1));
    const active=await page.evaluate(()=>({tab:document.querySelector('#mobile-nav button[aria-current=page]')?.dataset.view,copies:getComputedStyle(document.querySelector('#mobile-nav .lg-nav__copy')).visibility}));
    check('repeated taps end with one selected tab and hidden clone',active.tab==='today'&&active.copies==='hidden',active);
  }
  if(width===1440){await page.screenshot({path:join(out,'stable-desktop-1440.png'),animations:'disabled'})}
  await page.close();
 }
 check('uncaught page exceptions',exceptions.length===0,exceptions);
}finally{await browser.close();await writeFile(join(out,'motion-stability-report.json'),JSON.stringify({records,fail,exceptions},null,2));console.log('MOTION_STABILITY '+JSON.stringify({passed:records.length-fail.length,failed:fail.length}));if(fail.length)process.exitCode=1}
