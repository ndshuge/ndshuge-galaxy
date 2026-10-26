'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname);
const apple = path.join(root, 'little-works', 'xiaoya-apple');
const txt = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => assert.ok(fs.existsSync(path.join(root, relative)), 'Missing: ' + relative);
const html = txt('little-works/xiaoya-apple/index.html');
const css = txt('little-works/xiaoya-apple/apple-next.css');
const js = txt('little-works/xiaoya-apple/apple-next.js');
const glass = txt('little-works/xiaoya-apple/glass/liquid-glass.js');
const catalog = JSON.parse(txt('little-works/catalog.json'));
const checks = [
  ['Version entry remains isolated', () => {
    assert.match(html, /body class="design-apple"/);
    assert.match(html, /<link rel="stylesheet" href="\.\/apple-next\.css\?v=[\w-]+"\/>/);
    assert.match(html, /<script type="module" src="\.\/apple-next\.js\?v=[\w-]+"><\/script>/);
    assert.doesNotMatch(html, /href="\.\/premium\.css/);
    const page = txt('little-works/index.html');
    assert.match(page, /xiaoya-apple\//);
    assert.match(page, /xiaoya-studio\//);
    assert.match(page, /xiaoya-lifelab\//);
    assert.ok(catalog.some(v => v.slug === 'xiaoya-lifelab'));
  }],
  ['Optical engine is bundled and attributed', () => {
    assert.match(js, /import\s*\{\s*createGlass\s*,\s*createSpring\s*\}/);
    assert.match(js, /createGlass\(lens,/);
    assert.match(js, /mode:'backdrop'/);
    assert.match(glass, /feDisplacementMap|displacement/i);
    const license = txt('little-works/xiaoya-apple/glass/LICENSE.txt');
    assert.match(license, /MIT License/);
  }],
  ['Accessibility and fallback are preserved', () => {
    assert.match(js, /aria-hidden/);
    assert.match(js, /prefers-reduced-motion/);
    assert.match(js, /prefers-reduced-transparency/);
    assert.match(css, /prefers-reduced-motion/);
    assert.match(css, /prefers-reduced-transparency/);
    assert.match(css, /focus-visible/);
    assert.match(css, /min-height:55px/);
  }],
  ['Business and privacy code not replaced', () => {
    ['app.js','core.js','domain.js','byok-ui.js','xiaoya-chat.js','redesign.js','styles.css'].forEach(f => exists('little-works/xiaoya-apple/'+f));
    assert.match(html, /\.\/app\.js/);
    assert.match(html, /\.\/xiaoya-chat\.js/);
  }],
  ['Design audit and browser test exist', () => {
    const audit = txt('little-works/xiaoya-apple/DESIGN_AUDIT_APPLE_NEXT.md');
    assert.match(audit, /Taste-Skill/);
    assert.match(audit, /Designeer/);
    assert.match(audit, /User art acceptance/);
    exists('qa-apple-next.cjs');
  }],
  ['No obvious credentials in newly introduced sources', () => {
    for (const [name, source] of [['JS',js],['CSS',css],['HTML',html]]) {
      assert.doesNotMatch(source, /sk-[a-zA-Z0-9_-]{20,}/);
      assert.doesNotMatch(source, /ghp_[A-Za-z0-9]{30,}/);
      assert.doesNotMatch(source, /BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY/);
    }
  }]
];
let failed = 0;
for (const [name, fn] of checks) {
  try { fn(); console.log('PASS', name); }
  catch(e) { failed++; console.error('FAIL', name, e.message); }
}
console.log(`XiaoYa Apple static release gate: ${checks.length-failed}/${checks.length}`);
if(failed) process.exitCode=1;
