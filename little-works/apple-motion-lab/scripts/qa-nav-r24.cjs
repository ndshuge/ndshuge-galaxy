/* R2.4: static duplicate-ink and fluid-map acceptance; Windows Edge CDP.
   Not a substitute for iOS Safari tactile/performance validation. */
const {chromium}=require('E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../evidence/r24'),url='http://127.0.0.1:5237/little-works/apple-motion-lab/';
const checks=[],errors=[],samples=[];fs.mkdirSync(root,{recursive:true});
const test=(n,pass,detail)=>{checks.push({name:n,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+n+' '+JSON.stringify(detail).slice(0,210));};
const wait=t=>new Promise(r=>setTimeout(r,t));
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
for(const width of [320,390,768,1440]){
 const height=width===320?700:width===390?844:width===768?1024:900;
 const c=await b.newContext({viewport:{width,height},isMobile:width<=390,hasTouch:true,deviceScaleFactor:1});
 await c.addInitScript(()=>{window.__r24map=0;let p=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(...a){window.__r24map++;return p.apply(this,a)};});
 const pg=await c.newPage();pg.on('pageerror',e=>errors.push(width+':'+e.message));
 await pg.goto(url,{waitUntil:'networkidle'});await pg.waitForFunction(()=>document.querySelector('#navigation')?.glass);await pg.waitForTimeout(250);
 const take=()=>pg.evaluate(()=>{let n=document.querySelector('#navigation'),a=n.querySelector('button'),cop=n.querySelector('.lg-nav__copy'),art=a.querySelector('svg'),cpy=cop.querySelector('svg'),sh=n.querySelector('.lg-lens-shadow'),bg=getComputedStyle(n).backgroundColor;
 const bgParts=bg.replace(/[^0-9.,]/g,'').split(',');let bgAlpha=bgParts.length>=4?Number(bgParts[3]):1;
 return {actualSvg:getComputedStyle(art).visibility,copySvg:getComputedStyle(cpy).visibility,
   copy:getComputedStyle(cop).visibility,actualText:getComputedStyle(a.querySelector('span')).visibility,
   fluidity:n.glass.params.fluidity,direction:n.glass.params.fluidDirection,
   clip:getComputedStyle(sh).clipPath,glassHeight:n.glass.params.height,
   bgAlpha,navHeight:n.offsetHeight,scroll:document.documentElement.scrollWidth,
   drag:__motionLab.diagnostic().navScrub,filters:getComputedStyle(cop).filter,maps:__r24map}});
 const idle=await take();if(width===390)await pg.screenshot({path:path.join(root,'r24-idle-crisp.png')});
 test(width+' static ink is single sourced',idle.actualSvg==='visible'&&idle.copy==='hidden'&&idle.copySvg==='hidden'&&idle.actualText==='visible',idle);
 test(width+' background text does not bleed through nav',idle.bgAlpha>=.78&&idle.scroll===width,{bgAlpha:idle.bgAlpha,scroll:idle.scroll});
 const coords=await pg.locator('#navigation>button').evaluateAll(els=>els.map(e=>{let r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}}));
 const client=await c.newCDPSession(pg),touch=(type,x)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:(type==='touchEnd'||type==='touchCancel')?[]:[{x,y:coords[0].y}]});
 await touch('touchStart',coords[0].x);await wait(220);
 const hold=await take();test(width+' hold swaps original for refracted copy',hold.actualSvg==='hidden'&&hold.copy==='visible'&&hold.copySvg==='visible'&&hold.drag.pressed,hold);
 for(let j=1;j<=16;j++){await touch('touchMove',coords[0].x+(coords[2].x-coords[0].x)*j/16);await wait(20)}
 const drag=await take();if(width===390)await pg.screenshot({path:path.join(root,'r24-drag-fluid.png')});
 test(width+' nonellipse optical contour active',drag.fluidity>0&&drag.clip.startsWith('polygon(')&&drag.direction!==0,{fluid:drag.fluidity,clip:drag.clip.slice(0,43),direction:drag.direction});
 test(width+' real SVG lens remains enabled',drag.filters.includes('url('),{filter:drag.filters});
 await touch('touchEnd',coords[2].x);await wait(850);
 const after=await take();if(width===390)await pg.screenshot({path:path.join(root,'r24-released-crisp.png')});
 test(width+' release restores single crisp ink',after.copy==='hidden'&&after.actualSvg==='visible'&&after.actualText==='visible'&&after.fluidity===0&&!after.drag.pressed,{copy:after.copy,actual:after.actualSvg,fluid:after.fluidity});
 samples.push({width,idle,hold,drag:{...drag,clip:drag.clip.slice(0,180)},after});await c.close();
}
}finally{await b.close()}
test('No browser exceptions',errors.length===0,errors);const summary={passed:checks.filter(c=>c.pass).length,total:checks.length};
fs.writeFileSync(path.join(root,'r24-nav-qa.json'),JSON.stringify({at:new Date().toISOString(),environment:'Windows Edge headless Chromium with DevTools touch; not iOS Safari',checks,samples,errors,summary},null,2));
console.log('SUMMARY '+JSON.stringify(summary));if(summary.passed!==summary.total)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=2});
