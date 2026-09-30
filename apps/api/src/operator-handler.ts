import {HttpException} from '@nestjs/common';
import {actorFor,login,verify,sessionCookie,type Request as ApiRequest} from './auth.js';
import {me,createAccount,manageAccount,auditHistory} from './accounts.js';
import {operatorDashboard,operatorAccounts,operatorRecords,operatorReceipt,operatorSettings} from './operator.js';
import {operatorRounds,operatorTotals} from './operator-reports.js';
import {operatorDevices,manageDevice} from './device.js';
import {operatorApiSettings,updateOperatorApi,operatorApiDocumentation,operatorIntegration} from './operator-api.js';
import {adjust,transfer,redeem,reverse} from './ledger.js';
import {changePassword} from './password.js';
import {transaction,fail} from './store.js';
import {hostedTest,validateHostedTest} from './environment.js';

const reads=new Set(['/v1/health','/v1/me','/v1/operator/dashboard','/v1/operator/accounts','/v1/operator/records','/v1/operator/settings','/v1/admin/audit','/v1/operator/rounds','/v1/operator/totals','/v1/operator/devices','/v1/operator/api','/v1/operator/api/documentation','/v1/integration/account','/v1/integration/users','/v1/integration/records','/v1/integration/rounds']);
const writes=new Set(['/v1/auth/login','/v1/auth/logout','/v1/auth/verify','/v1/auth/password','/v1/admin/accounts','/v1/admin/credit-adjustments','/v1/admin/reversals','/v1/credit-transfers','/v1/operator/redeems','/v1/operator/devices','/v1/operator/api']);
const receipt=/^\/v1\/operator\/receipts\/([a-f0-9-]{36})$/;
const manage=/^\/v1\/admin\/accounts\/([a-f0-9-]{36})\/manage$/;
export const operatorRoute=(method:string,path:string)=>method==='GET'?(reads.has(path)||receipt.test(path)):method==='POST'&&(writes.has(path)||manage.test(path));
const json=(body:unknown,status=200,extra:Record<string,string|string[]>={})=>{
 const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});
 for(const [key,value] of Object.entries(extra))for(const item of Array.isArray(value)?value:[value])headers.append(key,item);
 return Response.json(body,{status,headers});
};

/** Separate staff-only deployment; business functions enforce branch/role checks again. */
export async function operatorHandler(request:Request,context:{ip?:string}={}){
 try{
  if(!hostedTest()||process.env.HOSTED_APP!=='operator')return json({code:'API_NOT_CONFIGURED'},503);
  validateHostedTest();
  const url=new URL(request.url),path=url.pathname;
  if(!operatorRoute(request.method,path))return json({code:'NOT_FOUND'},404);
  const filterable=request.method==='GET'&&['/v1/operator/accounts','/v1/operator/records','/v1/operator/rounds','/v1/operator/totals','/v1/operator/devices','/v1/integration/users','/v1/integration/records','/v1/integration/rounds'].includes(path);
  if((url.search&&!filterable)||new Set(url.searchParams.keys()).size!==Array.from(url.searchParams.keys()).length)return json({code:'NOT_FOUND'},404);
  const req:ApiRequest={headers:Object.fromEntries(request.headers.entries()),ip:context.ip||'unknown'};
  let body:unknown;
  if(request.method==='POST'){
   if(!String(process.env.ALLOWED_ORIGINS||'').split(',').includes(String(req.headers.origin||'')))fail(403,'ORIGIN_REJECTED');
   if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'JSON_REQUIRED');
   const reader=request.body?.getReader()??fail(400,'INVALID_JSON');const chunks:Uint8Array[]=[];let size=0;
   while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>16384){await reader.cancel();fail(413,'BODY_TOO_LARGE');}chunks.push(part.value);}
   try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{fail(400,'INVALID_JSON');}
  }
  const headers:Record<string,string|string[]>={},res={setHeader:(key:string,value:string|string[])=>{headers[key]=value;}};
  if(path==='/v1/health'){await transaction(db=>db.query('SELECT 1'));return json({status:'ok',service:'operator'});}
  if(path==='/v1/auth/login')return json(await login(req,res,body,'staff'),201,headers);
  if(path.startsWith('/v1/integration/'))return json(await operatorIntegration(req,path.split('/')[3],Object.fromEntries(url.searchParams)));
  await transaction(async db=>{const actor=await actorFor(db,req,request.method==='POST');if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');});
  let result:unknown;
  if(path==='/v1/me')result=await me(req);
  else if(path==='/v1/operator/dashboard')result=await operatorDashboard(req);
  else if(path==='/v1/operator/accounts')result=await operatorAccounts(req,Object.fromEntries(url.searchParams));
  else if(path==='/v1/operator/records')result=await operatorRecords(req,Object.fromEntries(url.searchParams));
  else if(path==='/v1/operator/rounds')result=await operatorRounds(req,Object.fromEntries(url.searchParams));
  else if(path==='/v1/operator/totals')result=await operatorTotals(req,Object.fromEntries(url.searchParams));
  else if(path==='/v1/operator/devices')result=request.method==='POST'?await manageDevice(req,body):await operatorDevices(req,Object.fromEntries(url.searchParams));
  else if(path==='/v1/operator/api')result=request.method==='POST'?await updateOperatorApi(req,body):await operatorApiSettings(req);
  else if(path==='/v1/operator/api/documentation')result={text:operatorApiDocumentation,operatorIntegration};
  else if(path==='/v1/operator/settings')result=await operatorSettings(req);
  else if(receipt.test(path))result=await operatorReceipt(req,receipt.exec(path)![1]);
  else if(manage.test(path))result=await manageAccount(req,manage.exec(path)![1],body);
  else if(path==='/v1/admin/accounts')result=await createAccount(req,body);
  else if(path==='/v1/admin/audit')result=await auditHistory(req);
  else if(path==='/v1/admin/credit-adjustments')result=await adjust(req,body);
  else if(path==='/v1/admin/reversals')result=await reverse(req,body);
  else if(path==='/v1/credit-transfers')result=await transfer(req,body);
  else if(path==='/v1/operator/redeems')result=await redeem(req,body);
  else if(path==='/v1/auth/verify')result=await verify(req,body);
  else if(path==='/v1/auth/password')result=await changePassword(req,res,body);
  else {
   await transaction(async db=>{const actor=await actorFor(db,req,true);await db.query('UPDATE sessions SET revoked_at=now() WHERE token_hash=$1',[actor.token_hash]);});
   res.setHeader('Set-Cookie',sessionCookie('',0));result={loggedOut:true};
  }
  return json(result,request.method==='POST'?201:200,headers);
 }catch(error){
  if(error instanceof HttpException)return json(error.getResponse(),error.getStatus());
  console.error('Operator request unavailable.');return json({code:'SERVICE_UNAVAILABLE',message:'The service could not finish. Retry the same request.'},503);
 }
}
