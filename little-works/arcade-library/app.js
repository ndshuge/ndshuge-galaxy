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
const PICKS=['lumen-siege','still','gravity-garden','vocalon-chaos','pulse-breaker'];
const STORIES=['still','gravity-garden','vocalon-chaos','belfry','ghostslash','pulse-breaker'];
const DISCOVER=['rewinder','echo-trail','issen','motu','lightlag','ww2-frontline'];
const GENRES=['全部','动作','节奏','冒险','解谜','街机','实验'];
const SAVE='shuge-arcade-favorites-v1',HISTORY='shuge-arcade-recent-v1';
const read=(key)=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(id=>typeof id==='string'&&byId[id]):[]}catch{return[]}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
let favorites=new Set(read(SAVE)),recent=read(HISTORY),view='home',genre='全部',query='',activeFeature=0,openGame=null,lastFocus=null,toaster,searchMode=false;
const $=q=>document.querySelector(q);
const heart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8.5c0 4.1-8 9.7-8 9.7S4 12.6 4 8.5a4.2 4.2 0 0 1 8-1.8 4.2 4.2 0 0 1 8 1.8Z"/></svg>';
const gameArt=id=>'./art/'+id+'.svg';
function toast(msg){const t=$('#toast');clearTimeout(toaster);t.textContent=msg;t.classList.add('visible');toaster=setTimeout(()=>t.classList.remove('visible'),1900)}
function featureAt(index){
 const next=(index+PICKS.length)%PICKS.length,g=byId[PICKS[next]],old=activeFeature;activeFeature=next;
 const media=$('.hero-media');if(old!==next){media.classList.add('is-changing');setTimeout(()=>{media.classList.remove('is-changing')},160)}
 $('#heroImg').src=gameArt(g.id);$('#heroTitle').textContent=g.name;$('#heroDescription').textContent={
 'lumen-siege':'一束光，迎战无尽黑暗。','still':'凝住时间，改变战局。','gravity-garden':'让星球与重力自由起舞。','vocalon-chaos':'让每一次按键，都踩在节拍上。','pulse-breaker':'跟上脉冲，冲破边界。'
 }[g.id]||g.desc;
 $('#heroLabel').textContent=['本周精选','为你推荐','自由探索','节奏之选','动作新体验'][next];
 $('#heroPlay').href=BASE+g.id+'/';$('#heroPlay').dataset.play=g.id;
 $('#heroDetail').dataset.detail=g.id;$('#heroDetail').setAttribute('aria-label','查看'+g.name+'详情');
 $('#heroDots').innerHTML=PICKS.map((id,i)=>'<button type="button" class="hero-dot '+(i===next?'active':'')+'" data-feature="'+i+'" aria-label="查看第'+(i+1)+'款精选游戏" aria-pressed="'+(i===next)+'"></button>').join('');
}
function story(g){return '<button type="button" class="story-card" data-detail="'+g.id+'" aria-label="了解'+g.name+'"><img src="'+gameArt(g.id)+'" alt="" loading="lazy"><span class="story-meta"><small>'+g.tags.slice(0,2).join(' · ')+'</small><strong>'+g.name+'</strong><span>'+g.desc.slice(0,20)+'…</span></span></button>'}
function shelf(g){return '<button type="button" class="shelf-tile" data-detail="'+g.id+'" aria-label="查看'+g.name+'"><span class="shelf-art"><img src="'+gameArt(g.id)+'" loading="lazy" alt=""></span><span class="shelf-title">'+g.name+'</span><span class="shelf-caption">'+g.group+'</span></button>'}
function renderHome(){
 $('#homeGenres').innerHTML=GENRES.slice(1).map(t=>'<button type="button" class="genre-chip" data-genre="'+t+'">'+t+'</button>').join('');
 $('#featureRail').innerHTML=STORIES.map(id=>story(byId[id])).join('');
 const front=recent.length?recent.slice(0,8):['lumen-siege','vocalon-chaos','gravity-garden','pulse-breaker','rewinder','still','belfry','pixel-pong'];
 $('#continueHeading').textContent=recent.length?'继续游玩':'开启下一场冒险';
 $('#appShelf').innerHTML=front.map(id=>shelf(byId[id])).join('');
 $('#discoveryRail').innerHTML=DISCOVER.map(id=>story(byId[id])).join('');
}
function listForView(){
 let data=view==='favorites'?GAMES.filter(g=>favorites.has(g.id)):view==='recent'?recent.map(id=>byId[id]).filter(Boolean):GAMES;
 const word=query.trim().toLocaleLowerCase();
 return data.filter(g=>(genre==='全部'||g.group===genre||g.tags.includes(genre))&&(!word||[g.name,g.en,g.group,...g.tags,g.desc].join(' ').toLocaleLowerCase().includes(word)));
}
function renderList(){
 const metas={library:['游戏库','16 个世界，随时开玩。','全部游戏'],favorites:['我的收藏','值得重返的游戏，放在这里。','收藏的游戏'],recent:['最近玩过','继续上次的冒险。','最近打开']};
 const current=searchMode?'library':view,key=metas[current]?current:'library',m=metas[key];
 $('#subTitle').textContent=searchMode?'搜索':m[0];$('#subEyebrow').textContent=searchMode?'找到你的下一款游戏':'SHUGE Arcade';$('#subDescription').textContent=searchMode?'按名称、类型或玩法探索。':m[1];$('#listHeading').textContent=m[2];
 $('#tagStrip').innerHTML=GENRES.map(t=>'<button type="button" class="filter-chip '+(t===genre?'active':'')+'" aria-pressed="'+(t===genre)+'" data-filter="'+t+'">'+t+'</button>').join('');
 const result=listForView();$('#resultCount').textContent=result.length+' 款';
 $('#gameList').innerHTML=result.map(g=>'<article class="list-row"><button class="list-image" data-detail="'+g.id+'" aria-label="查看'+g.name+'详情"><img src="'+gameArt(g.id)+'" loading="lazy" alt=""></button><button class="list-text" data-detail="'+g.id+'"><strong>'+g.name+'</strong><small>'+g.en+' · '+g.tags.slice(0,2).join(' · ')+'</small></button><a href="'+BASE+g.id+'/" data-play="'+g.id+'" target="_blank" rel="noopener noreferrer" class="row-play" aria-label="游玩'+g.name+'">游玩</a><button type="button" class="row-favorite '+(favorites.has(g.id)?'selected':'')+'" data-fav="'+g.id+'" aria-pressed="'+favorites.has(g.id)+'" aria-label="'+(favorites.has(g.id)?'取消收藏':'收藏')+g.name+'">'+heart+'</button></article>').join('');
 const empty=result.length===0;$('#emptyState').hidden=!empty;
 if(empty){
   $('#emptyTitle').textContent=query?'没有找到游戏':view==='favorites'?'暂无收藏':view==='recent'?'还没有游玩记录':'没有符合条件的游戏';
   $('#emptyDescription').textContent=view==='favorites'&&!query?'看到喜欢的游戏，点爱心保存。':view==='recent'&&!query?'点击任意游戏的“游玩”，这里会自动记录。':'可以换个搜索词或分类。';
 }
}
function updateNav(){document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===(searchMode?'search':view);b.classList.toggle('active',active);if(!['search'].includes(b.dataset.view))b.setAttribute('aria-current',active?'page':'false')})}
function setView(next,tag='全部'){
 const search=next==='search',valid=['home','library','favorites','recent','search'];
 if(!valid.includes(next))return;
 searchMode=search;view=search?'library':next;genre=tag;query='';$('#searchInput').value='';
 $('#homeView').hidden=view!=='home';$('#browseView').hidden=view==='home';
 updateNav();if(view==='home')renderHome();else renderList();
 window.scrollTo({top:0,behavior:'instant'});
 if(search)requestAnimationFrame(()=>$('#searchInput').focus({preventScroll:true}));
}
function toggleFavorite(id){
 if(!byId[id])return;const isAdded=!favorites.has(id),focused=document.activeElement?.matches?.('[data-fav]'),fromModal=openGame===id;
 if(isAdded)favorites.add(id);else favorites.delete(id);
 save(SAVE,[...favorites]);renderList();
 if(fromModal)renderDetail(byId[id]);
 if(focused){const selector='[data-fav="'+id+'"]';const el=fromModal?$('#modalContent').querySelector(selector):$('#gameList').querySelector(selector);(el||document.querySelector('.tab.active'))?.focus({preventScroll:true})}
 toast(isAdded?'已加入收藏':'已取消收藏');
}
function markPlayed(id){if(!byId[id])return;recent=[id,...recent.filter(x=>x!==id)].slice(0,16);save(HISTORY,recent);renderHome();if(view==='recent')renderList()}
function renderDetail(g){
 $('#modalContent').innerHTML='<div class="modal-cover"><img src="'+gameArt(g.id)+'" alt="" fetchpriority="high"></div><div class="modal-body"><div class="modal-symbol"><img src="'+gameArt(g.id)+'" alt=""></div><p class="modal-category">SHUGE Games · '+g.group+'</p><h2 id="detailTitle">'+g.name+'</h2><p class="modal-desc">'+g.desc+'</p><div class="modal-tags">'+g.tags.map(t=>'<span>'+t+'</span>').join('')+'</div><div class="modal-actions"><a class="modal-play" href="'+BASE+g.id+'/" data-play="'+g.id+'" target="_blank" rel="noopener noreferrer">游玩 <span aria-hidden="true">↗</span></a><button class="modal-save" data-fav="'+g.id+'" aria-pressed="'+favorites.has(g.id)+'">'+(favorites.has(g.id)?'♥ 已收藏':'♡ 收藏')+'</button></div><p class="modal-note">'+(g.device||'在新标签页启动浏览器游戏。')+' · 游玩记录只保存在这台设备</p></div>';
}
function openDetail(id){
 const g=byId[id];if(!g)return;lastFocus=document.activeElement;openGame=id;renderDetail(g);
 const layer=$('#modalLayer');layer.classList.add('open');layer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#modalClose').focus({preventScroll:true});
}
function closeDetail(){
 const layer=$('#modalLayer');if(!layer.classList.contains('open'))return;layer.classList.remove('open');layer.setAttribute('aria-hidden','true');document.body.style.overflow='';openGame=null;if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
}
document.addEventListener('click',e=>{
 const feature=e.target.closest('[data-feature]');if(feature){featureAt(Number(feature.dataset.feature));return}
 const nav=e.target.closest('[data-view]');if(nav){setView(nav.dataset.view);return}
 const choose=e.target.closest('[data-genre]');if(choose){setView('library',choose.dataset.genre);return}
 const filt=e.target.closest('[data-filter]');if(filt){genre=filt.dataset.filter;renderList();return}
 const play=e.target.closest('[data-play]');if(play){markPlayed(play.dataset.play);return}
 const fav=e.target.closest('[data-fav]');if(fav){toggleFavorite(fav.dataset.fav);return}
 const details=e.target.closest('[data-detail]');if(details)openDetail(details.dataset.detail)
});
$('#heroPrev').addEventListener('click',()=>featureAt(activeFeature-1));
$('#heroNext').addEventListener('click',()=>featureAt(activeFeature+1));
$('#searchInput').addEventListener('input',e=>{query=e.target.value;renderList()});
$('#clearFilters').addEventListener('click',()=>setView('library'));
$('#modalClose').addEventListener('click',closeDetail);
$('#modalLayer').addEventListener('click',e=>{if(e.target.id==='modalLayer')closeDetail()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(openGame)closeDetail();else if(searchMode)setView('home');return}
 if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!openGame&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();setView('search')}
 if(e.key==='Tab'&&openGame){const targets=[...$('#modalPanel').querySelectorAll('button,a[href],input')].filter(n=>!n.disabled);if(e.shiftKey&&document.activeElement===targets[0]){e.preventDefault();targets.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===targets.at(-1)){e.preventDefault();targets[0].focus()}}
});
let touchStart=null;
$('#hero').addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!e.target.closest('button,a'))touchStart={x:e.clientX,y:e.clientY}});
$('#hero').addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.15)featureAt(activeFeature+(dx<0?1:-1))});
$('#hero').addEventListener('pointercancel',()=>touchStart=null);
window.addEventListener('storage',e=>{if(e.key===SAVE){favorites=new Set(read(SAVE));renderList()}if(e.key===HISTORY){recent=read(HISTORY);renderHome();if(view==='recent')renderList()}});
featureAt(0);renderHome();renderList();updateNav();
