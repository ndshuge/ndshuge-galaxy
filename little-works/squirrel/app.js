import {createGlass,createSpring,engine,reducedMotion} from './lib/liquid-glass.js';
const topics={
  climb:{kicker:'THE ART OF MOVEMENT',name:'天生的<br>树冠舞者。',description:'尖锐的爪子帮助它抓住树皮，蓬松的尾巴则在奔跑和跳跃时协助平衡。树枝之间的距离，在它眼里只是下一次起跳的邀请。',count:'01 / 03'},
  store:{kicker:'THE ART OF PREPARATION',name:'把秋天，<br>藏进未来。',description:'松鼠会收集坚果和种子，把食物分散藏在不同地点。那些没有被找回的种子，有时会在土壤里萌发，成为一棵新的树。',count:'02 / 03'},
  talk:{kicker:'THE ART OF CONNECTION',name:'森林里，<br>也有悄悄话。',description:'尾巴的摆动、身体的姿态，还有细微的叫声，都是它表达警觉与交流信息的方式。安静的森林，其实从来不缺对话。',count:'03 / 03'}
};
const tabs=Array.from(document.querySelectorAll('.life-tab'));
function selectTab(tab,focus=false){
  tabs.forEach(t=>{const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1});
  const data=topics[tab.dataset.topic];const panel=document.getElementById('life-panel');
  panel.setAttribute('aria-labelledby',tab.id);
  document.getElementById('life-kicker').textContent=data.kicker;
  document.getElementById('life-name').innerHTML=data.name;
  document.getElementById('life-description').textContent=data.description;
  document.getElementById('life-count').textContent=data.count;
  if(focus)tab.focus();
}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>selectTab(t));t.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next===undefined)return;e.preventDefault();selectTab(tabs[next],true)})});
const io=('IntersectionObserver' in window)&&!reducedMotion.matches?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target)}})},{threshold:.1}):null;
document.querySelectorAll('.intro-grid,.intro-photo-grid,.life-head,.life-layout,.moments-head,.moments-layout,.moments-note').forEach(el=>{if(io){el.classList.add('reveal');io.observe(el)}});
const nav=document.getElementById('navGlass');
const placard=document.getElementById('heroPlacard');
const cardBackdrop=document.getElementById('placardBackdrop');
const photo=document.querySelector('.hero-picture');
const stage=document.querySelector('.hero');
let glasses=[];
try{
  if(!matchMedia('(prefers-reduced-transparency: reduce)').matches){
    glasses.push(createGlass(nav,{mode:'backdrop',fit:true,radius:23,refraction:9,bezel:.34,chroma:.08,specular:.55,blur:0,fallback:'blur(24px) saturate(1.6)'}));
    glasses.push(createGlass(cardBackdrop,{fit:true,radius:21,refraction:16,bezel:.35,chroma:.12,specular:.5}));
    const natural=new Image();natural.src=new URL('./assets/hero.jpg',import.meta.url).href;
    const place=()=>{if(!natural.naturalWidth||!stage.clientWidth)return;
      const SW=stage.clientWidth,SH=stage.clientHeight,PW=placard.offsetWidth,PH=placard.offsetHeight;
      const r=placard.getBoundingClientRect(),s=stage.getBoundingClientRect();
      const x=r.left-s.left,y=r.top-s.top,iw=natural.naturalWidth,ih=natural.naturalHeight;
      const scale=Math.max(SW/iw,SH/ih),w=iw*scale,h=ih*scale;
      const bgX=(SW-w)*.59,bgY=(SH-h)*.41;
      cardBackdrop.style.backgroundSize=w+'px '+h+'px';
      cardBackdrop.style.backgroundPosition=(bgX-x)+'px '+(bgY-y)+'px';
    };
    natural.addEventListener('load',place);window.addEventListener('resize',place,{passive:true});place();
  }
}catch(err){console.warn('Optical glass degraded gracefully:',err)}
document.documentElement.dataset.glassEngine=engine;
const glassAvailable=glasses.length>0;document.documentElement.dataset.glassMounted=String(glassAvailable);
document.querySelectorAll('.pressable').forEach(el=>{
  const spring=createSpring(1,(v)=>el.style.setProperty('--press-scale',String(v)),{stiffness:520,damping:30});
  const start=()=>spring.set(.94);const end=()=>spring.set(1);
  el.addEventListener('pointerdown',start);el.addEventListener('pointerup',end);
  el.addEventListener('pointercancel',end);el.addEventListener('pointerleave',end);
  el.addEventListener('blur',end);el.addEventListener('keyup',end);
});
window.addEventListener('pagehide',()=>{glasses.forEach(glass=>glass.destroy());glasses=[]},{once:true});
