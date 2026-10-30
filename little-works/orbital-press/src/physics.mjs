const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createBodies(words,width,height){
 return words.map((text,i)=>{const a=i*2.3999632297,r=.17+.32*Math.sqrt((i+1)/Math.max(words.length,1));
 return {id:i,text,x:width*(.5+Math.cos(a)*r),y:height*(.5+Math.sin(a)*r*.88),vx:Math.sin(i*2.3)*9,vy:Math.cos(i*1.7)*10,radius:text.length>3?36:text.length>1?30:23,rotation:(i%7-3)*9,size:Math.max(27,Math.min(76,64-i%4*8))};
 });
}
export function stepBodies(bodies,field,width,height,dt=1/60){
 const step=clamp(dt,.001,.033),frames=step*60;
 for(let i=0;i<bodies.length;i++){
  const b=bodies[i];
  // Tiny orbit creates sustained living type, not random jitter.
  const dx=(width*.5)-b.x,dy=(height*.50)-b.y;
  b.vx+=(-dy*.00052+dx*.00023)*frames;
  b.vy+=(dx*.00052+dy*.00023)*frames;
  if(field?.active){
    const fx=field.x-b.x,fy=field.y-b.y,d=Math.max(42,Math.hypot(fx,fy));
    const strength=clamp(330/d,.25,5)*.9*(field.repulse?-1:1);
    b.vx+=(fx/d)*strength*frames;b.vy+=(fy/d)*strength*frames;
  }
  b.vx*=Math.pow(.988,frames);b.vy*=Math.pow(.988,frames);
 }
 for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
   const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y;
   const d=Math.hypot(dx,dy),limit=(a.radius+b.radius)*.72;
   if(d<limit){
     const nx=d<.01?Math.cos(i+j*2):dx/d,ny=d<.01?Math.sin(i+j*2):dy/d;
     const push=(limit-Math.max(.01,d))*.034;
     a.vx-=nx*push;b.vx+=nx*push;a.vy-=ny*push;b.vy+=ny*push;
   }
 }
 for(const b of bodies){
  b.vx=clamp(b.vx,-140,140);b.vy=clamp(b.vy,-140,140);
  b.x=clamp(b.x+b.vx*frames,12,Math.max(12,width-12));
  b.y=clamp(b.y+b.vy*frames,12,Math.max(12,height-12));
 }
 return bodies;
}