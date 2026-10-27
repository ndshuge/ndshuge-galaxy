const fs=require("fs"),path=require("path"),assert=require("assert");
const root=path.join(__dirname,".."),app=path.join(root,"little-works","habit-flow");
function verify(read){
  for(const f of ["index.html","style.css","app.js","icon.svg","DESIGN_SOURCES.md"])assert(read(path.join(app,f)),f+" must exist");
  const index=read(path.join(app,"index.html")),css=read(path.join(app,"style.css")),js=read(path.join(app,"app.js")),doc=read(path.join(app,"DESIGN_SOURCES.md"));
  assert(index.includes('id="todayView"')&&index.includes('id="reviewView"'),"both core views");
  assert(js.includes("localStorage")&&js.includes("records")&&js.includes("rangeDays"),"persistence and computed period totals");
  assert(js.includes("escapeHTML")&&js.includes("importData"),"safe names and restore");
  assert(css.includes("prefers-reduced-motion")&&css.includes("prefers-reduced-transparency"),"a11y fallbacks");
  for(const word of ["Taste-Skill","Designeer","Edge","UNVERIFIED"])assert(doc.includes(word),"evidence "+word);
  const entries=JSON.parse(read(path.join(root,"little-works","catalog.json")));
  const matches=entries.filter(e=>e.slug==="habit-flow");
  assert(matches.length===1&&matches[0].url==="./habit-flow/","catalog unique registration");
}
const read=f=>fs.existsSync(f)?fs.readFileSync(f,"utf8"):"";
verify(read);
let caught=0;
for(const removed of ["index.html","DESIGN_SOURCES.md"]){try{verify(f=>f.endsWith(removed)?"":read(f));}catch{caught++;}}
assert(caught===2,"negative evidence tests");
console.log("Habit Flow static gate: PASS; 2 negative cases rejected");
