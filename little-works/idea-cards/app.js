(() => {
'use strict';
const KEY = 'shuge.idea-cards.v1';
const OLD_KEY = 'shuge-idea-cards-v1';
const COLORS = {
 sage: {paper:'#fafdf8', outline:'#e0ebdc', accent:'#789784', aura:'#d1e7d1', picker:'#9dbca4'},
 cream:{paper:'#fffdf5', outline:'#eee9d9', accent:'#ae9670', aura:'#f3e2b6', picker:'#e4cb94'},
 lilac:{paper:'#fcfaff', outline:'#e9e3f1', accent:'#9886ae', aura:'#e1d4f0', picker:'#c2b1d8'},
 sky:{paper:'#f8fcff',outline:'#e0eaf1',accent:'#7697b1',aura:'#d0e6f1',picker:'#9ec4dd'},
 rose:{paper:'#fffaf9',outline:'#eee1dd',accent:'#bc8f86',aura:'#f0d6ce',picker:'#e6b5a9'}
};
const now = () => new Date().toISOString();
const examples = [
  {id:'sample-1',title:'一个会慢慢长大的数字花园',body:'每记录一次灵感，就种下一颗种子。点子之间的联系像根系一样缓缓长出来。',tag:'产品点子',color:'sage',star:true,pinned:false},
  {id:'sample-2',title:'把每天的一点好奇，留给未来的自己',body:'也许不必立即有答案。先收集问题，再让时间帮忙发酵。',tag:'生活碎片',color:'cream',star:false,pinned:false},
  {id:'sample-3',title:'让知识像星座一样相连',body:'学过的公式、看过的论文和突然出现的联想，最终可以连成一片有形状的夜空。',tag:'学习研究',color:'lilac',star:true,pinned:false},
  {id:'sample-4',title:'不用解释的五分钟',body:'有些小作品不需要目标，也不需要任务，只要让人愿意停留片刻。',tag:'创作灵感',color:'sky',star:false,pinned:false},
  {id:'sample-5',title:'关于周末的一百个小实验',body:'给生活留下一点无目的的探索时间。',tag:'生活碎片',color:'rose',star:false,pinned:false}
].map((v,i)=>({...v,archive:false,sample:true,created:new Date(Date.now()-(i+1)*86400000).toISOString(),updated:new Date(Date.now()-(i+1)*86400000).toISOString()}));
const $ = id=>document.getElementById(id);
const escaped = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validDate=v=>Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : now();
const fromLegacy = v=>({...v,tag:v.tag??v.category??'未分类',color:({white:'sage',mint:'sage',violet:'lilac',peach:'rose',blue:'sky',cream:'cream'})[v.color]||v.color||'sage',created:typeof v.created==='number'?new Date(v.created).toISOString():v.created||(typeof v.updated==='number'?new Date(v.updated).toISOString():v.updated),updated:typeof v.updated==='number'?new Date(v.updated).toISOString():v.updated});
const sanitize = v=>({
 id:typeof v.id==='string' && /^[a-z\d_-]{1,100}$/i.test(v.id)?v.id:uid(),
 title:String(v.title??'').trim().slice(0,120),body:String(v.body??'').slice(0,10000),
 tag:String(v.tag??'未分类').trim().slice(0,24)||'未分类',
 color:Object.hasOwn(COLORS,v.color)?v.color:'sage',
 star:!!v.star,pinned:!!v.pinned,archive:!!v.archive,sample:!!v.sample,
 created:validDate(v.created),updated:validDate(v.updated)
});
function uid(){return crypto.randomUUID?.()||('idea-'+Date.now()+'-'+Math.random().toString(36).slice(2,9))}
function load(){
 try {
  const raw=localStorage.getItem(KEY);
  if(raw===null){
    const older=localStorage.getItem(OLD_KEY);
    if(older!==null){const legacy=JSON.parse(older);if(Array.isArray(legacy))return legacy.filter(x=>x&&typeof x==='object').map(fromLegacy).map(sanitize).filter(x=>x.title)}
    return examples;
  }
  const data=JSON.parse(raw);
  return Array.isArray(data)?data.filter(x=>x&&typeof x==='object').map(sanitize).filter(x=>x.title):examples;
 } catch(err){console.warn('Storage unavailable',err);toast('读取失败，请尝试导入之前的备份');return examples}
}
let notes=load(),view='all',tag='全部',query='',sort='new',editorColor='sage',lastFocus=null,openId=null,toastTimer;
let persisted=true;
function persist(){
 try {localStorage.setItem(KEY,JSON.stringify(notes));persisted=true;return true}
 catch(e){persisted=false;console.warn('Storage unavailable',e);toast('无法保存到此设备，请导出备份');return false}
}
try { if(localStorage.getItem(KEY)===null)persist() } catch(e) { console.warn('Local storage unavailable',e); }
function fmt(v){const d=new Date(v);return Number.isFinite(d.valueOf())?new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'short',day:'numeric'}).format(d):''}
function toast(msg){clearTimeout(toastTimer);const node=$('toast');node.textContent=msg;node.classList.add('show');toastTimer=setTimeout(()=>node.classList.remove('show'),2500)}
function find(id){return notes.find(n=>n.id===id)}
function change(id,patch){const n=find(id);if(!n)return;Object.assign(n,patch,{updated:now(),sample:false});persist();render()}
function viewName(){return ({all:'全部想法',star:'我的收藏',archive:'已归档'})[view]}
function active(){let list=notes.filter(n=>view==='archive'?n.archive:!n.archive && (view!=='star'||n.star));
 if(tag!=='全部')list=list.filter(n=>n.tag===tag);
 if(query.trim()){const q=query.trim().toLocaleLowerCase();list=list.filter(n=>[n.title,n.body,n.tag].some(x=>x.toLocaleLowerCase().includes(q)))}
 list.sort((a,b)=>sort==='az'?a.title.localeCompare(b.title,'zh-CN'):sort==='old'?Date.parse(a.created)-Date.parse(b.created):Number(b.pinned)-Number(a.pinned)||Date.parse(b.updated)-Date.parse(a.updated));
 return list;
}
function render(){
 const primary=notes.filter(n=>!n.archive);
 $('countAll').textContent=primary.length;$('countStar').textContent=primary.filter(n=>n.star).length;$('countArchive').textContent=notes.length-primary.length;
 $('breadNow').textContent=viewName();$('sectionTitle').firstChild.textContent=viewName()+' ';
 document.querySelectorAll('[data-view]').forEach(n=>{const yes=n.dataset.view===view;n.classList.toggle('active',yes);if(n.classList.contains('nav'))n.setAttribute('aria-current',yes?'page':'false');});
 const tags=[...new Set(notes.filter(n=>view==='archive'?n.archive:!n.archive).map(n=>n.tag))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
 if(tag!=='全部'&&!tags.includes(tag))tag='全部';
 $('sideTags').innerHTML=tags.map(t=>'<button class="side-tag '+(tag===t?'active':'')+'" data-tag="'+escaped(t)+'"><i class="dot"></i><span class="tagname">'+escaped(t)+'</span></button>').join('');
 $('filters').innerHTML=['全部',...tags].map(t=>'<button class="pill '+(tag===t?'active':'')+'" data-tag="'+escaped(t)+'">'+(t==='全部'?'全部标签':escaped(t))+'</button>').join('');
 const list=active();$('visibleCount').textContent=list.length;$('cards').innerHTML=list.map((n,i)=>card(n,i)).join('');
 const empty=$('empty');empty.hidden=list.length!==0;
 if(list.length===0){const blank=notes.length===0;$('emptyTitle').textContent=query?'没有找到相关灵感':blank?'从一个念头开始':view==='star'?'还没有收藏的灵感':view==='archive'?'还没有归档的卡片':'这里暂时空空的';$('emptyDesc').textContent=query?'试试其他关键词，或清除搜索。':blank?'把今天的第一个好想法写下来。':'换个标签，或写下新的想法。';}
}
function card(n,i){
 const c=COLORS[n.color],style='--paper:'+c.paper+';--outline:'+c.outline+';--accent:'+c.accent+';--aura:'+c.aura+';--delay:'+Math.min(i,8)*35+'ms';
 return '<article class="card" tabindex="0" role="button" aria-label="查看 '+escaped(n.title)+'" data-id="'+escaped(n.id)+'" style="'+style+'"><div class="card-header"><div class="category"><i></i><span>'+escaped(n.tag)+'</span></div><div class="card-actions"><button class="icon-button '+(n.star?'saved':'')+'" data-action="star" aria-label="'+(n.star?'取消收藏':'收藏')+'" title="'+(n.star?'取消收藏':'收藏')+'" aria-pressed="'+n.star+'">'+(n.star?'★':'☆')+'</button><button class="icon-button '+(n.pinned?'saved':'')+'" data-action="pin" aria-label="'+(n.pinned?'取消置顶':'置顶')+'" title="'+(n.pinned?'取消置顶':'置顶')+'" aria-pressed="'+n.pinned+'">⌃</button></div></div><h3>'+escaped(n.title)+'</h3><p>'+escaped(n.body||'点击卡片，继续这个想法。')+'</p><div class="card-bottom"><span>'+fmt(n.updated)+(n.sample?'<span class="sample">· 示例</span>':'')+(n.pinned?'<span class="pinmark">· 置顶</span>':'')+'</span><span class="arrow">↗</span></div></article>'
}
function showSheet(markup){
 lastFocus=document.activeElement;
 $('sheetBody').innerHTML=markup;
 $('overlay').hidden=false;
 document.body.style.overflow='hidden';
 $('sheet').scrollTop=0;
 requestAnimationFrame(()=>{$('sheet').querySelector('[autofocus],input,button')?.focus({preventScroll:true})});
}
function close(){if($('overlay').hidden)return;$('overlay').hidden=true;document.body.style.overflow='';openId=null;lastFocus?.focus?.({preventScroll:true})}
function detail(id){
 const n=find(id);if(!n)return;openId=id;
 showSheet('<div class="sheet-inner"><div class="sheet-head"><span class="sheet-note">'+escaped(n.tag)+' · '+fmt(n.created)+'</span><button class="close" data-action="close" aria-label="关闭">×</button></div><h2 id="sheetTitle">'+escaped(n.title)+'</h2><p class="sheet-text">'+escaped(n.body||'还没有写下更多内容。')+'</p><div class="meta"><span>'+escaped(n.tag)+'</span>'+(n.star?'<span>已收藏</span>':'')+(n.archive?'<span>已归档</span>':'')+'</div><div class="sheet-buttons"><button class="primary" data-action="edit" data-id="'+escaped(id)+'">编辑想法</button><button data-action="copy" data-id="'+escaped(id)+'">复制</button><button data-action="archive" data-id="'+escaped(id)+'">'+(n.archive?'恢复':'归档')+'</button><button class="danger" data-action="delete" data-id="'+escaped(id)+'">删除</button></div></div>');
}
function edit(id){
 const n=id?find(id):null;if(id&&!n)return;
 editorColor=n?.color||'sage';openId=id||null;
 showSheet('<div class="sheet-inner"><div class="sheet-head"><span class="sheet-note">'+(n?'编辑灵感':'捕捉灵感')+'</span><button class="close" data-action="close" aria-label="关闭">×</button></div><h2 id="sheetTitle">'+(n?'让想法继续生长':'今天想到什么？')+'</h2><form id="editor"><label class="field-label" for="titleInput">标题</label><input class="field-input" id="titleInput" name="title" maxlength="120" required placeholder="一句话，记下它的名字" value="'+escaped(n?.title||'')+'" autofocus><label class="field-label" for="bodyInput">想法</label><textarea class="field-text" id="bodyInput" name="body" maxlength="10000" placeholder="随手写下，不必完美…">'+escaped(n?.body||'')+'</textarea><label class="field-label" for="tagInput">标签</label><input class="field-input" id="tagInput" name="tag" maxlength="24" list="existingTags" placeholder="例如：产品点子" value="'+escaped(n?.tag||'')+'"><datalist id="existingTags">'+[...new Set(notes.map(n=>n.tag))].map(t=>'<option value="'+escaped(t)+'"></option>').join('')+'</datalist><div class="field-label">卡片颜色</div><div class="palette" role="group" aria-label="卡片颜色">'+Object.entries(COLORS).map(([k,c])=>'<button type="button" class="swatch '+(k===editorColor?'selected':'')+'" data-color="'+k+'" style="--swatch:'+c.picker+'" aria-label="'+({sage:'鼠尾草绿',cream:'奶油黄',lilac:'丁香紫',sky:'天空蓝',rose:'柔雾粉'})[k]+'" aria-pressed="'+(k===editorColor)+'"></button>').join('')+'</div><div class="editor-bottom"><small>自动保存在此设备</small><button class="save" type="submit">'+(n?'保存修改':'保存灵感')+'</button></div></form></div>');
}
function backup(){
 const blob=new Blob([JSON.stringify({format:'idea-cards-v1',exportedAt:now(),cards:notes},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='灵感卡片-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('备份已导出');
}
async function importFile(file){
 if(!file)return;if(file.size>5*1024*1024){toast('备份文件超过 5MB');return}
 try{const data=JSON.parse(await file.text());const arr=Array.isArray(data)?data:(data.cards??data.list);if(!Array.isArray(arr))throw Error('format');const imported=arr.filter(x=>x&&typeof x==='object').slice(0,2500).map(fromLegacy).map(sanitize).filter(x=>x.title);
 if(imported.length===0)throw Error('empty');
 const map=new Map(notes.map(n=>[n.id,n]));imported.forEach(n=>map.set(n.id,n));notes=[...map.values()];persist();view='all';tag='全部';query='';$('search').value='';render();toast('已合并 '+imported.length+' 张卡片');
 }catch(e){console.warn('Import failed',e);toast('导入失败，请检查 JSON 备份文件')}finally{$('fileInput').value=''}
}
function action(name,id){
 if(name==='new'){edit(null);return}
 if(name==='close'){close();return}
 if(name==='review'){const pool=notes.filter(n=>!n.archive);if(pool.length){detail(pool[Math.floor(Math.random()*pool.length)].id)}else{toast('还没有可以回顾的灵感')}return}
 if(name==='backup'){backup();return}
 if(name==='import'){$('fileInput').click();return}
 if(name==='star'||name==='pin'){const n=find(id);if(n)change(id,{[name==='star'?'star':'pinned']:!n[name==='star'?'star':'pinned']});return}
 if(name==='edit'){edit(id);return}
 if(name==='archive'){const n=find(id);if(!n)return;change(id,{archive:!n.archive});close();toast(n.archive?'卡片已归档':'已恢复到全部灵感');return}
 if(name==='delete'){const n=find(id);if(n&&confirm('确定删除“'+n.title+'”吗？此操作不可撤销。')){notes=notes.filter(x=>x.id!==id);persist();close();render();toast('卡片已删除')}return}
 if(name==='copy'){const n=find(id);if(!n)return;const content=n.title+(n.body?'\n\n'+n.body:'');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(content).then(()=>toast('已复制到剪贴板')).catch(()=>toast('复制失败，请选中文字手动复制'));else toast('当前浏览器不支持直接复制');return}
}
document.addEventListener('click',e=>{
 const color=e.target.closest('[data-color]');if(color){editorColor=color.dataset.color;document.querySelectorAll('.swatch').forEach(n=>{n.classList.toggle('selected',n===color);n.setAttribute('aria-pressed',String(n===color))});return}
 const tagButton=e.target.closest('[data-tag]');if(tagButton){tag=tagButton.dataset.tag;render();return}
 const viewButton=e.target.closest('[data-view]');if(viewButton){view=viewButton.dataset.view;tag='全部';query='';$('search').value='';render();window.scrollTo({top:0,behavior:'smooth'});return}
 const button=e.target.closest('[data-action]');if(button){const id=button.dataset.id||button.closest('[data-id]')?.dataset.id;action(button.dataset.action,id);return}
 const card=e.target.closest('.card');if(card)detail(card.dataset.id);
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('overlay').hidden){e.preventDefault();close();return}
 if(!$('overlay').hidden){if(e.key==='Tab'){const els=[...$('sheet').querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)')].filter(x=>x.offsetParent!==null);if(els.length){if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0].focus()}}}return}
 const activeEl=document.activeElement,typing=activeEl?.matches('input,textarea,select,[contenteditable=true]');
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('search').focus();$('search').select();return}
 if(!typing&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&e.key.toLowerCase()==='n'){e.preventDefault();edit(null);return}
 if(!typing&&(e.key==='Enter'||e.key===' ')&&activeEl?.classList.contains('card')){e.preventDefault();detail(activeEl.dataset.id)}
});
document.addEventListener('submit',e=>{if(e.target.id!=='editor')return;e.preventDefault();const fd=new FormData(e.target),title=String(fd.get('title')||'').trim(),body=String(fd.get('body')||'').trim(),t=String(fd.get('tag')||'').trim()||'未分类';if(!title){$('titleInput').focus();toast('先为灵感起个名字');return}
 if(openId){change(openId,{title,body,tag:t,color:editorColor});toast('修改已保存')}else{const time=now();notes.unshift({id:uid(),title,body,tag:t,color:editorColor,star:false,pinned:false,archive:false,sample:false,created:time,updated:time});persist();view='all';tag='全部';render();toast('灵感已保存')}
 close();
});
$('search').addEventListener('input',e=>{query=e.target.value;render()});$('sort').addEventListener('change',e=>{sort=e.target.value;render()});
$('fileInput').addEventListener('change',e=>importFile(e.target.files?.[0]));
window.addEventListener('storage',e=>{if(e.key===KEY){notes=load();render()}});
render();
})();