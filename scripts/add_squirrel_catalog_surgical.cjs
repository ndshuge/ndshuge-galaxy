const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const file=path.resolve(__dirname,'../little-works/catalog.json');
const base=cp.execFileSync('git',['show','origin/main:little-works/catalog.json'],{encoding:'utf8'});
const list=JSON.parse(base);
const entry={slug:'squirrel',title:'松鼠 · 森林里的小小冒险家',date:'2026.10.29',type:'APPLE / NATURE STORY',description:'以沉浸式松鼠摄影、精致 Apple 风格排版和真正接入的 Liquid Glass 光学引擎，认识灵动的树梢邻居。',url:'./squirrel/',cover:'./squirrel/assets/hero.jpg',tags:['Apple 风格','自然观察','交互科普']};
if(!list.some(x=>x.slug===entry.slug)){
 const e=JSON.stringify(entry,null,2).split('\n').map(x=>'  '+x).join('\n');
 const pos=base.indexOf('\n')+1;
 const result=base.slice(0,pos)+e+',\n'+base.slice(pos);
 const parsed=JSON.parse(result);
 if(parsed[0].slug!=='squirrel'||parsed.length!==list.length+1)throw Error('catalog parse/size mismatch');
 fs.writeFileSync(file,result,'utf8');
 console.log('Inserted squirrel without reformatting existing catalog');
}else console.log('Already in upstream catalog; leave file alone');
