import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const base='https://ndshuge.github.io/ndshuge-galaxy/little-works/ai-academy-apple/';
const files=['','app.js','r2-present.js','nav-stability.css','nav-integration.js','assets/motionlab-nav-scrub.js','assets/liquid-glass.js'];
const checks=[];let errs=[];
const check=(n,p,x)=>{checks.push({name:n,ok:!!p,details:x});console.log((p?'PASS ':'FAIL ')+n+' '+JSON.stringify(x||{}).slice(0,180))};
const b=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const f of files){let x;try{const r=await fetch(base+f+'?r22='+Date.now());x={code:r.status,ct:r.headers.get('content-type')};}catch(e){x={error:String(e)}}check('asset '+(f||'index'),x.code===200,x)}
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});
 p.on('pageerror',e=>errs.push(e.message));
 p.on('response',r=>{if(r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
 await p.goto(base+'?r22='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
 await p.waitForFunction(()=>document.querySelector('#bridge-state')?.textContent?.includes('已连接'),{timeout:24000});
 await p.waitForFunction(()=>!!window.ZHIXU_APPLE_NAV_SCRUB,{timeout:8000});
 const state=await p.evaluate(()=>({text:document.querySelector('#main .large-title')?.textContent,chart:document.querySelectorAll('#main .r2-science').length,copy:getComputedStyle(document.querySelector('#mobile-nav .lg-nav__copy')).visibility,normalInk:getComputedStyle(document.querySelector('#mobile-nav>button>span')).visibility,nav:!!window.ZHIXU_APPLE_NAV_SCRUB,js:document.querySelectorAll('script[src*="r2-ui.js"]').length,css:document.styleSheets.length}));
 check('stable native first view',state.text==='继续学习'&&state.chart===1&&state.copy==='hidden'&&state.normalInk==='visible'&&state.nav&&state.js===0,state);
 await p.locator('#mobile-nav>button[data-view=learn]').click();
 await p.locator('[data-action=load-question]').waitFor({timeout:10000});
 await p.locator('[data-action=load-question]').click();
 await p.locator('#quiz-form input[type=radio]').first().waitFor({timeout:14000});
 check('Original real question and answer not preselected',(await p.locator('#quiz-form input[type=radio]').count())>=2 && await p.locator('#quiz-form input:checked').count()===0);
 await p.locator('#quiz-form input[type=radio]').first().check();
 await p.locator('#quiz-form button[type=submit]').click();
 await p.locator('[data-action=next-pre]').waitFor({timeout:10000});
 check('Original grading successful',await p.locator('[data-action=next-pre]').count()===1);
 await p.locator('#mobile-nav>button[data-view=today]').click();
 const next=await p.evaluate(()=>({location:location.hash,nav:document.querySelector('#mobile-nav button[aria-current=page]')?.dataset.view,copy:getComputedStyle(document.querySelector('#mobile-nav .lg-nav__copy')).visibility}));
 check('return navigation remains sharp',next.location==='#today'&&next.nav==='today'&&next.copy==='hidden',next);
 check('no uncaught exceptions or resource errors',errs.length===0,errs);
 await p.screenshot({path:'little-works/ai-academy-apple/qa/r22-live-390.png',animations:'disabled'});
 await p.close();
 const orig=await fetch('https://ndshuge.github.io/zhixu-ai-academy/');
 check('Original Edition unaffected',orig.status===200,{status:orig.status});
}finally{await b.close(); await writeFile('little-works/ai-academy-apple/qa/r22-online-qa.json',JSON.stringify(checks,null,2));console.log('R22_ONLINE '+JSON.stringify({passed:checks.filter(x=>x.ok).length,total:checks.length,failed:checks.filter(x=>!x.ok).length}));if(checks.some(x=>!x.ok))process.exitCode=1}
