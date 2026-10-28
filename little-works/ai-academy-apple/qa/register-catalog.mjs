import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const file=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../catalog.json');
const orig=JSON.parse(await readFile(file,'utf8'));
if(!Array.isArray(orig))throw Error('Catalog schema changed');
const slug='ai-academy-apple';
if(orig.some(x=>x.slug===slug)){console.log('Already registered');process.exit(0);}
const record={
 slug,title:'知序 AI 学院 · Apple Edition',date:'2026.10.28',type:'AI LEARNING / APPLE EDITION',
 description:'基于原版真实科学计算与学习证据的新一代知序学习空间。保留比赛原版，提供分步导师、独立作答、科学实验与复习。',
 url:'./ai-academy-apple/',cover:'./ai-academy-apple/cover.svg',
 tags:['Apple Edition','真实科学实验','AI 私人教师']
};
orig.unshift(record);
await writeFile(file,JSON.stringify(orig,null,2)+'\n','utf8');
console.log('registered',slug,'total',orig.length);
