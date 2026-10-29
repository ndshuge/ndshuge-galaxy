const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'../little-works/gameverse-vision');
const html=()=>fs.readFileSync(path.join(dir,'index.html'),'utf8');
const css=()=>fs.readFileSync(path.join(dir,'style.css'),'utf8');
test('desktop is a self-contained game app, not a fake macOS desktop',()=>{
  assert.doesNotMatch(html(),/class="mac-menubar"/);
  assert.doesNotMatch(html(),/class="traffic-lights"/);
  assert.doesNotMatch(css(),/\.mac-menubar|\.traffic-lights/);
  assert.match(html(),/id="desktopSidebar"/);
  assert.match(html(),/id="hero"/);
  assert.match(css(),/\.window\{[^}]*height:min\(9[0-9]{2}px,calc\(100dvh - [0-9]{2}px\)\)/);
});
test('native-feeling dock and category selection use actual bundled spring engine',()=>{
  assert.match(html(),/src="\.\/nav-motion\.js"/);
  const js=fs.readFileSync(path.join(dir,'nav-motion.js'),'utf8');
  assert.match(js,/import\s*\{\s*createSpring\s*\}\s*from\s*['"]\.\/glasslib\/liquid-glass\.js['"]/);
  assert.match(js,/\.mobile-dock/);
  assert.match(js,/\.mobile-pills/);
  assert.match(js,/navigation-indicator/);
  const polish=fs.readFileSync(path.join(dir,'native-polish.css'),'utf8');
  assert.match(polish,/\.navigation-indicator/);
  assert.match(css(),/prefers-reduced-motion/);
});
test('content-led polish stabilizes numerals and reduces decorative glyphs',()=>{
  const polish=fs.readFileSync(path.join(dir,'native-polish.css'),'utf8');
  assert.match(polish,/font-variant-numeric:\s*tabular-nums/);
  assert.doesNotMatch(html(),/[✺✸♛✯]/);
  assert.match(polish,/\.hero-badge/);
  assert.match(polish,/\.medal-row/);
});
