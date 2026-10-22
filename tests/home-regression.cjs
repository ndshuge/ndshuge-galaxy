// Core navigation/layout regressions. Real browser screenshots complement this DOM/canvas harness.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(width=1280,height=720,reduced=false){
  const texts=[],events={},nodes={};let doc;
  const grad={addColorStop(){}};
  const ctx=new Proxy({createLinearGradient:()=>grad,createRadialGradient:()=>grad,measureText:t=>({width:t.length*8}),fillText:t=>texts.push(t)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  function node(){const classes=new Set();return{style:{setProperty(){}},dataset:{},hidden:false,children:[],events:{},value:'',textContent:'',
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c);}},
    append(...n){this.children.push(...n);},appendChild(n){this.children.push(n);this.firstChild=this.children[0];},setAttribute(k,v){this[k]=v;},
    addEventListener(k,v){this.events[k]=v;},focus(){doc.activeElement=this;},blur(){doc.activeElement=null;},
    getContext:()=>ctx,setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width,height:Math.max(height,width<620?760:620)})};}
  doc={activeElement:null,body:node(),createElement:node,getElementById:id=>nodes[id]||(nodes[id]=node()),querySelectorAll:()=>[node(),node(),node()]};
  const sandbox={console,Math,Date,String,performance:{now:()=>0},document:doc,innerWidth:width,innerHeight:height,
    addEventListener(k,f){events[k]=f;},matchMedia:q=>({matches:q.includes('reduce')?reduced:width<620}),setInterval(){},clearInterval(){},requestAnimationFrame(){},
    localStorage:{getItem(){return null;},setItem(){}},location:{href:''}};sandbox.window=sandbox;
  vm.createContext(sandbox);vm.runInContext(script,sandbox);return{nodes,events,texts,run:c=>vm.runInContext(c,sandbox),sandbox};
}
let checks=0;
for(const reduced of [false,true])for(let i=0;i<8;i++){
  const h=harness(1280,720,reduced);h.run(`runCmd(PROJECTS[${i}].name);for(let n=0;n<100;n++)update(.05,n*.05);`);
  assert.equal(h.sandbox.location.href,h.run(`PROJECTS[${i}].url`));assert.equal(h.run('systems.includes(warp.target)'),true);checks++;
}
for(const [w,h] of [[320,568],[375,812],[390,844],[768,1024],[1280,720],[1440,900],[1920,1080]]){
  const t=harness(w,h);t.run('for(let n=0;n<60;n++)update(1/60,n/60)');
  assert.equal(t.nodes.destinations.children.length,8);assert.equal(t.nodes.chart.children.length,8);
  assert.equal(t.run('destinationLinks.filter(a=>a.hidden).length'),0);
  assert.equal(t.run('systems.every(s=>Number.isFinite(s.x+s.y+s.r)&&s.x-s.r>0&&s.x+s.r<W&&s.y-s.r>60&&s.y+s.r<H-50)'),true);
  assert.equal(t.run('M.driveX===0&&M.driveY===0'),true);
  t.run('mouseX=0;mouseY=0;for(let n=0;n<60;n++)update(1/60,n/60)');assert.equal(t.run('M.driveX===0&&M.driveY===0'),true);
  t.run('setExplore(true);mouseX=0;mouseY=0;for(let n=0;n<60;n++)update(1/60,n/60)');
  assert.equal(t.run('M.driveX<0'),w>=620); // Only desktop has a hover-steering pointer.
  t.run('setExplore(false)');assert.equal(t.run('M.driveX'),0);
  checks++;
}
{
  const t=harness(1440,900);t.run('M.mapOn=true;drawMinimap(0)');assert(t.texts.some(t=>t!=='星图 · 点选目的地'));checks++;
}
{
  const t=harness(390,844);const cv=t.nodes.space;
  const p=t.run('({x:systems[0].x,y:systems[0].y})');
  cv.events.pointerdown({pointerId:1,clientX:p.x,clientY:p.y});
  cv.events.pointermove({pointerId:1,clientX:p.x+30,clientY:p.y+30});
  cv.events.pointerup({pointerId:1,clientX:p.x+30,clientY:p.y+30});assert.equal(t.run('warp.active'),false);checks++;
  cv.events.pointerdown({pointerId:2,clientX:p.x,clientY:p.y});
  cv.events.pointerup({pointerId:2,clientX:p.x,clientY:p.y});assert.equal(t.run('warp.active'),true);checks++;
}
// Pointer gestures must pan the starfield even without pressing the Roam button.
for(const reduced of [false,true])for(const [w,h] of [[375,812],[1440,900]]){
  const t=harness(w,h,reduced),cv=t.nodes.space;
  const e=(id,x,y,time)=>({pointerId:id,clientX:x,clientY:y,timeStamp:time,cancelable:true,preventDefault(){}});
  cv.events.pointerdown(e(10,160,260,0));
  cv.events.pointermove(e(10,212,290,16));
  cv.events.pointermove(e(10,268,315,32));
  assert.equal(t.run('M.explore&&M.dragging'),true);
  const before=t.run('M.targetX');
  assert(before<0&&t.run('M.targetY')<0);
  cv.events.pointerup(e(10,268,315,48));
  assert.equal(t.run('M.dragging'),false);
  assert.equal(t.run('warp.active'),false);
  assert.equal(t.run('M.inertiaX!==0'),!reduced);
  t.run('for(let n=0;n<20;n++)update(1/60,n/60)');
  assert.equal(t.run('M.targetX<'+before),!reduced);
  t.run('setExplore(false)');
  assert.equal(t.run('M.targetX===0&&M.driveX===0&&!M.explore'),true);
  checks++;

  // Dragging a visible HTML label must NOT follow its link.
  const link=t.nodes.destinations.children[0];
  link.events.pointerdown(e(11,100,100,100));
  link.events.pointermove(e(11,170,150,116));
  link.events.pointerup(e(11,170,150,132));
  let stopped=false;
  link.events.click({currentTarget:link,preventDefault(){stopped=true;}});
  assert(stopped&&!t.run('warp.active')&&t.run('M.explore'));
  checks++;

  // A fresh tap still warps, and a cancel ends a gesture without accidental navigation.
  t.run('setExplore(false)');
  link.events.pointerdown(e(12,100,100,150));
  link.events.pointerup(e(12,100,100,166));
  link.events.click({currentTarget:link,preventDefault(){}});
  assert(t.run('warp.active'));
  checks++;
}
{
  const t=harness(375,812),cv=t.nodes.space;
  const e=(x,y)=>({pointerId:5,clientX:x,clientY:y,timeStamp:10});
  cv.events.pointerdown(e(100,100));cv.events.pointermove(e(145,160));
  cv.events.pointercancel(e(145,160));
  assert.equal(t.run('M.dragging'),false);
  assert.equal(t.run('M.inertiaX'),0);
  checks++;
}
console.log(JSON.stringify({passed:checks,scope:'VM navigation, reduced motion, seven layouts, minimap labels, direct drag/inertia, links, tap and cancel'}));
