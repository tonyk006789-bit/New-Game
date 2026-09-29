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
Object.assign(process.env,{HOSTED_APP:'operator',GAME_ENV:'hosted-test',SITE_ID:site,HOSTED_TEST_SITE_ID:site,HOSTED_TEST_PROFILE:'stage-paying30-v2',DATABASE_URL:'postgresql://fixture:fixture@database.example/test?sslmode=require',ALLOWED_ORIGINS:origin,NODE_ENV:'production'});
const {operatorHandler}=await import('../../dist/server/apps/api/src/operator-handler.js');
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
 const response=await operatorHandler(new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrf}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})}),{ip:'127.0.0.1'});
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie'),cache:response.headers.get('cache-control')};
}

test('separate operator hosted transport is password-only and staff-only',async t=>{
 let session;
 await t.test('password login returns a separate secure staff cookie',async()=>{
  const r=await call('/v1/auth/login',{username:'fixture.admin',password});assert.equal(r.status,201,JSON.stringify(r.data));
  assert.match(r.cookie,/ng_operator_session=/);assert.match(r.cookie,/HttpOnly/);assert.match(r.cookie,/Secure/);
  session={cookie:r.cookie.split(';')[0],csrf:r.data.csrf};assert.equal((await call('/v1/me',undefined,session)).data.role,'MAIN_ADMIN');
  assert.equal((await call('/v1/auth/login',{username:'tester.one',password})).status,401);
  assert.equal((await call('/v1/operator/dashboard')).status,401);
 });
 await t.test('strict routes and parameter validation block routing overrides',async()=>{
  assert.equal((await call('/v1/operator/accounts?role=SUB_DISTRIBUTOR&pageSize=1',undefined,session)).data.total,'1');
  assert.equal((await call('/v1/operator/accounts?role=PLAYER&role=MAIN_ADMIN',undefined,session)).status,404);
  assert.equal((await call('/v1/operator/accounts?unknown=value',undefined,session)).status,400);
  assert.equal((await call('/v1/me?accountId=other',undefined,session)).status,404);
  for(const path of ['/v1/staging/neon-sevens/rounds','/v1/daily-wheel/spin'])assert.equal((await call(path,{},session)).status,404);
  assert.equal((await call('/v1/auth/verify',{password},session,{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await call('/v1/auth/login',{username:'fixture.admin',password},undefined,{Origin:'https://other.invalid'})).status,403);
  assert.equal((await call('/v1/auth/login',{username:'fixture.admin',password:'x'.repeat(17000)})).status,413);
  assert.equal((await call('/v1/auth/verify',{password},session)).status,201);
 });
 await t.test('hosted staff creates a zero-balance sub-contractor and archives it',async()=>{
  const r=await call('/v1/admin/accounts',{parentId:root,username:'hosted.sub',displayName:'Hosted Sub',password,requestKey:randomUUID()},session);
  assert.equal(r.status,201,JSON.stringify(r.data));
  const row=(await call('/v1/operator/accounts?role=SUB_DISTRIBUTOR&search=hosted.sub',undefined,session)).data.items[0];
  assert.equal(row.wallet.available,'0');assert.equal(row.canRedeem,true);
  assert.equal((await call(`/v1/admin/accounts/${r.data.id}/manage`,{action:'SET_ARCHIVED',archived:true,reason:'Hosted archive acceptance',requestKey:randomUUID()},session)).status,201);
  assert.equal((await call('/v1/auth/login',{username:'hosted.sub',password})).status,401);
  const records=await call('/v1/operator/records?kind=ADJUSTMENTS&pageSize=1',undefined,session);assert.equal(records.status,200);
  const receipt=await call('/v1/operator/receipts/'+records.data.items[0].id,undefined,session);assert.equal(receipt.status,200);
 });
 await t.test('wrong database identity and wrong deployment type fail closed',async()=>{
  const old=process.env.HOSTED_TEST_SITE_ID;process.env.HOSTED_TEST_SITE_ID=randomUUID();process.env.SITE_ID=process.env.HOSTED_TEST_SITE_ID;
  assert.equal((await call('/v1/health')).status,503);process.env.HOSTED_TEST_SITE_ID=old;process.env.SITE_ID=old;
  process.env.HOSTED_APP='player';assert.equal((await call('/v1/health')).status,503);process.env.HOSTED_APP='operator';
 });
});
after(async()=>{await pool.end();await control.query(`DROP SCHEMA ${schema} CASCADE`);await control.end();});
