'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{test}=require('node:test'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../little-works/arcade-library');
test('wood-gold game is an additional library game with a direct external URL',()=>{
 const s=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const match=s.match(/const GAMES=\[([\s\S]*?)\];/);assert.ok(match);
 const sandbox={};vm.runInNewContext('this.list=['+match[1]+'];',sandbox);
 const list=sandbox.list;assert.equal(list.length,17);
 const g=list.find(v=>v.id==='mumujinjin');assert.ok(g);
 assert.equal(g.name,'木木金金棋');
 assert.equal(g.group,'策略');
 assert.equal(g.url,'https://ndshuge.github.io/oh-mumujinjin/');
 assert.ok(s.includes('const gameUrl=g=>g.url||BASE+g.id'));
 assert.equal(s.includes("href=\"'+BASE+g.id"),false);
 assert.ok(fs.existsSync(path.join(root,'art/mumujinjin.svg')));
});
test('arcade count and links remain readable on catalogue page',()=>{
 const h=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(h.includes('17 款'));
});
