// Only the built player and an explicit player API allowlist cross this boundary.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'};
const games='neon-sevens|jade-fortune|coin-carnival|aurora-vault|ember-relics|temple-lights|orchard-numbers|reef-party';
export function allowedRoute(method,path){return method==='GET'?['/v1/environment','/v1/me','/v1/history','/v1/staging/history','/v1/staging/stats','/v1/practice/reef/room','/v1/practice/reef/tables','/v1/games'].includes(path):method==='POST'&&(['/v1/auth/login','/v1/auth/logout','/v1/practice/reef/join','/v1/practice/reef/leave','/v1/staging/recover'].includes(path)||new RegExp(`^/v1/staging/(${games})/rounds$`).test(path));}
export function createGateway({dist=resolve('apps/player/dist'),upstream='http://127.0.0.1:3001',getAudience,getOrigin,fetcher=fetch}={}){
 const limits=new Map();
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  try{
   const origin=await getOrigin(),publicHost=origin?new URL(origin).host:null;
   if(!['127.0.0.1:5185','localhost:5185',publicHost].includes(req.headers.host))return json(403,{message:'Unknown test hostname.'});
   // localhost.run reports proto=http even after TLS termination. Enforce the HTTPS
   // origin on every POST and Secure cookies; the client redirects before rendering login.
   if(publicHost&&req.headers.host===publicHost)res.setHeader('Strict-Transport-Security','max-age=86400');
   const address=String(req.headers['cf-connecting-ip']||req.headers['x-forwarded-for']||req.headers.x_forwarded_for||req.socket.remoteAddress).split(',')[0].trim(),now=Date.now();let rate=limits.get(address);
   if(!rate||now-rate.start>60000){rate={start:now,n:0};limits.set(address,rate);}if(++rate.n>1200)return json(429,{message:'Too many requests. Please wait a minute.'});
   if(limits.size>1000)for(const [key,value] of limits)if(now-value.start>60000)limits.delete(key);
   const url=new URL(req.url,'http://local'),path=url.pathname,method=req.method;
   if(path==='/robots.txt'&&method==='GET'){res.setHeader('Content-Type','text/plain');res.end('User-agent: *\nDisallow: /\n');return;}
   if(path.startsWith('/v1/')){
    if(url.search||!allowedRoute(method,path))return json(404,{message:'Not available in the player test.'});
    if(method==='POST'&&req.headers.origin!==origin&&req.headers.origin!=='http://127.0.0.1:5185')return json(403,{message:'Request origin rejected.'});
    if(method==='POST'&&!String(req.headers['content-type']).startsWith('application/json'))return json(415,{message:'JSON required.'});
    let body; if(method==='POST'){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384)return json(413,{message:'Request too large.'});chunks.push(chunk);}try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{return json(400,{message:'Invalid JSON.'});}}
    const audience=await getAudience(),headers={Origin:'http://127.0.0.1:5183','Content-Type':'application/json',Cookie:String(req.headers.cookie||''),'X-CSRF-Token':String(req.headers['x-csrf-token']||'')};
    if(path==='/v1/auth/login'){
     if(typeof body?.username!=='string'||!audience.some(a=>a.username===body.username.toLowerCase()))return json(401,{message:'Player ID or password is incorrect.'});
    }else if(!['/v1/environment','/v1/games'].includes(path)){
     const me=await fetcher(`${upstream}/v1/me`,{headers,signal:AbortSignal.timeout(10000)});if(!me.ok)return json(401,{message:'Please sign in.'});const account=await me.json();
     if(account.role!=='PLAYER'||!audience.some(a=>a.id===account.id&&a.username===account.username))return json(403,{message:'This account is not included in the shared test.'});
    }
    const response=await fetcher(`${upstream}${path}`,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});
    const result=await response.json();
    if(path==='/v1/environment')delete result.sampleLogin;
    const cookie=response.headers.get('set-cookie');if(cookie)res.setHeader('Set-Cookie',`${cookie}${origin&&req.headers.host===publicHost?'; Secure':''}`);
    return json(response.status,result);
   }
   if(method!=='GET'&&method!=='HEAD')return json(405,{message:'Method not allowed.'});
   // No SPA fallback to unknown paths: never serve workspace sources or credentials.
   const staticPath=path==='/'?'/index.html':decodeURIComponent(path);
   if(staticPath.includes('\\')||staticPath.includes('\0')||staticPath.split('/').some(p=>p==='..'||p.startsWith('.'))||!/^\/(index\.html|favicon\.ico|(?:assets|art)\/[^?]+)$/.test(staticPath))return json(404,{message:'Not found.'});
   const file=resolve(dist,'.'+staticPath),extension=extname(file);
   if(!file.startsWith(dist+sep)||!types[extension])return json(404,{message:'Not found.'});
   const info=await stat(file);if(!info.isFile())return json(404,{message:'Not found.'});
   res.setHeader('Content-Type',types[extension]);res.setHeader('Content-Length',info.size);if(extension!=='.html')res.setHeader('Cache-Control',path.startsWith('/assets/')?'public, max-age=31536000, immutable':'public, max-age=3600');
   if(method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  }catch(error){if(!res.headersSent)json(error.code==='ENOENT'?404:503,{message:error.code==='ENOENT'?'Not found.':'Test server unavailable. Retry shortly.'});else res.destroy();}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const audience=JSON.parse(await readFile('.local/staging/share-audience.json','utf8')).accounts;
 if(audience.length!==5||new Set(audience.map(a=>a.id)).size!==5)throw new Error('Five distinct tester accounts are required.');
 const server=createGateway({getAudience:async()=>audience,getOrigin:async()=>{try{return JSON.parse(await readFile('.local/staging/share-link.json','utf8')).url;}catch{return null;}}});
 server.requestTimeout=30000;server.headersTimeout=10000;server.listen(5185,'127.0.0.1',()=>console.log('Built player test gateway: http://127.0.0.1:5185'));
}
