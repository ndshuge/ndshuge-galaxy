const {chromium}=require('E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core');
const fs=require('fs'); const path=require('path');
const url='http://127.0.0.1:5236/little-works/apple-motion-lab/';
const out=path.resolve(__dirname,'../evidence/nav-scrub-r23');fs.mkdirSync(out,{recursive:true});
const checks=[],samples=[],errors=[];
function check(name,pass,detail){checks.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name+' '+JSON.stringify(detail).slice(0,220))}
const sleep=t=>new Promise(r=>setTimeout(r,t));
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await ctx.addInitScript(()=>{window.__mapDraws=[];const fn=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(...args){window.__mapDraws.push({w:this.width,h:this.height});return fn.apply(this,args)};});
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__motionLab&&document.querySelector('#navigation')?.glass);
 const points=await page.locator('#navigation>button').evaluateAll(a=>a.map(n=>{const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}}));
 const client=await ctx.newCDPSession(page);
 const fire=(type,x)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y:points[0].y}]});
 const snap=async(label)=>{const s=await page.evaluate(()=>{const nav=document.querySelector('#navigation');return{glass:nav.glass.params,position:__motionLab.diagnostic().navScrub,copyFilter:getComputedStyle(nav.copy).filter,selectedColor:getComputedStyle(nav.copy.children[__motionLab.diagnostic().navScrub.preview??0]).color,mapDraws:__mapDraws.length}});samples.push({label,...s});return s;};
 const rest=await snap('rest');await fire('touchStart',points[0].x);await sleep(180);
 let maxW=rest.glass.width,maxStretch=0,maxShot=false;
 for(let j=1;j<=13;j++){
  const x=points[0].x+(points[2].x-points[0].x)*j/13;
  await fire('touchMove',x);await sleep(25);
  const s=await snap('forward'+j);
  if(s.glass.width>maxW){maxW=s.glass.width;maxStretch=s.position.stretch}
  if(j===7){await page.screenshot({path:path.join(out,'fluid-mid.png'),fullPage:false});}
 }
 for(let j=1;j<=10;j++){
  const x=points[2].x-(points[2].x-points[0].x)*j/10;
  await fire('touchMove',x);await sleep(25);
  const s=await snap('reverse'+j);
  maxW=Math.max(maxW,s.glass.width);
 }
 await page.screenshot({path:path.join(out,'fluid-reverse.png'),fullPage:false});
 const during=await snap('held');
 await fire('touchEnd',0);await sleep(750);
 const final=await snap('released');
 await page.screenshot({path:path.join(out,'fluid-released.png'),fullPage:false});
 check('Glass width stretches elastically beyond idle width',maxW>=rest.glass.width+6,{rest:rest.glass.width,maxW,maxStretch});
 check('Moving lens remains tied to real SVG optical filter',during.copyFilter.includes('url('),{filter:during.copyFilter});
 check('Glass returns to original size on release',Math.abs(final.glass.width-rest.glass.width)<1,{rest:rest.glass.width,after:final.glass.width});
 check('Selected icon changes during held gesture',samples.some(s=>s.label.startsWith('forward')&&s.position.preview===1&&s.selectedColor!=='rgb(255, 255, 255)'),{mid:samples.find(x=>x.label==='forward7')?.selectedColor});
 check('Displacement map uses bounded discrete presets',final.mapDraws-rest.mapDraws<=80,{initial:rest.mapDraws,final:final.mapDraws});
 check('Content stays unchanged until release',samples.every(s=>s.label.startsWith('forward')?s.position.current===0:true),{previewed:samples.filter(s=>s.label.startsWith('forward')).map(s=>s.position.preview)});
 // Re-run reverse-swipe to demonstrate cache warm-up.
 await fire('touchStart',points[0].x);await sleep(80);
 for(let j=1;j<=13;j++){await fire('touchMove',points[0].x+(points[2].x-points[0].x)*j/13);await sleep(25)}
 await fire('touchEnd',0);await sleep(600);
 const warm=await snap('warm');
 check('Previously visited lens shapes are reused on second swipe',warm.mapDraws-final.mapDraws<=10,{first:final.mapDraws-rest.mapDraws,second:warm.mapDraws-final.mapDraws});
 await ctx.close();
 }finally{await b.close()}
 check('No JavaScript errors',errors.length===0,errors);
 const data={date:new Date().toISOString(),environment:'Windows Edge CDP touch simulator, not iPhone Safari',checks,samples,summary:{passed:checks.filter(c=>c.pass).length,total:checks.length},errors};
 fs.writeFileSync(path.join(out,'fluid-qa.json'),JSON.stringify(data,null,2));
 console.log('SUMMARY '+JSON.stringify(data.summary));if(data.summary.passed!==data.summary.total)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exit(2)});
