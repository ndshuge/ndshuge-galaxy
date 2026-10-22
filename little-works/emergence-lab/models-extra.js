/* Emergence Lab II: seven additional original teaching models. No dependencies. */
(()=>{'use strict';
const cw=800,ch=450,TAU2=Math.PI*2;
const cap=(v,a,b)=>Math.max(a,Math.min(b,v));
const rv=(w,a,b)=>a+w.rng()*(b-a), ri=(w,n)=>Math.floor(w.rng()*n);
const MODS={
boids:{name:'自组织鸟群',kicker:'08 / COLLECTIVE MOTION',intro:'每一只鸟只遵守三条规则：避让、对齐、靠拢。',gesture:'↖ 点击召集鸟群',head:'每只鸟只看附近，\n整群却像一个生命。',body:'Boids：分离防止撞车式拥挤；对齐让邻居的方向趋同；凝聚让离散个体回到群体。没有领队，也没有全局路径。',
tags:['Boids','群集行为','局部邻域'],try:'降低凝聚、提高对齐，观察群体会分散还是形成平行飞行的队伍。',
params:[['align','方向对齐',0,2.2,1.05,.05,'提高使邻居飞行方向更一致'],['cohere','向群体靠拢',0,1.8,.55,.05,'提高促使局部小群抱团'],['separate','避免拥挤',.1,2.8,1.35,.05,'提高可减少挤成一团'],['reach','观察半径',25,105,58,1,'每只鸟能看到多远']]},
reaction:{name:'化学花纹',kicker:'09 / REACTION DIFFUSION',intro:'两种物质一边反应一边扩散，斑点与迷宫自行生长。',gesture:'↖ 点击注入反应物 B',head:'无须绘画者，\n化学反应也会作画。',body:'简化 Gray–Scott 模型：A 与 B 在格子间扩散，同时 A + 2B → 3B，B 又逐渐被移除。两个小概率参数就能让均匀混合物长出不同花纹。',
tags:['Gray–Scott','图灵式花纹','反应扩散'],try:'让补给率保持接近 0.036，逐步改变清除率，寻找斑点与条纹。',
params:[['feed','物质 A 补给率',.018,.08,.036,.001,'持续为反应补充 A'],['kill','物质 B 清除率',.045,.075,.060,.001,'越高，B 越难维持'],['diff','扩散强度',.4,1.6,1,.05,'控制物质互相扩散的快慢']]},
life:{name:'生命游戏',kicker:'10 / CELLULAR AUTOMATA',intro:'活细胞和空格，只通过八邻居决定下一代。',gesture:'↖ 点击绘制活细胞',head:'几条生死规则，\n就能让图案自己移动。',body:'康威生命游戏及其简单规则变体：默认活细胞拥有 2 或 3 个邻居便继续存活；空格拥有恰好 3 个邻居便出生。调整门槛探索振荡与滑翔结构。',
tags:['康威生命游戏','细胞自动机','离散动力学'],try:'先使用标准 B3/S23，再把出生邻居数调到 4：原先活跃的区域会怎样？',
params:[['birth','出生邻居数',2,5,3,1,'空格有恰好这个数量的活邻居时出生'],['surviveLo','存活下限',1,4,2,1,'活细胞至少需要这么多邻居'],['surviveHi','存活上限',2,6,3,1,'活细胞最多容忍这么多邻居'],['density','初始生命密度',.10,.43,.25,.01,'更改后重置生效']]},
crystal:{name:'分形结晶',kicker:'11 / DIFFUSION LIMITED AGGREGATION',intro:'游走粒子只要接触到晶核，就有机会粘住。',gesture:'↖ 点击放入新晶核',head:'随机漫步的人群，\n竟然长出分形树。',body:'简化 DLA：游离粒子在网格中随机游走，靠近已有晶体时以一定概率粘附。新结晶又成为下一次的生长边界，形成由局部接触积累而成的枝杈。',
tags:['DLA','随机游走','分形生长'],try:'让黏附概率从 0.2 提高到 0.95，比较晶体枝条是否更密。',
params:[['stick','黏附概率',.1,1,.73,.05,'接触晶体后粘住的机会'],['walkers','游走粒子',15,110,64,5,'更改后重置生效'],['activity','生长尝试',80,900,480,20,'每帧做多少次随机走动']]},
forest:{name:'森林火灾',kicker:'12 / EXCITABLE ECOSYSTEM',intro:'树会长、火会传、灰烬会恢复；一团火能变成一道火线。',gesture:'↖ 点击点燃附近树木',head:'每棵树只看邻居，\n一场大火却能横扫森林。',body:'简化森林火灾自动机：着火树在下一步烧尽，邻近树有概率被点燃；空地随机再生新树，偶尔有独立闪电。不同再生速度会改变大火的间隔和规模。',
tags:['森林火灾模型','临界状态','波前传播'],try:'降低再生率，观察大火之后是否出现长期分割的空白带。',
params:[['spread','火势蔓延概率',.15,1,.69,.05,'火传到邻树的机会'],['regrow','树木再生率',.002,.10,.028,.002,'空地重新长树的速度'],['lightning','随机闪电率',0,.002,.00025,.00005,'没有邻火也可能自己点燃']]},
ants:{name:'蚂蚁觅食',kicker:'13 / COLLECTIVE FORAGING',intro:'找到食物的蚂蚁回家时留气味，同伴便逐渐走出路线。',gesture:'↖ 点击添加食物堆',head:'没谁知道最短路，\n小小气味却能引路。',body:'一种简化的蚁群寻食模型：出巢蚂蚁探索时探测回程蚂蚁留下的气味；找到食物后向巢穴返回并沿途留信号。路径不断增强，同时挥发消失。',
tags:['蚁群优化启发','正反馈','气味挥发'],try:'逐渐调高挥发率，观察路径是保持清晰，还是需要不断重新探索。',
params:[['wander','探索随机性',.06,1,.46,.05,'不确定方向时的游走幅度'],['follow','气味追随强度',.2,3,1.5,.1,'对气味较浓方向的偏爱'],['evap','气味挥发率',.005,.22,.045,.005,'气味每步损失的比例']]},
traffic:{name:'幽灵堵车',kicker:'14 / STOP AND GO WAVES',intro:'封闭环路没有红灯，却可能出现倒退的堵车波。',gesture:'↖ 点击一辆车附近制造轻微刹车',head:'没有事故，\n车流也会自己堵住。',body:'环形单车道简化跟驰模型：每辆车只根据前车车距加速或刹车；偶尔的小幅随机减速可能放大，并以停停走走的车流波向后传播。',
tags:['跟驰模型','自发拥堵','停止-启动波'],try:'让车辆密度不变，提升随机刹车概率。速度低谷会不会向后传播？',
params:[['reaction','车距敏感度',.2,1.8,.95,.05,'遇到前车时有多谨慎'],['brake','随机刹车率',0,.18,.035,.005,'小扰动发生的概率'],['maxSpeed','期望车速',2,9,6,.5,'无车挡路时的最高移动速度'],['cars','道路车辆数',35,150,95,5,'更改后重置生效']]}
};
Object.assign(MODES,MODS);
const originalWorld=newWorld;
newWorld=function(which){
 const w=originalWorld(which);if(!MODS[mode]||!Object.prototype.hasOwnProperty.call(MODS,mode))return w;
 const p=(k)=>value(w,k);
 if(mode==='boids'){w.points=[];for(let i=0;i<185;i++){const a=rv(w,0,TAU2);w.points.push({x:rv(w,20,cw-20),y:rv(w,20,ch-20),vx:Math.cos(a)*1.7,vy:Math.sin(a)*1.7})}}
 if(mode==='reaction'){w.w=144;w.h=82;const n=w.w*w.h;w.ca=new Float32Array(n).fill(1);w.cb=new Float32Array(n);w.na=new Float32Array(n);w.nb=new Float32Array(n);for(let j=0;j<16;j++){let x=ri(w,w.w-20)+10,y=ri(w,w.h-20)+10;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const i=(y+dy)*w.w+x+dx;w.cb[i]=rv(w,.72,.98);w.ca[i]=rv(w,.1,.38)}}w.points=[{x:0}]}
 if(mode==='life'){w.w=120;w.h=68;w.cells=new Uint8Array(w.w*w.h);w.next=new Uint8Array(w.cells.length);for(let i=0;i<w.cells.length;i++)w.cells[i]=w.rng()<p('density')?1:0;w.points=[{x:0}]}
 if(mode==='crystal'){w.w=160;w.h=90;w.cells=new Uint8Array(w.w*w.h);w.points=[];let x=w.w>>1,y=w.h>>1;w.cells[y*w.w+x]=1;w.radius=2;for(let i=0;i<p('walkers');i++)w.points.push({x:ri(w,w.w),y:ri(w,w.h)});w.mass=1;}
 if(mode==='forest'){w.w=132;w.h=75;w.cells=new Uint8Array(w.w*w.h);w.next=new Uint8Array(w.cells.length);for(let i=0;i<w.cells.length;i++)w.cells[i]=w.rng()<.7?1:0;for(let i=0;i<90;i++)w.cells[ri(w,w.cells.length)]=2;w.points=[{x:0}];}
 if(mode==='ants'){w.w=160;w.h=90;w.smell=new Float32Array(w.w*w.h);w.buffer=new Float32Array(w.smell.length);w.nest={x:cw/2,y:ch/2};w.food=[{x:120,y:100,n:120},{x:700,y:105,n:130},{x:160,y:355,n:110},{x:635,y:365,n:140}];w.delivered=0;w.points=[];for(let i=0;i<220;i++)w.points.push({x:w.nest.x+rv(w,-9,9),y:w.nest.y+rv(w,-9,9),angle:rv(w,0,TAU2),load:false});}
 if(mode==='traffic'){w.points=[];const n=p('cars'),track=1400;for(let i=0;i<n;i++)w.points.push({pos:(i*track/n+rv(w,-1,1)+track)%track,v:rv(w,2,4.8),brake:0});w.track=track;}
 return w;
};
const evolve={
boids(w){const list=w.points,n=list.length,p=k=>value(w,k),r=p('reach'),r2=r*r,old=list.map(a=>({...a}));let meanSpeed=0;
for(let i=0;i<n;i++){const b=old[i];let count=0,avx=0,avy=0,cx=0,cy=0,sx=0,sy=0;
for(let j=0;j<n;j++){if(i===j)continue;const a=old[j];let dx=a.x-b.x,dy=a.y-b.y;if(dx>cw/2)dx-=cw;if(dx<-cw/2)dx+=cw;if(dy>ch/2)dy-=ch;if(dy<-ch/2)dy+=ch;const d2=dx*dx+dy*dy;if(d2>r2||d2<1)continue;count++;avx+=a.vx;avy+=a.vy;cx+=dx;cy+=dy;if(d2<625){sx-=dx/(d2+1);sy-=dy/(d2+1)}}
let vx=b.vx,vy=b.vy;if(count){vx+=(avx/count-b.vx)*p('align')*.052+cx/count*p('cohere')*.014+sx*p('separate')*.8;vy+=(avy/count-b.vy)*p('align')*.052+cy/count*p('cohere')*.014+sy*p('separate')*.8;}
const d=Math.hypot(vx,vy)||1,s=cap(d,.9,2.9);vx=vx/d*s;vy=vy/d*s;list[i].vx=vx;list[i].vy=vy;list[i].x=(b.x+vx+cw)%cw;list[i].y=(b.y+vy+ch)%ch;meanSpeed+=s;}
w.metric=meanSpeed/n;},
reaction(w){const ww=w.w,hh=w.h,feed=value(w,'feed'),kill=value(w,'kill'),d=value(w,'diff');for(let z=0;z<2;z++){const a=w.ca,b=w.cb,na=w.na,nb=w.nb;for(let y=1;y<hh-1;y++)for(let x=1;x<ww-1;x++){const i=y*ww+x,A=a[i],B=b[i],reaction=A*B*B;const la=a[i-1]+a[i+1]+a[i-ww]+a[i+ww]-4*A,lb=b[i-1]+b[i+1]+b[i-ww]+b[i+ww]-4*B;na[i]=cap(A+d*.17*la-reaction+feed*(1-A),0,1);nb[i]=cap(B+d*.085*lb+reaction-(kill+feed)*B,0,1)}
for(let x=0;x<ww;x++){const top=x,bot=(hh-1)*ww+x;na[top]=a[top];nb[top]=b[top];na[bot]=a[bot];nb[bot]=b[bot]}for(let y=0;y<hh;y++){const lo=y*ww,hi=lo+ww-1;na[lo]=a[lo];nb[lo]=b[lo];na[hi]=a[hi];nb[hi]=b[hi]}w.ca=na;w.cb=nb;w.na=a;w.nb=b;}
let sum=0;for(let i=0;i<w.cb.length;i+=7)sum+=w.cb[i];w.metric=sum/(w.cb.length/7);},
life(w){const a=w.cells,b=w.next,ww=w.w,hh=w.h,birth=value(w,'birth'),lo=Math.min(value(w,'surviveLo'),value(w,'surviveHi')),hi=Math.max(value(w,'surviveLo'),value(w,'surviveHi'));let alive=0;
for(let y=0;y<hh;y++)for(let x=0;x<ww;x++){let cnt=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;cnt+=a[((y+dy+hh)%hh)*ww+(x+dx+ww)%ww]}const i=y*ww+x;b[i]=a[i]?(cnt>=lo&&cnt<=hi?1:0):(cnt===birth?1:0);alive+=b[i]}w.next=a;w.cells=b;w.metric=alive;},
crystal(w){const g=w.cells,ww=w.w,hh=w.h,centerX=ww>>1,centerY=hh>>1;const chance=value(w,'stick');let stuck=0;for(let z=0;z<value(w,'activity');z++){const a=w.points[ri(w,w.points.length)],step=ri(w,4);a.x=cap(a.x+(step===0?1:step===1?-1:0),1,ww-2);a.y=cap(a.y+(step===2?1:step===3?-1:0),1,hh-2);const i=a.y*ww+a.x;if(g[i])continue;let neighbor=g[i-1]||g[i+1]||g[i-ww]||g[i+ww];if(neighbor&&w.rng()<chance){g[i]=1;w.mass++;stuck++;const radius=Math.hypot(a.x-centerX,a.y-centerY);w.radius=Math.max(w.radius,radius);const angle=rv(w,0,TAU2),outer=Math.min(Math.min(ww,hh)*.49,w.radius+8);a.x=cap(Math.floor(centerX+Math.cos(angle)*outer),1,ww-2);a.y=cap(Math.floor(centerY+Math.sin(angle)*outer),1,hh-2)}else if(w.rng()<.007||Math.hypot(a.x-centerX,a.y-centerY)>w.radius+17){const theta=rv(w,0,TAU2),radius=Math.min(hh*.46,w.radius+6);a.x=cap(Math.floor(centerX+Math.cos(theta)*radius),1,ww-2);a.y=cap(Math.floor(centerY+Math.sin(theta)*radius),1,hh-2)}}w.metric=w.mass;},
forest(w){const ww=w.w,hh=w.h,g=w.cells,b=w.next,pSpread=value(w,'spread'),regrow=value(w,'regrow'),lightning=value(w,'lightning');let burning=0;for(let y=0;y<hh;y++)for(let x=0;x<ww;x++){const i=y*ww+x,v=g[i];if(v===2){b[i]=0;continue}if(v===0){b[i]=w.rng()<regrow?1:0;continue}let around=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let xx=x+dx,yy=y+dy;if(xx>=0&&xx<ww&&yy>=0&&yy<hh&&g[yy*ww+xx]===2)around++}let burn=w.rng()<(around?1-Math.pow(1-pSpread,around):lightning);b[i]=burn?2:1;if(burn)burning++}w.next=g;w.cells=b;w.metric=burning;},
ants(w){const gw=w.w,gh=w.h,sm=w.smell,buf=w.buffer,p=k=>value(w,k);
const sample=(x,y,a)=>{const xx=cap(Math.floor((x+Math.cos(a)*14)/5),0,gw-1),yy=cap(Math.floor((y+Math.sin(a)*14)/5),0,gh-1);return sm[yy*gw+xx]};
for(const a of w.points){if(a.load){a.angle=Math.atan2(w.nest.y-a.y,w.nest.x-a.x)+rv(w,-.22,.22);const k=cap(Math.floor(a.y/5),0,gh-1)*gw+cap(Math.floor(a.x/5),0,gw-1);sm[k]=Math.min(22,sm[k]+2.8);if(Math.hypot(a.x-w.nest.x,a.y-w.nest.y)<16){w.delivered++;a.load=false;a.angle=rv(w,0,TAU2);}}else{const l=sample(a.x,a.y,a.angle-.6),f=sample(a.x,a.y,a.angle),r=sample(a.x,a.y,a.angle+.6);if(l>f&&l>r)a.angle-=.20*p('follow');else if(r>f&&r>l)a.angle+=.20*p('follow');a.angle+=rv(w,-.32,.32)*p('wander');for(const f of w.food){if(f.n>0&&Math.hypot(a.x-f.x,a.y-f.y)<16){f.n--;a.load=true;break}}}
a.x+=Math.cos(a.angle)*2.9;a.y+=Math.sin(a.angle)*2.9;if(a.x<2||a.x>cw-2||a.y<2||a.y>ch-2){a.x=cap(a.x,3,cw-3);a.y=cap(a.y,3,ch-3);a.angle+=Math.PI*.75}}
for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){const k=y*gw+x;buf[k]=(sm[k]*.55+(sm[k-1]+sm[k+1]+sm[k-gw]+sm[k+gw])*.1125)*(1-p('evap'))}w.smell=buf;w.buffer=sm;w.metric=w.delivered;},
traffic(w){const cars=w.points,L=w.track,p=k=>value(w,k);cars.sort((a,b)=>a.pos-b.pos);let total=0,stopped=0;const gaps=cars.map((a,i)=>((cars[(i+1)%cars.length].pos-a.pos+L)%L));for(let i=0;i<cars.length;i++){const a=cars[i],gap=gaps[i],safe=5+p('reaction')*a.v*1.7;if(w.rng()<p('brake'))a.v=Math.max(0,a.v-rv(w,.5,2.2));else a.v=Math.min(p('maxSpeed'),a.v+.2);a.v=Math.min(a.v,Math.max(0,(gap-safe)*.9));if(a.v<1.25)stopped++;total+=a.v;}for(const a of cars)a.pos=(a.pos+a.v)%L;w.metric=total/cars.length;w.stopped=stopped;}
};
Object.assign(steppers,evolve);
function colorGrid(ctx,w,palette,data){const ww=w.w,hh=w.h;if(!w.off){w.off=document.createElement('canvas');w.off.width=ww;w.off.height=hh;w.offCtx=w.off.getContext('2d',{alpha:false});w.offImg=w.offCtx.createImageData(ww,hh)}const im=w.offImg;for(let i=0;i<data.length;i++){const rgb=palette[data[i]]||palette[0],j=i*4;im.data[j]=rgb[0];im.data[j+1]=rgb[1];im.data[j+2]=rgb[2];im.data[j+3]=255}w.offCtx.putImageData(im,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(w.off,0,0,cw,ch);ctx.imageSmoothingEnabled=true;}
function renderNew(w,canvas){
 const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#071422';ctx.fillRect(0,0,cw,ch);ctx.lineWidth=1;ctx.strokeStyle='#ffffff08';
 for(let x=0;x<=cw;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ch);ctx.stroke()}for(let y=0;y<=ch;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cw,y);ctx.stroke()}
 if(mode==='boids'){for(const a of w.points){const len=Math.hypot(a.vx,a.vy),dx=a.vx/len,dy=a.vy/len;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle='#9cebdc';ctx.shadowColor='#9cebdc';ctx.shadowBlur=7;ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-3.5);ctx.lineTo(-3,0);ctx.lineTo(-5,3.5);ctx.closePath();ctx.fill();ctx.restore()}}
 if(mode==='reaction'){if(!w.off){w.off=document.createElement('canvas');w.off.width=w.w;w.off.height=w.h;w.offCtx=w.off.getContext('2d',{alpha:false});w.offImg=w.offCtx.createImageData(w.w,w.h)}const im=w.offImg;for(let i=0;i<w.cb.length;i++){let v=cap(w.cb[i]*3,0,1),a=w.ca[i],k=i*4;im.data[k]=Math.round(8+v*210);im.data[k+1]=Math.round(19+v*165+a*5);im.data[k+2]=Math.round(34+(1-v)*60+v*64);im.data[k+3]=255;}w.offCtx.putImageData(im,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(w.off,0,0,cw,ch);}
 if(mode==='life')colorGrid(ctx,w,[[6,19,32],[129,235,208]],w.cells);
 if(mode==='crystal'){colorGrid(ctx,w,[[6,18,33],[129,209,242]],w.cells);ctx.shadowColor='#8edbef';ctx.shadowBlur=25;ctx.fillStyle='#ecf8fc';ctx.beginPath();ctx.arc(cw/2,ch/2,5,0,TAU2);ctx.fill();ctx.shadowBlur=0;for(const a of w.points){ctx.fillStyle='#f6c98d7e';ctx.fillRect(a.x*cw/w.w,a.y*ch/w.h,2,2)}}
 if(mode==='forest')colorGrid(ctx,w,[[16,29,42],[69,149,106],[251,134,84]],w.cells);
 if(mode==='ants'){if(!w.off){w.off=document.createElement('canvas');w.off.width=w.w;w.off.height=w.h;w.offCtx=w.off.getContext('2d',{alpha:false});w.offImg=w.offCtx.createImageData(w.w,w.h)}const im=w.offImg;for(let i=0;i<w.smell.length;i++){let v=cap(w.smell[i]/6,0,1),k=i*4;im.data[k]=Math.floor(7+v*20);im.data[k+1]=Math.floor(20+v*131);im.data[k+2]=Math.floor(35+v*110);im.data[k+3]=255}w.offCtx.putImageData(im,0,0);ctx.drawImage(w.off,0,0,cw,ch);ctx.fillStyle='#f5bd83';for(const food of w.food)if(food.n>0){ctx.beginPath();ctx.arc(food.x,food.y,8+Math.sqrt(food.n),0,TAU2);ctx.globalAlpha=.6;ctx.fill();ctx.globalAlpha=1;}ctx.fillStyle='#a9f1dd';ctx.beginPath();ctx.arc(w.nest.x,w.nest.y,14,0,TAU2);ctx.fill();for(const a of w.points){ctx.fillStyle=a.load?'#f4dcad':'#a3e1e3';ctx.fillRect(a.x,a.y,2.5,2.5)}}
 if(mode==='traffic'){ctx.fillStyle='#152b39';ctx.beginPath();ctx.ellipse(400,225,318,173,0,0,TAU2);ctx.fill();ctx.fillStyle='#071422';ctx.beginPath();ctx.ellipse(400,225,251,107,0,0,TAU2);ctx.fill();ctx.strokeStyle='#a6ccd350';ctx.setLineDash([13,16]);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(400,225,285,140,0,0,TAU2);ctx.stroke();ctx.setLineDash([]);for(const a of w.points){const ang=a.pos/w.track*TAU2,x=400+285*Math.cos(ang),y=225+140*Math.sin(ang);ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(140*Math.cos(ang),-285*Math.sin(ang)));ctx.fillStyle=a.v<1.5?'#ff8f97':a.v<3.2?'#f1c782':'#a8e9d3';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=5;ctx.fillRect(-6,-3,12,6);ctx.restore();}ctx.font='12px ui-monospace,Consolas';ctx.textAlign='center';ctx.fillStyle='#94bdc1';ctx.fillText('STOP · AND · GO',400,226);}
}
const oldDraw=draw;draw=function(w,canvas){if(MODS[mode])return renderNew(w,canvas);return oldDraw(w,canvas);};
const oldMetrics=metrics;metrics=function(){if(!MODS[mode])return oldMetrics();if(!worldA)return;const w=worldA;let entries=[],v=w.metric||0;
switch(mode){case'boids':entries=[['鸟群个体',w.points.length],['平均速度',v.toFixed(2)],['演化步数',w.age]];break;
case'reaction':entries=[['平均 B 浓度',v.toFixed(3)],['网格数量',w.w*w.h],['反应步数',w.age]];break;
case'life':entries=[['活细胞',v],['覆盖率',(v/w.cells.length*100).toFixed(1)+'%'],['代数',w.age]];break;
case'crystal':entries=[['晶体像素',w.mass],['生长半径',w.radius.toFixed(1)],['游走粒子',w.points.length]];break;
case'forest':entries=[['燃烧树木',v],['森林覆盖',w.cells.reduce((s,a)=>s+(a===1),0)],['演化步数',w.age]];break;
case'ants':entries=[['带回食物',w.delivered],['出巢蚂蚁',w.points.length],['剩余食物',w.food.reduce((s,f)=>s+f.n,0)]];break;
case'traffic':entries=[['平均车速',v.toFixed(2)],['低速车辆',w.stopped||0],['车辆总数',w.points.length]];break;}
const host=$('metrics');host.replaceChildren(...entries.map(([k,v])=>{const row=document.createElement('div');row.className='metric';const a=document.createElement('span'),b=document.createElement('strong');a.textContent=k;b.textContent=v;row.append(a,b);return row;}));$('count').textContent=(mode==='traffic'?w.points.length:mode==='boids'||mode==='ants'?w.points.length:w.w*w.h)+' 个体 / 格点';metricTrail.push(Number(w.metric)||0);if(metricTrail.length>100)metricTrail.shift();
const c=$('spark'),ctx=c.getContext('2d'),width=c.width,height=c.height;ctx.fillStyle='#0d1e30';ctx.fillRect(0,0,width,height);let min=Math.min(...metricTrail),max=Math.max(...metricTrail);ctx.beginPath();metricTrail.forEach((n,i)=>{let x=i/(Math.max(99,metricTrail.length-1))*width,y=height-9-(n-min)/(max-min||1)*(height-18);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)});ctx.lineWidth=2;ctx.strokeStyle='#95e3d4';ctx.stroke();
};
const oldInteract=interact;interact=function(e,canvas){if(!MODS[mode])return oldInteract(e,canvas);const rect=canvas.getBoundingClientRect(),x=cap((e.clientX-rect.left)/rect.width*cw,0,cw-1),y=cap((e.clientY-rect.top)/rect.height*ch,0,ch-1),w=canvas===$('a')?worldA:worldB;if(!w)return;
if(mode==='boids'){for(let j=0;j<16;j++){const a=rv(w,0,TAU2);w.points.push({x:cap(x+rv(w,-25,25),0,cw),y:cap(y+rv(w,-25,25),0,ch),vx:Math.cos(a),vy:Math.sin(a)})}if(w.points.length>400)w.points.splice(0,16);}
if(mode==='reaction'){const gx=Math.floor(x/cw*w.w),gy=Math.floor(y/ch*w.h);for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){let xx=gx+dx,yy=gy+dy;if(xx<2||yy<2||xx>=w.w-2||yy>=w.h-2||dx*dx+dy*dy>16)continue;const k=yy*w.w+xx;w.ca[k]=.14;w.cb[k]=.95;}}
if(mode==='life'||mode==='forest'){let gx=Math.floor(x/cw*w.w),gy=Math.floor(y/ch*w.h);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){let xx=gx+dx,yy=gy+dy;if(xx<0||yy<0||xx>=w.w||yy>=w.h||dx*dx+dy*dy>5)continue;w.cells[yy*w.w+xx]=mode==='forest'?2:1;}}
if(mode==='crystal'){let gx=Math.floor(x/cw*w.w),gy=Math.floor(y/ch*w.h);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let xx=gx+dx,yy=gy+dy;if(xx>0&&yy>0&&xx<w.w-1&&yy<w.h-1){w.cells[yy*w.w+xx]=1;w.radius=Math.max(w.radius,Math.hypot(xx-w.w/2,yy-w.h/2))}}}
if(mode==='ants'){if(w.food.length>12)w.food.shift();w.food.push({x,y,n:100})}
if(mode==='traffic'){const angle=Math.atan2((y-225)/140,(x-400)/285),position=((angle+TAU2)%TAU2)/TAU2*w.track;for(const a of w.points){let d=Math.abs(a.pos-position);d=Math.min(d,w.track-d);if(d<45)a.v=.1;}}
};
})();