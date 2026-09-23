import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
const localUrl=new URL(process.env.DATABASE_URL||'postgres://invalid/');
if(!['127.0.0.1','localhost'].includes(localUrl.hostname)||localUrl.pathname!=='/new_game_staging')throw new Error('Hosted-adapter tests require the isolated local staging database.');
const schema=`test_${randomUUID().replaceAll('-','')}`,control=new pg.Client({connectionString:localUrl.href});
await control.connect();await control.query(`CREATE SCHEMA ${schema}`);await control.query(`SET search_path TO ${schema}`);
for(const file of (await readdir('database/migrations')).filter(f=>f.endsWith('.sql')).sort())await control.query(await readFile(`database/migrations/${file}`,'utf8'));
process.env.PGOPTIONS=`-c search_path=${schema}`;
// Pin the pool to the local test schema before simulating deployment metadata.
// No external database is contacted and runtime validation is not bypassed.
const {pool}=await import('../../dist/server/apps/api/src/store.js');
const site=randomUUID(),origin='https://private-test.example';
Object.assign(process.env,{GAME_ENV:'hosted-test',SITE_ID:site,HOSTED_TEST_SITE_ID:site,HOSTED_TEST_PROFILE:'stage-paying30-v2',DATABASE_URL:'postgresql://fixture:fixture@database.example/test?sslmode=require',ALLOWED_ORIGINS:origin,NODE_ENV:'production'});
const {hostedHandler}=await import('../../dist/server/apps/api/src/hosted-handler.js');
const {login}=await import('../../dist/server/apps/api/src/auth.js');
const {passwordHash,newTotpSecret,totp}=await import('../../dist/server/apps/api/src/security.js');
const {createAccount}=await import('../../dist/server/apps/api/src/accounts.js');
const {adjust}=await import('../../dist/server/apps/api/src/ledger.js');
const root=randomUUID(),branch=randomUUID(),password='DisposableLocalFixture-123!',secret=newTotpSecret();
await control.query('INSERT INTO hosted_test_environment(site_id) VALUES($1)',[site]);
await control.query('INSERT INTO branches(id,name) VALUES($1,$2)',[branch,'Hosted adapter test']);await control.query('INSERT INTO branch_ancestors VALUES($1,$1,0)',[branch]);
await control.query("INSERT INTO accounts(id,branch_id,role,display_name,active,username,password_hash,totp_secret) VALUES($1,$2,'MAIN_ADMIN','Fixture Admin',true,'fixture.admin',$3,$4)",[root,branch,await passwordHash(password),secret]);await control.query('INSERT INTO wallets(id,account_id) VALUES($1,$2)',[randomUUID(),root]);
const admin={headers:{origin},ip:'fixture'};
const auth=await login(admin,{setHeader(name,value){if(name==='Set-Cookie')admin.headers.cookie=value.split(';')[0];}},{username:'fixture.admin',password,code:totp(secret)});admin.headers['x-csrf-token']=auth.csrf;
const distributor=await createAccount(admin,{parentId:root,username:'fixture.circle',displayName:'Circle',password});
const agent=await createAccount(admin,{parentId:distributor.id,username:'fixture.agent',displayName:'Agent',password});
for(const username of ['tester.one','tester.two','tester.three','tester.four','tester.five','outside.player']){
 const account=await createAccount(admin,{parentId:agent.id,username,displayName:username,password});
 await adjust(admin,{targetId:account.id,direction:'ADD',amount:'100000',expectedVersion:'0',requestKey:randomUUID(),reason:'Explicit isolated hosted-adapter acceptance fixture'});
}
async function call(path,body,auth,extra={}){
 const response=await hostedHandler(new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrf}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})}),{ip:'127.0.0.1'});
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie'),cache:response.headers.get('cache-control')};
}
const sessions=[];
test('Netlify player transport uses authoritative accounting and four real seats',async t=>{
 await t.test('five logins keep secure cookies; admin and other accounts cannot enter',async()=>{
  for(const name of ['one','two','three','four','five']){
   const r=await call('/v1/auth/login',{username:`tester.${name}`,password});assert.equal(r.status,201);assert.match(r.cookie,/Secure/);assert.match(r.cookie,/HttpOnly/);assert.match(r.cookie,/ng_hosted_test_session/);assert.equal(r.cache,'no-store');sessions.push({cookie:r.cookie.split(';')[0],csrf:r.data.csrf});
  }
  assert.equal((await call('/v1/me',undefined,sessions[0])).data.wallet.available,'100000');
  for(const username of ['fixture.admin','outside.player'])assert.equal((await call('/v1/auth/login',{username,password})).status,401);
  assert.equal((await call('/v1/admin/accounts')).status,404);
  assert.equal((await call('/v1/history?accountId=someone',undefined,sessions[0])).status,404);
  assert.equal((await call('/v1/me',undefined,{cookie:admin.headers.cookie,csrf:admin.headers['x-csrf-token']})).status,403);
 });
 await t.test('wrong origin, CSRF and oversized bodies are rejected',async()=>{
  assert.equal((await call('/v1/auth/logout',{},sessions[0],{Origin:'https://other.example'})).status,403);
  assert.equal((await call('/v1/auth/logout',{},sessions[0],{'X-CSRF-Token':'forged'})).status,403);
  assert.equal((await call('/v1/auth/login',{username:'tester.one',password:'x'.repeat(17000)})).status,413);
 });
 await t.test('slot retries settle one round; recovery cannot create a new charge',async()=>{
  const body={requestKey:randomUUID(),stake:'25',profileId:'stage-paying30-v2'};
  const results=await Promise.all(Array.from({length:6},()=>call('/v1/staging/neon-sevens/rounds',body,sessions[0])));
  for(const result of results){assert.equal(result.status,201,JSON.stringify(result.data));assert.deepEqual(result.data,results[0].data);}
  const player=(await call('/v1/me',undefined,sessions[0])).data;
  assert.equal(BigInt(player.wallet.available),100000n-25n+BigInt(results[0].data.award));
  assert.equal((await control.query('SELECT count(*)::int n FROM staging_rounds')).rows[0].n,1);
  assert.deepEqual((await call('/v1/staging/recover',{...body,game:'neon-sevens'},sessions[0])).data.result,results[0].data);
  const missing={...body,requestKey:randomUUID()};assert.equal((await call('/v1/staging/recover',{...missing,game:'neon-sevens'},sessions[0])).data.status,'NOT_PLAYED');
  assert.equal((await call('/v1/staging/neon-sevens/rounds',missing,sessions[0])).status,409);
 });
 await t.test('four people join one table and the fifth cannot occupy an existing seat',async()=>{
  const first=await call('/v1/practice/reef/join',{newTable:true,seat:1},sessions[0]);assert.equal(first.status,201,JSON.stringify(first.data));
  const roomId=first.data.id;
  for(let seat=2;seat<=4;seat++)assert.equal((await call('/v1/practice/reef/join',{roomId,seat},sessions[seat-1])).status,201);
  const tables=await call('/v1/practice/reef/tables',undefined,sessions[0]);assert.equal(tables.status,200);
  const full=await call('/v1/practice/reef/join',{roomId,seat:1},sessions[4]);assert.equal(full.status,409);
  assert.equal((await control.query('SELECT count(*)::int n FROM practice_seats WHERE room_id=$1',[roomId])).rows[0].n,4);
 });
 await t.test('a different database marker prevents account reads',async()=>{
  await control.query('UPDATE hosted_test_environment SET site_id=$1',[randomUUID()]);
  assert.equal((await call('/v1/me',undefined,sessions[0])).status,503);
  await control.query('UPDATE hosted_test_environment SET site_id=$1',[site]);
  assert.equal((await call('/v1/health')).status,200);
 });
 await t.test('public environment never returns a sample password',async()=>{
  process.env.STAGING_DEMO_PASSWORD='must-not-leak';const r=await call('/v1/environment');assert.equal(r.status,200);assert.equal(r.data.sampleLogin,null);assert.equal(r.data.productionApproved,false);
  assert.equal((await call('/v1/auth/logout',{},sessions[0])).status,201);assert.equal((await call('/v1/me',undefined,sessions[0])).status,401);
 });
});
after(async()=>{await pool.end();await control.query(`DROP SCHEMA ${schema} CASCADE`);await control.end();});
