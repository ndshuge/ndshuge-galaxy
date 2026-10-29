'use strict';
/* Independent GameVerse Vision. All AAA items are visual examples linking to official stores.
   Only games under ndshuge-game have an immediate browser-play action. */
const STORE='https://store.steampowered.com/app/';
const PLAY='https://ndshuge.github.io/ndshuge-game/games/';
const staticGame=(id,title,en,appId,hours,percent,description,category='冒险')=>({id,title,en,appId,hours,percent,description,category,type:'showcase',image:'./assets/'+id+'-wide.jpg',cover:'./assets/'+id+'-cover.jpg'});
const GAMES=[
 staticGame('wukong','黑神话：悟空','Black Myth: Wukong',2358720,23,44,'踏上充满东方神话色彩的史诗之旅，在壮丽与危险并存的世界中，直面天命。','动作'),
 staticGame('elden','Elden Ring','艾尔登法环',1245620,42,68,'探寻交界地的秘密，在辽阔的世界里书写属于你的传说。','动作'),
 staticGame('hades','Hades II','哈迪斯 II',1145350,18,35,'穿越冥界，在一次次战斗中挑战命运。','动作'),
 staticGame('baldurs',"Baldur's Gate 3",'博德之门 3',1086940,120,72,'你的每一个选择，都将决定旅伴和世界的命运。','角色扮演'),
 staticGame('stardew','Stardew Valley','星露谷物语',413150,36,40,'在自己的农场，开始一段温暖而缓慢的生活。','休闲'),
 staticGame('cyberpunk','Cyberpunk 2077','赛博朋克 2077',1091500,58,78,'夜之城等你探索。','角色扮演'),
 staticGame('reddead','Red Dead Redemption 2','荒野大镖客 2',1174180,64,62,'一场横跨美国西部的传奇旅程。','冒险'),
 staticGame('hollow','Hollow Knight','空洞骑士',367520,25,57,'深入被遗忘的地下王国。','动作'),
 staticGame('ghost','Ghost of Tsushima','对马岛之魂',2215430,49,83,'以武士之道守护家园。','冒险'),
 staticGame('sekiro','Sekiro: Shadows Die Twice','只狼：影逝二度',814380,42,68,'在生与死之间锤炼剑术。','动作'),
 staticGame('witcher','The Witcher 3','巫师 3：狂猎',292030,91,88,'踏上寻找希里的奇幻旅程。','角色扮演'),
 staticGame('horizon','Horizon Zero Dawn','地平线：零之曙光',1151640,30,55,'走进机械生物与自然共存的未来。','冒险'),
 staticGame('portal','Portal 2','传送门 2',620,16,90,'用传送门破解精妙的空间谜题。','解谜'),
 staticGame('cuphead','Cuphead','茶杯头',268910,12,32,'复古动画风格的高难度闯关冒险。','动作')
];
const ORIGINALS=[
 ['lumen-siege','光核围城','动作生存'],['still','凝时 STILL','时间弹幕'],['gravity-garden','重力花园','物理沙盒'],
 ['vocalon-chaos','VOCALON!','音乐节奏'],['pulse-breaker','脉冲破界','节奏动作'],['belfry','钟楼契约','冒险'],
 ['motu','墨途','水墨平台'],['ghostslash','残光斩','高速斩击'],['rewinder','回带','时光解谜'],
 ['echo-trail','回声小径','解谜'],['lightlag','慢光 LIGHTLAG','太空防御'],['shise','拾色','色彩射击'],
 ['issen','一闪','居合动作'],['beat-paddle','鼓点乒乓','音乐街机'],['pixel-pong','像素乒乓','像素对决'],['ww2-frontline','西线前线','3D FPS']
].map(([id,title,category])=>({id,title,en:title,category,type:'web',image:'../arcade-library/art/'+id+'.svg',cover:'../arcade-library/art/'+id+'.svg',description:'鼠哥原创网页游戏 · 无需安装，点击即可开始游玩。'}));
const FEATURED=['wukong','elden','baldurs','hades','stardew'];
const FRIENDS=[
 {name:'Momo',state:'正在玩 Elden Ring',tone:['#e68fa2','#4c517a'],initial:'M'},
 {name:'Kai',state:'正在玩 VALORANT',tone:['#c18b66','#3c4356'],initial:'K'},
 {name:'星野',state:"正在玩 Baldur’s Gate 3",tone:['#efcd88','#6e6b9b'],initial:'星'},
 {name:'Cirno',state:'在线',tone:['#9bc4f4','#6474b8'],initial:'C'},
 {name:'Jackie',state:'正在玩 HELLDIVERS 2',tone:['#cda07d','#3b5666'],initial:'J'}
];
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const byId=Object.fromEntries([...GAMES,...ORIGINALS].map(g=>[g.id,g]));
const icon=name=>'<svg aria-hidden="true"><use href="#ico-'+name+'"></use></svg>';
const read=(key,backup=[])=>{try{let v=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(v)?v:backup}catch{return backup}};
const save=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v))}catch{}};
const state={view:'home',hero:0,filter:'all',sort:'recent',favorites:new Set(read('gameverse-vision-favorites')),recent:read('gameverse-vision-recent'),search:'',lastFocus:null};
let toastTimer,heroTimer;
function toast(message){const el=$('#toast');clearTimeout(toastTimer);el.textContent=message;el.classList.add('show');toastTimer=setTimeout(()=>el.classList.remove('show'),2300)}
function gameArt(g,kind='cover'){return g[kind]||g.image}
function cover(g){return '<img src="'+gameArt(g)+'" alt="" loading="lazy" decoding="async">'}
function renderHero(){
 const g=byId[FEATURED[state.hero]];
 const el=$('#hero');
 el.classList.add('switching');
 clearTimeout(heroTimer);heroTimer=setTimeout(()=>el.classList.remove('switching'),210);
 $('#heroArt').src=state.hero===0?'./assets/wukong-hero.jpg':g.image;
 $('#heroArt').alt=g.title+' 游戏宣传画';
 $('#heroTitle').textContent=g.title;
 $('#heroDescription').textContent=g.description;
 $('#heroBadge').textContent=['精选推荐','本周热门','故事世界','为你推荐','轻松时光'][state.hero];
 $('#heroAction').dataset.detail=g.id;$('#heroMore').dataset.detail=g.id;
 $('#heroDots').innerHTML=FEATURED.map((id,i)=>'<button type="button" data-feature="'+i+'" aria-label="查看第 '+(i+1)+' 款精选游戏" aria-pressed="'+(i===state.hero)+'"></button>').join('');
}
function card(g){
 return '<button type="button" class="continue-card" data-detail="'+g.id+'" aria-label="查看 '+g.title+' 详情"><div class="continue-art">'+cover({...g,cover:g.image})+'</div><div class="continue-info"><strong>'+g.title+'</strong><small>已游玩 '+g.hours+' 小时 · 演示</small><div class="card-progress"><span class="bar"><i style="width:'+g.percent+'%"></i></span><span>'+g.percent+'%</span></div></div></button>';
}
function tile(g){
 return '<button type="button" class="library-tile" data-detail="'+g.id+'" aria-label="查看 '+g.title+'"><img src="'+g.cover+'" alt="" loading="lazy" decoding="async"><strong>'+g.title+'</strong></button>';
}
function playable(g){
 return '<button type="button" class="playable-card" data-detail="'+g.id+'">'+cover(g)+'<div><strong>'+g.title+'</strong><small>立即游玩 →</small></div></button>';
}
function selectedLibrary(){
 let items=GAMES.slice(5);
 if(state.filter==='recent')items=[GAMES[1],GAMES[3],GAMES[4],GAMES[0],...items];
 if(state.filter==='installed')items=[GAMES[1],GAMES[2],GAMES[3],GAMES[4]];
 if(state.filter==='favorites')items=GAMES.filter(g=>state.favorites.has(g.id));
 if(state.sort==='name')items.sort((a,b)=>a.title.localeCompare(b.title));
 if(state.sort==='hours')items.sort((a,b)=>b.hours-a.hours);
 return items;
}
function renderHome(){
 $('#continueRail').innerHTML=['elden','hades','baldurs','stardew'].map(id=>card(byId[id])).join('');
 $('#libraryGrid').innerHTML=selectedLibrary().length?selectedLibrary().map(tile).join(''):'<p class="empty-note">还没有收藏游戏。打开详情页，点击收藏即可添加。</p>';
 $('#playableRail').innerHTML=ORIGINALS.slice(0,8).map(playable).join('');
 $$('.filter-chips [data-filter]').forEach(button=>button.classList.toggle('active',button.dataset.filter===state.filter));
 renderHero();
}
function renderFriends(){
 $('#friendsList').innerHTML=FRIENDS.map(f=>'<div class="friend-row"><span class="friend-avatar" style="--av1:'+f.tone[0]+';--av2:'+f.tone[1]+'">'+f.initial+'</span><span class="friend-copy"><strong>'+f.name+'</strong><small>'+f.state+'</small></span>'+icon('more')+'</div>').join('');
}
function altHeading(overline,title,description,body){
 $('#alternateOverline').textContent=overline;$('#alternateTitle').textContent=title;$('#alternateDescription').textContent=description;$('#alternateBody').innerHTML=body;
}
function altView(view){
 if(view==='library'){
  altHeading('My Collection','游戏库','正版游戏收藏展示 · 点击封面可查看 Steam 商店；下方原创游戏可以直接游玩。','<div class="alternate-grid">'+GAMES.map(tile).join('')+'</div><div class="section"><div class="section-heading"><h2>即点即玩 <small>16 Originals</small></h2></div><div class="alternate-grid">'+ORIGINALS.map(tile).join('')+'</div></div>');
 }else if(view==='featured'){
  altHeading('Featured','精选推荐','值得慢慢探索的故事和世界。','<div class="alternate-grid">'+FEATURED.map(id=>tile(byId[id])).join('')+'</div>');
 }else if(view==='friends'){
  const rows=FRIENDS.map(f=>'<div class="friend-row"><span class="friend-avatar" style="--av1:'+f.tone[0]+';--av2:'+f.tone[1]+'">'+f.initial+'</span><span class="friend-copy"><strong>'+f.name+'</strong><small>'+f.state+'</small></span></div>').join('');
  altHeading('Community','好友','示例好友列表 · 当前未连接真实的社交账户。','<div class="alternate-friends">'+rows+'</div>');
 }else if(view==='achievements'){
  altHeading('Achievements','成就中心','展示界面样例；若要同步真实成就，需要连接合法的平台账户。','<div class="alternate-info"><div class="achievements-middle"><div class="ring"><span>68%</span></div><div><small>示例总成就进度</small><strong>186 / 274</strong></div></div><p>在 GameVerse Vision 中，真实原创游戏入口与演示数据互不混淆。</p></div>');
 }else if(view==='profile'){
  altHeading('Profile','Player One','演示玩家档案 · 当前收藏和最近游玩只保存在此浏览器。','<div class="alternate-info"><h3>Level 28 · PRO</h3><p>已收藏 '+state.favorites.size+' 款游戏。你可以打开游戏详情，把喜欢的游戏加入收藏。</p><button type="button" data-view="library" class="primary-play">查看我的游戏库 →</button></div>');
 }else if(view==='cloud'){
  altHeading('Local Saves','云存档','当前版本不会上传存档或读取第三方账户。','<div class="alternate-info"><p>浏览器本地存储仅用于记录收藏和最近打开的游戏，浏览器清理数据会删除这些记录。</p></div>');
 }else if(view==='settings'){
  altHeading('Preferences','设置','为你保留轻盈、清晰的浏览体验。','<div class="alternate-info"><h3>外观与交互</h3><p>支持系统减少动态效果、减少透明度和高对比度偏好。点击“清空本地记录”可以移除 GameVerse Vision 的收藏和最近记录。</p><button type="button" class="primary-play" id="clearSaved">清空本地记录</button></div>');
 }
}
function setView(view){
 if(!['home','library','featured','friends','achievements','profile','cloud','settings'].includes(view))view='home';
 state.view=view;
 $('#homeContent').hidden=view!=='home';$('#alternateView').hidden=view==='home';
 $$('[data-view]').forEach(el=>{let active=el.dataset.view===view || (view==='featured'&&el.dataset.view==='home'&&el.closest('.mobile-dock'));el.classList.toggle('selected',!!active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
 if(view==='home')renderHome();else altView(view);
 $('#mainArea').scrollTo?.({top:0,behavior:'instant'});window.scrollTo?.({top:0,behavior:'instant'});
}
function detailGame(g,trigger){
 if(!g)return;state.lastFocus=trigger||document.activeElement;
 const web=g.type==='web';
 const image=g.image;
 const link=web?PLAY+encodeURIComponent(g.id)+'/':STORE+g.appId+'/';
 const cta=web?'开始游戏':'前往 Steam 商店';
 const foot=web?'鼠哥原创 · 网页即点即玩':'商业游戏 · 仅展示资料 · 需在正规平台购买或启动';
 const favorite=state.favorites.has(g.id);
 $('#detailBody').innerHTML='<img class="detail-art" src="'+image+'" alt=""><div class="detail-text"><span class="eyebrow">'+foot+'</span><h2>'+g.title+'</h2><p>'+g.description+'</p><div class="detail-actions"><a href="'+link+'" target="_blank" rel="noopener noreferrer" data-launch="'+g.id+'">'+icon('play')+cta+'</a><button type="button" data-favorite="'+g.id+'" aria-pressed="'+favorite+'">'+icon('heart')+(favorite?'已收藏':'加入收藏')+'</button></div></div>';
 const dialog=$('#detailDialog');if(!dialog.open)dialog.showModal();
 $('#closeDetail').focus();
}
function closeDetail(){const dialog=$('#detailDialog');if(dialog.open)dialog.close();state.lastFocus?.focus?.();}
function toggleFavorite(id){if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);save('gameverse-vision-favorites',[...state.favorites]);toast(state.favorites.has(id)?'已加入收藏':'已取消收藏');if($('#detailDialog').open)detailGame(byId[id],state.lastFocus);if(state.view==='home')renderHome();else altView(state.view)}
function openSearch(){
 $('#searchOverlay').hidden=false;state.lastFocus=document.activeElement;$('#searchInput').value='';renderSearch('');requestAnimationFrame(()=>$('#searchInput').focus());
}
function closeSearch(){$('#searchOverlay').hidden=true;state.lastFocus?.focus?.()}
function renderSearch(text){
 const query=(text||'').trim().toLocaleLowerCase();
 const items=[...GAMES,...ORIGINALS].filter(g=>[g.title,g.en,g.category,g.description].join(' ').toLocaleLowerCase().includes(query)).slice(0,10);
 $('#searchResults').innerHTML=items.length?items.map(g=>'<button type="button" class="search-result" data-detail="'+g.id+'">'+cover(g)+'<span><strong>'+g.title+'</strong><small>'+(g.type==='web'?'浏览器即点即玩':'游戏资料 / Steam 商店')+' · '+g.category+'</small></span></button>').join(''):'<p style="padding:20px;color:#d8e3f4">没有找到匹配的游戏。</p>';
}
function updateController(){
 const pads=(navigator.getGamepads?.()||[]).filter(Boolean);
 const el=$('#controllerStatus');if(el)el.textContent=pads[0]?pads[0].id.split('(')[0].slice(0,34):'未连接控制器';
}
function trackLaunch(id){state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,20);save('gameverse-vision-recent',state.recent)}
document.addEventListener('click',event=>{
 const view=event.target.closest('[data-view]');if(view){event.preventDefault();setView(view.dataset.view);return}
 if(event.target.closest('[data-search-trigger]')){openSearch();return}
 if(event.target.closest('[data-close-search]')){closeSearch();return}
 const feature=event.target.closest('[data-feature]');if(feature){state.hero=Number(feature.dataset.feature)||0;renderHero();return}
 const filter=event.target.closest('[data-filter]');if(filter){state.filter=filter.dataset.filter;renderHome();return}
 const favorite=event.target.closest('[data-favorite]');if(favorite){toggleFavorite(favorite.dataset.favorite);return}
 const item=event.target.closest('[data-detail]');if(item){if(!$('#searchOverlay').hidden)closeSearch();detailGame(byId[item.dataset.detail],item);return}
 const launch=event.target.closest('[data-launch]');if(launch){trackLaunch(launch.dataset.launch);return}
 if(event.target.closest('#clearSaved')){state.favorites.clear();state.recent=[];save('gameverse-vision-favorites',[]);save('gameverse-vision-recent',[]);toast('已清空本地记录');setView('settings');return}
 if(event.target.closest('#closeDetail')){closeDetail();return}
 if(event.target.closest('[data-action="notifications"]')){toast('暂无新通知 · 演示模式');return}
});
$('#sortSelect').addEventListener('change',event=>{state.sort=event.target.value;renderHome()});
$('#searchInput').addEventListener('input',event=>renderSearch(event.target.value));
$('#searchInput').addEventListener('keydown',event=>{if(event.key==='Enter'){const b=$('.search-result');if(b)b.click()}});
$('#detailDialog').addEventListener('click',event=>{if(event.target===$('#detailDialog'))closeDetail()});
$('#detailDialog').addEventListener('close',()=>state.lastFocus?.focus?.());
document.addEventListener('keydown',event=>{
 if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if($('#searchOverlay').hidden)openSearch();else closeSearch()}
 if(event.key==='Escape'&&!$('#searchOverlay').hidden){event.preventDefault();closeSearch()}
 if(event.key==='ArrowRight'&&document.activeElement?.closest?.('#heroDots')){state.hero=(state.hero+1)%FEATURED.length;renderHero();$('#heroDots [aria-pressed="true"]').focus()}
 if(event.key==='ArrowLeft'&&document.activeElement?.closest?.('#heroDots')){state.hero=(state.hero+FEATURED.length-1)%FEATURED.length;renderHero();$('#heroDots [aria-pressed="true"]').focus()}
});
let holdTimer,holdStart;
document.addEventListener('pointerdown',e=>{
 const target=e.target.closest('.continue-card,.library-tile,.playable-card');
 if(!target||e.pointerType==='mouse')return;
 holdStart={x:e.clientX,y:e.clientY};clearTimeout(holdTimer);
 holdTimer=setTimeout(()=>{target.dataset.longpressed='true';detailGame(byId[target.dataset.detail],target)},570);
});
document.addEventListener('pointermove',e=>{if(holdStart&&Math.hypot(e.clientX-holdStart.x,e.clientY-holdStart.y)>12){clearTimeout(holdTimer);holdStart=null}});
['pointerup','pointercancel','scroll'].forEach(name=>document.addEventListener(name,()=>{clearTimeout(holdTimer);holdStart=null},{passive:true}));
window.addEventListener('gamepadconnected',updateController);window.addEventListener('gamepaddisconnected',updateController);
window.addEventListener('error',event=>{console.error('[GameVerse Vision]',event.message)});
renderFriends();renderHome();updateController();
