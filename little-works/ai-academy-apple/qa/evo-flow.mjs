import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const folder=dirname(fileURLToPath(import.meta.url)),out={checks:[],errors:[]};
const verify=(name,ok,details)=>{out.checks.push({name,ok,details});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(details||''));};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 page.on('pageerror',e=>out.errors.push(e.message));
 await page.goto('http://127.0.0.1:18762/little-works/ai-academy-apple/');
 await page.waitForFunction(()=>document.querySelector('#bridge-state').textContent.includes('已连接'),{timeout:24000});
 await page.locator('[data-action=enter-evo]').first().click();
 await page.locator('[data-action=load-question]').click();
 const count=await page.locator('#quiz-form input[type=radio]').count();
 verify('EvoWorld real prequestion',count>=2,{count});
 if(count>=2){
  await page.locator('#quiz-form input[type=radio]').last().check();
  await page.locator('#quiz-form button[type=submit]').click();
  await page.locator('[data-action=next-prediction]').click();
  await page.locator('#prediction').fill('我预测在不同的随机种子下，合作机制的相对结果可能变化，需要独立重复。');
  await page.locator('#prediction-form button[type=submit]').click();
  await page.waitForTimeout(700);
  const countRows=await page.locator('.table-scroll table tr').count(); verify('EvoWorld observed table',countRows>=5,{countRows});const widthInfo=await page.evaluate(()=>({page:document.documentElement.scrollWidth,screen:innerWidth}));verify('Evo no page overflow',widthInfo.page<=widthInfo.screen+1,widthInfo);
  const txt=await page.locator('.table-scroll table').innerText();
  verify('EvoWorld conditions and seeds genuine',txt.includes('合作开启')&&txt.includes('合作关闭')&&txt.includes('12023'),txt.slice(0,280));
  await page.screenshot({path:join(folder,'apple-evo-390.png'),animations:'disabled'});
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('ai-academy-learning-v02')));
  verify('EvoWorld event persisted in original V2',stored.events.some(e=>e.kind==='hypothesis_test'&&e.payload.experimentId==='evo-pair'));
  await page.locator('[data-action=mentor]').click();
  verify('Evo tutor rules present',await page.getByText('规则引导').count()>=1);
 }
}catch(e){out.errors.push(e.stack||String(e));}finally{await browser.close();out.pass=out.checks.filter(x=>x.ok).length;out.fail=out.checks.filter(x=>!x.ok).length;await writeFile(join(folder,'evo-report.json'),JSON.stringify(out,null,2));console.log('EVO_REPORT '+JSON.stringify({pass:out.pass,fail:out.fail,errors:out.errors.length}));if(out.fail||out.errors.length)process.exitCode=1;}
