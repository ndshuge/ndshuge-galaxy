// Purpose-built GPU refractive material for the player's floating control surface.
// Keeps controls real HTML: shader output is purely decorative and never captures events.
// Uses WebGL1 (widely supported on Safari) and paints/refracts its *own* ambient light field.
const canvas = document.getElementById("liquid-dock-canvas");
const dock = document.querySelector(".player-dock");
const audio = document.getElementById("audio");
const main = document.getElementById("play-pause");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const reduceTransparency = matchMedia("(prefers-reduced-transparency: reduce)");
const highContrast = matchMedia("(prefers-contrast: more)");
const active = !reduceTransparency.matches && !highContrast.matches;
let gl = null, program = null, uniforms = {}, alive = true;
const state = {press:0, velocity:0, goal:0, x:.51, y:.5, ax:.51, ay:.5, t:0, last:0, drawn:0, pointerDown:false};
window.__liquidDockState = {engine:"fallback", press:0, frames:0, light:0, opticVisible:false, reduced: !active};

function compile(type,src){
 const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
 return s;
}
const vertex=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=(a_position+1.0)*0.5;gl_Position=vec4(a_position,0.,1.);}`;
const fragment=`
precision mediump float;
varying vec2 v_uv;
uniform float u_time,u_press,u_audio,u_aspect,u_dpr;
uniform vec2 u_point;
uniform vec3 u_color1,u_color2,u_color3;
uniform sampler2D u_album;
uniform float u_albumLoaded;
float noise1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 field(vec2 uv){
 float d = length(vec2((uv.x-.52)*u_aspect*.70,(uv.y-.42)*.64));
 float a = .23+.13*sin(u_time*.33);
 float c1 = exp(-pow(length(vec2((uv.x-.15)*u_aspect*.66,uv.y-.24)),2.)*9.);
 float c2 = exp(-pow(length(vec2((uv.x-.78)*u_aspect*.67,uv.y-.81)),2.)*7.);
 float c3 = exp(-pow(d,2.)*4.);
 vec3 outc=vec3(.082,.100,.166)+u_color1*c1*.29+u_color2*c2*.25+u_color3*c3*.17;
 float line1=exp(-pow((uv.y-.36-.11*sin(uv.x*6.2-u_time*.23))*21.,2.));
 float line2=exp(-pow((uv.y-.76-.08*sin(uv.x*8.5+u_time*.14+1.5))*24.,2.));
 float line3=exp(-pow((uv.y-.58-.07*sin(uv.x*10.2-u_time*.2))*31.,2.));
 outc+=mix(u_color1,u_color3,.48)*line1*(.085+.035*u_audio);
 outc+=u_color2*line2*(.063+.025*u_audio);
 outc+=u_color3*line3*.045;
 return outc;
}
void main(){
 vec2 p=v_uv; float ratio = max(u_aspect,1.);
 vec2 d = vec2((p.x-u_point.x)*ratio,p.y-u_point.y);
 float r=length(d);
 float lens = exp(-pow(r/(.23+.09*u_press),2.)*1.5);
 float refraction=(.020+.030*u_press)*lens;
 vec2 normal=d/(r+.018);
 vec2 shear=normal*refraction*(.18+.82*smoothstep(.00,.21,r));
 vec2 q=p+vec2(shear.x/ratio,shear.y);
 // chromatic rim: sample refracted scene in three slightly different positions
 float chroma = (.004+.007*u_press)*lens;
 vec3 color = vec3(field(q+vec2(chroma/ratio,0.)).r,field(q).g,field(q-vec2(chroma/ratio,0.)).b);
 vec2 albumUV=vec2(clamp(.23+q.x*.55,0.,1.),clamp(.15+q.y*.70,0.,1.));
 vec3 album=vec3(texture2D(u_album,albumUV+vec2(chroma/ratio,0.)).r,texture2D(u_album,albumUV).g,texture2D(u_album,albumUV-vec2(chroma/ratio,0.)).b);
 color=mix(color,color*.57+album*.48,(.10+.22*lens)*u_albumLoaded);
 float rim=exp(-pow((r-(.23+.055*u_press))/.027,2.));
 float lightSide=pow(max(.0,normal.x*-.65+normal.y*.75),2.0);
 vec3 pearl=vec3(.89,.84,.96);
 color+=pearl*rim*(.032+.13*lightSide+.11*u_press);
 // broad soft lens reflection travels as touch moves, not a sharp rainbow outline
 float sheen=exp(-pow((p.y - (.86-.34*p.x+.08*sin(u_time*.15)))*9.,2.));
 color+=pearl*sheen*(.014+.063*u_press);
 float halo = lens*(.015+.04*u_audio);
 color+=u_color1*halo;
 float fade=1.0-smoothstep(.94,1.,abs(p.y*2.-1.));
 gl_FragColor=vec4(color, min(.83,(.66+.11*u_press)*fade));
}`.replace(/\/\/ chromatic rim[^\n]*\n/g,"").replace(/\/\/ broad soft lens reflection[^\n]*\n/g,"");
const toRgb=h=>{const x=h.replace("#","");return [0,2,4].map(i=>parseInt(x.slice(i,i+2),16)/255)};
let colors=["#ad8cb8","#3d7797","#715b89"];
function setPalette(next){colors=next.map(toRgb);if(!gl)return;colors.forEach((c,i)=>gl.uniform3fv(uniforms["u_color"+(i+1)],c));}
function init(){
 if(!active||!canvas||!dock)return;
 try{
   gl=canvas.getContext("webgl",{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,powerPreference:"low-power"});
   if(!gl)throw Error("WebGL unavailable");
   program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   gl.useProgram(program);
   const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   const pos=gl.getAttribLocation(program,"a_position");gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
   for(const name of ["u_time","u_press","u_audio","u_aspect","u_dpr","u_point","u_color1","u_color2","u_color3","u_album","u_albumLoaded"])uniforms[name]=gl.getUniformLocation(program,name);
   setPalette(colors);
   initAlbumTexture();
   canvas.classList.add("gpu-ready");
   window.__liquidDockState.engine="webgl";
   window.__liquidDockState.opticVisible=true;
   resize();
   requestAnimationFrame(tick);
 }catch(e){console.warn("Liquid dock GPU fallback:",e);window.__liquidDockState.error=String(e);gl=null;canvas.classList.remove("gpu-ready");}
}
function initAlbumTexture(){
 const img=document.getElementById('cover-art');const texture=gl.createTexture();
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
 gl.uniform1i(uniforms.u_album,0);gl.uniform1f(uniforms.u_albumLoaded,0);
 const upload=()=>{try{if(img.naturalWidth){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.uniform1f(uniforms.u_albumLoaded,1);window.__liquidDockState.albumRefracted=true;}}catch(e){console.warn('Album texture fallback',e)}};
 if(img.complete)upload();else img.addEventListener('load',upload,{once:true});
}
function resize(){
 if(!canvas||!gl)return;
 const box=dock.getBoundingClientRect();
 const scale=Math.min(devicePixelRatio||1,1.8);
 const width=Math.max(1,Math.round(box.width*scale)),height=Math.max(1,Math.round(box.height*scale));
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
 gl.uniform1f(uniforms.u_aspect,box.width/Math.max(box.height,1));
 gl.uniform1f(uniforms.u_dpr,scale);
}
function seekPoint(e){
 if(!dock)return;const r=dock.getBoundingClientRect();
 state.x=Math.min(.99,Math.max(.01,(e.clientX-r.left)/r.width));
 state.y=1.-Math.min(.99,Math.max(.01,(e.clientY-r.top)/r.height));
}
function tick(now){
 if(!alive||!gl)return;
 const dt=Math.min(.042,Math.max(.006,(now-state.last)/1000||.016));state.last=now;
 // Damped spring, integrated per frame: interaction is interruptible, never scales hit targets.
 const accel=(state.goal-state.press)*92-state.velocity*19.5;
 state.velocity+=accel*dt;state.press+=state.velocity*dt;state.press=Math.max(-.04,Math.min(1.15,state.press));
 const follow=Math.min(1,dt*11);
 state.ax+=(state.x-state.ax)*follow;state.ay+=(state.y-state.ay)*follow;
 const isPlaying=!audio.paused&&!audio.ended;
 // Rate cap when paused; interactivity gets 60fps during press/release.
 const fps=reduceMotion.matches?1:state.pointerDown||Math.abs(state.press-state.goal)>.009||Math.abs(state.velocity)>.08?60:isPlaying?28:12;
 if(now-state.drawn>=1000/fps){
   resize();
   gl.uniform1f(uniforms.u_time,reduceMotion.matches?0:now/1000);
   gl.uniform1f(uniforms.u_press,Math.max(0,state.press));
   gl.uniform1f(uniforms.u_audio,isPlaying? .38+.26*Math.sin(audio.currentTime*3.1):0);
   gl.uniform2f(uniforms.u_point,state.ax,state.ay);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   state.drawn=now;
   Object.assign(window.__liquidDockState,{press:state.press,frames:window.__liquidDockState.frames+1,light:isPlaying?.65:.38,pointer:[state.ax,state.ay]});
 }
 requestAnimationFrame(tick);
}
const down=e=>{if(reduceMotion.matches)return;state.pointerDown=true;state.goal=1;seekPoint(e);dock.classList.add("glass-pressed");};
const move=e=>{if(!reduceMotion.matches)seekPoint(e);};
const up=()=>{state.pointerDown=false;state.goal=0;dock.classList.remove("glass-pressed");};
dock?.addEventListener("pointerdown",down,{passive:true});
dock?.addEventListener("pointermove",move,{passive:true});
window.addEventListener("pointerup",up,{passive:true});
window.addEventListener("pointercancel",up,{passive:true});
dock?.addEventListener("pointerleave",()=>{if(!state.pointerDown){state.x=.51;state.y=.5;}});
window.addEventListener("pagehide",()=>{alive=false;});
if(typeof ResizeObserver!=="undefined")new ResizeObserver(()=>{if(gl)resize()}).observe(dock);
window.__auroraSetMaterialPalette=palette=>setPalette(palette);
init();
