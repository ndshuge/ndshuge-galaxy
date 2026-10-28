import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
// The optional test driver comes from the locally installed Taste Skill.
const cdpPath = process.env.TASTE_CDP_PATH || join(homedir(), '.agents', 'skills', 'design-taste-frontend', 'scripts', 'lib', 'cdp.mjs');
const { Browser, sleep } = await import(pathToFileURL(cdpPath).href);
import { writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://127.0.0.1:8874/little-works/mouseverse/';
const failures=[]; const checks=[];
const assert=(name,ok,details='')=>{checks.push({name,ok,details});if(!ok) failures.push(name+': '+details);console.log((ok?'PASS':'FAIL')+' '+name+(details?' '+details:''))};
const browser=await Browser.launch({width:1440,height:920});
try{
  const page=await browser.newPage({width:390,height:844,mobile:true});
  await page.goto(URL,{settleMs:1400});
  const inspect=expr=>page.eval(expr);
  const baseline=await inspect(()=>({
     title:document.title, imageCount:[...document.querySelectorAll('img')].filter(x=>x.getAttribute('src')&&x.complete&&x.naturalWidth===0).length,
     nativeGlass: !!customElements.get('lg-segmented'),
     generatedGlass: !!document.querySelector('lg-segmented')?.glass,
     effectiveFilter: getComputedStyle(document.querySelector('lg-segmented .lg-refract')).filter,
     svgFilters:document.querySelectorAll('feDisplacementMap').length,
     componentSource:[...document.scripts].some(s=>s.src.endsWith('app.js')),
     segments: document.querySelector('lg-segmented')?.value,
     overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     heroWidth: document.querySelector('.feature').getBoundingClientRect().width,
     navigationHeight:document.querySelector('.mobile-dock').getBoundingClientRect().height
  }));
  assert('390px mobile content fits',baseline.overflow<=1,JSON.stringify(baseline));
  assert('bundled LiquidGlass component runtime',baseline.nativeGlass && baseline.segments==='all');
  assert('actual SVG displacement filter running',baseline.generatedGlass&&baseline.effectiveFilter.includes('url(')&&baseline.svgFilters>0,JSON.stringify({filter:baseline.effectiveFilter,svgFilters:baseline.svgFilters}));
  assert('all images load',baseline.imageCount===0,JSON.stringify(baseline.imageCount));

  // Native user actions in page context, verify resulting live DOM.
  const detail=await inspect(()=>{document.querySelector('[data-open=harvest]').click();return {open:document.querySelector('#detailDialog').open,title:document.querySelector('#detailTitle').textContent,propCount:document.querySelectorAll('.property').length}});
  assert('species detail dialog',detail.open&&detail.title==='巢鼠'&&detail.propCount===4,JSON.stringify(detail));
  await sleep(500);
  await page.screenshot({path:'E:/CHATGPT/outputs/mouseverse-qa-detail.png',format:'png'});
  const fav=await inspect(()=>{document.querySelector('#detailSave').click();return {count:document.querySelector('#savedCount').textContent,pressed:document.querySelector('#detailSave').getAttribute('aria-pressed'),stored:localStorage.getItem('mouseverse:favorites')}});
  assert('save favorites to local storage',fav.count==='1'&&fav.pressed==='true'&&fav.stored.includes('harvest'),JSON.stringify(fav));
  await inspect(()=>document.querySelector('#closeDetail').click()); await sleep(320);
  assert('dialog closes',!(await inspect(()=>document.querySelector('#detailDialog').open)));
  const filterState=await inspect(()=>{const seg=document.querySelector('#typeFilter');seg.value='human';seg.dispatchEvent(new CustomEvent('change',{bubbles:true,detail:{value:'human'}}));return {species:[...document.querySelectorAll('#albumTrack .album h3')].map(e=>e.textContent),count:document.querySelectorAll('#albumTrack .album').length}});
  assert('habitat filter works',filterState.count===1&&filterState.species[0]==='家鼠',JSON.stringify(filterState));
  await inspect(()=>{const seg=document.querySelector('#typeFilter');seg.value='all';seg.dispatchEvent(new CustomEvent('change',{bubbles:true,detail:{value:'all'}}))});
  const search=await inspect(()=>{document.querySelector('#searchTrigger').click();const input=document.querySelector('#searchInput');input.value='林姬鼠';input.dispatchEvent(new Event('input',{bubbles:true}));return {open:document.querySelector('#searchDialog').open,hits:[...document.querySelectorAll('#searchResults strong')].map(e=>e.textContent)}});
  assert('live search results',search.open&&search.hits.length===1&&search.hits[0]==='林姬鼠',JSON.stringify(search));
  await inspect(()=>document.querySelector('#searchDialog').close());
  await page.goto(URL,{settleMs:700});
  assert('favorites persist after reload',await inspect(()=>document.querySelector('#savedCount').textContent==='1'));
  await inspect(()=>document.querySelector('[data-nav=saved].dock-tab').click());
  await sleep(500);
  const nav=await inspect(()=>({selected:document.querySelector('.dock-tab[data-nav=saved]').classList.contains('selected'),visible:document.querySelector('#saved').getBoundingClientRect().top < innerHeight,hit:document.querySelector('#savedGallery .album')?.querySelector('h3')?.textContent}));
  assert('mobile dock and saved section',nav.selected&&nav.visible&&nav.hit==='巢鼠',JSON.stringify(nav));
  await inspect(()=>document.querySelector('#savedGallery [data-save=harvest]').click());
  assert('remove favorite',await inspect(()=>document.querySelector('#savedCount').textContent==='0'));
  const facts=await inspect(()=>{document.querySelector('[data-fact=hearing]').click();return {label:document.querySelector('#factLabel').textContent,press:document.querySelector('[data-fact=hearing]').getAttribute('aria-pressed')}});
  assert('fact interactive selection',facts.label==='超声交流'&&facts.press==='true',JSON.stringify(facts));
  for(const width of [320,390,768,1024,1440]){
    await page.setViewport({width,height:width===320?740:width===390?844:width===768?1024:900,mobile:width<761});
    await sleep(280);
    const size=await inspect(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,feature:Math.round(document.querySelector('.feature').getBoundingClientRect().width),touch:Math.round(document.querySelector('#searchTrigger').getBoundingClientRect().width),last:document.querySelector('footer').getBoundingClientRect().bottom>0}));
    assert('responsive width '+width,size.overflow<=2&&size.feature>200&&size.touch>=40,JSON.stringify(size));
  }
  const pageReduced=await browser.newPage({width:390,height:844,mobile:true,reducedMotion:true});
  await pageReduced.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-reduced-transparency',value:'reduce'}]});
  await pageReduced.goto(URL,{settleMs:1100});
  const reduced=await pageReduced.eval(()=>({motion:matchMedia('(prefers-reduced-motion:reduce)').matches,background:getComputedStyle(document.querySelector('.mobile-dock')).backgroundColor,blur:getComputedStyle(document.querySelector('.mobile-dock')).backdropFilter}));
  assert('reduced motion and transparency',reduced.motion&&reduced.blur==='none',JSON.stringify(reduced));
  assert('no runtime exceptions',page.consoleErrors.length===0&&pageReduced.consoleErrors.length===0,JSON.stringify([...page.consoleErrors,...pageReduced.consoleErrors]));
  await pageReduced.close();await page.close();
}finally{await browser.close();writeFileSync('E:/CHATGPT/outputs/mouseverse-interaction-qa.json',JSON.stringify({url:URL,checks,failures},null,2));console.log('SUMMARY '+checks.filter(c=>c.ok).length+'/'+checks.length+' passed')}
if(failures.length)process.exitCode=1;
