const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const state={manifest:[],brief:null,currentDate:null,searchIndex:null,allBriefs:null,currentView:"brief"};

function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function sourceLinks(sources=[]){if(!sources.length)return"";return '<div class="source-row">'+sources.map(s=>s.url?`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">↗ ${esc(s.label||"来源")}</a>`:`<span class="source-link">${esc(s.label||"来源")}</span>`).join("")+'</div>'}
function sectionIcon(kind){return({core:"10",extensions:"8",questions:"?",projects:"5",person:"1",signals:"↗"}[kind]||"•")}
function renderStory(x){return `<article class="story" id="item-${esc(x.id||x.n)}" data-search-text="${esc([x.title,x.summary,x.background,x.importance,x.impact,(x.tags||[]).join(" ")].join(" "))}">
<div class="story-head"><div class="story-num">${String(x.n).padStart(2,"0")}</div><div><h3>${esc(x.title)}</h3><div class="story-tags">${(x.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div></div></div>
<p class="story-summary">${esc(x.summary)}</p>
<div class="story-more"><details><summary>展开背景、意义与与你的关系 <span>＋</span></summary><div class="story-detail">
<div class="detail-cell"><small>关键背景</small><p>${esc(x.background)}</p></div>
<div class="detail-cell"><small>为什么重要</small><p>${esc(x.importance)}</p></div>
<div class="detail-cell"><small>值得你关注</small><p>${esc(x.impact)}</p></div>
</div></details></div>${sourceLinks(x.sources)}</article>`}
function section(id,title,subtitle,kind,content,count,open=true){return `<section class="brief-section" id="${id}"><div class="section-shell ${open?"":"collapsed"}"><button class="section-toggle" type="button"><span class="section-icon">${sectionIcon(kind)}</span><span class="section-title"><strong>${esc(title)}</strong><span>${esc(subtitle)}</span></span><span class="section-count">${count}</span><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button><div class="section-content">${content}</div></div></section>`}
function renderProject(p,i){return `<article class="project-card" id="project-${i+1}" data-search-text="${esc(Object.values(p).filter(v=>typeof v==="string").join(" "))}"><div class="project-type">${esc(p.type)} · 难度 ${esc(p.difficulty)}</div><h3>${esc(p.name)}</h3><div class="one-line">${esc(p.definition)}</div><div class="project-facts">
<div class="project-fact"><b>为什么适合：</b>${esc(p.why)}</div><div class="project-fact"><b>借鉴：</b>${esc(p.reuse)}</div><div class="project-fact"><b>MVP：</b>${esc(p.mvp)}</div><div class="project-fact"><b>学习收益：</b>${esc(p.learning)}</div><div class="project-fact"><b>最大风险：</b>${esc(p.risk)}</div><div class="project-fact"><b>Project Scout：</b>${esc(p.next)}</div></div><div class="project-question">思考：${esc(p.question)}</div>${p.source?.url?`<div class="source-row" style="margin-left:0"><a class="source-link" href="${esc(p.source.url)}" target="_blank" rel="noopener">↗ ${esc(p.source.label||"参考项目")}</a></div>`:""}</article>`}

async function getAllBriefs(){
  if(state.allBriefs)return state.allBriefs;
  state.allBriefs=(await Promise.all(state.manifest.map(m=>fetch(m.path,{cache:"no-store"}).then(r=>r.json()).catch(()=>null)))).filter(Boolean);
  return state.allBriefs;
}
async function renderCollection(kind,push=true){
  const briefs=await getAllBriefs(); state.currentView=kind; state.currentDate=null; state.brief=null;
  document.querySelectorAll(".collection-link,.collection-pill").forEach(el=>el.classList.toggle("active",el.dataset.collection===kind));
  let body="",title="",deck="",count=0;
  if(kind==="projects"){
    const items=[];briefs.forEach(b=>(b.projects||[]).forEach(p=>items.push({...p,type:`${b.date} · ${p.type}`})));
    count=items.length;title="Project Scout 项目库";deck="把每天分散的候选集中到一个长期灵感库里。先比较、研究、淘汰，再决定哪些值得真正开工。";
    body='<div class="project-grid">'+items.map(renderProject).join("")+'</div>';
  }else{
    const items=briefs.filter(b=>b.person).map(b=>({date:b.date,person:b.person}));
    count=items.length;title="科技人物库";deck="跨日期回看工程师、研究者、创始人与设计者：不仅看成功，也保留失败、约束与时代条件。";
    body='<div class="people-grid">'+items.map(x=>`<article class="person-library-card"><small>${esc(x.date)}</small><h3>${esc(x.person.name)}</h3><p>${esc(x.person.subtitle)}</p><button class="library-cta" data-person-date="${esc(x.date)}">打开当天人物传记</button></article>`).join("")+'</div>';
  }
  $("#briefRoot").innerHTML=`<header class="collection-hero"><div class="eyebrow">SHUGE DAILY · COLLECTION</div><h1>${esc(title)}</h1><p>${esc(deck)}</p><div class="collection-meta">${count} 个条目 · 随每日简报持续增长</div></header><section class="brief-section"><div class="section-shell"><div class="section-content" style="border-top:0">${body}</div></div></section>`;
  $("#sectionNav").innerHTML="";renderDateNav();document.title=`${title} · 鼠哥晨间简报`;
  document.querySelectorAll("[data-person-date]").forEach(btn=>btn.onclick=async()=>{await loadBrief(btn.dataset.personDate,true);setTimeout(()=>$("#person")?.scrollIntoView({behavior:"smooth",block:"start"}),60)});
  closeArchive();window.scrollTo({top:0,behavior:"instant"});updateProgress();
  if(push)history.pushState({view:kind},"",`?view=${encodeURIComponent(kind)}`);
}
function renderBrief(b){
  state.brief=b; state.currentDate=b.date; state.currentView="brief"; document.title=`${b.date} · 鼠哥晨间简报`;
  document.querySelectorAll(".collection-link,.collection-pill").forEach(el=>el.classList.remove("active"));
  const core=b.core.map(renderStory).join(""), ext=b.extensions.map(renderStory).join("");
  const questions='<div class="question-list">'+b.questions.map((q,i)=>`<div class="question"><b>${esc(q.label||("问题 "+(i+1)))}</b><p>${esc(q.text)}</p></div>`).join("")+'</div>';
  const projects='<div class="project-grid">'+b.projects.map(renderProject).join("")+'</div>'+(b.projectCompare?.length?'<div class="question-list">'+b.projectCompare.map((q,i)=>`<div class="question"><b>比较题 ${i+1}</b><p>${esc(q)}</p></div>`).join("")+'</div>':"");
  const person='<div class="person-hero"><div class="person-kicker">TECH PERSON OF THE DAY</div><h3>'+esc(b.person.name)+'</h3><p>'+esc(b.person.subtitle)+'</p></div><div class="person-body">'+b.person.sections.map(s=>`<div class="person-block"><h4>${esc(s.title)}</h4><p>${esc(s.body)}</p></div>`).join("")+'</div><div class="question-list">'+b.person.questions.map((q,i)=>`<div class="question"><b>人物问题 ${i+1}</b><p>${esc(q)}</p></div>`).join("")+'</div>';
  const signals='<div class="signals">'+b.finalSignals.map((x,i)=>`<div class="final-signal"><span>${String(i+1).padStart(2,"0")}</span><p>${esc(x)}</p></div>`).join("")+'</div><div class="focus-topics">'+b.deepDive.map((x,i)=>`<div class="focus-topic"><small>DEEP DIVE 0${i+1}</small><strong>${esc(x)}</strong></div>`).join("")+'</div>';
  $("#briefRoot").innerHTML=`<header class="hero"><div class="eyebrow">${esc(b.weekday)} · ${esc(b.date)}</div><h1>${esc(b.title)}</h1><p class="hero-deck">${esc(b.deck)}</p><div class="hero-meta"><span class="meta-chip">10 核心</span><span class="meta-chip">8 跨领域</span><span class="meta-chip">5 项目候选</span><span class="meta-chip">1 科技人物</span><span class="meta-chip">${esc(b.window||"")}</span></div></header>
  <div class="signal-strip">${(b.topSignals||[]).slice(0,3).map((s,i)=>`<div class="signal"><div class="k">SIGNAL 0${i+1}</div><strong>${esc(s)}</strong></div>`).join("")}</div>
  ${section("core","核心 10 条","AI、芯片、机器人、科研与职业判断","core",'<div class="story-list">'+core+'</div>',b.core.length,true)}
  ${section("extensions","跨领域扩展 8 条","政治 ×2 · 艺术 · 生物 · 教育 · 历史 · 金融 · 生态","extensions",'<div class="story-list">'+ext+'</div>',b.extensions.length,false)}
  ${section("questions","18 条之后的思考题","跨领域结构 · 与你相关 · 反事实权衡","questions",questions,b.questions.length,false)}
  ${section("projects","Project Scout","5 个差异化候选，不自动开工","projects",projects,b.projects.length,false)}
  ${section("person","今日科技人物","不神化，保留失败、约束与时代背景","person",person,1,false)}
  ${section("signals","今天最值得记住","跨领域信号与最多 2 个深挖主题","signals",signals,b.finalSignals.length,false)}`;
  bindSectionToggles(); renderSectionNav(b); renderDateNav(); window.scrollTo({top:0,behavior:"instant"}); updateProgress(); updateSectionActive();
}
function bindSectionToggles(){$$(".section-toggle").forEach(btn=>btn.addEventListener("click",()=>btn.closest(".section-shell").classList.toggle("collapsed")))}
function renderSectionNav(b){const items=[["core","核心 10 条",10],["extensions","跨领域",8],["questions","思考题",b.questions.length],["projects","项目候选",b.projects.length],["person","科技人物",1],["signals","今日信号",b.finalSignals.length]];$("#sectionNav").innerHTML=items.map(i=>`<button class="section-link" data-target="${i[0]}"><span>${i[1]}</span><span>${i[2]}</span></button>`).join("");$$(".section-link").forEach(b=>b.onclick=()=>{const el=$("#"+b.dataset.target);el?.scrollIntoView({behavior:"smooth",block:"start"})})}
function renderDateNav(){const html=state.manifest.map(x=>`<button class="date-link ${x.date===state.currentDate?"active":""}" data-date="${x.date}"><span>${x.label||x.date}</span><small>${x.date===state.manifest[0]?.date?"最新":""}</small></button>`).join("");$("#dateList").innerHTML=html;$("#mobileDateList").innerHTML=html;$$(".date-link").forEach(b=>b.onclick=()=>loadBrief(b.dataset.date,true))}
async function loadBrief(date,push=false){const meta=state.manifest.find(x=>x.date===date)||state.manifest[0];if(!meta)return;try{const b=await fetch(meta.path,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()});renderBrief(b);if(push){history.pushState({date},"",`?date=${encodeURIComponent(b.date)}`);closeArchive()}}catch(e){$("#briefRoot").innerHTML=`<div class="loading-state"><p>这一天的简报暂时读取失败。</p></div>`}}
async function loadManifest(){state.manifest=await fetch("./data/manifest.json",{cache:"no-store"}).then(r=>r.json());const params=new URLSearchParams(location.search);const view=params.get("view"),q=params.get("date");if(view==="projects"||view==="people")await renderCollection(view,false);else await loadBrief(q||state.manifest[0]?.date)}
function setTheme(v){document.documentElement.dataset.theme=v;localStorage.setItem("brief-theme",v)}
function initTheme(){const saved=localStorage.getItem("brief-theme");if(saved)return setTheme(saved);setTheme(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}
function toggleTheme(){setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark")}
function toggleDensity(){document.body.classList.toggle("compact");localStorage.setItem("brief-density",document.body.classList.contains("compact")?"compact":"full");showToast(document.body.classList.contains("compact")?"已切换到扫描模式":"已切换到深度阅读")}
function showToast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove("show"),1500)}
function openSearch(){const o=$("#searchOverlay");o.classList.add("open");o.setAttribute("aria-hidden","false");setTimeout(()=>$("#searchInput").focus(),20);buildSearchIndex()}
function closeSearch(){$("#searchOverlay").classList.remove("open");$("#searchOverlay").setAttribute("aria-hidden","true")}
async function buildSearchIndex(){if(state.searchIndex)return state.searchIndex;const briefs=await getAllBriefs();const out=[];briefs.filter(Boolean).forEach(b=>{[...b.core,...b.extensions].forEach(x=>out.push({date:b.date,section:x.n<=10?"核心资讯":"跨领域",title:x.title,text:[x.summary,x.background,x.importance,x.impact,(x.tags||[]).join(" ")].join(" "),target:`item-${x.id||x.n}`}));b.projects.forEach((p,i)=>out.push({date:b.date,section:"Project Scout",title:p.name,text:Object.values(p).filter(v=>typeof v==="string").join(" "),target:`project-${i+1}`}));out.push({date:b.date,section:"科技人物",title:b.person.name,text:b.person.sections.map(s=>s.body).join(" "),target:"person"})});state.searchIndex=out;return out}
async function doSearch(q){const idx=await buildSearchIndex();const term=q.trim().toLowerCase();if(!term){$("#searchMeta").textContent="输入关键词，搜索全部归档";$("#searchResults").innerHTML="";return}const words=term.split(/\s+/);const hits=idx.map(x=>({x,score:words.reduce((n,w)=>n+((x.title+" "+x.text).toLowerCase().includes(w)?1:0),0)})).filter(y=>y.score>0).sort((a,b)=>b.score-a.score).slice(0,40);$("#searchMeta").textContent=`找到 ${hits.length} 条结果`;$("#searchResults").innerHTML=hits.map(({x})=>`<button class="search-result" data-date="${x.date}" data-target="${x.target}"><small>${x.date} · ${x.section}</small><strong>${esc(x.title)}</strong><p>${esc(x.text.slice(0,150))}</p></button>`).join("");$$(".search-result").forEach(b=>b.onclick=async()=>{await loadBrief(b.dataset.date,true);closeSearch();setTimeout(()=>$("#"+b.dataset.target)?.scrollIntoView({behavior:"smooth",block:"center"}),80)})}
function openArchive(){$("#archiveSheet").classList.add("open");$("#archiveSheet").setAttribute("aria-hidden","false");$("#archiveBackdrop").hidden=false;$("#archiveBackdrop").classList.add("show")}
function closeArchive(){$("#archiveSheet").classList.remove("open");$("#archiveSheet").setAttribute("aria-hidden","true");$("#archiveBackdrop").classList.remove("show");setTimeout(()=>$("#archiveBackdrop").hidden=true,250)}
function updateProgress(){const el=$("#readingProgress");if(!el)return;const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);el.style.width=(Math.min(1,Math.max(0,scrollY/max))*100)+"%"}
function updateSectionActive(){if(state.currentView!=="brief")return;const sections=[...document.querySelectorAll(".brief-section")];let current=null;for(const s of sections){if(s.getBoundingClientRect().top<=150)current=s.id}document.querySelectorAll(".section-link").forEach(x=>x.classList.toggle("active",x.dataset.target===current))}
addEventListener("scroll",()=>{updateProgress();updateSectionActive()},{passive:true});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}else if(e.key==="/"&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();openSearch()}else if(e.key==="Escape"){closeSearch();closeArchive()}});
window.addEventListener("popstate",async e=>{const params=new URLSearchParams(location.search),view=e.state?.view||params.get("view");if(view==="projects"||view==="people")await renderCollection(view,false);else await loadBrief(e.state?.date||params.get("date")||state.manifest[0]?.date)});
async function boot(){
  initTheme();
  if(localStorage.getItem("brief-density")==="compact")document.body.classList.add("compact");
  $("#themeToggle").onclick=toggleTheme;
  $("#densityToggle").onclick=toggleDensity;
  document.querySelectorAll(".search-open").forEach(b=>b.onclick=openSearch);
  $("#searchClose").onclick=closeSearch;
  $("#searchInput").oninput=e=>doSearch(e.target.value);
  $("#searchOverlay").onclick=e=>{if(e.target===$("#searchOverlay"))closeSearch()};
  $("#archiveClose").onclick=closeArchive;
  $("#archiveBackdrop").onclick=closeArchive;
  document.querySelectorAll("[data-collection]").forEach(b=>b.onclick=()=>renderCollection(b.dataset.collection,true));
  document.querySelectorAll("[data-mobile-action]").forEach(b=>b.onclick=async()=>{
    if(b.dataset.mobileAction==="search")openSearch();
    else if(b.dataset.mobileAction==="archive")openArchive();
    else if(state.currentView!=="brief")await loadBrief(state.manifest[0]?.date,true);
    else window.scrollTo({top:0,behavior:"smooth"});
  });
  await loadManifest();
}
boot().catch(err=>{
  console.error("SHUGE DAILY boot failed",err);
  const root=$("#briefRoot");
  if(root)root.innerHTML='<div class="loading-state"><p>简报数据暂时无法加载，请刷新后重试。</p></div>';
});