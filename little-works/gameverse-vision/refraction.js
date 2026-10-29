/* Genuine optical lens on the hero details button, using the bundled liquidglass.dev engine.
   The pixels behind the button are aligned to a local image copy, so the SVG feDisplacementMap
   bends the actual sampled background, including on WebKit. Reduced transparency uses L0. */
import {createGlass, createSpring} from './glasslib/liquid-glass.js';
const host=document.getElementById('hero');
const image=document.getElementById('heroArt');
const button=document.getElementById('heroMore');
const surface=button?.querySelector('.refract-plate');
let glass;
let pressed=0;
if(host&&image&&button&&surface){
 try{
  glass=createGlass(surface,{fit:true,radius:22,refraction:9,bezel:.62,curvature:3,chroma:.1,specular:.58,mapScale:1});
  document.documentElement.dataset.opticalGlass='active';
  const spring=createSpring(0,v=>{pressed=v;if(glass)glass.update({refraction:9+v*6,chroma:.10+v*.05})},{stiffness:450,damping:30});
  button.addEventListener('pointerdown',()=>spring.set(1));
  for(const ev of ['pointerup','pointercancel','pointerleave'])button.addEventListener(ev,()=>spring.set(0));
  function align(){
   if(!host.isConnected||!image.complete)return;
   const h=host.getBoundingClientRect(),b=button.getBoundingClientRect(),w=image.naturalWidth,hh=image.naturalHeight;
   if(!w||!hh||!h.width)return;
   const scale=Math.max(h.width/w,h.height/hh),dw=w*scale,dh=hh*scale;
   const left=(h.width-dw)/2,top=(h.height-dh)/2;
   surface.style.backgroundImage='url("'+image.getAttribute('src')+'")';
   surface.style.backgroundSize=dw+'px '+dh+'px';
   surface.style.backgroundPosition=(left-(b.left-h.left))+'px '+(top-(b.top-h.top))+'px';
  }
  image.addEventListener('load',align);
  new ResizeObserver(align).observe(host);
  window.addEventListener('resize',align,{passive:true});
  const heroObs=new MutationObserver(align);
  heroObs.observe(image,{attributes:true,attributeFilter:['src']});
  requestAnimationFrame(align);
  if(matchMedia('(prefers-reduced-transparency: reduce)').matches){glass.update({hidden:true});surface.style.backgroundImage='none'}
 }catch(error){
  console.warn('Optical glass unavailable, keeping frosted visual fallback:',error);
  document.documentElement.dataset.opticalGlass='fallback';
 }
}
