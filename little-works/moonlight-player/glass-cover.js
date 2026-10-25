import { createGlass } from "./liquid-glass.js";
// Real refractive displacement of *the actual cover pixels*, not backdrop blur.
// The optics stay on the artwork, never on text or interactive controls.
const artwork=document.querySelector(".art-frame img");
if(artwork&&!matchMedia("(prefers-reduced-transparency: reduce)").matches){
 try{
  const update=()=>{
   const size=artwork.clientWidth;
   if(!size)return;
   if(window.__albumLens){window.__albumLens.update({x:0,y:0,width:size,height:size,radius:Math.min(16,size*.08)});}
   else window.__albumLens=createGlass(artwork,{x:0,y:0,width:size,height:size,radius:Math.min(16,size*.08),refraction:9,bezel:.42,chroma:.11,specular:.38});
   artwork.classList.add("album-refraction-ready");
  };
  update();
  const ro=new ResizeObserver(update);ro.observe(artwork);
 }catch(err){console.warn("Cover refraction not available; artwork remains visible",err);}
}
