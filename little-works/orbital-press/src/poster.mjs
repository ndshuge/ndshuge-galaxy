const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const sanitizeText=text=>Array.from(String(text??'').trim().replace(/[\r\n\t<>]/g,' ').replace(/\s+/g,' ')).slice(0,24).join('');
export function normalizePieces(pieces,width,height){
 return pieces.map(p=>({text:sanitizeText(p.text)||'·',x:clamp(p.x/Math.max(1,width),.03,.97),y:clamp(p.y/Math.max(1,height),.03,.97),size:clamp(p.size||56,18,160),rotation:clamp(p.rotation||0,-180,180)}));
}
export function planPoster(pieces,edition){
 return {width:1800,height:2400,pieces:pieces.map(p=>({text:sanitizeText(p.text)||'·',x:clamp(p.x,0,1),y:clamp(p.y,0,1),size:clamp(p.size||56,18,160),rotation:clamp(p.rotation||0,-180,180)})),edition:sanitizeText(edition||'01'),issued:'ORBITAL PRESS / TYPE EXPERIMENT'};
}
function letter(ctx,str,x,y,size,rot,color){
 ctx.save();ctx.translate(x,y);ctx.rotate(rot*Math.PI/180);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
 ctx.font='900 '+size+'px "Noto Serif CJK SC","SimSun","Songti SC",Georgia,serif';
 ctx.fillText(str,0,0,Math.max(250,size*str.length*.88));
 ctx.restore();
}
export function renderPoster(canvas,model){
 const w=model.width,h=model.height;canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas 2D unavailable');
 ctx.fillStyle='#eae7d9';ctx.fillRect(0,0,w,h);
 // Printshop's physical registration marks, not decorative sparkles.
 ctx.strokeStyle='#302b27';ctx.lineWidth=3;
 const m=114;ctx.strokeRect(m,m,w-m*2,h-m*2);
 ctx.fillStyle='#262b28';ctx.fillRect(m,m,w-m*2,30);
 ctx.font='500 33px monospace';ctx.textAlign='left';ctx.fillText('O R B I T A L   /   P R E S S',m+33,206);
 ctx.font='29px monospace';ctx.fillText('印 字  /  无 重 力 活 字 试 验',m+34,266);
 // Ink punch: a bold oversize cylinder impression seen behind the individual letter placements.
 ctx.save();ctx.translate(w*.52,h*.51);ctx.rotate(-.20);
 ctx.strokeStyle='#c55335';ctx.lineWidth=93;ctx.beginPath();ctx.ellipse(0,0,595,740,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#b24c34';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,525,668,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
 ctx.fillStyle='#d5cfc0';ctx.fillRect(m+46,344,w-m*2-92,2);
 ctx.save();ctx.beginPath();ctx.rect(m+22,352,w-m*2-44,1758);ctx.clip();
 for(let i=0;i<model.pieces.length;i++){
 const p=model.pieces[i],x=m+85+p.x*(w-2*m-170),y=370+p.y*1688;
 const scaled=clamp(p.size*2.4,55,380);letter(ctx,p.text,x,y,scaled,p.rotation,i%5===0?'#b94731':'#222723');
 }
 ctx.restore();
 ctx.fillStyle='#252a26';ctx.fillRect(m+32,2110,w-2*m-64,3);
 ctx.font='bold 36px monospace';ctx.textAlign='left';ctx.fillText('NO GRAVITY. ONLY IMPRESSION.',m+32,2182);
 ctx.font='29px monospace';ctx.fillText('\u6bcf\u4e00\u6b21\u843d\u5370\uff0c\u53ea\u5c5e\u4e8e\u8fd9\u4e00\u523b\u3002',m+32,2244);
 ctx.textAlign='right';ctx.fillText('ED. '+model.edition.padStart(2,'0')+'  /  2026',w-m-32,2244);
 return canvas;
}
export function downloadPoster(canvas,filename='orbital-press.png'){
 return new Promise((resolve,reject)=>{
 try{canvas.toBlob(blob=>{
 if(!blob){reject(Error('PNG generation failed'));return;}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
 resolve({bytes:blob.size,type:blob.type});
 },'image/png');}catch(e){reject(e)}
 });
}