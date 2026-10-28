import {createRequire} from 'node:module';
import {join,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const url='http://127.0.0.1:18889/little-works/ai-academy-apple/';
const checks=[];const ck=(name,pass,details)=>{checks.push({name,pass:!!pass,details});console.log((pass?'PASS ':'FAIL ')+name+' '+JSON.stringify(details??{}).slice(0,200))};
const dir=dirname(fileURLToPath(import.meta.url));const b=await chromium.launch({channel:'msedge',headless:true});
try {
for(const width of [320,390,768,1440]){
 const p=await b.newPage({viewport:{width,height:900},hasTouch:width<700,deviceScaleFactor:1});
 const errs=[],requests=[];p.on('pageerror',e=>errs.push(e.message));p.on('request',r=>{if(r.url().includes('api.deepseek.com'))requests.push(r.url())});
 await p.goto(url,{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.documentElement.dataset.engineReady==='true',{timeout:26000});
 await p.locator('#zx-doctor-open').waitFor();
 const r=await p.evaluate(()=>{const d=document.querySelector('#zx-doctor-open'),n=document.querySelector('#mobile-nav'),b=d.getBoundingClientRect();return {screen:innerWidth,scroll:document.documentElement.scrollWidth,doctor:b.toJSON(),dock:n.getBoundingClientRect().toJSON(),src:d.querySelector('img')?.src,dialog:document.querySelector('#zx-doctor-panel')?.hidden}});
 ck('doctor constant & initial hidden '+width,r.doctor.right<=width+1&&r.doctor.left>=0&&r.scroll<=width+1&&r.dialog&&r.src.includes('/idle.webp'),r);
 if(width<=390){ck('doctor not over mobile tab bar '+width,r.doctor.bottom <= r.dock.top-1,r);}
 const avatar=await p.locator('#zx-doctor-avatar').evaluate(img=>img.naturalWidth);
 ck('original doctor artwork loaded '+width,avatar>0,{avatar});
 await p.locator('#zx-doctor-open').click();
 ck('dialog opens with visible entry '+width,await p.locator('#zx-doctor-panel').isVisible()&&await p.locator('#zx-doctor-open').getAttribute('aria-expanded')==='true');
 ck('unverified AI cannot send '+width,await p.locator('#zx-doctor-send').isDisabled()&&(await p.locator('#zx-doctor-launch-status').innerText()).includes('未连接'));
 await p.locator('#zx-doctor-question').fill('初值敏感性是什么？');
 ck('typing does not auto-call AI '+width,requests.length===0&&await p.locator('#zx-doctor-send').isDisabled());
 if(width===390){await p.screenshot({path:join(dir,'r23-doctor-mobile-open.png'),animations:'disabled'});}
 if(width===1440){await p.screenshot({path:join(dir,'r23-doctor-desktop-open.png'),animations:'disabled'});}
 await p.keyboard.press('Escape');
 ck('Escape closes dialog '+width,await p.locator('#zx-doctor-panel').isHidden());
 await p.locator('#zx-doctor-open').click();
 await p.locator('#zx-doctor-config').click();
 await p.waitForTimeout(500);
 const configured=await p.evaluate(()=>({hash:location.hash,modal:!!document.querySelector('#close-ai-config'),dialogHidden:document.querySelector('#zx-doctor-panel').hidden}));
 ck('real AI config reachable '+width,configured.hash==='#settings'&&configured.modal&&configured.dialogHidden,configured);
 ck('no uncaught error or AI spend '+width,errs.length===0&&requests.length===0,{errs,requests});
 await p.close();
}
}finally{await b.close()}
const summary={passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length,checks};
await writeFile(join(dir,'r23-doctor-ux-report.json'),JSON.stringify(summary,null,2));
console.log('DOCTOR_SUMMARY '+JSON.stringify({passed:summary.passed,failed:summary.failed}));
if(summary.failed)process.exitCode=1;
