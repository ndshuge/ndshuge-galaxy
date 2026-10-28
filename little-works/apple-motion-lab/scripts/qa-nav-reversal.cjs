const {chromium}=require('E:/CHATGPT/work/apple-motion-lab-builddeps/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),dest=path.resolve(__dirname,'../evidence/nav-scrub');
async function main(){
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const log=[];const errors=[];const ok=(n,v,d)=>{log.push({name:n,pass:!!v,details:d});console.log((v?'PASS ':'FAIL ')+n+' '+JSON.stringify(d))};
try{
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await context.addInitScript(()=>{window.__lensCanvasExports=0;window.__lensDimensions=[];window.__lensParams=[]; const prev=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(...a){window.__lensCanvasExports++;window.__lensDimensions.push(this.width+'x'+this.height);if(this.width===112&&this.height===58){const nav=document.querySelector('#navigation');window.__lensParams.push({v:nav?.v,x:nav?.glass?.params?.x,w:nav?.glass?.params?.width,h:nav?.glass?.params?.height,r:nav?.glass?.params?.radius});}return prev.apply(this,a)};});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5233/little-works/apple-motion-lab/',{waitUntil:'networkidle'});
await page.waitForFunction(()=>__motionLab?.diagnostic()?.navScrub?.current===0);
const c=await page.locator('#navigation>button').evaluateAll(els=>els.map(b=>{const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}}));
const client=await context.newCDPSession(page);
const fire=(type,x)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:(type==='touchEnd'||type==='touchCancel')?[]:[{x,y:c[0].y}]});
await page.waitForTimeout(400);
const mapsBefore=await page.evaluate(()=>__lensCanvasExports);
await fire('touchStart',c[0].x);await page.waitForTimeout(300);
const sequence=[c[1].x,c[2].x,c[1].x,c[0].x,c[2].x,c[0].x,c[1].x];
const details=[];
let fromX=c[0].x;
for(const target of sequence){
for(let i=1;i<=8;i++){const x=fromX+(target-fromX)*i/8;await fire('touchMove',x);await page.waitForTimeout(16)}
 const d=await page.evaluate(()=>__motionLab.diagnostic().navScrub);details.push({target,preview:d.preview,x:d.x});fromX=target;}
const final=await page.evaluate(()=>__motionLab.diagnostic().navScrub);
const beforeRelease=await page.locator('.intro h1').innerText();
await fire('touchEnd',c[1].x);await page.waitForTimeout(380);
const after=await page.evaluate(()=>({nav:__motionLab.diagnostic().navScrub,title:document.querySelector('.intro h1').innerText,exportCount:__lensCanvasExports,dimensions:__lensDimensions.reduce((acc,x)=>(acc[x]=(acc[x]||0)+1,acc),{}),sampleParams:__lensParams.slice(0,8),lastParams:__lensParams.slice(-8)}));
ok('Multiple direction reversals while held',details[1].preview===2&&details[3].preview===0&&final.pressed,details);
ok('View unchanged until finger release',beforeRelease.includes('让声音'),beforeRelease);
ok('Release at middle selects middle',after.nav.current===1&&after.title.includes('发现'),after);
ok('Moving refractive lens does not rerasterize the SVG displacement map',after.exportCount===mapsBefore,
{before:mapsBefore,after:after.exportCount});
await context.close();
}finally{await browser.close()}
ok('No JS exceptions',errors.length===0,errors);
const result={date:new Date().toISOString(),environment:'Windows Edge Chromium touch emulation',checks:log,summary:{passed:log.filter(x=>x.pass).length,total:log.length}};
fs.writeFileSync(path.join(dest,'qa-reversal-cache.json'),JSON.stringify(result,null,2));
console.log('SUMMARY '+JSON.stringify(result.summary));if(result.summary.passed!==result.summary.total)process.exitCode=1;
}
main().catch(e=>{console.error(e.stack);process.exitCode=2});