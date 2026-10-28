const {chromium}=require('E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core'),fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});let data;try{
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto('http://127.0.0.1:5239/little-works/apple-motion-lab/',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__motionLab?.diagnostic()?.navScrub);
data=await page.evaluate(async()=>{
 const {createSpring}=await import('./lib/liquid-glass.js');
 const cs={R25_shell:{stiffness:480,damping:37,mass:1},
 R26_shell:{stiffness:175,damping:27,mass:1},
 R25_lens:{stiffness:520,damping:39,mass:1},
 R26_lens:{stiffness:190,damping:27.5,mass:1}};
 let traces={}, springs={},started=performance.now();
 for(let [key,param] of Object.entries(cs)){traces[key]=[];springs[key]=createSpring(0,(value)=>traces[key].push({t:+(performance.now()-started).toFixed(2),v:+value.toFixed(4)}),param);}
 for(let spring of Object.values(springs))spring.set(1);
 await new Promise(r=>setTimeout(r,1250));
 const report={};
 for(let [key,pts] of Object.entries(traces)){
   let thresholds={};
   for(let x of [.25,.5,.75,.9,.95,.99]){
     thresholds[x]=pts.find(v=>v.v>=x)?.t??null;
   }
   report[key]={thresholds,points:pts.length,maximum:Math.max(...pts.map(x=>x.v)),final:pts.at(-1)?.v};
 }
 Object.values(springs).forEach(x=>x.stop());
 return report;
});}finally{await browser.close()}
const result={at:new Date().toISOString(),env:'Windows Edge headless; isolated actual installed Skill createSpring, not native Apple/iPhone',curves:data};fs.mkdirSync('E:/CHATGPT/work/apple-motion-lab-r26-fluid-timing-20261028/little-works/apple-motion-lab/evidence/r26',{recursive:true});fs.writeFileSync('E:/CHATGPT/work/apple-motion-lab-r26-fluid-timing-20261028/little-works/apple-motion-lab/evidence/r26/spring-curves.json',JSON.stringify(result,null,2));console.log(JSON.stringify(data,null,2))})().catch(e=>{console.error(e.stack);process.exitCode=2});
