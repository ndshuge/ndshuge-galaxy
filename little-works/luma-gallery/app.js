(() => {
"use strict";
const $ = id => document.getElementById(id);
const preset = ["日常","旅行","风景","人像"];
const DB = "luma-private-gallery-v1";
let db, photos = [], nav = "all", category = "全部", query = "", visible = [], currentId = null, editId = null, menuId = null;
let lastFocus = null, viewerUrl = null, toastTimer, gridUrls = [], suppressNextClick = new Set();
const dateFmt = new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"long",day:"numeric"});
function notify(message){ const t=$("toast"); t.textContent=message; t.classList.add("visible"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("visible"),3000); }
function safeClose(dialog){if(dialog.open)dialog.close();}
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error("当前浏览器不支持本地照片数据库"));return;}
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains("photos"))d.createObjectStore("photos",{keyPath:"id"});};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||new Error("数据库打开失败"));
  req.onblocked=()=>notify("请先关闭其他正在使用光屿的标签页");
 });
}
function transact(mode,work){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("photos",mode),store=tx.objectStore("photos");
  let request;
  try{request=work(store)}catch(e){reject(e);return;}
  tx.oncomplete=()=>resolve(request&&request.result);
  tx.onerror=()=>reject(tx.error||new Error("本地储存失败"));
  tx.onabort=()=>reject(tx.error||new Error("写入中断"));
 });
}
const storePhoto=p=>transact("readwrite",s=>s.put(p));
const removePhoto=id=>transact("readwrite",s=>s.delete(id));
const readPhotos=()=>transact("readonly",s=>s.getAll());
function releaseGridUrls(){gridUrls.forEach(URL.revokeObjectURL);gridUrls=[];}
function filtered(){
 const q=query.toLocaleLowerCase();
 return photos.filter(p=>(nav!=="favorites"||p.favorite)&&(category==="全部"||p.category===category)&&(!q||(p.name||"").toLocaleLowerCase().includes(q)||(p.category||"").toLocaleLowerCase().includes(q))).sort((a,b)=>(b.addedAt||0)-(a.addedAt||0));
}
function svgIcon(name){const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href","#i-"+name);svg.appendChild(use);return svg;}
function buttonIcon(name,label,cls){const b=document.createElement("button");b.type="button";b.className=cls;b.setAttribute("aria-label",label);b.title=label;b.appendChild(svgIcon(name));return b;}
function renderTabs(){
 const tabs=$("categoryTabs");tabs.replaceChildren();
 const cats=["全部",...new Set([...preset,...photos.map(p=>p.category||"日常")])];
 if(!cats.includes(category)) category="全部";
 cats.forEach(c=>{
  const b=document.createElement("button");b.type="button";b.className="cat"+(category===c?" active":"");
  b.textContent=c;b.setAttribute("aria-pressed",String(category===c));
  b.addEventListener("click",()=>{category=c;render();});
  tabs.appendChild(b);
 });
}
function render(){
 document.body.classList.toggle('has-photos',photos.length>0);
 visible=filtered();releaseGridUrls();renderTabs();
 document.querySelectorAll("[data-nav]").forEach(b=>{
  const selected=b.dataset.nav===nav;b.classList.toggle("selected",selected);
  b.setAttribute("aria-pressed",String(selected));
 });
 $("collectionTitle").textContent=nav==="favorites"?"珍藏时刻":"我的画廊";
 $("countLabel").textContent=photos.length ? "已珍藏 "+photos.length+" 张照片 · "+photos.filter(p=>p.favorite).length+" 张心动收藏":"光影正在等候你的第一张照片。";
 const grid=$("photoGrid");grid.replaceChildren();
 visible.forEach((p,i)=>{
  const card=document.createElement("article");card.className="photo-card";card.style.setProperty("--order",Math.min(i,12));
  const target=document.createElement("button");target.type="button";target.className="photo-target";target.dataset.photoId=p.id;target.setAttribute("aria-label","浏览 "+p.name+"，长按查看更多操作");
  const img=document.createElement("img");img.alt="";img.loading=i<8?"eager":"lazy";img.decoding="async";
  const url=URL.createObjectURL(p.thumb||p.blob);gridUrls.push(url);img.src=url;target.appendChild(img);
  const overlay=document.createElement("div");overlay.className="photo-overlay";
  const wrap=document.createElement("span"),title=document.createElement("strong"),small=document.createElement("small");
  title.textContent=p.name;small.textContent=(p.category||"日常")+" · "+dateFmt.format(new Date(p.addedAt||Date.now()));
  wrap.append(title,small);overlay.appendChild(wrap);target.appendChild(overlay);
  const tools=document.createElement("div");tools.className="photo-tools";
  const heart=buttonIcon("heart",p.favorite?"取消收藏":"收藏","heart-tool"+(p.favorite?" is-favorite":""));
  heart.setAttribute("aria-pressed",String(!!p.favorite));
  heart.addEventListener("click",e=>{e.stopPropagation();toggleFavorite(p.id);});
  const more=buttonIcon("more","更多操作","more-tool");
  more.addEventListener("click",e=>{e.stopPropagation();showMenu(p.id,more.getBoundingClientRect().right,more.getBoundingClientRect().bottom);});
  tools.append(heart,more);card.append(target,tools);grid.appendChild(card);
  setupPress(target,p.id);
 });
 const empty=$("emptyState");empty.hidden=visible.length>0;
 if(!visible.length){
  const allEmpty=!photos.length;
  $("emptyTitle").textContent=allEmpty?"你的故事，从第一张开始。":"这里暂时没有照片";
  $("emptyText").textContent=allEmpty?"无需账户。把喜欢的照片放进来，慢慢整理成自己的光影集。":"换个分类或关键词看看，也可以继续添加新的回忆。";
  $("emptyAdd").hidden=!allEmpty;
 }
}
function showMenu(id,x,y){
 const p=photos.find(item=>item.id===id);if(!p)return;
 menuId=id;const menu=$("contextMenu");
 $("contextTitle").textContent=p.name;
 const favoriteAction=menu.querySelector('[data-action="favorite"]');
 favoriteAction.firstChild.textContent=p.favorite?"取消收藏 ":"加入收藏 ";
 menu.hidden=false;
 const width=menu.offsetWidth,height=menu.offsetHeight;
 menu.style.left=Math.max(10,Math.min(window.innerWidth-width-10,x-width+16))+"px";
 menu.style.top=Math.max(10,Math.min(window.innerHeight-height-10,y+10))+"px";
}
function hideMenu(){ $("contextMenu").hidden=true;menuId=null; }
function setupPress(target,id){
 let hold=null,down=null,held=false;
 const cancel=()=>{clearTimeout(hold);hold=null;target.classList.remove("is-pressing");};
 target.addEventListener("pointerdown",e=>{
  if(e.button!==0 && e.pointerType==="mouse")return;
  down={x:e.clientX,y:e.clientY};held=false;
  target.classList.add("is-pressing");
  clearTimeout(hold);
  hold=setTimeout(()=>{
   held=true; suppressNextClick.add(id);setTimeout(()=>suppressNextClick.delete(id),750);cancel();
   if(navigator.vibrate)navigator.vibrate(12);
   showMenu(id,down.x,down.y);
  },450);
 });
 target.addEventListener("pointermove",e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>12){cancel();down=null;}});
 target.addEventListener("pointerup",()=>{cancel();down=null;});
 target.addEventListener("pointercancel",()=>{cancel();down=null;});
 target.addEventListener("pointerleave",()=>{if(down){cancel();down=null;}});
 target.addEventListener("contextmenu",e=>{e.preventDefault();cancel();suppressNextClick.add(id);showMenu(id,e.clientX,e.clientY);});
 target.addEventListener("click",()=>{
  if(held||suppressNextClick.has(id)){suppressNextClick.delete(id);held=false;return;}
  openViewer(id);
 });
 target.addEventListener("keydown",e=>{if(e.key==="F10"&&e.shiftKey){e.preventDefault();const r=target.getBoundingClientRect();showMenu(id,r.right,r.bottom);}});
}
async function toggleFavorite(id){
 const p=photos.find(item=>item.id===id);if(!p)return;
 p.favorite=!p.favorite;
 try{await storePhoto(p);render();if($("viewer").open&&currentId===id)updateViewer();notify(p.favorite?"已加入收藏":"已从收藏移除");}
 catch(e){p.favorite=!p.favorite;notify("收藏未保存："+e.message);}
}
function currentPhoto(){return photos.find(p=>p.id===currentId);}
function setViewerPhoto(id){
 const p=photos.find(item=>item.id===id);if(!p)return;
 currentId=id;
 if(viewerUrl)URL.revokeObjectURL(viewerUrl);
 viewerUrl=URL.createObjectURL(p.blob);
 const img=$("viewerImage");
 img.classList.add("changing");
 img.src=viewerUrl;img.alt=p.name;
 img.onload=()=>img.classList.remove("changing");
 img.onerror=()=>{img.classList.remove("changing");notify("原图无法显示，请尝试下载查看");};
 updateViewer();
}
function updateViewer(){
 const p=currentPhoto();if(!p)return;
 const list=visible.some(item=>item.id===p.id)?visible:photos;
 const index=list.findIndex(item=>item.id===p.id);
 $("viewerCounter").textContent=(index+1)+" / "+list.length;
 $("viewerName").textContent=p.name;
 $("viewerMeta").textContent=(p.category||"日常")+"　·　"+dateFmt.format(new Date(p.addedAt||Date.now()))+"　·　"+(p.size/1048576).toFixed(1)+" MB";
 $("viewerFav").classList.toggle("is-favorite",!!p.favorite);
 $("viewerFav").setAttribute("aria-pressed",String(!!p.favorite));
 $("viewerPrev").disabled=list.length<2;$("viewerNext").disabled=list.length<2;
}
function openViewer(id){
 if(!photos.some(p=>p.id===id))return;
 lastFocus=document.activeElement;hideMenu();
 if(!$("viewer").open)$("viewer").showModal();
 setViewerPhoto(id);
 $("viewerClose").focus({preventScroll:true});
}
function moveViewer(step){
 const p=currentPhoto();if(!p)return;
 const list=visible.some(item=>item.id===p.id)?visible:photos;
 if(list.length<2)return;
 const idx=list.findIndex(item=>item.id===p.id);
 setViewerPhoto(list[(idx+step+list.length)%list.length].id);
}
function closeViewer(){safeClose($("viewer"));}
function openEditor(id){
 const p=photos.find(item=>item.id===id);if(!p)return;
 hideMenu(); editId=id;
 $("editName").value=p.name;
 const cats=[...new Set([...preset,...photos.map(a=>a.category).filter(Boolean)])];
 const sel=$("editCategory");sel.replaceChildren();
 for(const cat of cats){const opt=document.createElement("option");opt.value=cat;opt.textContent=cat;sel.appendChild(opt);}
 const custom=document.createElement("option");custom.value="__custom";custom.textContent="新建分类…";sel.appendChild(custom);
 sel.value=p.category||"日常";$("editCustomCategory").value="";
 $("customCategoryField").hidden=true;
 $("editor").showModal();$("editName").focus();
}
async function saveEdit(e){
 e.preventDefault();const p=photos.find(item=>item.id===editId);if(!p)return;
 const name=$("editName").value.trim();
 const cat=$("editCategory").value==="__custom"?$("editCustomCategory").value.trim():$("editCategory").value;
 if(!name||!cat){notify("请填写照片名称与分类");return;}
 p.name=name.slice(0,110);p.category=cat.slice(0,24);
 try{await storePhoto(p);safeClose($("editor"));render();if($("viewer").open)updateViewer();notify("照片资料已保存");}
 catch(err){notify("保存失败："+err.message);}
}
async function deletePhoto(id){
 const p=photos.find(item=>item.id===id);if(!p)return;
 if(!confirm("确定移除「"+p.name+"」？此操作不可撤销，请确认已经备份。"))return;
 try{await removePhoto(id);photos=photos.filter(item=>item.id!==id);
 safeClose($("editor"));if($("viewer").open&&currentId===id)closeViewer();
 hideMenu();render();notify("照片已移除");}
 catch(e){notify("删除失败："+e.message);}
}
function downloadPhoto(id){
 const p=photos.find(item=>item.id===id);if(!p)return;
 const url=URL.createObjectURL(p.blob),a=document.createElement("a");a.href=url;a.download=p.originalName||p.name||"photo";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function openPicker(){$("photoInput").click();}
async function thumbnail(blob){
 let bitmap,srcUrl,img;
 try{
  let width,height,canvas=document.createElement("canvas");
  if("createImageBitmap" in window){bitmap=await createImageBitmap(blob);width=bitmap.width;height=bitmap.height;}
  else{srcUrl=URL.createObjectURL(blob);img=new Image();img.src=srcUrl;await img.decode();width=img.naturalWidth;height=img.naturalHeight;}
  if(!width||!height)throw Error("照片尺寸无效");
  const factor=Math.min(1,900/Math.max(width,height));
  canvas.width=Math.max(1,Math.round(width*factor));canvas.height=Math.max(1,Math.round(height*factor));
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("无法绘制缩略图");
  ctx.drawImage(bitmap||img,0,0,canvas.width,canvas.height);
  const result=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("缩略图转换失败")),"image/webp",.82));
  return result;
 }finally{if(bitmap)bitmap.close();if(srcUrl)URL.revokeObjectURL(srcUrl);}
}
async function importFiles(files){
 if(!db){notify("数据库暂不可用，请刷新重试");return;}
 const accepted=["image/jpeg","image/png","image/webp","image/gif","image/avif","image/bmp"];
 let ok=0,fail=0;
 notify("正在把照片安全保存到这台设备…");
 for(const file of files){
  if(!accepted.includes(file.type)||file.size>70*1024*1024||!file.size){fail++;continue;}
  try{
   const thumb=await thumbnail(file);
   const p={id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),name:file.name.replace(/\.[^.]+$/,"").slice(0,110)||"未命名照片",originalName:file.name,category:category!=="全部"?category:"日常",favorite:false,addedAt:Date.now()+ok,size:file.size,blob:file,thumb};
   await storePhoto(p);photos.push(p);ok++;
  }catch(e){console.error("照片导入失败",file.name,e);fail++;}
 }
 $("photoInput").value="";render();
 notify(ok+" 张照片已保存"+(fail?" · "+fail+" 张失败（格式、大小或存储空间限制）":""));
}
async function blobToBase64(blob){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);
 });
}
function saveFile(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function backup(){
 if(!photos.length){notify("先添加一些照片，再导出备份");return;}
 const total=photos.reduce((n,p)=>n+(p.size||0),0);
 if(total>120*1048576&&!confirm("备份含原图，容量约 "+Math.round(total/1048576)+" MB。生成文件可能占用较多内存，仍要继续吗？"))return;
 notify("正在打包原始照片，请勿关闭页面…");
 try{
  const records=[];
  for(const p of photos){
   records.push({id:p.id,name:p.name,originalName:p.originalName,category:p.category,favorite:!!p.favorite,addedAt:p.addedAt,size:p.size,dataUrl:await blobToBase64(p.blob)});
  }
  const data={format:"luma-gallery-backup",version:1,exportedAt:new Date().toISOString(),photos:records};
  saveFile(new Blob([JSON.stringify(data)],{type:"application/json"}),"Luma-照片备份-"+new Date().toISOString().slice(0,10)+".json");
  notify("备份已导出，请妥善保存（包含原始照片）");
 }catch(e){notify("备份失败："+e.message);}
}
async function restore(file){
 if(!file)return;
 notify("正在检查备份…");
 try{
  if(file.size>650*1048576)throw Error("单个备份过大，请分批恢复");
  const data=JSON.parse(await file.text());
  if(data.format!=="luma-gallery-backup"||data.version!==1||!Array.isArray(data.photos))throw Error("不是有效的光屿备份文件");
  if(!confirm("将恢复 "+data.photos.length+" 张照片。相同 ID 的照片会更新，其他照片保留。继续吗？"))return;
  let imported=0;
  for(const item of data.photos){
   if(!item||typeof item.dataUrl!=="string"||!/^data:image\/(jpeg|png|webp|gif|avif|bmp);base64,/i.test(item.dataUrl))continue;
   const res=await fetch(item.dataUrl),blob=await res.blob();
   if(!blob.size||blob.size>70*1048576)continue;
   const p={id:typeof item.id==="string"&&item.id.length<100?item.id:crypto.randomUUID(),name:String(item.name||"未命名照片").slice(0,110),originalName:String(item.originalName||"photo").slice(0,180),category:String(item.category||"日常").slice(0,24),favorite:!!item.favorite,addedAt:Number(item.addedAt)||Date.now(),size:blob.size,blob,thumb:await thumbnail(blob)};
   await storePhoto(p);imported++;
  }
  photos=await readPhotos();render();notify("成功恢复 "+imported+" 张照片");
 }catch(e){console.error("恢复失败",e);notify("无法恢复："+e.message);}
 finally{$("restoreInput").value="";}
}
function bind(){
 $("importBtn").addEventListener("click",openPicker);$("emptyAdd").addEventListener("click",openPicker);
 $("photoInput").addEventListener("change",e=>importFiles([...e.target.files]));
 $("backupBtn").addEventListener("click",backup);
 $("restoreBtn").addEventListener("click",()=>$("restoreInput").click());
 $("restoreInput").addEventListener("change",e=>restore(e.target.files[0]));
 $("searchInput").addEventListener("input",e=>{query=e.target.value.trim();render();});
 document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>{nav=b.dataset.nav;category="全部";render();}));
 $("contextMenu").addEventListener("click",async e=>{
  const button=e.target.closest("[data-action]");if(!button||!menuId)return;
  const id=menuId,action=button.dataset.action;hideMenu();
  if(action==="open")openViewer(id);
  else if(action==="favorite")await toggleFavorite(id);
  else if(action==="edit")openEditor(id);
  else if(action==="download")downloadPhoto(id);
  else if(action==="delete")await deletePhoto(id);
 });
 document.addEventListener("pointerdown",e=>{if(!$("contextMenu").hidden&&!e.target.closest("#contextMenu")&&!e.target.closest(".more-tool"))hideMenu();},{capture:true});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")hideMenu();if($("viewer").open&&!$("editor").open&&!$("privacy").open){if(e.key==="ArrowRight"){e.preventDefault();moveViewer(1);}else if(e.key==="ArrowLeft"){e.preventDefault();moveViewer(-1);}}});
 window.addEventListener("scroll",()=>{if(!$("contextMenu").hidden)hideMenu();},{passive:true});
 $("viewerClose").addEventListener("click",closeViewer);
 $("viewerPrev").addEventListener("click",()=>moveViewer(-1));
 $("viewerNext").addEventListener("click",()=>moveViewer(1));
 $("viewerFav").addEventListener("click",()=>currentId&&toggleFavorite(currentId));
 $("viewerEdit").addEventListener("click",()=>currentId&&openEditor(currentId));
 $("viewerDownload").addEventListener("click",()=>currentId&&downloadPhoto(currentId));
 $("viewer").addEventListener("click",e=>{if(e.target===$("viewer"))closeViewer();});
 $("viewer").addEventListener("close",()=>{if(viewerUrl)URL.revokeObjectURL(viewerUrl);viewerUrl=null;currentId=null;if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true});});
 let swipeX=null;
 $("viewerImage").addEventListener("pointerdown",e=>{if(e.pointerType==="touch")swipeX=e.clientX;});
 $("viewerImage").addEventListener("pointerup",e=>{if(swipeX!==null){const dx=e.clientX-swipeX;if(Math.abs(dx)>65)moveViewer(dx<0?1:-1);swipeX=null;}});
 $("viewerImage").addEventListener("pointercancel",()=>swipeX=null);
 $("editorClose").addEventListener("click",()=>safeClose($("editor")));
 $("editorForm").addEventListener("submit",saveEdit);
 $("editCategory").addEventListener("change",()=>{$("customCategoryField").hidden=$("editCategory").value!=="__custom";if(!$("customCategoryField").hidden)$("editCustomCategory").focus();});
 $("deletePhotoBtn").addEventListener("click",()=>editId&&deletePhoto(editId));
 $("privacyBtn").addEventListener("click",()=>$("privacy").showModal());
 $("privacyClose").addEventListener("click",()=>safeClose($("privacy")));
 $("privacyDone").addEventListener("click",()=>safeClose($("privacy")));
}
async function start(){
 bind();render();
 try{db=await openDB();photos=await readPhotos();render();}
 catch(e){console.error("光屿无法打开照片储存",e);render();notify("浏览器照片储存不可用："+e.message);}
}
start();
})();