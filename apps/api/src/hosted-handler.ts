import {HttpException} from '@nestjs/common';
import {catalog} from '@new-game/contracts';
import {actorFor, login, sessionCookie, type Request as ApiRequest} from './auth.js';
import {me, history} from './accounts.js';
import {environment, stagingRound, stagingHistory, stagingStats, recoverStagingRound} from './staging.js';
import {reefRoom, reefTables, reefLeave} from './practice.js';
import {transaction, fail} from './store.js';
import {hostedTest, validateHostedTest} from './environment.js';
import {dailyWheelStatus,spinDailyWheel} from './daily-wheel.js';
import {changePassword} from './password.js';

export const testAudience = new Set(['tester.one','tester.two','tester.three','tester.four','tester.five']);
const reads = new Set(['/v1/environment','/v1/health','/v1/games','/v1/me','/v1/history','/v1/staging/history','/v1/staging/stats','/v1/practice/reef/room','/v1/practice/reef/tables','/v1/daily-wheel']);
const writes = new Set(['/v1/auth/login','/v1/auth/logout','/v1/auth/password','/v1/daily-wheel/spin','/v1/staging/recover','/v1/practice/reef/join','/v1/practice/reef/leave']);
const rounds = /^\/v1\/staging\/(neon-sevens|jade-fortune|coin-carnival|aurora-vault|ember-relics|temple-lights|orchard-numbers|reef-party)\/rounds$/;
export function playerRoute(method:string, path:string){return method==='GET'?reads.has(path):method==='POST'&&(writes.has(path)||rounds.test(path));}
const json=(body:unknown,status=200,extra:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',...extra}});

async function readBody(request:Request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'JSON_REQUIRED');
 const reader=request.body?.getReader() ?? fail(400,'INVALID_JSON');
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>16384){await reader.cancel();fail(413,'BODY_TOO_LARGE');}chunks.push(part.value);}
 try{return JSON.parse(Buffer.concat(chunks).toString());}catch{return fail(400,'INVALID_JSON');}
}

// HTTP transport only: accounting, authentication and room mutations use the
// same PostgreSQL business functions as the NestJS service. No admin routes.
export async function hostedHandler(request:Request, context:{ip?:string}={}){
 try{
  if(!hostedTest())return json({code:'API_NOT_CONFIGURED',message:'Online sign-in is not connected yet.'},503);
  validateHostedTest();
  const url=new URL(request.url),path=url.pathname.replace(/^\/\.netlify\/functions\/game-api(?=\/)/,'');
  if(url.search||!playerRoute(request.method,path))return json({code:'NOT_FOUND'},404);
  const req:ApiRequest={headers:Object.fromEntries(request.headers.entries()),ip:context.ip || 'unknown'};
  if(request.method==='POST'&&!String(process.env.ALLOWED_ORIGINS||'').split(',').includes(String(req.headers.origin||'')))return json({code:'ORIGIN_REJECTED'},403);
  const body=request.method==='POST'?await readBody(request):undefined;
  const headers:Record<string,string>={};
  const res={setHeader:(name:string,value:string)=>{headers[name]=value;}};
  if(path==='/v1/environment')return json(environment());
  if(path==='/v1/health'){await transaction(db=>db.query('SELECT 1'));return json({status:'ok',mode:'private-test'});}
  if(path==='/v1/games')return json(catalog);
  if(path==='/v1/auth/login'){
   if(typeof body?.username!=='string'||!testAudience.has(body.username.toLowerCase()))return json({code:'INVALID_CREDENTIALS',message:'Player ID or password is incorrect.'},401);
   return json(await login(req,res,body),201,headers);
  }
  await transaction(async db=>{const actor=await actorFor(db,req,request.method==='POST');if(actor.role!=='PLAYER'||!testAudience.has(actor.username))fail(403,'TEST_ACCOUNT_REQUIRED');});
  let result:unknown;
  if(path==='/v1/me')result=await me(req);
  else if(path==='/v1/daily-wheel')result=await dailyWheelStatus(req);
  else if(path==='/v1/daily-wheel/spin')result=await spinDailyWheel(req,body);
  else if(path==='/v1/auth/password')result=await changePassword(req,res,body);
  else if(path==='/v1/history')result=await history(req);
  else if(path==='/v1/staging/history')result=await stagingHistory(req);
  else if(path==='/v1/staging/stats')result=await stagingStats(req);
  else if(path==='/v1/staging/recover')result=await recoverStagingRound(req,body);
  else if(path==='/v1/practice/reef/tables')result=await reefTables(req);
  else if(path==='/v1/practice/reef/room')result=await reefRoom(req);
  else if(path==='/v1/practice/reef/join')result=await reefRoom(req,true,body);
  else if(path==='/v1/practice/reef/leave')result=await reefLeave(req,body);
  else if(path==='/v1/auth/logout'){
   await transaction(async db=>{const actor=await actorFor(db,req,true);await db.query('UPDATE sessions SET revoked_at=now() WHERE token_hash=$1',[actor.token_hash]);});
   res.setHeader('Set-Cookie',sessionCookie('',0));result={loggedOut:true};
  }else result=await stagingRound(req,path.split('/')[3],body);
  return json(result,request.method==='POST'?201:200,headers);
 }catch(error){
  if(error instanceof HttpException)return json(error.getResponse(),error.getStatus());
  console.error('Hosted player request unavailable.');
  return json({code:'SERVICE_UNAVAILABLE',message:'The service could not finish. Please retry shortly.'},503);
 }
}
