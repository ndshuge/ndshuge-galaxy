// Local read-only preview server: serves candidate files and proxies unmodified live Original Pages.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
http.createServer(async(req,res)=>{
try{
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 if(u.pathname.startsWith('/zhixu-ai-academy/')){
  const r=await fetch('https://ndshuge.github.io'+u.pathname+u.search,{redirect:'follow'});
  res.writeHead(r.status,{'Content-Type':r.headers.get('content-type')||'application/octet-stream','Cache-Control':'no-store'});
  res.end(Buffer.from(await r.arrayBuffer()));return;
 }
 let p=path.resolve(root,'.'+decodeURIComponent(u.pathname));
 if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);res.end('forbidden');return;}
 if((await stat(p)).isDirectory())p=path.join(p,'index.html');
 const body=await readFile(p);
 res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});
 res.end(body);
}catch(e){res.writeHead(404,{'Content-Type':'text/plain'});res.end('not found: '+e.message);}
}).listen(18886,'127.0.0.1',()=>console.log('Zhixu Apple local QA http://127.0.0.1:18886/little-works/ai-academy-apple/'));
