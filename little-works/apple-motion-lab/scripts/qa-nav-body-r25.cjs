const {chromium}=require('E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),OUT=path.resolve(__dirname,'../evidence/r25');
fs.mkdirSync(OUT,{recursive:true});
const URL=process.env.TEST_BASE_URL||'http://127.0.0.1:5238/little-works/apple-motion-lab/';
let checks=[],captures=[],errors=[];
const test=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name+' '+JSON.stringify(detail).slice(0,270));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true,
 executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
 args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
 for(const width of [320,390,768,1440]){
  const height=width===320?700:width===390?844:width===768?1024:900;
  const isMobile=width<600;
  const ctx=await browser.newContext({viewport:{width,height},isMobile,hasTouch:isMobile,deviceScaleFactor:1});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(width+': '+e.message));
  await page.goto(URL,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>window.__motionLab?.diagnostic()?.navScrub);
  const measure=()=>page.evaluate(()=>{
   const bar=document.querySelector('#navigation'),wrap=document.querySelector('#navWrap'),
     buttons=[...bar.querySelectorAll(':scope>button')],c=bar.querySelector('.lg-nav__copy'),seg=document.querySelector('lg-segmented');
   const nav=window.__motionLab.diagnostic().navScrub;
   return {wrapTransform:getComputedStyle(wrap).transform,wrapState:wrap.dataset.dockState,
     shellEnergy:getComputedStyle(bar).getPropertyValue('--dock-shell-energy').trim(),
     lightPoint:getComputedStyle(bar).getPropertyValue('--dock-shell-touch').trim(),
     navbarHeight:bar.getBoundingClientRect().height,
     navLabels:buttons.map(b=>({fontSize:getComputedStyle(b).fontSize,fontWeight:getComputedStyle(b).fontWeight,label:b.innerText,
        labelSize:getComputedStyle(b.querySelector('span')).fontSize,iconWidth:b.querySelector('svg').getBoundingClientRect().width})),
     navCopy:getComputedStyle(c).visibility,
     opticalFilter:getComputedStyle(c).filter,
     nav,segStyle:seg?getComputedStyle(seg).transform:null,
     overflow:document.documentElement.scrollWidth-innerWidth};
  });
  const idle=await measure();
  const points=await page.locator('#navigation>button').evaluateAll(els=>els.map(el=>{let r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}}));
  if(width===390)await page.screenshot({path:path.join(OUT,'r25-idle-390.png')});
  let cdpsession;
  if(isMobile){cdpsession=await ctx.newCDPSession(page);
   await cdpsession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:points[0].x,y:points[0].y}]});
  }else{await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();}
  await sleep(280);
  const pressed=await measure();
  if(width===390)await page.screenshot({path:path.join(OUT,'r25-pressed-390.png')});
  for(let j=1;j<=13;j++){
   const x=points[0].x+(points[2].x-points[0].x)*j/13;
   if(isMobile)await cdpsession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:points[0].y}]});
   else await page.mouse.move(x,points[0].y);
   await sleep(20);
  }
  const scrub=await measure();
  if(width===390)await page.screenshot({path:path.join(OUT,'r25-scrub-390.png')});
  if(isMobile)await cdpsession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  else await page.mouse.up();
  await sleep(600);
  const settled=await measure();
  if(width===390)await page.screenshot({path:path.join(OUT,'r25-settled-390.png')});
  const mtx=str=>{const g=str.match(/matrix3d\(([^)]+)\)/)?.[1]?.split(',').map(Number);if(g)return [g[0],0,0,0,0,g[13]];return str.match(/matrix\(([^)]+)\)/)?.[1]?.split(',').map(Number)||[];};
  const a=mtx(idle.wrapTransform), b=mtx(pressed.wrapTransform),c=mtx(scrub.wrapTransform),d=mtx(settled.wrapTransform);
  test(width+' whole shell lifts/scales when pressed', b.length>0&&Math.abs(b[0]-a[0])>.004&&Math.abs(b[5]-a[5])>1,{idle:idle.wrapTransform,pressed:pressed.wrapTransform});
  test(width+' whole shell follows horizontal drag',Math.abs(scrub.shellEnergy-0)>0 || scrub.wrapTransform!==idle.wrapTransform,{scrub:scrub.wrapTransform,energy:scrub.shellEnergy});
  test(width+' full dock restores at release',Math.abs(d[0]-a[0])<.002 && Math.abs(d[5]-a[5])<.5,{idle:idle.wrapTransform,rest:settled.wrapTransform});
  test(width+' selected tab changed only on release',pressed.nav.current===0&&scrub.nav.current===0&&settled.nav.current===2,{press:pressed.nav,drag:scrub.nav,rest:settled.nav});
  test(width+' typography hierarchy within 58px shell',idle.navLabels.every(t=>parseFloat(t.fontSize)>=10.4 && t.iconWidth>=20 && t.iconWidth<=22)&&Math.abs(idle.navbarHeight-58)<1.5,{labels:idle.navLabels,height:idle.navbarHeight});
  test(width+' no overflow and single ink at rest',settled.overflow<=1&&settled.navCopy==='hidden',{overflow:settled.overflow,copy:settled.navCopy});
  test(width+' square/segmented control unaffected',idle.segStyle===settled.segStyle,{initial:idle.segStyle,final:settled.segStyle});
  captures.push({width,idle,pressed,scrub,settled});
  await ctx.close();
 }
 }finally{await browser.close()}
 test('No JS exceptions',errors.length===0,errors);
 const summary={passed:checks.filter(x=>x.pass).length,total:checks.length};
 const report={date:new Date().toISOString(),environment:'Windows Edge CDP touch emulation, NOT iPhone Safari',checks,captures,errors,summary};
 fs.writeFileSync(path.join(OUT,'nav-body-qa.json'),JSON.stringify(report,null,2));
 console.log('SUMMARY '+JSON.stringify(summary));
 if(summary.passed!==summary.total)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=2});
