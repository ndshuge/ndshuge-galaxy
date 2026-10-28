import {createRequire} from 'node:module';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true});
const p=await b.newPage();
await p.goto('http://127.0.0.1:18762/little-works/ai-academy-apple/');
await p.waitForFunction(()=>!!document.querySelector('#original-engine').contentWindow?.ZHIXU_BROWSER_ADAPTER,{timeout:25000});
const r=await p.evaluate(async()=>{const w=document.querySelector('#original-engine').contentWindow;const x=await w.fetch('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({experiment:'evo-pair',seed:12023,prediction:'我预测合作机制在不同随机种子的世界里会出现不同表现'})});const j=await x.json();return {status:x.status,fields:Object.keys(j),error:j.error,metrics:j.metrics,summary:j.summary,plots:j.plots?.length,results:j.results?.slice?.(0,3),condition:j.condition,engineVersion:j.engineVersion,runId:j.runId};});
console.log(JSON.stringify(r,null,2));await b.close();