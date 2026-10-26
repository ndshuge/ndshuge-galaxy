const fs=require('fs'),path=require('path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const url=process.env.XIAOYA_APPLE_TEST_URL||'http://127.0.0.1:5393/little-works/xiaoya-apple/';
(async()=>{
 const browser=await chromium.launch(process.env.XIAOYA_BROWSER_CHANNEL==='chromium'?{headless:true}:{channel:'msedge',headless:true});
 const reports=[];
 const dir=process.env.XIAOYA_QA_OUTPUT_DIR||path.join(__dirname,'docs','xiaoya-apple-next-qa');fs.mkdirSync(dir,{recursive:true});
 for(const w of [320,390,768,1440]){console.log('WIDTH_BEGIN',w);
  const p=await browser.newPage({viewport:{width:w,height:w<600?844:900},reducedMotion:'no-preference'});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text().slice(0,140))});
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:25000});await p.waitForSelector('#xy-onboard');await p.waitForTimeout(550);if(w===390){await p.screenshot({path:path.join(dir,'onboarding-390.png')});}
  const firstLaunch=await p.evaluate(()=>({hasArt:document.querySelector('.xy-intro-illustration')?.naturalWidth>0,optionalCollapsed:!document.querySelector('.xy-onboard-optional')?.open}));
  await p.locator('.xy-onboard-optional summary').evaluate(e=>e.click());
  const optionalExpanded=await p.evaluate(()=>({open:document.querySelector('.xy-onboard-optional')?.open,key:!!document.querySelector('#xy-key')?.getClientRects().length,warning:document.querySelector('.xy-onboard-optional')?.textContent.includes('CORS')}));
  await p.locator('.xy-onboard-optional summary').evaluate(e=>e.click());
  const optionalClosed=await p.locator('.xy-onboard-optional').evaluate(e=>!e.open);
  await p.locator('#xy-local').evaluate(b=>b.click());await p.waitForTimeout(650);const dismissed=await p.locator('#xy-onboard').evaluate(e=>e.hidden);
  await p.locator('#ai-global-entry').evaluate(b=>b.click());
  const manualReopen=await p.locator('#xy-onboard').evaluate(e=>!e.hidden);
  const manualOpensForm=await p.locator('.xy-onboard-optional').evaluate(e=>e.open);
  await p.locator('#xy-skip').evaluate(b=>b.click());
  await p.waitForTimeout(420);
  const staysDismissed=await p.locator('#xy-onboard').evaluate(e=>e.hidden);
  if(w<=790)await p.waitForFunction(()=>getComputedStyle(document.querySelector('.xy-glass-indicator')).backdropFilter.includes('url('),{timeout:4000}).catch(()=>{});
  const baseline=await p.evaluate(()=>{
    const d=document.documentElement,nav=document.querySelector('.mobile-tabs'),lens=document.querySelector('.xy-glass-indicator');
    const radius = selector => parseFloat(getComputedStyle(document.querySelector(selector)).borderTopLeftRadius)||0;
    const numericCells=[...document.querySelectorAll('.rc-table td:nth-child(n+2):nth-child(-n+5)')];
    return {shell:document.body.classList.contains('apple-next'),overflow:d.scrollWidth-innerWidth,glass:nav?.dataset.glass||'',filter:lens?getComputedStyle(lens).backdropFilter:'missing',heroRect:document.querySelector('.xy-cinema')?.getBoundingClientRect().toJSON(),sheetRadius:radius('#xy-onboard .xy-dialog'),groupRadius:radius('#view-settings > .panel'),controlRadius:radius('#xy-connect'),heroRadius:radius('.xy-cinema'),numericTotal:numericCells.length,numericAligned:numericCells.every(td=>getComputedStyle(td).textAlign==='right'),tinyText:[...document.querySelectorAll('body *')].filter(e=>e.children.length===0&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<11&&getComputedStyle(e).display!=='none').length};
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
  const settingsNav=w<=790?p.locator('.mobile-tabs button[data-view="settings"]'):p.locator('.sidebar-bottom button[data-view="settings"]');
  await settingsNav.evaluate(b=>b.click());
  const semesterInfo=await p.locator('#view-settings .xy-semester-disclosure').evaluate(e=>({closed:!e.open,text:e.textContent.length}));
  await p.locator('#view-settings .xy-semester-disclosure summary').evaluate(e=>e.click());
  const semesterOpened=await p.locator('#view-settings .xy-semester-disclosure').evaluate(e=>e.open);
  await p.locator('#view-settings .xy-semester-disclosure summary').evaluate(e=>e.click());
  const disclosure=await p.locator('#byok-settings .xy-ai-disclosure').evaluate(e=>({closed:!e.open,safety:e.textContent.includes('CORS'),label:e.querySelector('summary')?.textContent}));
  await p.locator('#byok-settings .xy-ai-disclosure summary').evaluate(e=>e.click());
  const opened=await p.locator('#byok-settings .xy-ai-disclosure').evaluate(e=>e.open);
  await p.locator('#byok-settings .xy-ai-disclosure summary').evaluate(e=>e.click());
  const closedAgain=await p.locator('#byok-settings .xy-ai-disclosure').evaluate(e=>!e.open);
  await back.evaluate(b=>b.click());
  const lensVisible=await p.evaluate(()=>{const nav=document.querySelector('.mobile-tabs');const lens=nav?.querySelector('.xy-glass-indicator');if(!lens)return false;const st=getComputedStyle(lens);return st.display!=='none'&&st.visibility!=='hidden'&&Number(st.opacity)!==0&&lens.getBoundingClientRect().width>=35;});
  reports.push({width:w,...baseline,firstLaunch,optionalExpanded,optionalClosed,dismissed,manualReopen,manualOpensForm,staysDismissed,disclosure,semesterInfo,semesterOpened,opened,closedAgain,first,clickedTasks:tasks,returned,lensVisible,errors});console.log('WIDTH_DONE',w,errors.length);
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
 let wk=null;
 try {
  console.log('REAL_WEBKIT_BEGIN');
  wk=await webkit.launch({headless:true});
  const w=await wk.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const wkErrors=[];w.on('pageerror',e=>wkErrors.push(e.message));
  await w.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
  await w.waitForTimeout(850);
  if(await w.locator('#xy-skip').isVisible())await w.locator('#xy-skip').click();
  await w.waitForFunction(()=>{
    const nav=document.querySelector('.mobile-tabs');
    const copy=nav?.querySelector('.xy-refract-copy');
    return nav?.dataset.glass==='content-refraction' && nav.classList.contains('has-content-refraction') && copy && getComputedStyle(copy).filter.includes('url(');
  },null,{timeout:12000});
  await w.waitForTimeout(180);
  await w.screenshot({path:path.join(dir,'webkit-content-refraction-today-390.png')});
  const before=await w.evaluate(()=>{const nav=document.querySelector('.mobile-tabs'),c=nav?.querySelector('.xy-refract-copy');return {engine:nav?.dataset.glassEngine,mode:nav?.dataset.glass,filter:getComputedStyle(c).filter,clip:c.style.clipPath,overflow:document.documentElement.scrollWidth-innerWidth,realButtons:nav.querySelectorAll('button[data-view]').length,duplicateButtons:c.querySelectorAll('button').length,svgCopies:c.querySelectorAll('svg').length,ariaHidden:c.getAttribute('aria-hidden'),copyPointerEvents:getComputedStyle(c).pointerEvents,dockBackground:getComputedStyle(nav).backgroundColor}});
  await w.evaluate(()=>{
    window.__xyOpticWrites = 0;
    const copy=document.querySelector('.xy-refract-copy');
    const observer=new MutationObserver(mutations=>{window.__xyOpticWrites+=mutations.filter(m=>m.attributeName==='style').length});
    observer.observe(copy,{attributes:true,attributeFilter:['style']});
    window.__xyOpticObserver=observer;
  });
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
    let initial=copy?.style.filter;
    // Wait for WebKit's deferred SVG map decode, then require repeated stability.
    await new Promise(resolve=>setTimeout(resolve,300));
    let consecutive=0, changes=0, samples=0;
    for(let i=0;i<14;i++){
      await new Promise(resolve=>setTimeout(resolve,150));
      samples++;
      const current=copy?.style.filter;
      if(current===initial)consecutive++;
      else{changes++;consecutive=0;initial=current;}
      if(consecutive>=4)break;
    }
    return {active:document.querySelector('.mobile-tabs button.active')?.dataset.view,
      stable:consecutive>=4,changes,samples,animations:document.getAnimations().filter(x=>x.playState==='running').length};
  });
  const additionalWidths=[];
  for(const width of [320,768]){
    const viewport=await wk.newPage({viewport:{width,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    viewport.on('pageerror',e=>wkErrors.push(e.message));
    await viewport.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
    await viewport.waitForTimeout(700);
    if(await viewport.locator('#xy-skip').isVisible())await viewport.locator('#xy-skip').tap();
    await viewport.waitForFunction(()=>document.querySelector('.mobile-tabs')?.dataset.glass==='content-refraction',null,{timeout:12000});
    const initial=await viewport.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,dock:document.querySelector('.mobile-tabs')?.getBoundingClientRect().toJSON(),background:getComputedStyle(document.querySelector('.mobile-tabs')).backgroundColor}));
    await viewport.locator('.mobile-tabs button[data-view="settings"]').tap();
    await viewport.waitForTimeout(400);
    const active=await viewport.locator('.mobile-tabs button.active').getAttribute('data-view');
    await viewport.screenshot({path:path.join(dir,'webkit-content-refraction-settings-'+width+'.png')});
    additionalWidths.push({width,...initial,active});
    await viewport.close();
  }
  const opticalWrites=await w.evaluate(()=>{window.__xyOpticObserver.disconnect();return window.__xyOpticWrites});
  realWebkit={tested:true,before,after,settle,additionalWidths,opticalWrites,errors:wkErrors};
  await w.close(); await wk.close(); wk=null;
  if(before.engine!=='webkit'||before.mode!=='content-refraction'||!before.filter.includes('url(')||before.duplicateButtons!==0||before.realButtons!==6||before.svgCopies!==6||before.ariaHidden!=='true'||before.copyPointerEvents!=='none'||before.overflow>2||after.active!=='tasks'||before.clip===after.clip||settle.active!=='today'||!settle.stable||opticalWrites>14||additionalWidths.some(s=>s.overflow>2||s.active!=='settings'||!s.dock||s.dock.width<280||!s.background.startsWith('rgb('))||wkErrors.length)process.exitCode=2;
 } catch(e) {
  console.error('REAL_WEBKIT_FAILED',e.message);
  if(wk)await wk.close().catch(()=>{});
  realWebkit={tested:false,error:e.message.slice(0,180)};
  if(requireWebkit) process.exitCode=2;
 }
 console.log(JSON.stringify({reports,reduced,realWebkit}));
 if(reports.some(x=>x.overflow>2||(x.numericTotal>0&&!x.numericAligned)||x.tinyText>0||!x.shell||!x.firstLaunch?.hasArt||!x.firstLaunch?.optionalCollapsed||!x.optionalExpanded?.open||!x.optionalExpanded?.key||!x.optionalExpanded?.warning||!x.optionalClosed||!x.dismissed||!x.manualReopen||!x.manualOpensForm||!x.staysDismissed||!x.semesterInfo?.closed||!x.semesterOpened||x.semesterInfo?.text<20||!x.disclosure?.closed||!x.disclosure?.safety||!x.opened||!x.closedAgain||x.sheetRadius<32||Math.abs(x.groupRadius-26)>1||x.heroRadius<26||x.controlRadius>19||x.controlRadius>=x.groupRadius||!x.first||!x.clickedTasks||!x.returned||x.errors.length||(x.width<=790 && (x.glass!=='refraction'||!x.filter.includes('url(')||!x.lensVisible))))process.exitCode=2;
 if(process.env.XIAOYA_QA_RESULT_PATH)fs.writeFileSync(process.env.XIAOYA_QA_RESULT_PATH,JSON.stringify({reports,reduced,realWebkit,exitCode:process.exitCode||0},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=3})