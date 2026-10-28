/**
 * R2.4 opt-in, speed-driven NAVIGATION lens contour.
 * Extends (not replaces) the installed liquidglass.dev distance-field optics.
 *
 * The local positive dent near the center creates the brief Apple-like neck
 * between neighboring icons; directional phase makes its upper and lower rim
 * deform asymmetrically. Zero energy is EXACTLY the original round rectangle.
 */
export function fluidSignedDistance(x,y,width,height,radius,energy=0,direction=0) {
  const hw=width/2,hh=height/2;
  const r=Math.max(0,Math.min(radius,hw,hh));
  const ax=Math.abs(x),ay=Math.abs(y);
  const qx=ax-(hw-r),qy=ay-(hh-r);
  const d=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
  if(energy<=0)return d;
  const u=Math.max(-1,Math.min(1,x/hw));
  const envelope=Math.pow(Math.max(0,1-u*u),1.1);
  // A liquid connection between the previous and next tab; no random jitter.
  const bridge=Math.exp(-Math.pow((u+direction*.08)/.29,2));
  const upper=(y<0?1:-1)*direction;
  const ripple=3.2+6.1*bridge+1.7*Math.sin((u*2.2+upper*.16)*Math.PI);
  return d+energy*envelope*Math.max(.4,ripple)*Math.pow(Math.min(1,ay/hh),2.2);
}

// Trace the SAME signed distance into a CSS polygon for the visible shadow.
// 72 points is sub-pixel accurate at the typical 390px iPhone viewport.
export function fluidClipPolygon(width,height,radius,energy,direction,steps=48){
  if(!(energy>0))return '';
  const hw=width/2,hh=height/2,upper=[];
  for(let i=0;i<=steps;i++){
    const x=-hw+(i/steps)*width;
    let lo=0,hi=hh;
    if(fluidSignedDistance(x,0,width,height,radius,energy,direction)>0){hi=0;}
    else for(let iter=0;iter<13;iter++){
      const mid=(lo+hi)/2;
      if(fluidSignedDistance(x,mid,width,height,radius,energy,direction)<=0)lo=mid;
      else hi=mid;
    }
    upper.push([x+hw,hh-lo]);
  }
  const bottom=[];
  for(let i=steps;i>=0;i--){
    const x=-hw+(i/steps)*width;
    let lo=0,hi=hh;
    if(fluidSignedDistance(x,0,width,height,radius,energy,direction)>0)hi=0;
    else for(let iter=0;iter<13;iter++){
      const mid=(lo+hi)/2;
      if(fluidSignedDistance(x,-mid,width,height,radius,energy,direction)<=0)lo=mid;
      else hi=mid;
    }
    bottom.push([x+hw,hh+lo]);
  }
  return 'polygon('+[...upper,...bottom].map(([x,y])=>x.toFixed(2)+'px '+y.toFixed(2)+'px').join(',')+')';
}
