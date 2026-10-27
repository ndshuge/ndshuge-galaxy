const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const dir=path.resolve(__dirname,'..');const edgeExe='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';const port=18743;
const url=process.env.IDEA_CARDS_BASE_URL||'http://127.0.0.1:8763/little-works/idea-cards/';
const edge=spawn(edgeExe,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port='+port,'--user-data-dir='+path.join(dir,'.idea-edge-qa'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket,seq=0,pending=new Map(),errors=[],results=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(cond,msg)=>{results.push({test:msg,pass:!!cond});if(!cond)throw new Error(msg)};
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('Timeout '+method))}},15000)})}
async function evaluate(expression){const out=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(out.result.exceptionDetails)throw new Error(JSON.stringify(out.result.exceptionDetails));return out.result.result.value}
async function capture(name){const out=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const dir2=path.join(dir,'.idea-evidence');fs.mkdirSync(dir2,{recursive:true});const dest=path.join(dir2,name);fs.writeFileSync(dest,Buffer.from(out.result.data,'base64'));return dest}
async function viewport(width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});await pause(220)}
async function start(){
 let pages;
 for(let i=0;i<65;i++){try{pages=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();if(pages.some(p=>p.type==='page'))break}catch{}await pause(200)}
 const page=pages.find(p=>p.type==='page');if(!page)throw Error('Could not connect Edge');
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
 socket.onmessage=evt=>{const m=JSON.parse(evt.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text||'Uncaught exception')};
 await send('Runtime.enable');await send('Page.enable');
 await viewport(390,844);
 await send('Page.navigate',{url});await pause(1700);
 assert(await evaluate("document.title.includes('灵感卡片') && document.querySelectorAll('.card').length===5"),'初始示例与页面加载');
 await capture('mobile-before-390.png');
 // The older deployed edition used a different key and schema. Verify migration without losing data.
 await evaluate("localStorage.setItem('shuge-idea-cards-v1',JSON.stringify([{id:'legacy-card',title:'旧版珍藏想法',body:'旧版内容仍保留',category:'项目',color:'violet',star:true,updated:Date.now()}]));localStorage.removeItem('shuge.idea-cards.v1')");
 await send('Page.reload',{ignoreCache:true});await pause(750);
 assert(await evaluate("document.querySelectorAll('.card').length===1 && document.querySelector('.card h3').textContent==='旧版珍藏想法' && document.querySelector('#countStar').textContent==='1'"),'已发布旧版数据迁移不丢内容');
 await evaluate("localStorage.removeItem('shuge-idea-cards-v1');localStorage.removeItem('shuge.idea-cards.v1')");
 await send('Page.reload',{ignoreCache:true});await pause(750);
 assert(await evaluate("document.querySelectorAll('.card').length===5"),'迁移验证后恢复独立测试数据');
 assert(await evaluate("getComputedStyle(document.querySelector('.dock')).display !== 'none'"),'手机底部 Dock 可见');
 assert(await evaluate("getComputedStyle(document.querySelector('.top-buttons [data-action=backup]')).display !== 'none'"),'手机备份入口可见');
 assert(await evaluate("document.querySelector('.side-create').offsetParent===null"),'手机侧栏隐藏');
 await viewport(320,720);assert(await evaluate('document.documentElement.scrollWidth <= innerWidth+1'),'320px 无横向溢出');await capture('mobile-320.png');
 await viewport(390,844);assert(await evaluate('document.documentElement.scrollWidth <= innerWidth+1'),'390px 无横向溢出');
 // Actual click -> open sheet -> fill -> submit
 await evaluate("document.querySelector('.dock-plus').click()");
 assert(await evaluate("!!document.querySelector('#editor') && !document.querySelector('#overlay').hidden"),'点击新增打开编辑 Sheet');
 await pause(560);
 assert(await evaluate("getComputedStyle(document.querySelector('.sheet')).opacity==='1'"),'编辑弹层动画结束后不透出正文');
 await capture('mobile-editor-390.png');
 await evaluate("document.querySelector('#titleInput').value='自动化测试灵感';document.querySelector('#bodyInput').value='一段可以搜索的私人想法';document.querySelector('#tagInput').value='测试标签';document.querySelector('#editor').requestSubmit()");
 assert(await evaluate("document.querySelectorAll('.card').length===6 && document.querySelector('#overlay').hidden"),'新建保存并自动关闭');
 await send('Page.reload',{ignoreCache:true});await pause(1050);
 assert(await evaluate("document.querySelectorAll('.card').length===6 && localStorage.getItem('shuge.idea-cards.v1').includes('自动化测试灵感')"),'刷新后本地持久化');
 await evaluate("document.querySelector('#search').value='自动化测试';document.querySelector('#search').dispatchEvent(new Event('input',{bubbles:true}))");
 assert(await evaluate("document.querySelectorAll('.card').length===1"),'实时全文搜索');
 await evaluate("document.querySelector('#search').value='';document.querySelector('#search').dispatchEvent(new Event('input',{bubbles:true}))");
 await evaluate("document.querySelector('.card[data-id]:not([data-id^=sample]) .icon-button[data-action=star]').click()");
 await evaluate("document.querySelector('.dock [data-view=star]').click()");
 assert(await evaluate("document.querySelector('#countStar').textContent==='3'"),'收藏计数更新');
 await evaluate("document.querySelector('.dock [data-view=all]').click()");
 await evaluate("document.querySelector('.card[data-id]:not([data-id^=sample])').click()");
 assert(await evaluate("document.querySelector('#sheetTitle').textContent==='自动化测试灵感'"),'点击卡片打开详情');
 await evaluate("document.querySelector('[data-action=edit][data-id]').click();document.querySelector('#titleInput').value='已编辑的灵感';document.querySelector('#editor').requestSubmit()");
 assert(await evaluate("document.querySelector('.card h3')?.textContent==='已编辑的灵感'"),'编辑卡片生效');
 await evaluate("document.querySelector('.card[data-id]:not([data-id^=sample])').click();document.querySelector('[data-action=archive][data-id]').click()");
 assert(await evaluate("document.querySelector('#countArchive').textContent==='1'"),'归档卡片');
 await evaluate("document.querySelector('.dock [data-view=archive]').click()");
 assert(await evaluate("document.querySelectorAll('.card').length===1"),'归档筛选');
 await evaluate("document.querySelector('.card').click();document.querySelector('[data-action=archive][data-id]').click()");
 assert(await evaluate("document.querySelector('#countArchive').textContent==='0'"),'恢复归档卡片');
 await evaluate("document.querySelector('.dock [data-view=all]').click();document.querySelector('.card[data-id]:not([data-id^=sample])').click();window.confirm=()=>true;document.querySelector('[data-action=delete][data-id]').click()");
 assert(await evaluate("document.querySelectorAll('.card').length===5"),'删除卡片');
 await evaluate("document.querySelector('[data-action=review]').click()");
 assert(await evaluate("!document.querySelector('#overlay').hidden"),'随机回顾');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert(await evaluate("document.querySelector('#overlay').hidden"),'Escape 关闭 Sheet');
 // safe HTML escaping & import JSON
 await evaluate("const b=new File([JSON.stringify({cards:[{title:'<img src=x onerror=alert(1)>',body:'&<script>',tag:'安全',color:'rose'}]})],'test.json',{type:'application/json'});let dt=new DataTransfer();dt.items.add(b);const input=document.querySelector('#fileInput');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}))");await pause(400);
 assert(await evaluate("document.querySelector('.card h3')?.textContent.includes('<img') && !document.querySelector('.card img')"),'导入校验与 HTML 注入转义');
 // Clean QA-only imported note before visual evidence
 await evaluate("localStorage.setItem('shuge.idea-cards.v1',JSON.stringify(JSON.parse(localStorage.getItem('shuge.idea-cards.v1')).filter(n=>n.tag!=='安全'))) ");await send('Page.reload',{ignoreCache:true});await pause(800);
 // screenshot after improvements and desktop
 await viewport(768,900);assert(await evaluate('document.documentElement.scrollWidth <= innerWidth+1'),'768px 无横向溢出');
 await viewport(1440,900);assert(await evaluate('document.documentElement.scrollWidth <= innerWidth+1'),'1440px 无横向溢出');await capture('desktop-1440.png');
 await viewport(390,844);await capture('mobile-after-390.png');
 await evaluate("localStorage.removeItem('shuge.idea-cards.v1')");
 assert(errors.length===0,'运行期无未捕获 JS 异常');
 return results;
}
start().then(r=>{console.log(JSON.stringify({status:'PASS',tests:r,screens:path.join(dir,'.idea-evidence')},null,2));process.exitCode=0}).catch(e=>{console.error(JSON.stringify({status:'FAIL',error:e.message,tests:results,errors},null,2));process.exitCode=1}).finally(async()=>{try{socket?.close()}catch{}try{edge.kill()}catch{}});
