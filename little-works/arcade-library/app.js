'use strict';
const BASE='https://ndshuge.github.io/ndshuge-game/games/';
const GAMES=[
{id:'lumen-siege',name:'光核围城',en:'LUMEN SIEGE',group:'动作',tags:['动作','生存','像素'],desc:'在光与暗交错的战场里，一边躲避不断涌来的敌人，一边进化你的武器。每一局都是新的生存挑战。',device:'键盘体验更完整'},
{id:'still',name:'凝时 STILL',en:'STILL',group:'动作',tags:['动作','时间','弹幕'],desc:'按下时间的暂停键，在密集弹幕间寻找唯一的破局路线。快与慢，在你的手中交换。'},
{id:'gravity-garden',name:'重力花园',en:'GRAVITY GARDEN',group:'实验',tags:['实验','物理','沙盒'],desc:'给物体一点力量，让它们自由碰撞、旋转、飞行。在这座小小的物理花园里，玩出你的宇宙。'},
{id:'vocalon-chaos',name:'VOCALON!',en:'BEAT REVOLUTION',group:'节奏',tags:['节奏','音乐','音游'],desc:'跟着节拍进入绚烂的音游世界，用反应和节奏感完成一场小型舞台演出。'},
{id:'pulse-breaker',name:'脉冲破界',en:'PULSE // BREAKER',group:'动作',tags:['动作','节奏','Roguelite'],desc:'战斗跟着脉冲推进。一次次闯入危险区域，在节奏与行动之间找准突破口。'},
{id:'belfry',name:'钟楼契约',en:'BELL & BOND',group:'冒险',tags:['冒险','像素','策略'],desc:'昼与夜轮流敲响钟声。走进钟楼，发现藏在循环中的规则与故事。'},
{id:'motu',name:'墨途',en:'INK JOURNEY',group:'冒险',tags:['冒险','水墨','平台'],desc:'踏过留白的山与水，用奔跑和跳跃画出只属于自己的墨色旅程。'},
{id:'ghostslash',name:'残光斩',en:'GHOSTSLASH',group:'动作',tags:['动作','高速','斩击'],desc:'疾驰、闪避、出刀，让每一次斩击都成为划过黑暗的一道残光。'},
{id:'rewinder',name:'回带',en:'REWINDER',group:'解谜',tags:['解谜','时间','实验'],desc:'有些错误不必重来。让时间倒流一点点，看看另一种行动能带来怎样的结果。'},
{id:'echo-trail',name:'回声小径',en:'ECHO TRAIL',group:'解谜',tags:['解谜','像素','回声'],desc:'沿着回声指引前进，听见看不见的路，在静谧的空间中找寻出口。'},
{id:'lightlag',name:'慢光 LIGHTLAG',en:'LIGHTLAG',group:'街机',tags:['街机','太空','防御'],desc:'漫游星海，用有限的光与时间守护你的航线。'},
{id:'shise',name:'拾色',en:'HUEBOUND',group:'动作',tags:['动作','射击','色彩'],desc:'在不断变换的色彩世界中移动与战斗，让颜色成为你解决困局的工具。'},
{id:'issen',name:'一闪',en:'ISSEN',group:'动作',tags:['动作','居合','像素'],desc:'耐心等待，精准出刀。胜负往往就在一瞬间。'},
{id:'beat-paddle',name:'鼓点乒乓',en:'BEAT PADDLE',group:'节奏',tags:['节奏','街机','反应'],desc:'当乒乓与鼓点相遇，每一次回击都有了音乐的重量。'},
{id:'pixel-pong',name:'像素乒乓',en:'CAT vs RAT',group:'街机',tags:['街机','像素','对战'],desc:'轻松上手的像素对决，试试谁能将球稳稳送回。'},
{id:'ww2-frontline',name:'西线前线',en:'WESTERN FRONT',group:'冒险',tags:['冒险','3D','FPS'],desc:'踏入第一人称的战场原型，在 3D 空间里完成一段充满挑战的探索。',device:'推荐使用电脑与键鼠'}
];
const byId=Object.fromEntries(GAMES.map(g=>[g.id,g]));
const GROUPS=['全部','动作','节奏','解谜','街机','实验','冒险'];
const KEY_FAV='shuge-arcade-favorites-v1',KEY_RECENT='shuge-arcade-recent-v1';
const load=(key)=>{try{let result=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(result)?result.filter(x=>typeof x==='string'&&byId[x]):[]}catch{return[]}};
let favorites=new Set(load(KEY_FAV)),recent=load(KEY_RECENT),view='all',filter='全部',query='',lastFocus=null,openGame=null,toastTimer;
const $=(q)=>document.querySelector(q);
const ICON_HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 8.4c0 4.1-8.2 10-8.2 10s-8.2-5.9-8.2-10a4.4 4.4 0 0 1 8.2-2.1 4.4 4.4 0 0 1 8.2 2.1Z"/></svg>';
const ICON_PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 10 6-10 6Z" fill="currentColor" stroke="none"/></svg>';
const persist=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
function announce(message){const e=$('#toast');clearTimeout(toastTimer);e.textContent=message;e.classList.add('visible');toastTimer=setTimeout(()=>e.classList.remove('visible'),1900)}
function filtered(){
  const source=view==='favorites'?GAMES.filter(g=>favorites.has(g.id)):view==='recent'?recent.map(id=>byId[id]).filter(Boolean):GAMES;
  const q=query.trim().toLocaleLowerCase();
  return source.filter(g=>(filter==='全部'||g.tags.includes(filter)||g.group===filter)&&(!q||[g.name,g.en,...g.tags,g.desc].join(' ').toLocaleLowerCase().includes(q)));
}
function renderFilters(){
  $('#filters').innerHTML=GROUPS.map(x=>`<button type="button" class="filter-chip ${filter===x?'active':''}" aria-pressed="${filter===x}" data-filter="${x}">${x}</button>`).join('');
}
function card(g,i){
  const saved=favorites.has(g.id);
  return `<article class="game-card" style="--i:${i}">
    <div class="game-cover">
      <button type="button" class="cover-open" data-detail="${g.id}" aria-label="查看${g.name}详情"><img src="./art/${g.id}.svg" alt="" loading="${i<4?'eager':'lazy'}"><span class="cover-subtitle">${g.en}</span><strong class="cover-title">${g.name}</strong></button>
      <button type="button" class="fav-button ${saved?'is-fav':''}" data-fav="${g.id}" aria-pressed="${saved}" aria-label="${saved?'取消收藏':'收藏'}${g.name}">${ICON_HEART}</button>
    </div><div class="card-caption"><div><h3>${g.name}</h3><p>${g.tags.slice(0,2).join(' · ')}</p></div><span class="card-arrow" aria-hidden="true">↗</span></div>
  </article>`;
}
function render(){
  const vmeta={all:['DISCOVER','探索游戏'],favorites:['SAVED','我的收藏'],recent:['HISTORY','最近玩过']};
  $('#viewKicker').textContent=vmeta[view][0];$('#browseTitle').textContent=vmeta[view][1];
  document.querySelectorAll('[data-view]').forEach(btn=>{let active=btn.dataset.view===view;btn.classList.toggle('active',active);btn.classList.toggle('current',active);btn.setAttribute('aria-current',active?'page':'false')});
  const games=filtered();$('#resultCount').textContent=`${games.length} 款游戏`;
  $('#gameGrid').innerHTML=games.map(card).join('');
  const no=games.length===0;$('#emptyState').hidden=!no;
  if(no){$('#emptyTitle').textContent=query?'没有找到匹配的游戏':view==='favorites'?'你还没有收藏游戏':view==='recent'?'还没有游玩记录':'这里还没有游戏';$('#emptyText').textContent=view==='favorites'&&!query?'看到喜欢的游戏，点一下封面上的爱心就能收藏。':view==='recent'&&!query?'打开任意游戏后，它就会出现在这里。':'试试其他关键词，或清除筛选条件。'}
  renderFilters();$('#features').hidden=view!=='all'||!!query;
}
function selectView(v){if(!['all','favorites','recent'].includes(v))return;view=v;filter='全部';query='';$('#search').value='';document.querySelector('.search-box').classList.remove('search-open');render();requestAnimationFrame(()=>{const p=$('#browse');p.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})})}
function toggleFavorite(id){if(!byId[id])return;const wasKeyboardFocus=document.activeElement?.matches?.('[data-fav]');const inDetail=openGame===id;const adding=!favorites.has(id);adding?favorites.add(id):favorites.delete(id);persist(KEY_FAV,[...favorites]);render();if(inDetail)populateDetail(byId[id]);if(wasKeyboardFocus){const selector='[data-fav="'+id+'"]';const target=inDetail?$('#detailContent').querySelector(selector):$('#gameGrid').querySelector(selector);(target||document.querySelector('[data-view="'+view+'"]'))?.focus({preventScroll:true})}announce(adding?'已加入收藏':'已取消收藏')}
function markPlayed(id){if(!byId[id])return;recent=[id,...recent.filter(x=>x!==id)].slice(0,16);persist(KEY_RECENT,recent)}
function populateDetail(g){const saved=favorites.has(g.id);$('#detailContent').innerHTML=`
  <div class="detail-art"><img src="./art/${g.id}.svg" alt="" loading="eager"></div>
  <div class="detail-copy"><p class="detail-overline">${g.en} · ${g.group}</p><h2 id="detailTitle">${g.name}</h2><p>${g.desc}</p>
  <div class="detail-tags">${g.tags.map(t=>`<span>${t}</span>`).join('')}</div>
  <div class="detail-actions"><a href="${BASE+g.id}/" class="detail-play" data-play="${g.id}" target="_blank" rel="noopener noreferrer">${ICON_PLAY} 开始游戏 <span aria-hidden="true">↗</span></a><button type="button" class="detail-save" data-fav="${g.id}" aria-pressed="${saved}">${saved?'♥ 已收藏':'♡ 收藏'}</button></div>
  <div class="detail-notice">${g.device||'将在新标签页中打开原创网页游戏。'} · 游玩记录仅保存在此浏览器</div></div>`;
}
function showDetail(id){const g=byId[id];if(!g)return;lastFocus=document.activeElement;openGame=id;populateDetail(g);const backdrop=$('#detailBackdrop');backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#closeSheet').focus({preventScroll:true})}
function closeDetail(){const b=$('#detailBackdrop');if(!b.classList.contains('open'))return;b.classList.remove('open');b.setAttribute('aria-hidden','true');document.body.style.overflow='';openGame=null;if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true})}
document.addEventListener('click',(event)=>{
  const detail=event.target.closest('[data-detail]');if(detail){showDetail(detail.dataset.detail);return}
  const fav=event.target.closest('[data-fav]');if(fav){toggleFavorite(fav.dataset.fav);return}
  const chip=event.target.closest('[data-filter]');if(chip){filter=chip.dataset.filter;render();return}
  const v=event.target.closest('[data-view]');if(v){selectView(v.dataset.view);return}
  const play=event.target.closest('[data-play]');if(play){markPlayed(play.dataset.play);if(view==='recent')render();return}
});
$('#search').addEventListener('input',e=>{query=e.target.value;render()});
$('#mobileSearch').addEventListener('click',()=>{const s=$('.search-box');const opened=s.classList.toggle('search-open');if(opened)$('#search').focus();else{$('#search').value='';query='';render()}});
$('#clearFilters').addEventListener('click',()=>{view='all';filter='全部';query='';$('#search').value='';render()});
$('#closeSheet').addEventListener('click',closeDetail);
$('#detailBackdrop').addEventListener('click',e=>{if(e.target===$('#detailBackdrop'))closeDetail()});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(openGame)closeDetail();else if($('.search-box').classList.contains('search-open')){$('.search-box').classList.remove('search-open');$('#mobileSearch').focus()}return}
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!openGame){e.preventDefault();$('.search-box').classList.add('search-open');$('#search').focus()}
  if(e.key==='Tab'&&openGame){const root=$('#detailSheet'),focusable=[...root.querySelectorAll('button,a[href],input')].filter(x=>!x.disabled);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
});
window.addEventListener('storage',e=>{if(e.key===KEY_FAV){favorites=new Set(load(KEY_FAV));render()}if(e.key===KEY_RECENT){recent=load(KEY_RECENT);if(view==='recent')render()}});
render();
