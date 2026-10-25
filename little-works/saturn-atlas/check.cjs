/* Dependency-free public release gate for this astronomy exhibit.
 * Does not pretend to measure aesthetics: real-browser proof stays separate. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=__dirname;const get=name=>fs.readFileSync(path.join(dir,name),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(dir,'..','catalog.json'),'utf8'));
const html=get('index.html'),js=get('app.js'),css=get('style.css'),sources=get('DESIGN_SOURCES.md');
const entry=catalog.find(x=>x.slug==='saturn-atlas');
const check=[
['catalog entry exists exactly once',catalog.filter(x=>x.slug==='saturn-atlas').length===1],
['catalog links to actual app',entry?.url==='./saturn-atlas/'&&fs.existsSync(path.join(dir,'index.html'))],
['cover is local and well sized',entry?.cover==='./saturn-atlas/cover.webp'&&fs.statSync(path.join(dir,'cover.webp')).size>15000],
['NASA image is genuinely bundled',fs.statSync(path.join(dir,'assets','nasa-saturn.webp')).size>30000],
['NASA credit included in visible page',html.includes('NASA / JPL-Caltech / SSI')&&/PIA17172/.test(sources)],
['nonendorsement and source citation present',html.includes('非 NASA 官方网站')&&html.includes('science.nasa.gov/saturn/facts/')],
['real photo not claimed to be AI',sources.includes('不是 AI 生成的土星图')],
['interactive ring canvas and accessible slider',html.includes('id="ringCanvas"')&&html.includes('id="angleSlider"')&&html.includes('for="angleSlider"')],
['ring geometry states are wired',js.includes("ringPath(false)")&&js.includes("ringPath(true)")&&js.includes("updateAngle(next)")],
['sunlight comparison is interactive',js.includes("selectWorld(name)")&&html.includes('data-world="earth"')&&html.includes('data-world="saturn"')],
['scientific simulation caveat visible',html.includes('非精确')||html.includes('不是精确')],
['Taste and Designeer evidenced',sources.includes('Taste-Skill')&&sources.includes('Designeer')&&sources.includes('page-is-the-object')],
['responsiveness and reduced motion rules',css.includes('@media(max-width:580px)')&&css.includes('prefers-reduced-motion')],
['no external runtime JavaScript dependency',!/<script\s+[^>]*src=["']https?:/.test(html)],
['no secret or private key material',!/(?:github_pat_|ghp_[a-zA-Z0-9]{20,}|sk-[A-Za-z0-9]{25,}|-----BEGIN (?:RSA|OPENSSH|PRIVATE) KEY-----)/.test(html+js+css)]
];
for(const [what,ok] of check)console.log((ok?'PASS ':'FAIL ')+what);
assert(check.every(x=>x[1]),'Saturn exhibit public release evidence gate failed');
console.log('PASS '+check.length+'/'+check.length+' static and evidence checks. Visual/human review is separate.');
