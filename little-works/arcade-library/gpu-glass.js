/**
 * GPU renderer for the static artwork behind this experiment.
 * Uses the installed Liquid Glass Skill's glass-webgl.js rather than implementing a new shader.
 * The stage image is rasterised once per resize. Its texture is uploaded once and reused.
 * The lens displacement map is cached until the lens geometry changes.
 */
import {createGlassRenderer} from './glasslib/glass-webgl.js';

export async function createGpuGlass({stage,source,panel}){
  if(!stage||!source||!panel)throw new Error('Missing GPU glass DOM element');
  if(!source.complete || !source.naturalWidth)await source.decode();

  const canvas=document.createElement('canvas');
  canvas.className='glass-gpu-canvas';
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0';
  stage.insertBefore(canvas,stage.querySelector('.scene-grain'));

  // A static, already-cropped copy of object-fit:cover artwork.
  const sourceCanvas=document.createElement('canvas');
  const ctx=sourceCanvas.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('No 2D context');
  let renderer=null,dead=false;
  const lens={x:0,y:0,width:1,height:1,radius:32,refraction:29,bezel:.44,curvature:4,
    ior:1.5,invert:false,chroma:.08,specular:.72,specularWidth:2,lightAngle:-120};

  function coverSource(){
    const w=Math.max(1,Math.round(stage.clientWidth));
    const h=Math.max(1,Math.round(stage.clientHeight));
    sourceCanvas.width=w;sourceCanvas.height=h;
    const scale=Math.max(w/source.naturalWidth,h/source.naturalHeight);
    const dw=source.naturalWidth*scale,dh=source.naturalHeight*scale;
    const objectX=matchMedia('(max-width:780px)').matches?.67:.5;
    ctx.drawImage(source,(w-dw)*objectX,(h-dh)*.5,dw,dh);
  }
  function render(){if(!dead)renderer?.render();}
  function move(x,y){
    if(dead)return;
    renderer?.updateLens(0,{x,y});
    render();
  }
  function resize(x,y){
    if(dead)return;
    coverSource();
    renderer?.invalidateSource();
    renderer?.updateLens(0,{x,y,width:Math.round(panel.offsetWidth),height:Math.round(panel.offsetHeight)});
    render();
  }
  function strength(v){
    lens.refraction=Number(v);
    renderer?.updateLens(0,{refraction:lens.refraction});
    render();
  }
  function setMode(mode){canvas.style.visibility=mode==='l2'?'visible':'hidden';if(mode==='l2')render();}
  function cleanup(){dead=true;renderer?.destroy();canvas.remove();}

  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();
    cleanup();
    window.dispatchEvent(new CustomEvent('shuge:glass-gpu-lost'));
  },{once:true});

  try{
    coverSource();
    renderer=createGlassRenderer(canvas,sourceCanvas,{pixelRatio:1,staticSource:true,overlayOnly:true});
    lens.width=Math.round(panel.offsetWidth);lens.height=Math.round(panel.offsetHeight);
    renderer.setLenses([lens]);
    render();
  }catch(error){canvas.remove();throw error}
  return {move,resize,strength,setMode,render,destroy:cleanup,canvas,get lens(){return {...lens}},get stats(){return renderer?.stats}};
}
