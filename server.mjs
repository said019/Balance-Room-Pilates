import http from 'node:http';
import https from 'node:https';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const targetValue = process.env.API_PROXY_TARGET || process.env.VITE_API_URL;
const target = targetValue ? new URL(targetValue) : null;
if (target && (!['http:', 'https:'].includes(target.protocol) || target.username || target.password)) throw new Error('Invalid API proxy target');
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff' };
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if(url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    if(!target) {res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'API no configurada'}));return;}
    const route = url.pathname.replace(/^\/api/, '') + url.search;
    const upstream = new URL(target.href);upstream.pathname = target.pathname.replace(/\/$/, '') + route.split('?')[0];upstream.search = url.search;
    const headers = {...req.headers,host:upstream.host};delete headers['x-forwarded-host'];delete headers['x-forwarded-for'];
    const request = (upstream.protocol==='https:'?https:http).request(upstream,{method:req.method,headers},response=>{res.writeHead(response.statusCode||502,response.headers);response.pipe(res);response.on('error',()=>res.destroy());});
    request.setTimeout(60_000,()=>request.destroy(new Error('Upstream timeout')));
    request.on('error',()=>{if(!res.headersSent){res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Servicio temporalmente no disponible'}));}else res.destroy();});
    req.on('aborted',()=>request.destroy());req.pipe(request);return;
  }
  if(!['GET','HEAD'].includes(req.method||'')){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
  let file=path.resolve(dist,'.'+pathname);
  if(!file.startsWith(dist+path.sep)&&file!==dist){res.writeHead(403);res.end();return;}
  try {let info=await stat(file).catch(()=>null);if(!info?.isFile()){
    // Missing assets are real 404s; a SPA document is only for navigation routes.
    if(path.extname(pathname)){res.writeHead(404);res.end();return;}
    file=path.join(dist,'index.html');info=await stat(file);
  }
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':file.endsWith('index.html')||file.endsWith('sw.js')?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
  }catch{res.writeHead(503);res.end('Aplicación no compilada');}
});
server.listen(Number(process.env.PORT||8080),process.env.HOST||'0.0.0.0',()=>console.log('2707 Altitud web ready'));
process.on('SIGTERM',()=>server.close());
