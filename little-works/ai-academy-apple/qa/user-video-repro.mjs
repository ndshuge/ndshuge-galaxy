import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const url='https://ndshuge.github.io/ndshuge-galaxy/little-works/ai-academy-apple/';
const out=join(dirname(fileURLToPath(import.meta.url)),'user-video-repro');
await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'msedge',headless:true});
const findings=[];
const test=(name,pass,detail)=>{findings.push({name,pass,detail});console.log((pass?'PASS ':'FAIL ')+name+' '+JSON.stringify(detail).slice(0,300))};
for(const width of [390,430]){
 const page=await b.newPage({viewport:{width,height:900},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.engineReady==='true',{timeout:26000});
 await page.waitForTimeout(450);
 const sequence=['learn','today','courses','learn','courses','today','learn'];
 for(let i=0;i<sequence.length;i++){
  const target=sequence[i];
  await page.locator('#mobile-nav > button[data-view="'+target+'"]').click({force:true});
  await page.waitForFunction(v=>document.location.hash==='#'+v,target,{timeout:4000});
  if(i===2||i===4){
   await page.waitForTimeout(30);
   await page.screenshot({path:join(out, 'viewport-'+width+'-'+i+'-intermediate.png')});
  }
  const state=await page.evaluate(()=>{
   const nav=document.querySelector('#mobile-nav'),copy=nav.querySelector('.lg-nav__copy');
   const anim=document.getAnimations({subtree:true}).filter(a=>String(a.effect?.pseudoElement||'').includes('view-transition'));
   return {hash:location.hash,mainPages:document.querySelectorAll('#main>.page').length,
    copyVisibility:getComputedStyle(copy).visibility,
    active:nav.querySelector('button[aria-current=page]')?.dataset.view,
    viewTransitionAnimations:anim.length,
    isScrubbing:nav.classList.contains('is-scrubbing'),
    scrollWidth:document.documentElement.scrollWidth,clientWidth:innerWidth
   };
  });
  test(width+' quick navigation '+i, state.hash==='#'+target&&state.mainPages===1&&state.copyVisibility==='hidden'&&state.active===target&&state.viewTransitionAnimations===0&&state.scrollWidth<=state.clientWidth, state);
 }
 await page.screenshot({path:join(out, 'viewport-'+width+'-final.png')});
 test(width+' zero runtime errors',errors.length===0,errors);
 await page.close();
}
await b.close();
await writeFile(join(out,'report.json'),JSON.stringify({findings,passed:findings.filter(x=>x.pass).length,failed:findings.filter(x=>!x.pass).length},null,2));
console.log('USER_VIDEO_REPRO',findings.filter(x=>x.pass).length,findings.filter(x=>!x.pass).length);
if(findings.some(x=>!x.pass))process.exitCode=1;
