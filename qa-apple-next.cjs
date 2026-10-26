const fs=require('fs'),path=require('path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const url=process.env.XIAOYA_APPLE_TEST_URL||'http://127.0.0.1:5393/little-works/xiaoya-apple/';
(async()=>{
 const browser=await chromium.launch(process.env.XIAOYA_BROWSER_CHANNEL==='chromium'?{headless:true}:{channel:'msedge',headless:true});
 const reports=[];
 const dir=path.join(__dirname,'docs','xiaoya-apple-next-qa');fs.mkdirSync(dir,{recursive:true});
 for(const w of [320,390,768,1440]){
  const p=await browser.newPage({viewport:{width:w,height:w<600?844:900},reducedMotion:'no-preference'});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text().slice(0,140))});
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:25000});await p.waitForSelector('#xy-onboard');await p.waitForTimeout(550);if(w===390){await p.screenshot({path:path.join(dir,'onboarding-390.png')});}await p.locator('#xy-local').evaluate(b=>b.click());await p.waitForTimeout(650);const dismissed=await p.locator('#xy-onboard').evaluate(e=>e.hidden);
  await p.locator('#ai-global-entry').evaluate(b=>b.click());
  const manualReopen=await p.locator('#xy-onboard').evaluate(e=>!e.hidden);
  await p.locator('#xy-skip').evaluate(b=>b.click());
  await p.waitForTimeout(420);
  const staysDismissed=await p.locator('#xy-onboard').evaluate(e=>e.hidden);
  if(w<=790)await p.waitForFunction(()=>getComputedStyle(document.querySelector('.xy-glass-indicator')).backdropFilter.includes('url('),{timeout:4000}).catch(()=>{});
  const baseline=await p.evaluate(()=>{
    const d=document.documentElement,nav=document.querySelector('.mobile-tabs'),lens=document.querySelector('.xy-glass-indicator');
    const radius = selector => parseFloat(getComputedStyle(document.querySelector(selector)).borderTopLeftRadius)||0;
    return {shell:document.body.classList.contains('apple-next'),overflow:d.scrollWidth-innerWidth,glass:nav?.dataset.glass||'',filter:lens?getComputedStyle(lens).backdropFilter:'missing',heroRect:document.querySelector('.xy-cinema')?.getBoundingClientRect().toJSON(),sheetRadius:radius('#xy-onboard .xy-dialog'),groupRadius:radius('#view-settings > .panel'),controlRadius:radius('#xy-connect'),heroRadius:radius('.xy-cinema')};
  });
  await p.screenshot({path:path.join(dir,'after-'+w+'.png')});
  const first=await p.locator('#view-today.view.active').count();
  const nav=w<=790?p.locator('.mobile-tabs button[data-view="tasks"]'):p.locator('.side-nav button[data-view="tasks"]');
  await nav.evaluate(b=>b.click());
  const tasks=await p.locator('#view-tasks.view.active').count();
  await p.waitForTimeout(450);
  if(w===390)await p.screenshot({path:path.join(dir,'post-release-390.png')});
  const back=w<=790?p.locator('.mobile-tabs button[data-view="today"]'):p.locator('.side-nav button[data-view="today"]');
  await back.evaluate(b=>b.click());
  const returned=await p.locator('#view-today.view.active').count();
  const lensVisible=await p.evaluate(()=>{const nav=document.querySelector('.mobile-tabs');const lens=nav?.querySelector('.xy-glass-indicator');if(!lens)return false;const st=getComputedStyle(lens);return st.display!=='none'&&st.visibility!=='hidden'&&Number(st.opacity)!==0&&lens.getBoundingClientRect().width>=35;});
  reports.push({width:w,...baseline,dismissed,manualReopen,staysDismissed,first,clickedTasks:tasks,returned,lensVisible,errors});
  await p.close();
 }
 const safari=await browser.newPage({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'});
 await safari.addInitScript(()=>Object.defineProperty(navigator,'userAgentData',{value:undefined,configurable:true}));
 await safari.goto(url,{waitUntil:'domcontentloaded'});await safari.waitForTimeout(500);
 const webkitClaim=await safari.evaluate(()=>({mode:document.querySelector('.mobile-tabs')?.dataset.glass,engine:document.querySelector('.mobile-tabs')?.dataset.glassEngine}));
 await safari.close();
 const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await p.goto(url);const reduced=await p.evaluate(()=>({motion:matchMedia('(prefers-reduced-motion: reduce)').matches,nav:document.querySelector('.mobile-tabs')?.dataset.glass||''}));await p.close();await browser.close();
 const requireWebkit=process.env.XIAOYA_REQUIRE_WEBKIT==='1';
 let realWebkit={tested:false};
 try {
  const wk=await webkit.launch({headless:true});
  const w=await wk.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const wkErrors=[];w.on('pageerror',e=>wkErrors.push(e.message));
  await w.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
  await w.waitForTimeout(850);
  if(await w.locator('#xy-skip').isVisible())await w.locator('#xy-skip').click();
  await w.waitForTimeout(650);
  await w.screenshot({path:path.join(dir,'webkit-content-refraction-today-390.png')});
  const before=await w.evaluate(()=>{const nav=document.querySelector('.mobile-tabs'),c=nav?.querySelector('.xy-refract-copy');return {engine:nav?.dataset.glassEngine,mode:nav?.dataset.glass,filter:getComputedStyle(c).filter,clip:c.style.clipPath,overflow:document.documentElement.scrollWidth-innerWidth,realButtons:nav.querySelectorAll('button[data-view]').length,duplicateButtons:c.querySelectorAll('button').length,svgCopies:c.querySelectorAll('svg').length,ariaHidden:c.getAttribute('aria-hidden'),copyPointerEvents:getComputedStyle(c).pointerEvents,dockBackground:getComputedStyle(nav).backgroundColor}});
  await w.locator('.mobile-tabs button[data-view="tasks"]').tap();
  await w.waitForTimeout(700);
  await w.screenshot({path:path.join(dir,'webkit-content-refraction-tasks-390.png')});
  const after=await w.evaluate(()=>({active:document.querySelector('.mobile-tabs button.active')?.dataset.view,filter:document.querySelector('.xy-refract-copy')?.style.filter,clip:document.querySelector('.xy-refract-copy')?.style.clipPath}));
  // Exercise native touch hit targets through multiple route changes.
  for (const route of ['goals','review','schedule','today']) {
    await w.locator('.mobile-tabs button[data-view="'+route+'"]').tap();
    await w.waitForTimeout(150);
  }
  await w.waitForTimeout(480);
  const settle=await w.evaluate(async()=>{
    const copy=document.querySelector('.xy-refract-copy');
    const initial=copy?.style.filter;
    await new Promise(resolve=>setTimeout(resolve,380));
    return {active:document.querySelector('.mobile-tabs button.active')?.dataset.view,
      stable:copy?.style.filter===initial, animations:document.getAnimations().filter(x=>x.playState==='running').length};
  });
  realWebkit={tested:true,before,after,settle,errors:wkErrors};
  await w.close(); await wk.close();
  if(before.engine!=='webkit'||before.mode!=='content-refraction'||!before.filter.includes('url(')||before.duplicateButtons!==0||before.realButtons!==6||before.svgCopies!==6||before.ariaHidden!=='true'||before.copyPointerEvents!=='none'||before.overflow>2||after.active!=='tasks'||before.clip===after.clip||settle.active!=='today'||!settle.stable||wkErrors.length)process.exitCode=2;
 } catch(e) {
  realWebkit={tested:false,error:e.message.slice(0,180)};
  if(requireWebkit) process.exitCode=2;
 }
 console.log(JSON.stringify({reports,reduced,realWebkit}));
 if(reports.some(x=>x.overflow>2||!x.shell||!x.dismissed||!x.manualReopen||!x.staysDismissed||x.sheetRadius<32||x.groupRadius<28||x.heroRadius<32||x.controlRadius>19||x.controlRadius>=x.groupRadius||!x.first||!x.clickedTasks||!x.returned||x.errors.length||(x.width<=790 && (x.glass!=='refraction'||!x.filter.includes('url(')||!x.lensVisible))))process.exitCode=2;
})().catch(e=>{console.error(e.stack);process.exitCode=3})