import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(readFileSync(new URL('./little-works/catalog.json',root),'utf8'));
const item=catalog.find(x=>x.slug==='zhixu-ai-academy');
const hub=new URL('./little-works/zhixu-versions/index.html',root);
test('Little Works links Zhixu to a version selector',()=>{
  assert.ok(item);
  assert.equal(item.url,'./zhixu-versions/');
});
test('selector exposes all three verified version destinations',()=>{
  const html=readFileSync(hub,'utf8');
  assert.match(html,/https:\/\/ndshuge\.github\.io\/zhixu-ai-academy\/original\.html/);
  assert.match(html,/https:\/\/ndshuge\.github\.io\/zhixu-ai-academy\/apple-editions\/ai-academy-apple\//);
  assert.match(html,/https:\/\/ndshuge\.github\.io\/zhixu-ai-academy\/apple-editions\/ai-academy-v4\//);
  assert.match(html,/返回小作品/);
});
