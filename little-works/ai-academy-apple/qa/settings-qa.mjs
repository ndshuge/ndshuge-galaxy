import {createRequire} from 'node:module';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true});let fail=0;
try{
 for(const width of [320,390,768,1440]){
  const page=await b.newPage({viewport:{width,height:844}});
  await page.goto('http://127.0.0.1:18762/little-works/ai-academy-apple/');
  const btn=page.locator('.user-button');
  const visible=await btn.isVisible();
  console.log((visible?'PASS ':'FAIL ')+'Settings visible '+width);if(!visible){fail++;continue}
  await btn.click();
  const ok=await page.locator('main h1.large-title').innerText().then(t=>t.includes('设置'));
  console.log((ok?'PASS ':'FAIL ')+'Settings opens '+width);if(!ok)fail++;
  await page.locator('[data-action=toggle-effect]').click();
  const stat=await page.evaluate(()=>({attr:document.documentElement.dataset.effect,blur:getComputedStyle(document.querySelector('.mobile-dock')).backdropFilter}));
  const pass=stat.attr==='off' && (width>=701||stat.blur==='none');
  console.log((pass?'PASS ':'FAIL ')+'L0 fallback '+width+' '+JSON.stringify(stat));if(!pass)fail++;
  await page.close();
 }
}catch(e){console.error(e);fail++;}finally{await b.close();console.log('SETTINGS FAIL',fail);if(fail)process.exitCode=1;}
