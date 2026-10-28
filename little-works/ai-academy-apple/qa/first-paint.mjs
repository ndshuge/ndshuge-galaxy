import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const root='http://127.0.0.1:18762/little-works/ai-academy-apple/';
const dir=dirname(fileURLToPath(import.meta.url));
const report={timestamp:new Date().toISOString(),mode:'JavaScript deliberately blocked',screens:[],checks:[]};
const check=(k,v,detail)=>{report.checks.push({name:k,pass:!!v,detail});console.log((v?'PASS ':'FAIL ')+k);};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const width of [390,1440]){
  const p=await browser.newPage({viewport:{width,height:900}});
  await p.route('**/little-works/ai-academy-apple/app.js',route=>route.abort());
  await p.goto(root,{waitUntil:'domcontentloaded'});
  const hero=await p.locator('main[data-initial-shell] .reading-hero').count();
  // initial shell is a child of <main>, not a separate page.
  const data=await p.evaluate(()=>({visible:!!document.querySelector('main [data-initial-shell] .reading-hero'),text:document.querySelector('main')?.innerText||'',original:document.querySelector('main [data-initial-shell] a.primary')?.href,overflow:document.documentElement.scrollWidth>innerWidth+2}));
  check('first paint content '+width,data.visible&&data.text.includes('今天，理解一个新问题。'),{contentLength:data.text.length});
  check('functional Original fallback '+width,data.original==='https://ndshuge.github.io/zhixu-ai-academy/',data.original);
  check('no horizontal overflow '+width,!data.overflow);
  await p.screenshot({path:join(dir,'first-paint-without-javascript-'+width+'.png')});
  report.screens.push('first-paint-without-javascript-'+width+'.png');
  await p.close();
 }
}catch(err){check('unexpected test error',false,String(err));}
finally{
 await browser.close();
 await writeFile(join(dir,'first-paint-report.json'),JSON.stringify(report,null,2));
 console.log('FIRST_PAINT '+JSON.stringify({passed:report.checks.filter(x=>x.pass).length,failed:report.checks.filter(x=>!x.pass).length}));
 if(report.checks.some(x=>!x.pass))process.exitCode=1;
}
