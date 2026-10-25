"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const tracks = [
    { title:"月光存档", artist:"深蓝电台", duration:213, accent:"#b8a27a", deep:"#142a32", cool:"#275361", light:"#ae9668", hue:"0deg", lines:[
      [0,"在无数个失眠的夜里"],[15,"我把月光存成一封信"],[32,"寄给还没有抵达的自己"],[51,"等风经过时　再轻轻打开"],[70,"那些未完成的梦　依然闪着光"],[89,"城市安静了　星星却没有睡"],[109,"沿着海岸　慢慢走向天亮"],[129,"你说时间会带走所有秘密"],[149,"我说它也会替我们珍藏"],[169,"如果你也在听这一段月光"],[191,"就让夜晚　再停留一会儿"]
    ] },
    { title:"潮汐来信", artist:"浮光邮局", duration:188, accent:"#8ac3bc", deep:"#0e2938", cool:"#3c777c", light:"#75afa3", hue:"115deg", lines:[
      [0,"海风把回忆吹向远方"],[17,"浪花写下不会寄出的信"],[35,"潮水漫过脚边的旧时光"],[53,"把心事留在沙滩的边缘"],[72,"灯塔向沉默的海面眨眼"],[90,"每一次潮起都有新的方向"],[109,"不必追问明天的答案"],[131,"我们都在缓慢地靠岸"],[155,"今夜让月色替我说晚安"],[174,"下一封信　写给明天"]
    ] },
    { title:"凌晨四点的星", artist:"雾灯计划", duration:226, accent:"#a5a0d7", deep:"#1b233e", cool:"#433c72", light:"#8e82bc", hue:"215deg", lines:[
      [0,"凌晨四点　窗外还有一颗星"],[18,"它不急着让黑夜结束"],[38,"一盏灯陪着寂静的街道"],[59,"回声在楼宇之间旅行"],[81,"如果世界暂时忘记了你"],[104,"至少还有这微弱的光"],[124,"每颗星都有自己的时差"],[149,"每个人都值得慢慢发亮"],[177,"当第一束晨光越过屋檐"],[202,"我们终于和自己重逢"]
    ] }
  ];
  const state={index:0,time:8,playing:true,favorites:new Set(),shuffle:false,lyrics:true,motion:true,lastFrame:null,active:-1,wasQueueFocus:null};
  const motionReduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function clock(s){s=Math.max(0,Math.floor(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
  function announce(message){$("live-announcement").textContent=message;}
  function current(){return tracks[state.index];}
  function setRange(el,percent){el.style.setProperty("--percent",Math.max(0,Math.min(100,percent))+"%");}
  function updateTimeUI(){
    const t=current();
    $("progress").max=t.duration;
    $("progress").value=Math.min(state.time,t.duration);
    setRange($("progress"),100*state.time/t.duration);
    $("elapsed").value=clock(state.time);
    $("remaining").textContent="−"+clock(t.duration-state.time);
  }
  function updatePlayUI(){
    $("play-use").setAttribute("href",state.playing?"#ic-pause":"#ic-play");
    $("play").setAttribute("aria-label",state.playing?"暂停模拟播放":"继续模拟播放");
    document.body.classList.toggle("paused",!state.playing);
    $("lyrics-section").classList.toggle("not-playing",!state.playing);
  }
  function makeLyrics(){
    const list=$("lyrics-list");
    list.replaceChildren();
    current().lines.forEach((entry,i)=>{
      const button=document.createElement("button");
      button.type="button";button.className="lyric";
      button.textContent=entry[1];
      button.setAttribute("aria-label",entry[1]+", 跳转至 "+clock(entry[0]));
      button.addEventListener("click",()=>{state.time=entry[0];state.lastFrame=null;updateTimeUI();updateLyric(true);announce("已跳转到 "+clock(entry[0]));});
      list.append(button);
    });
    state.active=-1;
    updateLyric(true);
  }
  function updateLyric(force){
    if(!state.lyrics)return;
    const lines=current().lines;
    let active=0;
    for(let i=0;i<lines.length;i++)if(state.time>=lines[i][0])active=i;
    if(active===state.active&&!force)return;
    state.active=active;
    const nodes=Array.from($("lyrics-list").children);
    nodes.forEach((node,i)=>{
      node.classList.toggle("active",i===active);
      node.dataset.distance=Math.min(3,Math.abs(i-active));
      node.setAttribute("aria-current",i===active?"true":"false");
    });
    const target=nodes[active],viewport=$("lyrics-viewport");
    if(target&&viewport){
      const y=target.offsetTop+target.offsetHeight/2-viewport.clientHeight/2;
      viewport.scrollTo({top:Math.max(0,y),behavior:(motionReduced||force)?"instant":"smooth"});
    }
    $("lyric-indicator").textContent=String(active+1).padStart(2,"0")+" / "+String(lines.length).padStart(2,"0");
  }
  function updateTheme(){
    const t=current();
    const s=document.documentElement.style;
    s.setProperty("--base",t.deep);s.setProperty("--light",t.light);s.setProperty("--cool",t.cool);s.setProperty("--accent",t.accent);
    // Keep the optical engine filter on the image itself; apply track tint to its frame.
    $("large-cover").closest(".art-frame").style.filter="hue-rotate("+t.hue+")";
    $("small-cover").style.filter="hue-rotate("+t.hue+")";
  }
  function renderQueue(){
    const list=$("queue-items");list.replaceChildren();
    tracks.forEach((t,i)=>{
      const b=document.createElement("button");
      b.className="queue-track";b.type="button";
      b.setAttribute("aria-current",i===state.index?"true":"false");
      const idx=document.createElement("span");idx.className="queue-index";idx.textContent=i===state.index?"♫":String(i+1).padStart(2,"0");
      const inner=document.createElement("span");
      const name=document.createElement("b");name.textContent=t.title;
      const subtitle=document.createElement("small");subtitle.textContent=t.artist+" · "+clock(t.duration);
      inner.append(name,subtitle);b.append(idx,inner);
      b.addEventListener("click",()=>{changeTrack(i);closeQueue();});
      list.append(b);
    });
  }
  function changeTrack(i){
    document.body.classList.remove('is-switching');
    void document.body.offsetWidth;
    document.body.classList.add('is-switching');
    state.index=(i+tracks.length)%tracks.length;
    state.time=0;state.lastFrame=null;
    const t=current();
    $("song-title").textContent=t.title;$("song-artist").textContent=t.artist;
    $("favorite").setAttribute("aria-pressed",String(state.favorites.has(state.index)));
    $("favorite").setAttribute("aria-label",state.favorites.has(state.index)?"取消收藏":"收藏歌曲");
    updateTheme();updateTimeUI();makeLyrics();renderQueue();
    announce("正在模拟播放："+t.title+"，"+t.artist);
  }
  function openQueue(){
    $("queue-shade").classList.remove("hidden");$("queue-drawer").classList.remove("hidden");$("queue").setAttribute("aria-expanded","true");
    renderQueue();$("close-queue").focus();
  }
  function closeQueue(){
    $("queue-shade").classList.add("hidden");$("queue-drawer").classList.add("hidden");$("queue").setAttribute("aria-expanded","false");$("queue").focus();
  }
  function closeMore(){$("more-menu").classList.add("hidden");$("more").setAttribute("aria-expanded","false");}
  function next(){
    if(state.shuffle){const others=tracks.map((_,i)=>i).filter(i=>i!==state.index);changeTrack(others[Math.floor(Math.random()*others.length)]);}
    else changeTrack(state.index+1);
  }
  $("play").addEventListener("click",()=>{
    state.playing=!state.playing;state.lastFrame=null;updatePlayUI();
    announce(state.playing?"继续模拟播放":"已暂停模拟播放");
  });
  $("next").addEventListener("click",next);
  $("prev").addEventListener("click",()=>{if(state.time>3){state.time=0;updateTimeUI();updateLyric(true);}else changeTrack(state.index-1);});
  $("shuffle").addEventListener("click",()=>{state.shuffle=!state.shuffle;$("shuffle").setAttribute("aria-pressed",String(state.shuffle));announce(state.shuffle?"随机播放已开启":"顺序播放已开启");});
  $("favorite").addEventListener("click",()=>{const i=state.index;if(state.favorites.has(i))state.favorites.delete(i);else state.favorites.add(i);const pressed=state.favorites.has(i);$("favorite").setAttribute("aria-pressed",String(pressed));$("favorite").setAttribute("aria-label",pressed?"取消收藏":"收藏歌曲");announce(pressed?"已收藏 "+current().title:"已取消收藏");});
  $("progress").addEventListener("input",(event)=>{state.time=Number(event.target.value);state.lastFrame=null;updateTimeUI();updateLyric(true);});
  $("volume").addEventListener("input",(event)=>{const value=Number(event.target.value);setRange($("volume"),value);$("volume-label").textContent=value+"%";});
  $("queue").addEventListener("click",openQueue);$("close-queue").addEventListener("click",closeQueue);$("queue-shade").addEventListener("click",closeQueue);
  $("more").addEventListener("click",()=>{const open=$("more-menu").classList.toggle("hidden");$("more").setAttribute("aria-expanded",String(!open));});
  $("toggle-motion").addEventListener("click",()=>{state.motion=!state.motion;document.body.classList.toggle("motion-still",!state.motion);$("toggle-motion").textContent=state.motion?"暂停环境动画":"恢复环境动画";closeMore();});
  $("reset-demo").addEventListener("click",()=>{state.time=0;state.lastFrame=null;updateTimeUI();updateLyric(true);closeMore();});
  $("toggle-lyrics").addEventListener("click",()=>{state.lyrics=!state.lyrics;$("toggle-lyrics").setAttribute("aria-pressed",String(state.lyrics));$("lyrics-viewport").style.visibility=state.lyrics?"visible":"hidden";$("lyric-indicator").textContent=state.lyrics?"同步歌词已开启":"歌词已隐藏";if(state.lyrics)updateLyric(true);});
  document.addEventListener("click",event=>{if(!$("more").contains(event.target)&&!$("more-menu").contains(event.target))closeMore();});
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"){if(!$("queue-drawer").classList.contains("hidden"))closeQueue();closeMore();}
    const tag=event.target.tagName;
    if(event.code==="Space"&&!["INPUT","BUTTON","TEXTAREA"].includes(tag)&&event.target!==$("lyrics-viewport")){event.preventDefault();$("play").click();}
    if(event.code==="ArrowRight"&&!["INPUT","BUTTON","TEXTAREA"].includes(tag)){state.time=Math.min(current().duration,state.time+5);updateTimeUI();updateLyric(true);}
    if(event.code==="ArrowLeft"&&!["INPUT","BUTTON","TEXTAREA"].includes(tag)){state.time=Math.max(0,state.time-5);updateTimeUI();updateLyric(true);}
    if(!$("queue-drawer").classList.contains("hidden")&&event.key==="Tab"){
      const focusable=Array.from($("queue-drawer").querySelectorAll("button"));
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  // Touch-friendly elastic response: pointer events work on both iPhone Safari and Edge.
  document.querySelectorAll('.glass-button,.transport-main,.transport-skip,.aux-button').forEach(button=>{
    const release=()=>button.classList.remove('is-pressing');
    button.addEventListener('pointerdown',()=>button.classList.add('is-pressing'));
    button.addEventListener('pointerup',release);
    button.addEventListener('pointercancel',release);
    button.addEventListener('pointerleave',release);
  });
  let lastUI=0;
  function tick(ts){
    if(state.lastFrame===null)state.lastFrame=ts;
    const dt=Math.min(.1,(ts-state.lastFrame)/1000);state.lastFrame=ts;
    if(state.playing){
      state.time+=dt;
      if(state.time>=current().duration)next();
      if(ts-lastUI>90){updateTimeUI();updateLyric(false);lastUI=ts;}
    }
    requestAnimationFrame(tick);
  }
  updateTheme();updatePlayUI();setRange($("volume"),62);updateTimeUI();makeLyrics();renderQueue();requestAnimationFrame(tick);
})();
