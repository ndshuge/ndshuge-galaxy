const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const project=path.join(root,'little-works','gameverse-vision');
test('independent GameVerse Vision page exists',()=>{
  for(const f of ['index.html','style.css','app.js','assets/wukong-hero.jpg']) assert.ok(fs.existsSync(path.join(project,f)),f+' missing');
  const html=fs.readFileSync(path.join(project,'index.html'),'utf8');
  for(const id of ['desktopSidebar','hero','continueRail','libraryGrid','friendsPanel','mobileDock','detailDialog']) assert.match(html,new RegExp('id="'+id+'"'));
});
test('catalog publishes a distinct new entry without replacing previous game platforms',()=>{
  const a=JSON.parse(fs.readFileSync(path.join(root,'little-works','catalog.json'),'utf8'));
  const bySlug=Object.fromEntries(a.map(x=>[x.slug,x]));
  for(const slug of ['gameverse-vision','gameverse','arcade-library']) assert.ok(bySlug[slug],slug+' not found');
  assert.equal(bySlug['gameverse-vision'].url,'./gameverse-vision/');
});
test('playable catalogue and external store destinations are separated',()=>{
  const app=fs.readFileSync(path.join(project,'app.js'),'utf8');
  assert.match(app,/ndshuge\.github\.io\/ndshuge-game\/games/);
  assert.match(app,/store\.steampowered\.com\/app/);
  assert.match(app,/localStorage/);
});
