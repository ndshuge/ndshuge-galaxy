/* LIMINAL · procedural cosmic installation · no external runtime dependencies */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('cosmos');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const state = { scene: 0, time: 18, speed: 1, yaw: 0.15, pitch: 0.20, distance: 11.8, targetYaw: 0.15, targetPitch: 0.20, targetDistance: 11.8, paused: reduced.matches, immersed: false, sound: false, frames: 0, fps: 60 };
  const chapters = [
    { name: '事件视界', number: '01', title: 'THE EVENT HORIZON', caption: '光在这里，改变了方向。', distance: 11.8, pitch: .20 },
    { name: '星云之海', number: '02', title: 'A SEA OF STARDUST', caption: '在尚未命名的光里，漂流。', distance: 6.4, pitch: .18 },
    { name: '超光速航行', number: '03', title: 'BEYOND THE LIGHT', caption: '向着未知，再靠近一点。', distance: 5.2, pitch: .08 }
  ];
  let gl, program, uniforms, vao, animation, last = 0, fade = 1, switching = false;
  let quality = coarse ? .68 : .9, fpsFrames = 0, fpsTime = 0, badFrames = 0;
  let audio = null, audioGain = null, oscillators = [], pointer = null, pinch = null;
  const touches = new Map();
  const vertex = `#version 300 es
  precision highp float;
  void main(){
    vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
    gl_Position=vec4(p*2.0-1.0,0.0,1.0);
  }`;
  const fragment = `#version 300 es
  precision highp float;
  out vec4 fragColor;
  uniform vec2 uResolution;
  uniform float uTime, uYaw, uPitch, uDistance, uFade, uCenter, uCenterY;
  uniform int uScene;
  const float PI=3.14159265359;
  float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
  float noise(vec3 p){
    vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){float v=0.0,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec3(3.1,1.7,2.4);a*=.5;}return v;}
  mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
  vec3 sky(vec3 d){
    vec2 uv=vec2(atan(d.z,d.x)/(2.0*PI)+.5,asin(clamp(d.y,-1.0,1.0))/PI+.5);
    float cloud=fbm(d*4.0+vec3(.4,.3,.1));
    float band=exp(-pow((d.y+d.x*.23)*2.7,2.0));
    vec3 col=vec3(.005,.007,.011)+vec3(.025,.031,.051)*pow(cloud,2.0)*band;
    for(int i=0;i<3;i++){
      float scale=90.0+float(i)*100.0;
      vec2 p=uv*vec2(scale*2.0,scale),cell=floor(p),f=fract(p);
      float h=hash(vec3(cell,float(i)+2.0));
      vec2 center=vec2(hash(vec3(cell,5.0)),hash(vec3(cell,9.0)))*.7+.15;
      float dist=length(f-center);
      float point=exp(-dist*dist*(1800.0+float(i)*900.0));
      float halo=exp(-dist*dist*120.0)*.065;
      float bright=step(.96,h)*(.45+hash(vec3(cell,13.0))*1.5);
      col+=(point+halo)*bright*mix(vec3(.55,.68,1.0),vec3(1.0,.82,.58),hash(vec3(cell,19.0)));
    }
    return col;
  }
  void camera(vec2 p, out vec3 ro, out vec3 rd){
    float yaw=uYaw+.035*sin(uTime*.055);
    ro=vec3(sin(yaw)*cos(uPitch),sin(uPitch),cos(yaw)*cos(uPitch))*uDistance;
    vec3 forward=normalize(-ro),right=normalize(cross(forward,vec3(0,1,0))),up=cross(right,forward);
    rd=normalize(forward*1.65+right*p.x+up*p.y);
  }
  vec3 accretion(vec3 p,vec3 rd,float radius){
    float a=atan(p.z,p.x),r=length(p.xz);
    vec2 q=rot(uTime*.48/pow(max(r,1.0),1.5))*p.xz;
    float turbulence=fbm(vec3(q*2.1,r*.65));
    float ribbons=.24+.76*pow(.5+.5*sin(r*18.0+a*1.1-uTime*.7+turbulence*17.0),2.0);
    float filaments=.25+.75*pow(turbulence,1.1);
    float hot=pow(clamp(3.3/max(r,2.8),0.0,1.0),2.7);
    vec3 color=mix(vec3(1.3,.12,.018),vec3(1.8,1.05,.46),hot);
    float doppler=pow(1.0+.45*dot(rd,normalize(vec3(-p.z,.001,p.x))),2.8);
    float falloff=smoothstep(2.65,3.05,r)*(1.0-smoothstep(5.4,7.4,r));
    return color*(.2+ribbons)*filaments*doppler*falloff;
  }
  vec3 blackhole(vec2 uv){
    vec3 ro,rd;camera(uv,ro,rd);
    vec3 p=ro,col=vec3(0),velocity=rd;float trans=1.0,minR=100.0;bool captured=false;
    vec3 angular=cross(ro,rd);float angular2=dot(angular,angular);
    for(int i=0;i<174;i++){
      float r=length(p); minR=min(minR,r);
      if(r<1.0){captured=true;break;}
      if(r>22.0)break;
      float ds=clamp(r*.055,.025,.55);
      vec3 prev=p;
      vec3 acceleration=-p*(1.5*angular2/pow(r,5.0));
      velocity+=acceleration*ds;rd=normalize(velocity);
      p+=velocity*ds;
      float rr=length(p.xz);
      if(rr>2.65 && rr<7.4){
        float thickness=.045+.014*rr;
        float vertical=exp(-pow(p.y/thickness,2.0));
        if(prev.y*p.y<0.0){
          float f=abs(prev.y)/(abs(prev.y)+abs(p.y));
          vec3 hit=mix(prev,p,f);float hitR=length(hit.xz);
          if(hitR>2.65&&hitR<7.4){
            float coverage=.18+min(1.2,.10/max(abs(rd.y),.04));
            vec3 light=accretion(hit,rd,hitR);
            col+=trans*light*coverage;trans*=exp(-coverage*.55);
          }
        }else if(vertical>.02){
          float density=vertical*ds*1.4;
          col+=trans*accretion(p,rd,rr)*density;
          trans*=exp(-density*.55);
        }
      }
    }
    if(!captured)col+=sky(rd)*trans;
    return col;
  }
  vec3 nebula(vec2 uv){
    vec3 ro,rd;camera(uv,ro,rd);
    vec3 col=sky(rd)*.7;float trans=1.0;
    float start=max(0.0,uDistance-4.5),jitter=hash(vec3(gl_FragCoord.xy,3.0));
    for(int i=0;i<58;i++){
      float t=start+(float(i)+jitter)*.145;
      vec3 p=ro+rd*t; p.xz=rot(uTime*.016)*p.xz;
      float r=length(p),envelope=exp(-r*r*.135);
      float n=fbm(p*1.14+vec3(0,uTime*.022,0));
      float ridge=pow(max(0.0,1.0-abs(n-.51)*7.5),3.0);
      float spiral=sin(atan(p.z,p.x)*3.0+length(p.xz)*2.5-p.y*1.4+uTime*.08)*.5+.5;
      float density=ridge*envelope*(.18+.82*spiral)*.115;
      vec3 cold=vec3(.12,.48,.78),warm=vec3(1.8,.53,.16);
      float heat=smoothstep(-1.6,1.6,p.x+p.y*.45);
      vec3 tint=mix(cold,warm,heat);
      float light=.45+pow(max(n,.0),5.0)*13.0;
      col+=trans*tint*density*light*2.4;
      trans*=exp(-density*.65);
    }
    vec3 central=normalize(ro);
    float core=length(cross(rd,-central));
    col+=vec3(.65,.85,1.2)*.002/(core*core+.002);
    return col;
  }
  vec3 warp(vec2 uv){
    vec2 p=uv; p=rot(uYaw*.25)*p;
    p+=vec2(sin(uTime*.17),cos(uTime*.13))*.035;
    float r=length(p),angle=atan(p.y,p.x);
    vec3 col=vec3(.005,.008,.018);
    for(int i=0;i<5;i++){
      float layer=float(i),speed=.45+layer*.17;
      float a=angle+uTime*.035+layer*1.7;
      float z=1.0/max(r,.012)+uTime*speed;
      vec2 field=vec2(a*27.0,z*.26);
      vec2 cell=floor(field),f=fract(field);
      float h=hash(vec3(cell,layer+1.0));
      float beam=pow(max(0.0,1.0-abs(f.x-.5)*2.0),46.0);
      float dash=pow(max(0.0,1.0-abs(f.y-.5)*2.0),3.0);
      float streak=beam*dash*step(.35,h)*smoothstep(.02,.42,r);
      vec3 tint=mix(vec3(.2,.54,1.3),vec3(1.4,.72,.29),h);
      col+=tint*streak*(.3+1.7*r);
    }
    float folds=sin(angle*5.0+uTime*.3+log(max(r,.01))*4.5);
    float tunnel=pow(max(0.0,folds),18.0)*.035/(r+.1);
    col+=vec3(.15,.3,.6)*tunnel;
    col+=vec3(.3,.57,1.0)*.012/(r*r+.018);
    return col;
  }
  vec3 filmic(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
  void main(){
    vec2 coord=gl_FragCoord.xy/uResolution;
    vec2 uv=(gl_FragCoord.xy-uResolution*.5)/uResolution.y*2.0;
    uv.x-=uCenter*uResolution.x/uResolution.y;
    uv.y-=uCenterY;
    vec3 col;
    if(uScene==0)col=blackhole(uv);
    else if(uScene==1)col=nebula(uv);
    else col=warp(uv*(uDistance/6.0));
    col=pow(filmic(col*1.45),vec3(.4545));
    float vignette=pow(16.0*coord.x*coord.y*(1.0-coord.x)*(1.0-coord.y),.13);
    col*=.65+.35*vignette;
    float grain=(hash(vec3(gl_FragCoord.xy,7.0))-.5)/180.0;
    col=(col+grain)*uFade;
    fragColor=vec4(col,1.0);
  }`;

  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  function init() {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL 2 unavailable');
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program); vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    uniforms = Object.fromEntries(['uResolution','uTime','uYaw','uPitch','uDistance','uFade','uCenter','uCenterY','uScene'].map(key => [key, gl.getUniformLocation(program, key)]));
    canvas.dataset.renderer = 'WebGL2'; resize(); render();
    $('load-progress').style.width = '100%';
    setTimeout(() => { $('loading').classList.add('complete'); document.body.classList.add('ready'); }, 160);
    setTimeout(() => { $('loading').hidden = true; }, 1100);
    last = 0; animation = requestAnimationFrame(loop);
  }
  function resize(capture = false) {
    const dpr = Math.min(devicePixelRatio || 1, capture ? 2 : 1.5);
    const desired = dpr * (capture ? 1 : quality);
    const cap = Math.sqrt((capture ? 4200000 : 1450000)/(innerWidth*innerHeight));
    const scale = Math.min(desired, cap);
    canvas.width = Math.max(1, Math.round(innerWidth * scale)); canvas.height = Math.max(1, Math.round(innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    canvas.dataset.resolution = canvas.width + '×' + canvas.height;
  }
  function render() {
    if (!gl || gl.isContextLost()) return;
    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.uTime, state.time);
    gl.uniform1f(uniforms.uYaw, state.yaw); gl.uniform1f(uniforms.uPitch, state.pitch);
    gl.uniform1f(uniforms.uDistance, state.distance*(innerWidth<=900&&state.scene===0&&!state.immersed?1.28:1)); gl.uniform1f(uniforms.uFade, fade);
    gl.uniform1f(uniforms.uCenter, innerWidth > 900 && !state.immersed ? .22 : 0);
    gl.uniform1f(uniforms.uCenterY, innerWidth<=900&&!state.immersed?-.18:0);
    gl.uniform1i(uniforms.uScene, state.scene); gl.drawArrays(gl.TRIANGLES, 0, 3);
    state.frames++;
  }
  function loop(now) {
    if (document.hidden) { last=0; animation=requestAnimationFrame(loop); return; }
    const dt=last?Math.min((now-last)/1000,.08):0;last=now;
    if (!state.paused) state.time += dt * state.speed;
    const ease=1-Math.exp(-dt*5);
    state.yaw+=(state.targetYaw-state.yaw)*ease;
    state.pitch+=(state.targetPitch-state.pitch)*ease;
    state.distance+=(state.targetDistance-state.distance)*ease;
    if (!state.paused || switching || Math.abs(state.distance-state.targetDistance)>.001 || Math.abs(state.yaw-state.targetYaw)>.001 || Math.abs(state.pitch-state.targetPitch)>.001) render();
    if (dt>0) { fpsFrames++;fpsTime+=dt; }
    if(fpsTime>1.8){
      state.fps=Math.round(fpsFrames/fpsTime);canvas.dataset.fps=String(state.fps);canvas.dataset.frames=String(state.frames);
      if(state.fps<34&&!state.paused)badFrames++;else badFrames=0;
      if(badFrames>=2&&quality>.38){quality=Math.max(.38,quality*.8);resize();badFrames=0;}
      fpsTime=0;fpsFrames=0;
    }
    animation=requestAnimationFrame(loop);
  }
  function setScene(scene) {
    if (switching || scene === state.scene) return;
    switching=true; document.body.classList.add('changing');
    const start=performance.now(), duration=reduced.matches?1:780;
    let applied=false;
    function transition(now){
      const p=Math.min(1,(now-start)/duration);fade=1-Math.sin(p*Math.PI)*.99;
      if(p>=.5&&!applied){
        applied=true;state.scene=scene;
        state.targetDistance=chapters[scene].distance;state.targetPitch=chapters[scene].pitch;
        $('scene-name').textContent=chapters[scene].name;
        $('scene-caption').textContent=chapters[scene].caption;
        $('scene-number').textContent=chapters[scene].number;
        document.body.dataset.scene=String(scene);canvas.dataset.scene=String(scene);
        document.querySelectorAll('[data-scene]').forEach(button=>{const active=Number(button.dataset.scene)===scene;button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);});
        if(audio)retune();
      }
      render();
      if(p<1)requestAnimationFrame(transition);
      else{switching=false;fade=1;document.body.classList.remove('changing');render();}
    }
    requestAnimationFrame(transition);
  }
  function immerse(value) {
    state.immersed=value; document.body.classList.toggle('immersed',value);
    $('enter').setAttribute('aria-pressed',String(value));render();
  }
  function togglePause() {
    state.paused=!state.paused;$('pause').setAttribute('aria-pressed',String(state.paused));
    $('pause').setAttribute('aria-label',state.paused?'继续流动':'暂停流动');
    $('pause').classList.toggle('active',state.paused);
    $('pause').querySelector('[data-label]').textContent=state.paused?'继续':'暂停';render();
  }
  function retune() {
    const bases=[36.708,43.654,48.999],base=bases[state.scene];
    oscillators.forEach((osc,i)=>osc.frequency.setTargetAtTime(base*[1,1.5,2,3.003][i],audio.currentTime,2.3));
  }
  async function toggleSound() {
    try {
      if(!audio){
        const Audio=window.AudioContext||window.webkitAudioContext;
        audio=new Audio();audioGain=audio.createGain();audioGain.gain.value=0;
        const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;filter.Q.value=.4;
        audioGain.connect(filter);filter.connect(audio.destination);
        oscillators=[0,1,2,3].map((_,i)=>{const osc=audio.createOscillator(),g=audio.createGain();osc.type=i===0?'sine':'triangle';g.gain.value=[.5,.12,.075,.025][i];osc.connect(g);g.connect(audioGain);osc.start();return osc;});
        retune();
      }
      await audio.resume();state.sound=!state.sound;audioGain.gain.setTargetAtTime(state.sound?.15:0,audio.currentTime,.6);
      $('sound').setAttribute('aria-pressed',String(state.sound));$('sound').setAttribute('aria-label',state.sound?'关闭声音':'开启声音');$('sound').classList.toggle('active',state.sound);
      $('sound').querySelector('[data-label]').textContent=state.sound?'声音开':'声音关';
    }catch(error){console.warn('Audio unavailable',error);$('sound').querySelector('[data-label]').textContent='声音不可用';}
  }
  document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>setScene(Number(button.dataset.scene))));
  $('enter').addEventListener('click',()=>immerse(true));$('leave').addEventListener('click',()=>immerse(false));
  $('pause').addEventListener('click',togglePause);$('sound').addEventListener('click',toggleSound);
  $('speed').addEventListener('input',event=>{state.speed=Number(event.target.value);$('speed-value').value=state.speed.toFixed(1)+'×';});
  $('fullscreen').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch(error){$('fullscreen').querySelector('[data-label]').textContent='浏览器不支持';}
  });
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement));resize();render();});
  $('capture').addEventListener('click',()=>{
    if(!gl)return;
    resize(true);render();
    canvas.toBlob(blob=>{
      if(blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LIMINAL-'+['Event-Horizon','Stardust','Beyond-Light'][state.scene]+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
      resize();render();
    },'image/png');
  });
  canvas.addEventListener('pointerdown',event=>{
    touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.classList.add('dragging');
    if(touches.size===2){const [a,b]=Array.from(touches.values());pinch={span:Math.hypot(a.x-b.x,a.y-b.y),distance:state.targetDistance};}
  });
  canvas.addEventListener('pointermove',event=>{
    if(touches.has(event.pointerId))touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(touches.size===2&&pinch){const [a,b]=Array.from(touches.values());const span=Math.max(10,Math.hypot(a.x-b.x,a.y-b.y));state.targetDistance=Math.max(4.2,Math.min(16,pinch.distance*pinch.span/span));return;}
    if(!pointer||pointer.id!==event.pointerId)return;
    state.targetYaw-=(event.clientX-pointer.x)*.004;
    state.targetPitch=Math.max(-1.15,Math.min(1.15,state.targetPitch+(event.clientY-pointer.y)*.003));
    pointer.x=event.clientX;pointer.y=event.clientY;
  });
  function release(event){touches.delete(event.pointerId);pinch=null;pointer=null;if(touches.size===1){const [id,p]=Array.from(touches.entries())[0];pointer={id,x:p.x,y:p.y};}if(!touches.size)canvas.classList.remove('dragging');}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('wheel',event=>{event.preventDefault();state.targetDistance=Math.max(4.2,Math.min(16,state.targetDistance+event.deltaY*.006));},{passive:false});
  addEventListener('keydown',event=>{
    if(event.target.matches('input,textarea,select,button'))return;
    if(event.code==='Space'){event.preventDefault();togglePause();}
    if(event.key.toLowerCase()==='h')immerse(!state.immersed);
    if(['1','2','3'].includes(event.key))setScene(Number(event.key)-1);
    if(event.key==='Escape'&&state.immersed)immerse(false);
    if(event.key==='ArrowLeft')state.targetYaw-=.12;
    if(event.key==='ArrowRight')state.targetYaw+=.12;
    if(event.key==='ArrowUp')state.targetDistance=Math.max(4.2,state.targetDistance-.4);
    if(event.key==='ArrowDown')state.targetDistance=Math.min(16,state.targetDistance+.4);
  });
  addEventListener('resize',()=>{if(gl){resize();render();}});
  document.addEventListener('visibilitychange',()=>{last=0;if(audioGain)audioGain.gain.setTargetAtTime(document.hidden?0:state.sound?.15:0,audio.currentTime,.3);});
  reduced.addEventListener('change',()=>{state.paused=reduced.matches;$('pause').setAttribute('aria-pressed',String(state.paused));$('pause').querySelector('[data-label]').textContent=state.paused?'继续':'暂停';render();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(animation);$('fallback').hidden=false;document.body.classList.add('ready');});
  canvas.addEventListener('webglcontextrestored',()=>{try{$('fallback').hidden=true;init();}catch(error){console.error(error);}});
  window.liminalDiagnostics=()=>({ ...state, webgl:!!gl&&!gl.isContextLost(), resolution:[canvas.width,canvas.height],quality, reducedMotion:reduced.matches, sceneName:chapters[state.scene].name, shaderLinked:!!gl&&gl.getProgramParameter(program,gl.LINK_STATUS) });
  canvas.dataset.scene='0';document.body.dataset.scene='0';
  $('pause').setAttribute('aria-pressed',String(state.paused));
  if(state.paused)$('pause').querySelector('[data-label]').textContent='继续';
  try{init();}catch(error){console.error('LIMINAL renderer:',error);$('loading').hidden=true;$('fallback').hidden=false;document.body.classList.add('ready');canvas.dataset.renderer='unavailable';}
})();
