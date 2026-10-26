const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const url=process.env.XIAOYA_APPLE_TEST_URL||'http://127.0.0.1:5393/little-works/xiaoya-apple/';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const reports=[];
 const dir=path.join(__dirname,'docs','xiaoya-apple-next-qa');fs.mkdirSync(dir,{recursive:true});
 for(const w of [320,390,768,1440]){
  const p=await browser.newPage({viewport:{width:w,height:w<600?844:900},reducedMotion:'no-preference'});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text().slice(0,140))});
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:25000});await p.waitForSelector('#xy-onboard');await p.waitForTimeout(550);if(w===390){await p.screenshot({path:path.join(dir,'onboarding-390.png')});}await p.locator('#xy-local').evaluate(b=>b.click());await p.waitForTimeout(650);
  const baseline=await p.evaluate(()=>{
    const d=document.documentElement,nav=document.querySelector('.mobile-tabs'),lens=document.querySelector('.xy-glass-indicator');
    return {shell:document.body.classList.contains('apple-next'),overflow:d.scrollWidth-innerWidth,glass:nav?.dataset.glass||'',filter:lens?getComputedStyle(lens).backdropFilter:'missing',heroRect:document.querySelector('.xy-cinema')?.getBoundingClientRect().toJSON()};
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
  reports.push({width:w,...baseline,first,clickedTasks:tasks,returned,lensVisible,errors});
  await p.close();
 }
 const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await p.goto(url);const reduced=await p.evaluate(()=>({motion:matchMedia('(prefers-reduced-motion: reduce)').matches,nav:document.querySelector('.mobile-tabs')?.dataset.glass||''}));await p.close();await browser.close();
 console.log(JSON.stringify({reports,reduced}));
 if(reports.some(x=>x.overflow>2||!x.shell||!x.first||!x.clickedTasks||!x.returned||x.errors.length||(x.width<=790 && (x.glass!=='refraction'||!x.filter.includes('url(')||!x.lensVisible))))process.exitCode=2;
})().catch(e=>{console.error(e.stack);process.exitCode=3})