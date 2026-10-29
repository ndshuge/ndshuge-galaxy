'use strict';

const GAMES = [
{id:'lumen-siege',name:'光核围城',en:'LUMEN SIEGE',group:'动作',tags:['生存','像素','动作'],desc:'在光与暗交错的战场中，进化武器，迎战不断涌来的敌人。每一局都是新的生存挑战。',device:'键盘操作体验更完整'},
{id:'still',name:'凝时 STILL',en:'STILL',group:'动作',tags:['弹幕','时间','策略'],desc:'按下暂停时间的按钮，在密集弹幕之间寻找破局路线。',device:''},
{id:'gravity-garden',name:'重力花园',en:'GRAVITY GARDEN',group:'实验',tags:['物理','沙盒','互动'],desc:'给物体一点力量，让它们自由碰撞、旋转与飞行。',device:''},
{id:'vocalon-chaos',name:'VOCALON!',en:'BEAT REVOLUTION',group:'节奏',tags:['音乐','音游','反应'],desc:'跟着节拍进入绚烂的音乐世界，让每一次按键都踩在节奏上。',device:''},
{id:'pulse-breaker',name:'脉冲破界',en:'PULSE // BREAKER',group:'动作',tags:['节奏','Roguelite','动作'],desc:'战斗随着脉冲推进。找准节奏，突破边界。',device:''},
{id:'belfry',name:'钟楼契约',en:'BELL & BOND',group:'冒险',tags:['像素','策略','昼夜'],desc:'昼与夜交替，钟声一次次响起。走进钟楼寻找循环的秘密。',device:''},
{id:'motu',name:'墨途',en:'INK JOURNEY',group:'冒险',tags:['水墨','平台','探索'],desc:'踏过留白的山与水，用奔跑与跳跃画出自己的旅程。',device:''},
{id:'ghostslash',name:'残光斩',en:'GHOSTSLASH',group:'动作',tags:['高速','斩击','反应'],desc:'疾驰、闪避与出刀，让每一次斩击都成为划破黑暗的光。',device:''},
{id:'rewinder',name:'回带',en:'REWINDER',group:'解谜',tags:['时间','解谜','实验'],desc:'让时间倒流一点点，探索一种不同的解决方式。',device:''},
{id:'echo-trail',name:'回声小径',en:'ECHO TRAIL',group:'解谜',tags:['像素','回声','探索'],desc:'顺着回声前行，听见看不见的路。',device:''},
{id:'lightlag',name:'慢光 LIGHTLAG',en:'LIGHTLAG',group:'街机',tags:['太空','防御','街机'],desc:'漫游星海，用有限的光与时间守护航线。',device:''},
{id:'shise',name:'拾色',en:'HUEBOUND',group:'动作',tags:['色彩','射击','动作'],desc:'在变换的色彩世界里移动与战斗，让颜色成为你的武器。',device:''},
{id:'issen',name:'一闪',en:'ISSEN',group:'动作',tags:['居合','像素','反应'],desc:'耐心等待，精准出刀。胜负只在一瞬。',device:''},
{id:'beat-paddle',name:'鼓点乒乓',en:'BEAT PADDLE',group:'节奏',tags:['音乐','街机','反应'],desc:'当乒乓遇见鼓点，每一次回击都带有音乐的重量。',device:''},
{id:'pixel-pong',name:'像素乒乓',en:'CAT vs RAT',group:'街机',tags:['像素','对战','街机'],desc:'轻松上手的像素对决，看看谁能赢下这一分。',device:''},
{id:'ww2-frontline',name:'西线前线',en:'WESTERN FRONT',group:'冒险',tags:['3D','FPS','探索'],desc:'踏入第一人称的战场原型，在 3D 空间里完成挑战。',device:'推荐使用电脑与键鼠'}
];
const BASE='https://ndshuge.github.io/ndshuge-game/games/';
const $=s=>document.querySelector(s);
const all=s=>[...document.querySelectorAll(s)];
const byId=Object.fromEntries(GAMES.map(g=>[g.id,g]));
const GENRES=['全部','动作','冒险','节奏','解谜','街机','实验'];
const COLORS={动作:'#ff8f98',冒险:'#f4ca82',节奏:'#b4a6ff',解谜:'#75d8dc',街机:'#88d1ff',实验:'#94dfb7'};
const PICKS=['lumen-siege','gravity-garden','vocalon-chaos','still','pulse-breaker'];
const SAVED_KEY='shuge-arcade-favorites-v1';
const RECENT_KEY='shuge-arcade-recent-v1';
const THEME_KEY='gameverse-theme-v1';
const readList=key=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(x=>byId[x]):[]}catch{return[]}};
const saveList=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
const art=id=>'../arcade-library/art/'+id+'.svg';
const icon=(name)=>'<svg aria-hidden="true"><use href="#i-'+name+'"></use></svg>';
const image=(g,alt='')=>'<img src="'+art(g.id)+'" alt="'+alt+'" loading="lazy" decoding="async">';
let saved=new Set(readList(SAVED_KEY)),recent=readList(RECENT_KEY),view='discover',genre='全部',query='',pick=0,openGame=null,selectedGame=null,lastFocus=null,toastTimer=null;
function notice(message){const el=$('#toast');clearTimeout(toastTimer);el.textContent=message;el.classList.add('visible');toastTimer=setTimeout(()=>el.classList.remove('visible'),2200)}
function playableUrl(g){return BASE+g.id+'/'}
function setTheme(mode){document.documentElement.dataset.theme=mode;try{localStorage.setItem(THEME_KEY,mode)}catch{}$('#themeToggle').innerHTML=icon(mode==='dark'?'sun':'moon');$('#themeToggle').setAttribute('aria-label',mode==='dark'?'切换浅色主题':'切换深色主题')}
try{setTheme(localStorage.getItem(THEME_KEY)==='light'?'light':'dark')}catch{setTheme('dark')}
function selectFeature(index){pick=(index+PICKS.length)%PICKS.length;const g=byId[PICKS[pick]];const hero=$('#heroImage');if(hero.dataset.game!==g.id){hero.style.opacity='.2';hero.src=art(g.id);hero.dataset.game=g.id;requestAnimationFrame(()=>{hero.style.opacity='1'})}$('#heroTitle').textContent=g.name;$('#heroEnglish').textContent=g.en;$('#heroDescription').textContent=g.desc;$('#heroDots').innerHTML=PICKS.map((id,i)=>'<button class="hero-dot '+(i===pick?'active':'')+'" type="button" data-pick="'+i+'" aria-label="查看第'+(i+1)+'款精选游戏" aria-pressed="'+(i===pick)+'"></button>').join('')}
function miniCard(g){return '<button class="rail-card" type="button" data-detail="'+g.id+'" aria-label="查看'+g.name+'"><span class="rail-img">'+image(g)+'</span><span class="rail-body"><strong>'+g.name+'</strong><small>'+g.en+'</small><span class="rail-underline"></span></span></button>'}
function featureCard(g){return '<button class="feature-card" data-detail="'+g.id+'" aria-label="查看'+g.name+'" type="button"><span class="art-wrap">'+image(g)+'</span><span class="feature-meta"><b>'+g.name+'</b><span>'+g.tags.slice(0,2).join(' · ')+'</span><em>探索作品 ↗</em></span></button>'}
function categoryButton(x,klass){return '<button class="'+klass+(genre===x?' active':'')+'" type="button" data-genre="'+x+'" style="--genre-color:'+(COLORS[x]||'#acd5ff')+'">'+(klass==='category-pill'?'<span></span>':'')+x+'</button>'}
function renderDiscovery(){const first=recent.length?recent.map(id=>byId[id]).filter(Boolean):PICKS.map(id=>byId[id]);$('#continueTitle').textContent=recent.length?'继续你的冒险':'开始下一场冒险';$('#continueRail').innerHTML=first.slice(0,8).map(miniCard).join('');$('#categoryRow').innerHTML=GENRES.slice(1).map(g=>categoryButton(g,'category-pill')).join('');$('#featureGrid').innerHTML=['lumen-siege','vocalon-chaos','belfry','ww2-frontline'].map(id=>featureCard(byId[id])).join('')}
function filteredGames(){const word=query.trim().toLocaleLowerCase();let games=view==='favorites'?GAMES.filter(g=>saved.has(g.id)):view==='recent'?recent.map(id=>byId[id]).filter(Boolean):GAMES;return games.filter(g=>(genre==='全部'||g.group===genre||g.tags.includes(genre))&&(!word||[g.name,g.en,g.group,...g.tags,g.desc].join(' ').toLocaleLowerCase().includes(word)))}
function libraryCard(g){return '<article class="library-card"><button type="button" class="card-open" data-detail="'+g.id+'" aria-label="查看'+g.name+'详情"><span class="card-art">'+image(g)+'</span><span class="card-text"><strong>'+g.name+'</strong><small>'+g.en+' · '+g.group+'</small></span></button><div class="card-actions"><button class="card-play" type="button" data-play="'+g.id+'">▶ 开始游戏</button><button type="button" class="fav-button" data-fav="'+g.id+'" aria-label="'+(saved.has(g.id)?'取消收藏':'收藏')+g.name+'" aria-pressed="'+saved.has(g.id)+'">'+icon('heart')+'</button></div></article>'}
function renderBrowse(){const title={library:'全部游戏',favorites:'我的收藏',recent:'最近游玩'};const eyebrow={library:'YOUR PLAYGROUND',favorites:'SAVED FOR LATER',recent:'PICK UP WHERE YOU LEFT OFF'};$('#browseTitle').textContent=query?'搜索游戏':title[view]||'全部游戏';$('#browseEyebrow').textContent=query?'FIND A NEW WORLD':eyebrow[view];$('#browseSubtitle').textContent=query?'搜索名称、风格，或你想尝试的玩法。':view==='favorites'?'把最喜欢的世界留在手边。':view==='recent'?'重新进入你的冒险。':'16 个独立创作的游戏世界，即点即玩。';$('#filterRow').innerHTML=GENRES.map(g=>categoryButton(g,'filter-pill')).join('');const data=filteredGames();$('#resultCount').textContent=data.length+' 款作品';$('#gameGrid').innerHTML=data.map(libraryCard).join('');const empty=data.length===0;$('#emptyState').hidden=!empty;$('#emptyTitle').textContent=query?'没有找到匹配的游戏':view==='favorites'?'还没有收藏':'还没有游玩记录';$('#emptyBody').textContent=query?'换个搜索词，或试试其他分类。':view==='favorites'?'打开游戏详情，点爱心就能收藏。':'点击任意游戏的“开始游戏”，会自动出现在这里。'}
function renderStats(){$('#favCount').textContent=saved.size;$('#recentCount').textContent=recent.length}
function setView(next,selectedGenre='全部'){if(!['discover','library','favorites','recent'].includes(next))return;view=next;genre=selectedGenre;if(next==='discover')query='';$('#searchInput').value=query;$('#discoverView').hidden=view!=='discover';$('#browseView').hidden=view==='discover';$('#currentSection').textContent={discover:'精选探索',library:'游戏库',favorites:'我的收藏',recent:'最近游玩'}[view];all('[data-view]').forEach(b=>{const on=b.dataset.view===view;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});if(view==='discover')renderDiscovery();else renderBrowse();renderStats();window.scrollTo({top:0,behavior:'instant'});if(document.activeElement===document.body)$('#main').focus({preventScroll:true})}
function toggleSaved(id){if(!byId[id])return;const adding=!saved.has(id);if(adding)saved.add(id);else saved.delete(id);saveList(SAVED_KEY,[...saved]);renderStats();if(view!=='discover')renderBrowse();if(openGame===id)renderDetails(byId[id]);notice(adding?'已加入收藏':'已取消收藏')}
function markPlayed(id){recent=[id,...recent.filter(x=>x!==id)].slice(0,16);saveList(RECENT_KEY,recent);renderStats();if(view==='recent')renderBrowse();renderDiscovery()}
function renderDetails(g){$('#detailContent').innerHTML='<div class="detail-cover">'+image(g)+'</div><div class="detail-body"><p class="detail-kicker">ORIGINAL GAME · '+g.en+'</p><h2 id="detailTitle">'+g.name+'</h2><p>'+g.desc+'</p><div class="detail-tags">'+[g.group,...g.tags].map(t=>'<span>'+t+'</span>').join('')+'</div><div class="detail-actions"><button type="button" class="primary-button" data-play="'+g.id+'">'+icon('play')+'开始游戏</button><button class="fav-button" type="button" data-fav="'+g.id+'" aria-label="'+(saved.has(g.id)?'取消收藏':'收藏')+g.name+'" aria-pressed="'+saved.has(g.id)+'">'+icon('heart')+'</button></div><p class="detail-note">'+(g.device||'游戏可在浏览器中运行，部分玩法需要键盘。')+' · 如无法内嵌启动，可在新标签页打开。</p></div>'}
function showDetails(id){const g=byId[id];if(!g)return;lastFocus=document.activeElement;openGame=id;renderDetails(g);$('#detailBackdrop').hidden=false;document.body.style.overflow='hidden';$('#closeDetail').focus({preventScroll:true})}
function closeDetails(restore=true){if($('#detailBackdrop').hidden)return;$('#detailBackdrop').hidden=true;document.body.style.overflow='';openGame=null;if(restore)lastFocus?.focus?.({preventScroll:true})}
function launchGame(id){const g=byId[id];if(!g)return;selectedGame=g;markPlayed(id);closeDetails(false);$('#playingTitle').textContent=g.name;$('#externalPlay').href=playableUrl(g);$('#gameFrame').src=playableUrl(g);$('#playback').hidden=false;document.body.style.overflow='hidden';$('#closePlayback').focus({preventScroll:true})}
function closeGame(){if($('#playback').hidden)return;$('#playback').hidden=true;$('#gameFrame').src='about:blank';document.body.style.overflow='';selectedGame=null;$('#main').focus({preventScroll:true})}
function showSearch(){const field=$('#searchField');field.classList.add('mobile-open');$('#searchInput').focus({preventScroll:true});if(view==='discover')setView('library');}
function keyShortcut(e){if(e.key==='Escape'){if(!$('#playback').hidden){closeGame();return}if(!$('#detailBackdrop').hidden){closeDetails();return}$('#searchField').classList.remove('mobile-open');$('#searchInput').blur();return}if((e.key.toLowerCase()==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey)){if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&e.key==='/')return;e.preventDefault();showSearch()}if(e.key==='Tab'&&!$('#detailBackdrop').hidden){const focusable=all('.detail-modal button:not([disabled]),.detail-modal a[href]');const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}
document.addEventListener('click',e=>{const pickBtn=e.target.closest('[data-pick]');if(pickBtn){selectFeature(Number(pickBtn.dataset.pick));return}const nv=e.target.closest('[data-view]');if(nv){setView(nv.dataset.view);return}const tag=e.target.closest('[data-genre]');if(tag){setView('library',tag.dataset.genre);return}const play=e.target.closest('[data-play]');if(play){launchGame(play.dataset.play);return}const fav=e.target.closest('[data-fav]');if(fav){toggleSaved(fav.dataset.fav);return}const detail=e.target.closest('[data-detail]');if(detail){showDetails(detail.dataset.detail)}});
document.addEventListener('keydown',keyShortcut);
$('#themeToggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
$('#heroPrevious').addEventListener('click',()=>selectFeature(pick-1));
$('#heroNext').addEventListener('click',()=>selectFeature(pick+1));
$('#heroPlay').addEventListener('click',()=>launchGame(PICKS[pick]));
$('#heroInfo').addEventListener('click',()=>showDetails(PICKS[pick]));
$('#searchInput').addEventListener('input',e=>{query=e.target.value;if(view==='discover'){setView('library');$('#searchInput').value=query}renderBrowse()});
$('#mobileSearch').addEventListener('click',()=>{const field=$('#searchField');if(field.classList.contains('mobile-open')&&!$('#searchInput').value){field.classList.remove('mobile-open')}else showSearch()});
$('#closeDetail').addEventListener('click',()=>closeDetails());
$('#detailBackdrop').addEventListener('click',e=>{if(e.target.id==='detailBackdrop')closeDetails()});
$('#closePlayback').addEventListener('click',closeGame);
$('#fullscreenGame').addEventListener('click',()=>{const f=$('#gameFrame');if(f.requestFullscreen)f.requestFullscreen().catch(()=>notice('全屏不可用，请在新标签页打开'))});
let pointerStart=null;$('#featureHero').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId}});
$('#featureHero').addEventListener('pointerup',e=>{if(!pointerStart||e.pointerId!==pointerStart.id)return;const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;pointerStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)selectFeature(pick+(dx<0?1:-1))});
$('#featureHero').addEventListener('pointercancel',()=>pointerStart=null);
const daily=byId['gravity-garden'];$('#dailyPick').dataset.detail=daily.id;$('#dailyImage').src=art(daily.id);$('#dailyTitle').textContent=daily.name;$('#dailyGenre').textContent=daily.tags.slice(0,2).join(' · ');
$('#sideGenres').innerHTML=GENRES.slice(1).map(g=>'<button class="genre-side" type="button" data-genre="'+g+'">'+g+'<span style="--genre-color:'+COLORS[g]+'"></span></button>').join('');
selectFeature(0);renderDiscovery();renderStats();setView('discover');
