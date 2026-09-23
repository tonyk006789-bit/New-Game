import type {IncomingMessage,ServerResponse} from 'node:http';
import {hostedHandler} from './hosted-handler.js';

/** Thin Node HTTP adapter. The same restricted player transport owns auth and accounting. */
export default async function vercelHandler(req:IncomingMessage,res:ServerResponse){
 try{
  const url=new URL(req.url||'/','https://player.internal');
  // Vercel preserves the original pathname while adding the rewrite query.
  // The local Node entry point instead receives /game; accept both shapes,
  // but never let a query choose a different route than the public pathname.
  if(url.searchParams.getAll('__route').length===1){
   const route=url.searchParams.get('__route')!;url.searchParams.delete('__route');
   if(!/^[a-z0-9/-]+$/.test(route)||(url.pathname!=='/game'&&url.pathname!==`/v1/${route}`)){res.writeHead(404);res.end();return;}
   url.pathname=`/v1/${route}`;
  }
  const headers=new Headers();for(const [key,value]of Object.entries(req.headers)){if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value);}
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>16384){res.writeHead(413,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({code:'BODY_TOO_LARGE'}));return;}chunks.push(bytes);}
  const body=chunks.length?new Uint8Array(Buffer.concat(chunks)):undefined;
  const request=new Request(url,{method:req.method||'GET',headers,...(body?{body}:{})});
  const response=await hostedHandler(request,{ip:String(req.headers['x-vercel-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0]});
  res.writeHead(response.status,Object.fromEntries(response.headers.entries()));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({code:'SERVICE_UNAVAILABLE'}));}
}
