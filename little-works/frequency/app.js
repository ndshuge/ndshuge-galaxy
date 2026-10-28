"use strict";
const albums=[
  {id:"afterglow",name:"Afterglow",zh:"余晖",artist:"Frequency Sessions",mood:"夜晚 · 氛围电子",color:"#ad557f",audio:0,caption:"让城市的喧闹慢慢远去。"},
  {id:"blue-tide",name:"Blue Tide",zh:"蓝色潮汐",artist:"Frequency Sessions",mood:"海洋 · 轻电子",color:"#4aacc3",audio:1,caption:"在海的另一边，听见自己。"},
  {id:"night-drive",name:"Night Drive",zh:"夜间驾驶",artist:"Frequency Sessions",mood:"公路 · 深夜",color:"#6c69b8",audio:2,caption:"路灯掠过，世界开始变得柔软。"},
  {id:"soft-focus",name:"Soft Focus",zh:"柔焦",artist:"Frequency Selects",mood:"放松 · 精选歌单",color:"#c69b9a",audio:0,caption:"别急，给此刻一个慢镜头。"},
  {id:"orbit",name:"Slow Orbit",zh:"慢速轨道",artist:"Frequency Selects",mood:"沉浸 · 精选歌单",color:"#8eaaac",audio:1,caption:"像星球一样，绕着喜欢的声音转。"},
  {id:"pink-noise",name:"Pink Noise",zh:"粉色噪声",artist:"Frequency Selects",mood:"柔和 · 精选歌单",color:"#db7597",audio:2,caption:"在微小的杂音里找到秩序。"}
];
const soundFiles=["../aurora-player/audio/afterglow.mp3","../aurora-player/audio/blue-tide.mp3","../aurora-player/audio/night-drive.mp3"];
const $=id=>document.getElementById(id);
const audio=$("audio");
let selected=0,view="home",isScrubbing=false,nowScrubbing=false,shuffle=false,repeat=false,contextIndex=-1,contextTimer=0,toastTimer=0,pressTimer=0,suppressClickUntil=0,overlayPreviousFocus=null;
let favorites=[];
try{const stored=JSON.parse(localStorage.getItem("frequency-favs-v1")||"[]");favorites=Array.isArray(stored)?stored.filter(n=>Number.isInteger(n)&&n>=0&&n<albums.length):[]}catch{}
audio.volume=.75;
function icon(name){return '<svg aria-hidden="true"><use href="#'+name+'"></use></svg>'}
function cover(a){return "covers/"+a.id+".svg"}
function favorite(index){return favorites.includes(index)}
function renderAlbum(a,index){
 return '<article class="album-card" data-index="'+index+'">'+
 '<div class="album-art"><button class="album-main-btn" data-play-track="'+index+'" aria-label="播放 '+a.name+'"><img src="'+cover(a)+'" alt="'+a.name+' 原创封面" loading="lazy"></button><div class="album-overlay"><button class="album-play" data-play-track="'+index+'" aria-label="播放 '+a.name+'">'+icon("play")+'</button></div></div>'+
 '<div class="album-description"><div class="album-info"><button class="album-main-btn album-title" data-play-track="'+index+'">'+a.name+'</button><p>'+a.zh+' · '+a.artist+'</p></div><button class="album-fav '+(favorite(index)?"is-favorite":"")+'" data-favorite="'+index+'" aria-pressed="'+favorite(index)+'" aria-label="'+(favorite(index)?"取消收藏":"收藏")+a.name+'">'+icon("heart")+'</button></div></article>';
}
function renderSongs(target,indices){
 $(target).innerHTML=indices.map((index,n)=>{const a=albums[index];return '<div class="song-row '+(index===selected?"is-current":"")+'"><span class="song-index">'+(n+1)+'</span><img src="'+cover(a)+'" alt=""><button class="song-info album-main-btn" data-play-track="'+index+'"><span class="song-name">'+a.name+'</span><span class="song-artist">'+a.artist+' · '+a.zh+'</span></button><button class="album-fav '+(favorite(index)?"is-favorite":"")+'" data-favorite="'+index+'" aria-label="'+(favorite(index)?"取消收藏":"收藏")+a.name+'">'+icon("heart")+'</button><span class="song-length">试听</span></div>'}).join("");
}
function render(){
 $("recentGrid").innerHTML=albums.map(renderAlbum).join("");
 $("browseGrid").innerHTML=albums.map(renderAlbum).join("");
 $("searchGrid").innerHTML=albums.map(renderAlbum).join("");
 $("libraryGrid").innerHTML=favorites.map(i=>renderAlbum(albums[i],i)).join("");
 $("libraryEmpty").hidden=favorites.length!==0;
 $("favoriteCount").textContent=favorites.length;
 renderSongs("homeSongList",[0,1,2]);
 renderSongs("browseSongList",[0,1,2]);
 renderSongs("queueList",[0,1,2]);
 if(view==="search")filterSearch();
 updateFavoriteButtons();
}
function updateFavoriteButtons(){
 document.querySelectorAll("[data-favorite]").forEach(btn=>{const f=favorite(Number(btn.dataset.favorite));btn.classList.toggle("is-favorite",f);btn.setAttribute("aria-pressed",String(f));btn.setAttribute("aria-label",(f?"取消收藏":"收藏")+albums[Number(btn.dataset.favorite)].name)});
 for(const id of ["playerHeart","nowHeart"]){$(id).classList.toggle("is-favorite",favorite(selected));$(id).setAttribute("aria-pressed",String(favorite(selected)))}
}
function saveFavorites(){try{localStorage.setItem("frequency-favs-v1",JSON.stringify(favorites))}catch{}}
function toggleFavorite(index){favorites=favorite(index)?favorites.filter(i=>i!==index):[...favorites,index];saveFavorites();render();showToast(favorite(index)?"已加入你的音乐资料库":"已从音乐资料库移除")}
function setView(next){
 if(!["home","browse","library","search"].includes(next))return;
 view=next;
 for(const s of document.querySelectorAll("[data-section]"))s.hidden=s.dataset.section!==next;
 for(const b of document.querySelectorAll("[data-view]")){const active=b.dataset.view===next;b.classList.toggle("active",active);if(b.classList.contains("nav-item")){if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")}}
 $("breadcrumb").textContent={home:"现在就听",browse:"浏览",library:"音乐资料库",search:"搜索"}[next];
 window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
 if(next==="search"){filterSearch();setTimeout(()=>$("searchInput").focus({preventScroll:true}),120)}
 closeContext();
}
function fmt(s){if(!Number.isFinite(s)||s<0)return "0:00";return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0")}
function actualDuration(){return Number.isFinite(audio.duration)?audio.duration:0}
function syncTime(){
 const dur=actualDuration(),pos=audio.currentTime||0,pct=dur?Math.min(100,pos/dur*100):0;
 if(!isScrubbing){$("seek").value=dur?Math.round(pos/dur*1000):0;setProgressCSS($("seek"),pct)}
 if(!nowScrubbing){$("nowSeek").value=dur?Math.round(pos/dur*1000):0;setProgressCSS($("nowSeek"),pct)}
 $("currentTime").textContent=fmt(pos);$("duration").textContent=fmt(dur);
 $("nowCurrent").textContent=fmt(pos);$("nowDuration").textContent=fmt(dur);$("mobileProgress").style.width=pct+"%";
}
function setProgressCSS(el,pct){el.style.setProperty("--range-progress",pct+"%")}
function updatePlayIcons(){
 const name=audio.paused?"play":"pause";
 for(const id of ["playBtn","mobilePlayBtn","nowPlay"]){$(id).innerHTML=icon(name);$(id).setAttribute("aria-label",audio.paused?"播放":"暂停")}
 for(const btn of document.querySelectorAll(".main-play")){btn.innerHTML=icon(!audio.paused&&Number(btn.dataset.playTrack)===selected?"pause":"play")}
}
function setTrack(index,autoplay=true){
 selected=(index+albums.length)%albums.length;
 const a=albums[selected],wasPlaying=!audio.paused;
 $("currentTitle").textContent=a.name;$("currentArtist").textContent=a.artist;
 $("playerCover").src=cover(a);$("nowCover").src=cover(a);
 $("nowTitle").textContent=a.name;$("nowArtist").textContent=a.artist;
 $("nowCaption").textContent=a.caption;
 $("playerWrap").style.setProperty("--player-art",'url("'+cover(a)+'")');
 $("nowOverlay").style.setProperty("--now-art",'url("'+cover(a)+'")');
 audio.src=soundFiles[a.audio];audio.load();
 $("seek").value=0;$("nowSeek").value=0;syncTime();updateFavoriteButtons();
 renderSongs("homeSongList",[0,1,2]);renderSongs("browseSongList",[0,1,2]);renderSongs("queueList",[0,1,2]);
 if(autoplay||wasPlaying)audio.play().catch(()=>{showToast("请点按播放按钮以开启音频")});
 updatePlayIcons();
}
function togglePlay(){if(audio.paused){audio.play().catch(()=>showToast("此浏览器暂无法播放试听音频"))}else audio.pause()}
function nextTrack(dir=1){
 if(shuffle&&dir>0){let pick=selected;while(pick===selected)pick=Math.floor(Math.random()*3);setTrack(pick);return}
 const current=selected<3?selected:albums[selected].audio;
 setTrack((current+dir+3)%3);
}
function showToast(msg){const el=$("toast");el.textContent=msg;el.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("visible"),2600)}
function openNow(){overlayPreviousFocus=document.activeElement;$("nowOverlay").hidden=false;$("closeNow").focus({preventScroll:true});document.body.style.overflow="hidden"}
function closeNow(){if($("nowOverlay").hidden)return;$("nowOverlay").hidden=true;$("nowQueue").hidden=true;document.body.style.overflow="";if(overlayPreviousFocus?.isConnected)overlayPreviousFocus.focus({preventScroll:true})}
function toggleQueue(){if($("nowOverlay").hidden)openNow();$("nowQueue").hidden=!$("nowQueue").hidden;if(!$("nowQueue").hidden)$("nowQueue").scrollIntoView({block:"nearest",behavior:"smooth"})}
function filterSearch(){
 const q=$("searchInput").value.trim().toLocaleLowerCase();
 const hits=albums.map((a,i)=>({a,i})).filter(({a})=>[a.name,a.zh,a.artist,a.mood,a.caption].some(s=>s.toLocaleLowerCase().includes(q)));
 $("searchGrid").innerHTML=hits.map(({a,i})=>renderAlbum(a,i)).join("");
 $("searchEmpty").hidden=hits.length>0;
 $("searchHelp").textContent=q?"找到 "+hits.length+" 个相关结果":"试试搜索「夜晚」「海」「Afterglow」";
}
function closeContext(){$("contextMenu").hidden=true;contextIndex=-1}
function openContext(index,x,y){
 contextIndex=index;const el=$("contextMenu");
 $("contextFavorite").textContent=favorite(index)?"♡ 取消收藏":"♡ 加入收藏";
 el.hidden=false;
 el.style.left=Math.max(10,Math.min(x,window.innerWidth-207))+"px";
 el.style.top=Math.max(10,Math.min(y,window.innerHeight-120))+"px";
}
document.addEventListener("click",e=>{
 const viewButton=e.target.closest("[data-view]");if(viewButton){setView(viewButton.dataset.view);return}
 const fav=e.target.closest("[data-favorite]");if(fav){toggleFavorite(Number(fav.dataset.favorite));return}
 const play=e.target.closest("[data-play-track]");if(play){if(Date.now()<suppressClickUntil)return;const i=Number(play.dataset.playTrack);if(i===selected)togglePlay();else setTrack(i);return}
 if(!e.target.closest("#contextMenu"))closeContext();
});
document.querySelectorAll(".album-card").forEach(()=>{});
document.addEventListener("pointerdown",e=>{
 const card=e.target.closest(".album-card");if(!card||e.target.closest(".album-fav"))return;
 clearTimeout(pressTimer);card.classList.add("pressing");
 const index=Number(card.dataset.index),x=e.clientX,y=e.clientY;
 pressTimer=setTimeout(()=>{suppressClickUntil=Date.now()+700;card.classList.remove("pressing");openContext(index,x,y)},570);
});
for(const event of ["pointerup","pointercancel","pointermove"]){document.addEventListener(event,e=>{
 if(event==="pointermove"&&(!e.buttons||Math.abs(e.movementX)<10&&Math.abs(e.movementY)<10))return;
 clearTimeout(pressTimer);document.querySelectorAll(".album-card.pressing").forEach(el=>el.classList.remove("pressing"));
},{passive:true})}
document.addEventListener("contextmenu",e=>{const card=e.target.closest(".album-card");if(card){e.preventDefault();openContext(Number(card.dataset.index),e.clientX,e.clientY)}});
$("contextPlay").addEventListener("click",()=>{if(contextIndex<0)return;setTrack(contextIndex);closeContext()});
$("contextFavorite").addEventListener("click",()=>{if(contextIndex<0)return;toggleFavorite(contextIndex);closeContext()});
for(const id of ["playBtn","mobilePlayBtn","nowPlay"])$(id).addEventListener("click",togglePlay);
for(const id of ["nextBtn","nowNext"])$(id).addEventListener("click",()=>nextTrack(1));
for(const id of ["prevBtn","nowPrev"])$(id).addEventListener("click",()=>audio.currentTime>3?(audio.currentTime=0):nextTrack(-1));
for(const id of ["playerHeart","nowHeart"])$(id).addEventListener("click",()=>toggleFavorite(selected));
for(const id of ["openNow","openNowText"])$(id).addEventListener("click",openNow);
$("closeNow").addEventListener("click",closeNow);
$("nowQueueButton").addEventListener("click",toggleQueue);
$("queueBtn").addEventListener("click",toggleQueue);
$("openQueueInline").addEventListener("click",toggleQueue);
$("desktopSearch").addEventListener("click",()=>setView("search"));
$("aboutBtn").addEventListener("click",()=>showToast("Frequency 是独立的 Apple 风格界面实验，非 Apple 官方产品"));
$("searchInput").addEventListener("input",filterSearch);
$("shuffleBtn").addEventListener("click",()=>{$("shuffleBtn").classList.toggle("active",shuffle=!shuffle);showToast(shuffle?"随机播放已开启":"随机播放已关闭")});
$("repeatBtn").addEventListener("click",()=>{$("repeatBtn").classList.toggle("active",repeat=!repeat);showToast(repeat?"单曲循环已开启":"单曲循环已关闭")});
$("volume").addEventListener("input",e=>{audio.volume=Number(e.target.value)/100;setProgressCSS(e.target,Number(e.target.value))});
setProgressCSS($("volume"),75);
for(const [id,flag] of [["seek","desktop"],["nowSeek","now"]]){
 const range=$(id);
 range.addEventListener("pointerdown",()=>{if(flag==="desktop")isScrubbing=true;else nowScrubbing=true});
 range.addEventListener("input",()=>{if(flag==="desktop")isScrubbing=true;else nowScrubbing=true;const dur=actualDuration(),s=Number(range.value)/1000*dur;range.style.setProperty("--range-progress",Number(range.value)/10+"%");if(flag==="desktop")$("currentTime").textContent=fmt(s);else $("nowCurrent").textContent=fmt(s)});
 const commit=()=>{const dur=actualDuration();if(dur)audio.currentTime=Math.max(0,Math.min(dur,Number(range.value)/1000*dur));isScrubbing=false;nowScrubbing=false;syncTime()};
 range.addEventListener("change",commit);range.addEventListener("pointerup",commit);range.addEventListener("pointercancel",()=>{isScrubbing=false;nowScrubbing=false;syncTime()});
}
audio.addEventListener("timeupdate",syncTime);audio.addEventListener("loadedmetadata",syncTime);audio.addEventListener("durationchange",syncTime);
audio.addEventListener("play",updatePlayIcons);audio.addEventListener("pause",updatePlayIcons);
audio.addEventListener("ended",()=>repeat?(audio.currentTime=0,audio.play().catch(()=>{})):nextTrack(1));
audio.addEventListener("error",()=>{if(audio.error)showToast("试听音频加载失败，可稍后重试")});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){closeContext();closeNow();return}
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setView("search");return}
 if(e.code==="Space"&&!e.repeat&&!e.target.closest("button,input,textarea,[contenteditable]")){e.preventDefault();togglePlay()}
});
$("dateLabel").textContent=new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"long"}).format(new Date());
audio.src=soundFiles[0];audio.load();
render();setView("home");syncTime();updatePlayIcons();
