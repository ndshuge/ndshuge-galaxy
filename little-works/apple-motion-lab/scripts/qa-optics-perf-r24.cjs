const {chromium}=require('E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),out=path.resolve(__dirname,'../evidence/r24');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});let result={date:new Date().toISOString(),engine:'Windows Edge headless CPU map rasterization, not iPhone performance'};
try{const page=await b.newPage({viewport:{width:390,height:844}});await page.goto('http://127.0.0.1:5237/little-works/apple-motion-lab/',{waitUntil:'networkidle'});
result.data=await page.evaluate(async()=>{
const {renderLensMap}=await import('./lib/liquid-glass.js'),obs=[];
for(const scale of [1,1.5,2]){
 for(const fluidity of [0,.25,.5,.75,1]){
  let durations=[];
  for(const direction of [-1,0,1]){
   const p={width:148,height:70,radius:35,fluidity,fluidDirection:direction,
   refraction:16,bezel:.74,specular:.79,curvature:3.5};
   const st=performance.now();const r=renderLensMap(p,scale);r.canvas.toDataURL();
   durations.push(+(performance.now()-st).toFixed(2));
  }
  obs.push({scale,fluidity,ms:durations,meanMs:+(durations.reduce((a,b)=>a+b,0)/3).toFixed(2),maxMs:Math.max(...durations)});
 }
}
return obs;
});}finally{await b.close()}
fs.writeFileSync(path.join(out,'optics-cpu-benchmark.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result.data));
})().catch(e=>{console.error(e.stack);process.exit(2)});
