import {createRequire} from 'node:module';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const b=await chromium.launch({channel:'msedge',headless:true});
for(const u of ['https://designeer.xyz/resources','https://designeer.xyz/inspiration']){
 try{
 const p=await b.newPage();await p.goto(u,{waitUntil:'domcontentloaded',timeout:30000});await p.waitForTimeout(800);
 const v=await p.evaluate(()=>({title:document.title,body:document.body.innerText.slice(0,2200),links:[...document.querySelectorAll('a[href]')].filter(a=>a.innerText.trim().length>1).map(a=>({text:a.innerText.slice(0,55),href:a.href})).slice(0,35)}));
 console.log(JSON.stringify({url:u,content:v}).slice(0,6500));await p.close();
 }catch(e){console.log(u+' ERROR '+e.message)}
}
await b.close();