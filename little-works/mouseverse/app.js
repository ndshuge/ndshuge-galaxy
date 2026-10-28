import {toast} from './assets/components.js';
const A='./assets/';
const MICE=[
{id:'harvest',title:'巢鼠',latin:'Micromys minutus',kind:'生活在高草间',category:'wild',habitat:'高草地、芦苇丛',behavior:'攀爬、筑球形巢',diet:'种子、昆虫等',image:'hero-harvest.webp',tag:'草间的建筑师',description:'巢鼠体型非常小，擅长沿着细草茎攀爬。它们会用草叶编织隐蔽的球形巢；灵活的尾巴可以在攀爬时帮助抓握植物。' },
{id:'wood',title:'林姬鼠',latin:'Apodemus sylvaticus',kind:'林地与草地的夜行者',category:'wild',habitat:'林地、灌丛、田边',behavior:'夜间活动、储存食物',diet:'种子、果实、昆虫',image:'wood-mouse.webp',tag:'夜行的探险家',description:'林姬鼠多在黄昏与夜间活跃。大耳朵、敏捷的四肢和细致的环境感知，让它们能够在枝叶与地面之间寻找食物，并为生态系统传播种子。'},
{id:'house',title:'家鼠',latin:'Mus musculus',kind:'人类身边的适应高手',category:'human',habitat:'建筑附近、农田等',behavior:'善于利用缝隙与掩体',diet:'谷物、种子等杂食',image:'house-mouse.webp',tag:'熟悉的陌生邻居',description:'家鼠能在多样的环境中生存，是世界上研究最充分的哺乳动物之一。它们依赖嗅觉、触须与社交信号了解周围环境；野外个体仍应保持距离观察。'},
{id:'deer',title:'鹿鼠',latin:'Peromyscus maniculatus',kind:'北美的林野旅人',category:'wild',habitat:'北美草原、林缘等',behavior:'夜行、敏捷攀爬',diet:'种子、果实、无脊椎动物',image:'deer-mouse.webp',tag:'穿梭草地与林缘',description:'鹿鼠原产北美洲，常有双色尾巴。它们在许多生境中寻找食物，是生态食物网的重要成员。观察野生啮齿动物时，不要直接接触或清理未知巢穴。'}
];
const $=s=>document.querySelector(s);
const all=s=>Array.from(document.querySelectorAll(s));
const safeStorage={get(){try{return JSON.parse(localStorage.getItem('mouseverse:favorites')||'[]')}catch{return []}},set(a){try{localStorage.setItem('mouseverse:favorites',JSON.stringify(a))}catch{}}};
let saved=new Set(safeStorage.get().filter(id=>MICE.some(m=>m.id===id)));
let filter='all';let current=null;let openingButton=null;
const heart='<svg aria-hidden="true"><use href="#ic-heart"/></svg>';
const chevron='<svg aria-hidden="true"><use href="#ic-chevron"/></svg>';
function albumMarkup(m){const active=saved.has(m.id);return `<article class="album" data-id="${m.id}"><button class="album-photo" type="button" data-open="${m.id}" aria-label="认识${m.title}"><img src="${A+m.image}" alt="${m.title}的真实野外或自然观察摄影" loading="lazy" onerror="this.onerror=null;this.src='./assets/wood-mouse.webp'"></button><div class="album-line"><div><h3>${m.title}</h3><p>${m.tag}</p></div><button class="favorite-button" type="button" data-save="${m.id}" aria-pressed="${active}" aria-label="${active?'取消收藏':'收藏'}${m.title}">${heart}</button></div></article>`}
function renderAlbums(){const arr=MICE.filter(m=>filter==='all'||m.category===filter);$('#albumTrack').innerHTML=arr.map(albumMarkup).join('');if(!arr.length)$('#albumTrack').innerHTML='<p>没有符合条件的鼠类。</p>';renderSaved()}
function renderSaved(){const arr=MICE.filter(m=>saved.has(m.id));$('#savedGallery').innerHTML=arr.length?arr.map(albumMarkup).join(''):'<div class="saved-empty"><strong>这里还空着。</strong>在图鉴中轻点爱心，把想再次认识的小家伙收藏起来。</div>';$('#savedCount').textContent=String(arr.length)}
function say(message){try{toast(message,{icon:'check',duration:2400})}catch{const el=document.createElement('div');el.textContent=message;el.style.cssText='position:fixed;top:85px;right:20px;z-index:99;background:#37363b;color:white;padding:12px 18px;border-radius:14px';document.body.appendChild(el);setTimeout(()=>el.remove(),2400)}}
function save(id){if(saved.has(id)){saved.delete(id);say('已移出收藏')}else{saved.add(id);say('已加入收藏')}safeStorage.set([...saved]);renderAlbums();if(current===id)syncDetailSave()}
function syncDetailSave(){const yes=saved.has(current);$('#detailSave').setAttribute('aria-pressed',String(yes));$('#detailSave span').textContent=yes?'已收藏 · 点击移除':'加入收藏'}
function openDetail(id,btn){const m=MICE.find(x=>x.id===id);if(!m)return;current=id;openingButton=btn||document.activeElement;$('#detailImage').src=A+m.image;$('#detailImage').onerror=function(){this.onerror=null;this.src=A+'wood-mouse.webp'};$('#detailImage').alt=m.title+'的摄影图片';$('#detailKind').textContent=m.kind;$('#detailTitle').textContent=m.title;$('#detailLatin').textContent=m.latin;$('#detailDescription').textContent=m.description;$('#detailProperties').innerHTML=[['栖息环境',m.habitat],['常见习性',m.behavior],['食物偏好',m.diet],['科学名称',m.latin]].map(([k,v])=>`<div class="property"><small>${k}</small><strong>${v}</strong></div>`).join('');syncDetailSave();if($('#searchDialog').open)$('#searchDialog').close();const d=$('#detailDialog');if(!d.open)d.showModal();requestAnimationFrame(()=>d.classList.add('is-visible'));$('#closeDetail').focus({preventScroll:true})}
function closeDetail(){const d=$('#detailDialog');d.classList.remove('is-visible');const finish=()=>{if(d.open)d.close();openingButton?.focus?.({preventScroll:true})};if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setTimeout(finish,250)}
$('#closeDetail').addEventListener('click',closeDetail);$('#detailDialog').addEventListener('click',e=>{if(e.target.id==='detailDialog')closeDetail()});$('#detailDialog').addEventListener('cancel',e=>{e.preventDefault();closeDetail()});$('#detailSave').addEventListener('click',()=>current&&save(current));
document.addEventListener('click',e=>{const s=e.target.closest('[data-save]');if(s){save(s.dataset.save);return}const o=e.target.closest('[data-open]');if(o){openDetail(o.dataset.open,o);return}const n=e.target.closest('[data-nav]');if(n){navigate(n.dataset.nav);return}});
function navigate(target){all('[data-nav]').forEach(el=>{const on=el.dataset.nav===target;el.classList.toggle('active',on);el.classList.toggle('selected',on)});const id=target==='discover'?'discover':target==='saved'?'saved':'home';document.getElementById(id).scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}
$('#randomMouse').addEventListener('click',e=>openDetail(MICE[Math.floor(Math.random()*MICE.length)].id,e.currentTarget));
$('#scrollRight').addEventListener('click',()=>$('#albumTrack').scrollBy({left:Math.round($('#albumTrack').clientWidth*.7),behavior:'smooth'}));
$('#albumTrack').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();$('#albumTrack').scrollBy({left:260*(e.key==='ArrowRight'?1:-1),behavior:'smooth'})}});
$('#typeFilter').addEventListener('change',e=>{filter=e.detail?.value||e.target.value||'all';renderAlbums()});
const ftext={whiskers:'触须感知',smell:'气味地图',hearing:'超声交流'};
all('[data-fact]').forEach(btn=>btn.addEventListener('click',()=>{all('[data-fact]').forEach(el=>{const yes=el===btn;el.classList.toggle('selected',yes);el.setAttribute('aria-pressed',String(yes))});$('#factOrb').dataset.state=btn.dataset.fact;$('#factLabel').textContent=ftext[btn.dataset.fact]}));
function updateSearch(){const q=$('#searchInput').value.trim().toLowerCase();const arr=MICE.filter(m=>[m.title,m.latin,m.habitat,m.behavior,m.tag,m.description].join(' ').toLowerCase().includes(q));$('#searchResults').innerHTML=arr.length?arr.map(m=>`<button type="button" class="search-result" data-open="${m.id}"><img src="${A+m.image}" alt=""><span><strong>${m.title}</strong><small>${m.latin} · ${m.habitat}</small></span>${chevron}</button>`).join(''):'<p class="search-empty">没有找到相关的老鼠，换个关键词试试。</p>'}
$('#searchTrigger').addEventListener('click',()=>{$('#searchDialog').showModal();$('#searchInput').value='';updateSearch();$('#searchInput').focus()});
$('#searchInput').addEventListener('input',updateSearch);
$('#searchResults').addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b){e.preventDefault();openDetail(b.dataset.open,$('#searchTrigger'))}});
all('.favorite-button').forEach(b=>b.addEventListener('pointerdown',()=>{}));
renderAlbums();renderSaved();updateSearch();
// One-time compositor-friendly section entrance; no endless rAF or viewport-size blur.
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  const sections=all('.collection .section-heading,.collection lg-segmented,.editorial,.knowledge .section-heading,.fact-layout,.saved-section .section-heading,.saved-gallery');
  const obs=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){e.target.classList.add('is-visible');obs.unobserve(e.target)}}},{threshold:.06,rootMargin:'0px 0px 35px 0px'});
  sections.forEach((el,i)=>{el.classList.add('reveal');obs.observe(el)});
  document.documentElement.classList.add('motion-ready');
}
