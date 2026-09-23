import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createGateway} from '../../scripts/share-gateway.mjs';
const origin='https://arcade-test.trycloudflare.com',audience=[{id:'tester-id',username:'tester.one'}];
test('share boundary exposes built player only, strips demo secrets and enforces tester identity, origin and route',async()=>{
 const calls=[];
 const gateway=createGateway({getAudience:async()=>audience,getOrigin:async()=>origin,fetcher:async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/me'))return Response.json({id:'tester-id',username:'tester.one',role:options.headers.Cookie==='admin'?'MAIN_ADMIN':'PLAYER'});
  if(url.endsWith('/environment'))return Response.json({staging:true,sampleLogin:{username:'stage.player',password:'never-public'}});
  if(url.endsWith('/auth/login'))return Response.json({csrf:'test'},{status:201,headers:{'set-cookie':'ng_staging_session=test; HttpOnly; SameSite=Strict; Path=/v1'}});
  return Response.json({accepted:true},{status:201});
 }});
 await new Promise(resolve=>gateway.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${gateway.address().port}`;
 const call=(path,method='GET',body,headers={})=>new Promise((resolve,reject)=>{const request=http.request(base+path,{method,headers:{Host:'arcade-test.trycloudflare.com',Origin:origin,'X-Forwarded-Proto':'https','Content-Type':'application/json',...headers}},response=>{const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:response.statusCode,headers:response.headers})));});request.on('error',reject);request.end(body===undefined?undefined:JSON.stringify(body));});
 try{
  assert.equal((await call('/')).status,200);
  assert.equal((await call('/v1/auth/login','POST',{username:'tester.one',password:'x'},{Origin:'http://arcade-test.trycloudflare.com'})).status,403);
  for(const path of ['/v1/admin/accounts','/v1/credit-transfers','/v1/auth/verify','/src/App.vue','/.local/staging/human-testers.json','/art/%2e%2e/%2e%2e/.env','/v1/history?accountId=someone'])assert.equal((await call(path)).status,404,path);
  assert.equal((await call('/v1/auth/login','POST',{username:'stage.admin',password:'x'})).status,401);
  assert.equal((await call('/v1/auth/login','POST',{username:'tester.one',password:'x'},{Origin:'https://evil.invalid'})).status,403);
  const login=await call('/v1/auth/login','POST',{username:'tester.one',password:'x'});assert.equal(login.status,201);assert.match(login.headers.get('set-cookie'),/HttpOnly.*Secure/);
  assert.equal((await call('/v1/environment')).status,200);assert.equal((await (await call('/v1/environment')).json()).sampleLogin,undefined);
  assert.equal((await call('/v1/me','GET',undefined,{Cookie:'admin'})).status,403);
  assert.equal((await call('/v1/staging/neon-sevens/rounds','POST',{stake:'2000'},{'X-CSRF-Token':'test'})).status,201);
  const forward=calls.at(-1);assert.equal(forward.options.headers.Origin,'http://127.0.0.1:5183');assert.equal(forward.options.headers['X-CSRF-Token'],'test');
  for(const path of ['/v1/staging/recover','/v1/practice/reef/join','/v1/practice/reef/leave'])assert.equal((await call(path,'POST',{})).status,201,path);
  assert.equal((await call('/v1/practice/reef/tables')).status,201);
  assert.equal((await call('/v1/environment','GET',undefined,{Host:'evil.invalid'})).status,403);
 }finally{await new Promise(resolve=>gateway.close(resolve));}
});
