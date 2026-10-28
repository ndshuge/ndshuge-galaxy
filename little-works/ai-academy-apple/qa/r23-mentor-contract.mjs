import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true});
const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});
const results=[];const ck=(name,ok,d)=>{results.push({name,ok:!!ok,details:d});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(d||'').slice(0,350))};
try{
 await p.goto('http://127.0.0.1:18889/little-works/ai-academy-apple/',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.documentElement.dataset.engineReady==='true',{timeout:25000});
 await p.locator('#zx-doctor-open').click();
 await p.locator('#zx-doctor-question').fill('为什么两个相近初值最后会分开？');
 ck('unconfigured does not submit',await p.locator('#zx-doctor-send').isDisabled());
 await p.evaluate(()=>{
  window.__mockCalls=[];
  const win=document.getElementById('original-engine').contentWindow;
  win.ZHIXU_PAGES_AI={
    status:()=>true,state:()=> 'verified',
    ask:async (messages,limit)=>{
     window.__mockCalls.push({messages,limit});
     return {reply:'【测试替身】这是测试专用回复，不是真实 AI 模型回答。'}
    }
  };
  document.dispatchEvent(new Event('visibilitychange'));
 });
 ck('verified model only via unchanged provider',await p.locator('#zx-doctor-send').isEnabled());
 ck('typing does not request model',await p.evaluate(()=>window.__mockCalls.length===0));
 await p.locator('#zx-doctor-send').click();
 await p.waitForFunction(()=>window.__mockCalls?.length===1);
 const first=await p.evaluate(()=>window.__mockCalls[0]);
 ck('send explicitly invokes original provider once',first?.limit===430&&first.messages.at(-1).role==='user',first);
 ck('actual request format includes Socratic system role',first?.messages[0]?.role==='system'&&first.messages[0].content.includes('苏格拉底'));
 ck('test reply shown, not invented fallback',await p.locator('#zx-doctor-log').innerText().then(s=>s.includes('【测试替身】')));
 await p.locator('#zx-doctor-question').fill('能不能设计一个验证实验？');
 await p.locator('#zx-doctor-send').click();
 await p.waitForFunction(()=>window.__mockCalls?.length===2);
 const second=await p.evaluate(()=>window.__mockCalls[1]);
 ck('second reply carries earlier conversation in memory',second.messages.filter(x=>x.role==='user').length===2&&second.messages.some(x=>x.role==='assistant'),{roles:second.messages.map(x=>x.role)});
 await p.keyboard.press('Escape');
 ck('Escape closes even with response',await p.locator('#zx-doctor-panel').isHidden());
 const b1=p.locator('#zx-doctor-open');
 await b1.hover();const box=await b1.boundingBox();
 await p.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await p.mouse.down();await p.waitForTimeout(120);
 const t=await b1.evaluate(el=>({transform:getComputedStyle(el).transform,active:el.matches(':active')}));
 await p.mouse.up();await p.waitForTimeout(400);
 const r=await b1.evaluate(el=>getComputedStyle(el).transform);
 ck('doctor button press -> release tactile motion',t.active&&t.transform!=='none'&&(r==='none'||r==='matrix(1, 0, 0, 1, 0, 0)'),{press:t,release:r});
}finally{await b.close()}
const report={passed:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results};
await writeFile('little-works/ai-academy-apple/qa/r23-mentor-contract.json',JSON.stringify(report,null,2));
console.log('MENTOR_CONTRACT '+JSON.stringify({passed:report.passed,failed:report.failed}));
if(report.failed)process.exitCode=1;
