/* 折光档案 · real-time optical sampling and narrative motion. No third-party runtime. */
const $=s=>document.querySelector(s);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const frame=$('#optics-frame'), glass=$('#refraction-canvas'), lens=$('#lens-overlay'), status=$('#optics-status'), reset=$('#lens-reset');
const toggle=$('#time-toggle'), replay=$('#time-replay'), range=$('#time-range'), timeCanvas=$('#time-canvas'), fill=$('#time-fill'), theatre=$('#time-theatre');
const image=new Image(); image.src='./assets/glass-shadow.jpg';
const motion={x:.43,y:.50,tx:.43,ty:.50,vx:0,vy:0,press:0,tpress:0,tilt:0,down:false,lastX:0,lastY:0,gl:null,tex:null,shader:null,available:false,visible:true};
const story={progress:0,mode:'scroll',visible:false,last:0,scroll:0,touch:0,vtouch:0,phase:0};
function spring(value,target,velocity,dt,stiffness=150,damping=21){const a=(target-value)*stiffness-velocity*damping; velocity+=a*dt;value+=velocity*dt;return [value,velocity]}
function makeShader(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader}
const vertex=`attribute vec2 pos;varying vec2 uv;void main(){uv=(pos+1.0)*0.5;gl_Position=vec4(pos,0.,1.);}`;
const fragment=`precision highp float;varying vec2 uv;
uniform sampler2D artwork;uniform vec2 res;uniform vec2 center;uniform vec2 radii;uniform float press;
void main(){
  vec2 pixel=uv*res;
  vec2 p=(pixel-center)/radii;
  float r=length(p);
  float inside=1.0-smoothstep(.91,1.015,r);
  vec2 normal=normalize(p+vec2(.00001));
  float band=smoothstep(.23,.88,r)*(1.0-smoothstep(.88,1.02,r));
  float body=(1.0-smoothstep(0.0,.86,r))*0.28;
  vec2 bend=normal*(band*23.0+body*10.0)*(1.0+.45*press);
  vec2 texUv=clamp(uv+bend*inside/res,vec2(0.001),vec2(.999));
  vec3 col=texture2D(artwork,texUv).rgb;
  float chroma=band*inside*.36;
  col.r=texture2D(artwork,clamp(texUv+normal*chroma/res*5.0,vec2(.001),vec2(.999))).r;
  col.b=texture2D(artwork,clamp(texUv-normal*chroma/res*5.0,vec2(.001),vec2(.999))).b;
  float highlight=inside*pow(clamp(dot(normal,normalize(vec2(-.65,.76))),0.0,1.0),9.0)*band;
  float rim=inside*smoothstep(.73,.985,r)*.055;
  col=mix(col,vec3(1.0,.98,.91),highlight*.32+rim);
  gl_FragColor=vec4(col,1.);
}`;
function initOptics(){
  if(reduced){fallback('简化模式：已减少运动');return}
  try{
    const gl=glass.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,depth:false,stencil:false,powerPreference:'low-power'});
    if(!gl)throw Error('WebGL not supported');
    const program=gl.createProgram();
    gl.attachShader(program,makeShader(gl,gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,makeShader(gl,gl.FRAGMENT_SHADER,fragment));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'pos');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    motion.gl=gl;motion.tex=tex;motion.shader=program;motion.loc={res:gl.getUniformLocation(program,'res'),center:gl.getUniformLocation(program,'center'),radii:gl.getUniformLocation(program,'radii'),press:gl.getUniformLocation(program,'press'),artwork:gl.getUniformLocation(program,'artwork')};
    motion.available=true;resizeOptics();$('#optics-backdrop').style.opacity='0';frame.dataset.optics='webgl';status.textContent='光正在改变路径';
    glass.addEventListener('webglcontextlost',ev=>{ev.preventDefault();fallback('显卡上下文已丢失：静态展厅')});
  }catch(e){console.warn('Optics fallback:',e.message);fallback('静态版本 · 当前设备不支持折射')}
}
function fallback(message){motion.available=false;$('#optics-backdrop').style.opacity='1';frame.classList.add('is-fallback');status.textContent=message}
function backdropCanvas(w,h){
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
  const g=ctx.createLinearGradient(0,h,w,0);g.addColorStop(0,'#586757');g.addColorStop(.55,'#39443b');g.addColorStop(1,'#252d27');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(image.complete&&image.naturalWidth){
    ctx.save();ctx.globalAlpha=.38;ctx.globalCompositeOperation='screen';
    const iw=w*.61,ih=h*1.65;
    ctx.drawImage(image,w*.46,-h*.43,iw,ih);
    ctx.restore();
  }
  ctx.save();ctx.fillStyle='#d3d9ca';ctx.font=`${Math.max(14,Math.round(w*.021))}px "Noto Serif SC","Songti SC",serif`;
  ctx.fillText('光沿着一条直线前进，',w*.08,h*.16);ctx.fillText('除非它遇见另一种介质。',w*.08,h*.16+Math.max(33,h*.06));
  ctx.fillStyle='#e4e9de';ctx.font=`${Math.round(Math.min(w*.3,h*.52))}px "Noto Serif SC","Songti SC",serif`;
  ctx.fillText('折射',w*.055,h*.70);ctx.restore();
  ctx.fillStyle='#d3d8cb';ctx.font=`${Math.max(12,Math.round(w*.013))}px "DM Sans",sans-serif`;ctx.fillText('REFRACTION / 02',w*.73,h*.88);
  return c;
}
function resizeOptics(){
  if(!motion.available)return;
  const r=frame.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,matchMedia('(max-width:600px)').matches?1.35:1.5);
  const w=Math.max(1,Math.floor(r.width*dpr)),h=Math.max(1,Math.floor(r.height*dpr));
  if(glass.width===w&&glass.height===h)return;
  glass.width=w;glass.height=h;
  const gl=motion.gl;gl.viewport(0,0,w,h);
  gl.bindTexture(gl.TEXTURE_2D,motion.tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,backdropCanvas(w,h));
}
function paintOptics(){
  if(!motion.available||!motion.visible)return;
  const gl=motion.gl, w=glass.width,h=glass.height;
  if(!w||!h)return;
  const radiusX=(matchMedia('(max-width:600px)').matches?74:99)*w/frame.clientWidth*(1+motion.press*.23);
  const radiusY=(matchMedia('(max-width:600px)').matches?52:67)*h/frame.clientHeight*(1+motion.press*.09);
  gl.useProgram(motion.shader);gl.uniform2f(motion.loc.res,w,h);gl.uniform2f(motion.loc.center,motion.x*w,(1-motion.y)*h);gl.uniform2f(motion.loc.radii,radiusX,radiusY);gl.uniform1f(motion.loc.press,motion.press);gl.uniform1i(motion.loc.artwork,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,motion.tex);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}
function paintLens(){
  lens.style.left=(motion.x*100).toFixed(3)+'%';lens.style.top=(motion.y*100).toFixed(3)+'%';
  const small=matchMedia('(max-width:600px)').matches;
  lens.style.width=(small?144:196)*(1+motion.press*.23)+'px';
  lens.style.height=(small?103:134)*(1+motion.press*.09)+'px';
  lens.style.transform=`translate(-50%,-50%) rotate(${motion.tilt.toFixed(2)}deg)`;
}
function pointerPosition(ev){const r=frame.getBoundingClientRect();return{x:clamp((ev.clientX-r.left)/r.width,.14,.86),y:clamp((ev.clientY-r.top)/r.height,.16,.83)}}
let pointerId=null;
frame.addEventListener('pointerdown',ev=>{
 if(ev.target.closest('button'))return;
 if(pointerId!==null)return;
 pointerId=ev.pointerId;frame.setPointerCapture(ev.pointerId);
 motion.down=true;motion.tpress=1;const p=pointerPosition(ev);motion.tx=p.x;motion.ty=p.y;motion.lastX=p.x;motion.lastY=p.y;
 frame.style.touchAction='none';
});
frame.addEventListener('pointermove',ev=>{
 if(!motion.down||ev.pointerId!==pointerId)return;
 const p=pointerPosition(ev);motion.tilt=clamp((p.x-motion.lastX)*130,-11,11);motion.tx=p.x;motion.ty=p.y;motion.lastX=p.x;motion.lastY=p.y;
});
function release(ev){if(pointerId!==ev.pointerId)return;pointerId=null;motion.down=false;motion.tpress=0;frame.style.touchAction='';}
frame.addEventListener('pointerup',release);frame.addEventListener('pointercancel',release);window.addEventListener('blur',()=>{pointerId=null;motion.down=false;motion.tpress=0});
reset.addEventListener('click',()=>{motion.tx=.43;motion.ty=.50;motion.tpress=0;motion.tilt=0});
frame.addEventListener('keydown',ev=>{
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key))return;
 ev.preventDefault();const dx=ev.key==='ArrowLeft'?-.04:ev.key==='ArrowRight'?.04:0;const dy=ev.key==='ArrowUp'?-.04:ev.key==='ArrowDown'?.04:0;motion.tx=clamp(motion.tx+dx,.14,.86);motion.ty=clamp(motion.ty+dy,.16,.83);
});
frame.setAttribute('tabindex','0');frame.setAttribute('role','group');frame.setAttribute('aria-label','可拖拽的折射透镜，聚焦后也可以通过方向键移动');

function resizeTime(){const r=theatre.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,1.6);timeCanvas.width=Math.max(1,Math.floor(r.width*dpr));timeCanvas.height=Math.max(1,Math.floor(r.height*dpr))}
function paintTime(){
 const c=timeCanvas,ctx=c.getContext('2d'),w=c.width,h=c.height;if(!w||!h)return;
 const p=story.progress;ctx.clearRect(0,0,w,h);
 const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#504339');bg.addColorStop(.52,'#423930');bg.addColorStop(1,'#282725');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const cx=w*.58,cy=h*.55;
 ctx.save();ctx.translate(cx,cy);ctx.rotate(-.14+p*.55+story.touch*.16);
 const R=Math.min(w*.49,h*.46);
 // The archive is a set of thin paper sheets passing under oblique light.
 for(let i=0;i<27;i++){
   const depth=(i+.8)/27;const t=p*Math.PI*2;const drift=Math.sin(t*.7+i*.38)*R*.12;
   const a=(i/27)*Math.PI*1.9+p*1.55;
   const rx=R*(.25+depth*.77),ry=R*(.2+depth*.5);
   ctx.beginPath();
   ctx.ellipse(drift*.3,0,rx,ry,a,Math.PI*.12,Math.PI*(.66+depth*.92),false);
   const alpha=(.10+depth*.29)*(1-.32*p);
   ctx.strokeStyle=`rgba(240,218,181,${alpha})`;ctx.lineWidth=(.55+depth*1.5)*Math.min(devicePixelRatio||1,1.6);ctx.stroke();
 }
 // A square of translucent archival paper shifts through the drawing.
 ctx.rotate(.15+p*.42);ctx.translate(-R*.34,-R*.44);
 ctx.fillStyle=`rgba(205,177,137,${.16+Math.sin(p*Math.PI)*.22})`;
 ctx.fillRect(-R*.2,-R*.45,R*.72,R*1.04);
 ctx.strokeStyle='rgba(248,231,202,.29)';ctx.lineWidth=1;ctx.strokeRect(-R*.2,-R*.45,R*.72,R*1.04);
 ctx.restore();
 // Physical response to pointer velocity
 const x=w*(.37+story.touch*.09),y=h*(.70-p*.09);
 const r=Math.min(w,h)*(.09+.12*p);
 ctx.beginPath();ctx.ellipse(x,y,r*.78,r,story.touch*.35,0,Math.PI*2);
 ctx.strokeStyle='rgba(239,211,174,.22)';ctx.lineWidth=1.3;ctx.stroke();
 for(let j=0;j<5;j++){ctx.fillStyle=`rgba(239,218,188,${.45-j*.07})`;ctx.fillRect(w*(.10+j*.015),h*(.73+j*.013),Math.max(1,w*.002),h*.018)}
}
function renderStory(){
 const n=Math.min(3,Math.floor(story.progress*4));document.querySelectorAll('[data-moment]').forEach((x,i)=>x.classList.toggle('is-current',i===n));
 range.value=Math.round(story.progress*1000);fill.style.width=(story.progress*100).toFixed(2)+'%';
 $('.time-progress span:first-child').textContent='00:'+String(Math.min(59,Math.round(story.progress*60))).padStart(2,'0');
}
function updateScroll(){const r=theatre.getBoundingClientRect();const y=(innerHeight-r.top)/(innerHeight+r.height);story.scroll=clamp(y,0,1);if(story.mode==='scroll'){story.progress=story.scroll;renderStory()}story.visible=r.top<innerHeight*1.3&&r.bottom>0}
window.addEventListener('scroll',()=>{updateScroll();updateNav()},{passive:true});
function updateNav(){let current='';for(const id of ['paper','light','time','edition']){if($('#'+id).getBoundingClientRect().top<innerHeight*.5)current=id}document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('is-active',a.dataset.nav===current))}
function setPlay(playing){story.mode=playing?'playing':'paused';toggle.textContent=playing?'Ⅱ':'▶';toggle.setAttribute('aria-pressed',playing?'true':'false');toggle.setAttribute('aria-label',playing?'暂停时间动画':'播放时间动画')}
toggle.addEventListener('click',()=>setPlay(story.mode!=='playing'));
range.addEventListener('input',ev=>{story.mode='paused';setPlay(false);story.progress=Number(ev.target.value)/1000;renderStory();paintTime()});
replay.addEventListener('click',()=>{story.progress=0;renderStory();setPlay(true)});
let id=null;theatre.addEventListener('pointerdown',ev=>{if(ev.target.closest('button,input'))return;id=ev.pointerId;theatre.setPointerCapture?.(id);story.touch=clamp((ev.clientX-theatre.getBoundingClientRect().left)/theatre.clientWidth*2-1,-1,1)});
theatre.addEventListener('pointermove',ev=>{if(ev.pointerId===id){story.touch=clamp((ev.clientX-theatre.getBoundingClientRect().left)/theatre.clientWidth*2-1,-1,1)}});
theatre.addEventListener('pointerup',()=>id=null);theatre.addEventListener('pointercancel',()=>id=null);
let last=performance.now(),frameIndex=0;
function tick(now){
 const dt=clamp((now-last)/1000,0,.045);last=now;
 for(let k=0;k<2;k++){const t=dt/2;[motion.x,motion.vx]=spring(motion.x,motion.tx,motion.vx,t);[motion.y,motion.vy]=spring(motion.y,motion.ty,motion.vy,t);[motion.press,motion.pressVel]=spring(motion.press,motion.tpress,motion.pressVel||0,t,180,19)}
 motion.tilt*=Math.exp(-dt*8);paintLens();
 if(motion.available&&motion.visible){paintOptics()}
 if(story.mode==='playing'){story.progress+=dt/60;if(story.progress>=1){story.progress=1;setPlay(false)}renderStory()}
 if(story.visible&&(!reduced||frameIndex++%3===0))paintTime();
 requestAnimationFrame(tick);
}
const observer=new IntersectionObserver(items=>{items.forEach(item=>{if(item.target===frame)motion.visible=item.isIntersecting;if(item.target===theatre)story.visible=item.isIntersecting})},{rootMargin:'100px'});
observer.observe(frame);observer.observe(theatre);
const ro=new ResizeObserver(()=>{resizeOptics();resizeTime()});ro.observe(frame);ro.observe(theatre);
function boot(){initOptics();resizeTime();updateScroll();updateNav();setPlay(false);paintTime();requestAnimationFrame(tick)}
image.onload=()=>{if(motion.available){glass.width=0;resizeOptics()}};document.fonts.ready.then(boot).catch(boot);
