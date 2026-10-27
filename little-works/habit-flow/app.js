"use strict";
(() => {
  const KEY = "habit-flow:v1";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const colors = [
    {id:"sage", value:"#548c66", pale:"#eaf3eb", symbol:"✳"},
    {id:"blue", value:"#607da5", pale:"#edf2f8", symbol:"◈"},
    {id:"peach", value:"#cc8f67", pale:"#fcf0e6", symbol:"◉"},
    {id:"plum", value:"#9580a2", pale:"#f4eef6", symbol:"✦"},
    {id:"gold", value:"#a79553", pale:"#f8f5e7", symbol:"◌"}
  ];
  const pad = n => String(n).padStart(2,"0");
  function key(date){return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate());}
  function parse(s){const a=s.split("-").map(Number);return new Date(a[0],a[1]-1,a[2]);}
  function shift(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
  function monday(d){const a=new Date(d.getFullYear(),d.getMonth(),d.getDate());return shift(a,-(a.getDay()+6)%7);}
  function shortDate(d){return (d.getMonth()+1)+"月"+d.getDate()+"日";}
  function longDate(d){return d.getFullYear()+"年"+(d.getMonth()+1)+"月"+d.getDate()+"日";}
  const today=()=>key(new Date());
  const fmtWeek=d=>["日","一","二","三","四","五","六"][d.getDay()];
  function escapeHTML(str){return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function makeId(){return typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():"h"+Date.now().toString(36)+Math.random().toString(36).slice(2);}
  const prototypes=[
    {id:"reading",name:"阅读 20 分钟",note:"给自己一段不被打扰的时间",color:"blue"},
    {id:"exercise",name:"运动 30 分钟",note:"让身体舒展，心也轻盈",color:"sage"},
    {id:"water",name:"喝够 8 杯水",note:"认真照顾自己的小事",color:"peach"},
    {id:"sleep",name:"23:30 前入睡",note:"给明天留一份好精神",color:"plum"}
  ];
  function initial(){return {version:1,habits:prototypes.map(h=>({...h,startDate:today()})),records:{}};}
  function validDate(s){if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=parse(s);return !isNaN(d.getTime())&&key(d)===s;}
  function normalize(src){
    if(!src||typeof src!=="object"||!Array.isArray(src.habits)||typeof src.records!=="object"||!src.records)throw Error("文件结构不正确");
    if(src.habits.length>250)throw Error("习惯数量超出限制");
    const ids=new Set(),habits=[];
    for(const h of src.habits){
      if(!h||typeof h.id!=="string"||!/^[-\w]{1,100}$/.test(h.id)||ids.has(h.id)||typeof h.name!=="string"||!h.name.trim()||h.name.length>32)throw Error("习惯数据不合法");
      ids.add(h.id);
      habits.push({id:h.id,name:h.name.trim(),note:typeof h.note==="string"?h.note.slice(0,70):"",color:colors.some(c=>c.id===h.color)?h.color:"sage",startDate:validDate(h.startDate)?h.startDate:today()});
    }
    const records={};
    if(Object.keys(src.records).length>4000)throw Error("记录过多");
    for(const [day,values] of Object.entries(src.records)){
      if(!validDate(day)||!values||typeof values!=="object"||Array.isArray(values))continue;
      const selected={};
      for(const [id,value] of Object.entries(values))if(ids.has(id)&&value===true)selected[id]=true;
      if(Object.keys(selected).length)records[day]=selected;
    }
    return {version:1,habits,records};
  }
  function load(){try{const saved=localStorage.getItem(KEY);return saved?normalize(JSON.parse(saved)):initial();}catch(err){console.warn("Habit Flow data unavailable",err);return initial();}}
  let data=load(), selected=today(),view="today",period="week",offset=0,editingId=null,chosenColor="sage",toastTimer=null;
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(data));return true;}
    catch(err){showToast("存储失败，请检查浏览器空间或隐私模式");return false;}
  }
  const colorById=id=>colors.find(x=>x.id===id)||colors[0];
  const styleOf=h=>{const c=colorById(h.color);return '--habit-color:'+c.value+';--habit-bg:'+c.pale};
  const completed=(day,id)=>!!data.records[day]?.[id];
  const eligible=(day,h)=>day>=h.startDate && day<=today();
  function dayData(day){
    const elig=data.habits.filter(h=>eligible(day,h));
    const done=elig.filter(h=>completed(day,h.id)).length;
    return {done,total:elig.length};
  }
  function setCompleted(day,id,checked){
    if(day>today()){showToast("还没到来的日子，留给明天");return;}
    const habit=data.habits.find(h=>h.id===id);if(!habit)return;
    if(checked&&day<habit.startDate)habit.startDate=day;
    if(checked){data.records[day]??={};data.records[day][id]=true;}
    else if(data.records[day]){delete data.records[day][id];if(!Object.keys(data.records[day]).length)delete data.records[day];}
    if(save()){render();if(checked)showToast("又完成了一件小事 ✓");}
  }
  function showToast(message){
    const el=$("#toast");el.textContent=message;el.classList.add("show");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);
  }
  function navigate(to){
    view=to;
    $$(".view").forEach(el=>{el.hidden=el.id!==(to==="today"?"todayView":"reviewView");el.classList.toggle("active",!el.hidden);});
    $$("[data-view]").forEach(el=>{const active=el.dataset.view===to;el.classList.toggle("active",active);if(el.classList.contains("side-tab")){if(active)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");}});
    render();
    window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  }
  function renderToday(){
    const d=parse(selected),now=new Date(),isToday=selected===today();
    $("#topDate").textContent=longDate(now)+" · 周"+fmtWeek(now);
    const hour=now.getHours();$("#greeting").textContent=(hour<11?"早上好":hour<18?"下午好":"晚上好")+"，今天是周"+fmtWeek(now);
    $("#selectedLabel").textContent=isToday?"今天":shortDate(d);
    const all=data.habits.length,details=dayData(selected),done=details.done,rate=details.total?Math.round(100*done/details.total):0;
    $("#completedCount").textContent=done+" / "+all;
    $("#progressPercent").textContent=rate+"%";
    $("#progressRing").setAttribute("aria-label",shortDate(d)+"完成 "+rate+"%");
    $("#ringFill").setAttribute("stroke-dasharray",rate+" "+(100-rate));
    $("#progressHeadline").innerHTML=rate===100&&all?"真好，今天的约定<br>都兑现了。":done>0?"已经向前走了<br>"+done+" 小步。":"每一点进步<br>都值得记录。";
    $("#progressSub").textContent=rate===100&&all?"留一点时间，好好享受今天。":done>0?"按照自己的节奏，继续就好。":"完成一件小事，点亮今天。";
    $("#habitNumber").textContent=all;
    $("#listSubtitle").textContent=isToday?"无需着急，一件一件完成。":"正在查看 "+longDate(d)+" 的记录";
    const start=monday(now),week=[],marked=[];
    for(let i=0;i<7;i++){
      const date=shift(start,i),day=key(date),s=dayData(day),isFuture=day>today();
      marked.push(s.done);
      week.push('<button type="button" class="week-day '+(day===selected?'active ':'')+(day===today()?'today':'')+'" data-day="'+day+'" '+(isFuture?'disabled':'')+' aria-label="'+shortDate(date)+(s.total?'，完成'+s.done+'项':'，无记录')+'" aria-pressed="'+(day===selected)+'"><span class="dayname">'+fmtWeek(date)+'</span><span class="dayno">'+date.getDate()+'</span><span class="daymark '+(s.done?(s.done===s.total?'done':'partial'):'')+'"></span></button>');
    }
    $("#weekRail").innerHTML=week.join("");
    $("#weekInsight").textContent=marked.some(Boolean)?"这一周，你已经完成了 "+marked.reduce((a,b)=>a+b,0)+" 次小约定。":"新的节奏，从今天开始。";
    $("#weekSubtitle").textContent=shortDate(start)+" — "+shortDate(shift(start,6));
    $("#weekTag").textContent="本周";
    $("#habitsList").innerHTML=data.habits.length?data.habits.map((h,i)=>{
      const done=completed(selected,h.id);
      return '<article class="habit-row '+(done?'completed':'')+'" style="animation-delay:'+Math.min(i*35,180)+'ms"><div class="habit-symbol" style="'+styleOf(h)+'" aria-hidden="true">'+colorById(h.color).symbol+'</div><div class="habit-info"><h3>'+escapeHTML(h.name)+'</h3><p>'+escapeHTML(h.note||"给自己的一份小小约定")+'</p></div><button type="button" class="edit-habit" data-edit="'+escapeHTML(h.id)+'" aria-label="编辑'+escapeHTML(h.name)+'" title="编辑习惯">···</button><button type="button" class="check-habit" data-check="'+escapeHTML(h.id)+'" aria-label="'+(done?'取消完成':'完成')+escapeHTML(h.name)+'" aria-pressed="'+done+'" '+(selected>today()?'disabled':'')+'>'+ (done?'✓':'') +'</button></article>';
    }).join(""):'<div class="empty">这里还没有习惯。<br>先写下想每天完成的一件小事吧。<br><button type="button" id="emptyAdd">＋ 创建我的第一个习惯</button></div>';
    $$("[data-day]",$("#weekRail")).forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.day;renderToday();}));
    $$("[data-check]",$("#habitsList")).forEach(b=>b.addEventListener("click",()=>setCompleted(selected,b.dataset.check,!completed(selected,b.dataset.check))));
    $$("[data-edit]",$("#habitsList")).forEach(b=>b.addEventListener("click",()=>openHabit(b.dataset.edit)));
    $("#emptyAdd")?.addEventListener("click",()=>openHabit());
  }
  function longestStreak(h){
    let best=0,run=0,day=parse(h.startDate),end=parse(today());
    const maxdays=2500;
    for(let n=0;n<maxdays&&day<=end;n++,day=shift(day,1)){if(completed(key(day),h.id)){run++;best=Math.max(best,run);}else run=0;}
    return best;
  }
  function currentRange(){
    const now=new Date(),date=period==="week"?monday(now):new Date(now.getFullYear(),now.getMonth(),1);
    if(period==="week"){const start=shift(date,offset*7);return {start,end:shift(start,6)};}
    const start=new Date(date.getFullYear(),date.getMonth()+offset,1);
    return {start,end:new Date(start.getFullYear(),start.getMonth()+1,0)};
  }
  function rangeDays(range){const days=[];for(let d=new Date(range.start),n=0;d<=range.end&&n<32;d=shift(d,1),n++)days.push(key(d));return days;}
  function renderReview(){
    const {start,end}=currentRange(),days=rangeDays({start,end}),actual=days.filter(d=>d<=today());
    const done=actual.reduce((sum,d)=>sum+dayData(d).done,0);
    const total=actual.reduce((sum,d)=>sum+dayData(d).total,0);
    const pct=total?Math.round(100*done/total):null;
    $("#rangeTitle").textContent=period==="week"?shortDate(start)+" — "+shortDate(end):start.getFullYear()+"年 "+(start.getMonth()+1)+"月";
    $("#statDone").textContent=done;
    $("#statRate").textContent=pct===null?"—":pct+"%";
    $("#statStreak").innerHTML=Math.max(0,...data.habits.map(longestStreak))+' <em>天</em>';
    $("#nextRange").disabled=offset>=0;
    const chart=$("#reviewChart");
    if(period==="week"){
      $("#chartTitle").textContent="这一周的节奏";
      $("#chartSubtitle").textContent="每一天的完成率";
      chart.innerHTML='<div class="weekly-bars">'+days.map(day=>{
        const s=dayData(day),date=parse(day),p=s.total?Math.round(s.done*100/s.total):0,notYet=day>today();
        return '<div class="bar-col '+(day===today()?'today':'')+'"><div class="bar-value">'+(notYet?'—':s.done?s.done+'/'+s.total:'0')+'</div><div class="bar-track"><div class="bar-fill" style="height:'+p+'%"></div></div><div class="bar-label">周'+fmtWeek(date)+'</div></div>';
      }).join("")+'</div>';
      $("#chartCaption").textContent="每根柱子代表当天完成的习惯占比；灰色日期尚未开始。";
    }else{
      $("#chartTitle").textContent="月度足迹";
      $("#chartSubtitle").textContent="颜色越深，完成越多。点击日期可补记。";
      let html='<div class="month-grid">';
      for(const wd of ["一","二","三","四","五","六","日"])html+='<span class="month-weekday">'+wd+'</span>';
      const blanks=(start.getDay()+6)%7;
      for(let i=0;i<blanks;i++)html+='<span class="month-day blank" aria-hidden="true"></span>';
      html+=days.map(day=>{
        const s=dayData(day),date=parse(day),future=day>today(),pct=s.total?s.done/s.total:0;
        const cls=s.done===0?"empty-active":pct===1?"complete":"partial";
        return '<button type="button" class="month-day '+cls+' '+(day===today()?'today ':'')+(day===selected?'selected':'')+'" data-monthday="'+day+'" '+(future?'disabled':'')+' aria-label="'+longDate(date)+'，完成'+s.done+'项"><span>'+date.getDate()+'</span>'+(s.done?'<i>'+s.done+'/'+s.total+'</i>':'')+'</button>';
      }).join("")+'</div>';
      chart.innerHTML=html;
      $$("[data-monthday]",chart).forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.monthday;navigate("today");showToast("可以为 "+shortDate(parse(selected))+" 补记习惯");}));
      $("#chartCaption").textContent="记录会在当前浏览器保存；深绿色表示当日全部完成，浅绿色表示部分完成。";
    }
    $("#detailSubtitle").textContent=period==="week"?"本周各项习惯的完成情况":"本月各项习惯的完成情况";
    $("#reviewHabits").innerHTML=data.habits.length?data.habits.map(h=>{
      const possible=actual.filter(day=>eligible(day,h)).length;
      const achieved=actual.filter(day=>eligible(day,h)&&completed(day,h.id)).length;
      const rate=possible?Math.round(100*achieved/possible):0;
      return '<div class="review-habit-row"><div class="habit-symbol" style="'+styleOf(h)+'">'+colorById(h.color).symbol+'</div><div><strong>'+escapeHTML(h.name)+'</strong><small>'+achieved+' / '+possible+' 天</small></div><div class="mini-track" aria-label="'+rate+'%"><span style="width:'+rate+'%"></span></div><b>'+(possible?rate+'%':'—')+'</b></div>';
    }).join(""):'<p class="empty">还没有习惯记录，去添加第一个吧。</p>';
  }
  function render(){renderToday();renderReview();}
  function openHabit(id=null){
    editingId=id;const h=data.habits.find(h=>h.id===id);
    $("#dialogTitle").textContent=h?"编辑习惯":"添加新习惯";
    $("#saveHabit").textContent=h?"保存修改":"添加习惯";
    $("#deleteHabit").hidden=!h;
    $("#habitName").value=h?.name||"";
    $("#habitNote").value=h?.note||"";
    chosenColor=h?.color||"sage";
    $("#colorPicker").innerHTML=colors.map(c=>'<button type="button" role="radio" class="color-dot" style="--swatch:'+c.value+'" data-color="'+c.id+'" aria-label="'+c.id+'" aria-checked="'+(chosenColor===c.id)+'">'+(chosenColor===c.id?"✓":"")+'</button>').join("");
    $$("[data-color]",$("#colorPicker")).forEach(b=>b.addEventListener("click",()=>{chosenColor=b.dataset.color;$$("[data-color]",$("#colorPicker")).forEach(el=>{const active=el.dataset.color===chosenColor;el.setAttribute("aria-checked",String(active));el.textContent=active?"✓":"";});}));
    $("#habitDialog").showModal();setTimeout(()=>$("#habitName").focus(),30);
  }
  function storeHabit(e){
    e.preventDefault();const name=$("#habitName").value.trim(),note=$("#habitNote").value.trim();
    if(!name){$("#habitName").focus();return;}
    if(editingId){const h=data.habits.find(x=>x.id===editingId);if(h)Object.assign(h,{name,note,color:chosenColor});}
    else if(data.habits.length>=250){showToast("最多可添加 250 项习惯");return;}
    else data.habits.push({id:makeId(),name,note,color:chosenColor,startDate:today()});
    if(!save())return;
    $("#habitDialog").close();render();showToast(editingId?"习惯已更新":"已经为你记下这项习惯");
  }
  function removeHabit(){
    const h=data.habits.find(x=>x.id===editingId);if(!h)return;
    if(!confirm('确定删除“'+h.name+'”吗？它的所有历史打卡也会一并删除。'))return;
    data.habits=data.habits.filter(x=>x.id!==editingId);
    for(const [day,values] of Object.entries(data.records)){delete values[editingId];if(!Object.keys(values).length)delete data.records[day];}
    save();$("#habitDialog").close();render();showToast("习惯已删除");
  }
  function openBackup(){$("#backupDialog").showModal();}
  function exportData(){
    const blob=new Blob([JSON.stringify({app:"Habit Flow",exportedAt:new Date().toISOString(),...data},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="habit-flow-backup-"+today()+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast("备份已下载");
  }
  async function importData(e){
    const file=e.target.files?.[0];e.target.value="";if(!file)return;
    if(file.size>5e6){showToast("备份文件太大");return;}
    try{
      const incoming=normalize(JSON.parse(await file.text()));
      if(!confirm("导入 "+incoming.habits.length+" 项习惯及历史记录？相同 ID 的记录将以导入内容为准。"))return;
      const byId=new Map(data.habits.map(h=>[h.id,h]));
      for(const h of incoming.habits)byId.set(h.id,h);
      const habits=[...byId.values()];
      const records={...data.records};
      for(const [day,vals] of Object.entries(incoming.records))records[day]={...records[day],...vals};
      const next=normalize({habits,records});
      data=next;if(!save())return;
      $("#backupDialog").close();render();showToast("备份恢复成功");
    }catch(err){showToast("导入失败："+(err.message||"格式错误"));}
  }
  $$("[data-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
  ["#newHabitTop","#mobileAdd"].forEach(s=>$(s).addEventListener("click",()=>openHabit()));
  $("#manageHabits").addEventListener("click",()=>{if(data.habits.length)openHabit(data.habits[0].id);else openHabit();});
  $("#habitForm").addEventListener("submit",storeHabit);
  $("#deleteHabit").addEventListener("click",removeHabit);
  ["#closeHabit","#cancelHabit"].forEach(s=>$(s).addEventListener("click",()=>$("#habitDialog").close()));
  ["#sidebarBackup","#mobileBackup"].forEach(s=>$(s).addEventListener("click",openBackup));
  $("#closeBackup").addEventListener("click",()=>$("#backupDialog").close());
  $("#exportData").addEventListener("click",exportData);
  $("#importData").addEventListener("click",()=>$("#importFile").click());
  $("#importFile").addEventListener("change",importData);
  $$("[data-period]").forEach(b=>b.addEventListener("click",()=>{
    period=b.dataset.period;offset=0;
    $$("[data-period]").forEach(el=>{const yes=el===b;el.classList.toggle("selected",yes);el.setAttribute("aria-pressed",String(yes));});
    $(".segmented").dataset.active=period;renderReview();
  }));
  $("#prevRange").addEventListener("click",()=>{offset=Math.max(offset-1,-120);renderReview();});
  $("#nextRange").addEventListener("click",()=>{offset=Math.min(0,offset+1);renderReview();});
  ["#habitDialog","#backupDialog"].forEach(s=>$(s).addEventListener("click",e=>{if(e.target===$(s))$(s).close();}));
  // Continuous press feedback. Pointer capture ensures cancellation clears the held state.
  const tactileSelector=".mobile-nav button,.check-habit,.week-day,.add-btn,.primary-btn";
  document.addEventListener("pointerdown",e=>{
    const button=e.target.closest?.(tactileSelector);
    if(!button||button.disabled||e.button!==0)return;
    button.classList.add("is-held");
  });
  const clearHeld=()=>document.querySelectorAll(".is-held").forEach(el=>el.classList.remove("is-held"));
  ["pointerup","pointercancel","dragstart","visibilitychange"].forEach(type=>document.addEventListener(type,clearHeld));
  window.addEventListener("blur",clearHeld);
  document.addEventListener("keydown",e=>{
    if((e.key===" "||e.key==="Enter")&&e.target.matches?.(tactileSelector))e.target.classList.add("is-held");
  });
  document.addEventListener("keyup",clearHeld);
  render();
  window.HabitFlowQA={today,key,parse,shift,monday,normalize,getState:()=>JSON.parse(JSON.stringify(data)),selectDay:d=>{if(validDate(d)&&d<=today()){selected=d;render();}},navigate};
})();