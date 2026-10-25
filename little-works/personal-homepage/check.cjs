'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const dir=__dirname;
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const html=read('index.html'),css=read('style.css'),js=read('app.js'),evidence=read('DESIGN_SOURCES.md');
const catalog=JSON.parse(fs.readFileSync(path.join(dir,'..','catalog.json'),'utf8'));
const match=catalog.filter(x=>x.slug==='personal-homepage');
const required=['saturn-scene','saturn','shanhe','zhixu','weather','games','gallery'];
const checks=[
 ['catalog contains exactly one personal-homepage',match.length===1],
 ['catalog uses existing relative URL and cover',match[0]?.url==='./personal-homepage/'&&match[0]?.cover==='./personal-homepage/cover.webp'],
 ['real local cover generated',fs.statSync(path.join(dir,'cover.webp')).size>20000],
 ['all real project assets shipped',required.every(x=>fs.statSync(path.join(dir,'assets',x+'.webp')).size>15000)],
 ['six public projects are clickable',([...html.matchAll(/class="project(?: [^"]*)?" href="([^"]+)"/g)].length===6)&&html.includes('https://ndshuge.github.io/zhixu-ai-academy/')],
 ['three project previews can switch',js.includes('selectProject(id)')&&['saturn','zhixu','shanhe'].every(x=>html.includes('data-show="'+x+'"'))],
 ['mobile/tablet styles and reduced motion',css.includes('@media(max-width:580px)')&&css.includes('@media(max-width:780px)')&&css.includes('prefers-reduced-motion')],
 ['language and substantive copy, not fake labels',html.includes('把好奇心')&&!/(SYSTEM READY|INTERACTIVE LAB|MISSION NO\.|OBSERVATION JOURNAL)/i.test(html)],
 ['no runtime CDNs or tracking',!/<script[^>]+src=["']https?:/i.test(html)&&!/(gtag\(|google-analytics|facebook-pixel)/i.test(html+js)],
 ['Taste implementation actually evidenced',evidence.includes('Taste-Skill')&&evidence.includes('draw.mjs')&&evidence.includes('inspect.mjs')],
 ['Designeer references and original researched',evidence.includes('designeer.xyz/inspiration/seesaw')&&evidence.includes('www.seesaw.website')],
 ['existing homepage explicitly not overwritten',evidence.includes('既有个人主页没有被覆盖')],
 ['no credentials or personal IDs',!/(github_pat_[A-Za-z0-9_]{20}|ghp_[A-Za-z0-9]{20}|sk-[A-Za-z0-9_-]{25}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----)/.test(html+css+js+evidence)],
 ['homepage OG card points to this deployment',html.includes('https://ndshuge.github.io/ndshuge-galaxy/little-works/personal-homepage/cover.webp')]
];
for(const [what,ok] of checks)console.log((ok?'PASS':'FAIL')+' '+what);
assert(checks.every(x=>x[1]),'Portfolio release check failed');
console.log('PASS '+checks.length+'/'+checks.length+' source/evidence checks; browser and human visual review remain separate.');
