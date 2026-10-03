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
const {adjust,transfer}=await import('../../dist/server/apps/api/src/ledger.js');
const root=randomUUID(),branch=randomUUID(),password='DisposableLocalFixture-123!',secret=newTotpSecret();
await control.query('INSERT INTO hosted_test_environment(site_id) VALUES($1)',[site]);
await control.query('INSERT INTO branches(id,name) VALUES($1,$2)',[branch,'Hosted adapter test']);await control.query('INSERT INTO branch_ancestors VALUES($1,$1,0)',[branch]);
await control.query("INSERT INTO accounts(id,branch_id,role,display_name,active,username,password_hash,totp_secret) VALUES($1,$2,'MAIN_ADMIN','Fixture Admin',true,'fixture.admin',$3,$4)",[root,branch,await passwordHash(password),secret]);await control.query('INSERT INTO wallets(id,account_id) VALUES($1,$2)',[randomUUID(),root]);
const admin={headers:{origin},ip:'fixture'};
const auth=await login(admin,{setHeader(name,value){if(name==='Set-Cookie')admin.headers.cookie=(Array.isArray(value)?value:[value]).map(cookie=>cookie.split(';')[0]).join('; ');}},{username:'fixture.admin',password,code:totp(secret)});admin.headers['x-csrf-token']=auth.csrf;
async function fixtureSession(username){const req={headers:{origin},ip:'fixture'};const account=await login(req,{setHeader(name,value){if(name==='Set-Cookie')req.headers.cookie=(Array.isArray(value)?value:[value]).map(c=>c.split(';')[0]).join('; ');}},{username,password});req.headers['x-csrf-token']=account.csrf;return req;}
const distributor=await createAccount(admin,{parentId:root,username:'fixture.circle1',displayName:'Circle',password}),subSession=await fixtureSession('fixture.circle1');
const agent=await createAccount(subSession,{parentId:distributor.id,username:'fixture.agent1',displayName:'Agent',password}),agentSession=await fixtureSession('fixture.agent1');
async function fixtureWallet(id){return (await control.query('SELECT version FROM wallets WHERE account_id=$1',[id])).rows[0];}
await adjust(admin,{targetId:distributor.id,direction:'ADD',amount:'600000',expectedVersion:'0',requestKey:randomUUID(),reason:'Explicit isolated hosted-adapter fixture'});
await transfer(subSession,{targetId:agent.id,amount:'600000',expectedVersion:'1',targetVersion:'0',requestKey:randomUUID(),reason:'Fixture distribution to direct agent'});
for(const username of ['tester.one','tester.two','tester.three','tester.four','tester.five','outside.player']){
 const account=await createAccount(agentSession,{parentId:agent.id,username:username+'1',displayName:username,password});
 // Existing tester IDs predate the six-character letter/number creation policy.
 await control.query('UPDATE accounts SET username=$1 WHERE id=$2',[username,account.id]);
 await transfer(agentSession,{targetId:account.id,amount:'100000',expectedVersion:(await fixtureWallet(agent.id)).version,targetVersion:'0',requestKey:randomUUID(),reason:'Fixture distribution to assigned player'});
}

async function call(path,body,auth,extra={}){
 const response=await operatorHandler(new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrf}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})}),{ip:'127.0.0.1'});
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie'),cookies:response.headers.getSetCookie().map(v=>v.split(';')[0]).join('; '),cache:response.headers.get('cache-control')};
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
  const r=await call('/v1/admin/accounts',{parentId:root,username:'hosted.sub1',displayName:'Hosted Sub',password,requestKey:randomUUID()},session);
  assert.equal(r.status,201,JSON.stringify(r.data));
  const row=(await call('/v1/operator/accounts?role=SUB_DISTRIBUTOR&search=hosted.sub1',undefined,session)).data.items[0];
  assert.equal(row.wallet.available,'0');assert.equal(row.canRedeem,true);
  assert.equal((await call(`/v1/admin/accounts/${r.data.id}/manage`,{action:'SET_ARCHIVED',archived:true,reason:'Hosted archive acceptance',requestKey:randomUUID()},session)).status,201);
  assert.equal((await call('/v1/auth/login',{username:'hosted.sub1',password})).status,401);
  const records=await call('/v1/operator/records?kind=ADJUSTMENTS&pageSize=1',undefined,session);assert.equal(records.status,200);
  const receipt=await call('/v1/operator/receipts/'+records.data.items[0].id,undefined,session);assert.equal(receipt.status,200);
 });
 await t.test('device review is password-gated, persisted, scoped and revokes rejected sessions',async()=>{
  const reviewer={cookie:admin.headers.cookie,csrf:admin.headers['x-csrf-token']};
  const devices=await call('/v1/operator/devices',undefined,reviewer);assert.equal(devices.status,200);assert.equal(devices.data.can_review,true);assert.equal(devices.data.enabled,false);
  assert.ok(devices.data.items.every(d=>!d.secret_hash&&!d.token_hash));
  assert.equal((await call('/v1/operator/devices',{action:'SET_REVIEW',enabled:true},reviewer)).status,201);
  assert.equal((await call('/v1/me',undefined,session)).status,401);
  const pending=await call('/v1/auth/login',{username:'fixture.admin',password});assert.equal(pending.data.deviceReviewRequired,true);assert.ok(!pending.data.csrf);assert.match(pending.cookie,/ng_operator_device=/);assert.doesNotMatch(pending.cookie,/ng_operator_session=/);
  const list=(await call('/v1/operator/devices?status=PENDING',undefined,reviewer)).data;
  const target=list.items[0];assert.ok(target);assert.equal((await call('/v1/operator/devices',{action:'APPROVE',id:target.id},reviewer)).status,201);
  const approved=await call('/v1/auth/login',{username:'fixture.admin',password},undefined,{Cookie:pending.cookies});assert.ok(approved.data.csrf);
  const approvedAuth={cookie:approved.cookies,csrf:approved.data.csrf};assert.equal((await call('/v1/me',undefined,approvedAuth)).status,200);
  assert.equal((await call('/v1/operator/devices',{action:'SET_REVIEW',enabled:false},approvedAuth)).status,403);
  const current=devices.data.items.find(d=>d.current);assert.equal((await call('/v1/operator/devices',{action:'REJECT',id:current.id},reviewer)).status,409);
  assert.equal((await call('/v1/operator/devices',{action:'REJECT',id:target.id},reviewer)).status,201);assert.equal((await call('/v1/me',undefined,approvedAuth)).status,401);
  const agentLogin=await call('/v1/auth/login',{username:'fixture.agent1',password});const agentAuth={cookie:agentLogin.cookies,csrf:agentLogin.data.csrf};
  assert.equal((await call('/v1/operator/devices',{action:'APPROVE',id:current.id},agentAuth)).status,403);
  assert.equal((await call('/v1/operator/devices?unknown=bad',undefined,reviewer)).status,400);
  assert.equal((await call('/v1/operator/devices',{action:'SET_REVIEW',enabled:false},reviewer)).status,201);session=reviewer;
  const fresh=await call('/v1/auth/login',{username:'fixture.admin',password});const freshAuth={cookie:fresh.cookies,csrf:fresh.data.csrf};
  assert.equal((await call('/v1/operator/devices',undefined,freshAuth)).data.can_review,false);
  assert.equal((await call('/v1/operator/devices',{action:'SET_REVIEW',enabled:true},freshAuth)).status,201);
  assert.equal((await call('/v1/operator/devices',undefined,freshAuth)).data.can_review,true);
  assert.equal((await call('/v1/operator/devices',{action:'SET_REVIEW',enabled:false},freshAuth)).status,201);
 });
 await t.test('API credentials are hashed, IP restricted, read-only and revoked by rotation and password reset',async()=>{
  const signed=await call('/v1/auth/login',{username:'fixture.agent1',password});const auth={cookie:signed.cookies,csrf:signed.data.csrf};
  const generated=await call('/v1/operator/api',{action:'REGENERATE'},auth);assert.equal(generated.status,201,JSON.stringify(generated.data));const key=generated.data.secret;assert.match(key,/^ng_[a-f0-9]{64}$/);
  const headers={Authorization:'Bearer '+key};assert.equal((await call('/v1/integration/users',undefined,undefined,headers)).status,401);
  assert.equal((await call('/v1/operator/api',{action:'WHITELIST',ips:['invalid']},auth)).status,400);
  assert.equal((await call('/v1/operator/api',{action:'WHITELIST',ips:['127.0.0.1']},auth)).status,201);
  const users=await call('/v1/integration/users',undefined,undefined,headers);assert.equal(users.status,200,JSON.stringify(users.data));assert.equal(users.data.total,'6');assert.ok(users.data.items.every(v=>v.role==='PLAYER'));
  const own=await call('/v1/integration/account',undefined,undefined,headers);assert.equal(own.data.id,agent.id);assert.ok(!('csrf' in own.data));
  assert.equal((await call('/v1/integration/users',{parentId:agent.id},undefined,headers)).status,404);
  assert.equal((await call('/v1/operator/accounts',undefined,undefined,headers)).status,401);
  const saved=(await control.query('SELECT * FROM operator_api_keys WHERE account_id=$1',[agent.id])).rows[0];assert.notEqual(saved.key_hash,key);assert.ok(!JSON.stringify(saved).includes(key));
  const newer=await call('/v1/operator/api',{action:'REGENERATE'},auth);assert.equal((await call('/v1/integration/users',undefined,undefined,headers)).status,401);
  assert.equal((await call('/v1/integration/users',undefined,undefined,{Authorization:'Bearer '+newer.data.secret})).status,200);
  const subLogin=await call('/v1/auth/login',{username:'fixture.circle1',password});const subAuth={cookie:subLogin.cookies,csrf:subLogin.data.csrf};
  const reset=await call('/v1/admin/accounts/'+agent.id+'/manage',{action:'RESET_PASSWORD',password:'ResetApiFixturePassword-123',reason:'Verify API credential revocation',requestKey:randomUUID()},subAuth);assert.equal(reset.status,201);
  assert.equal((await call('/v1/integration/users',undefined,undefined,{Authorization:'Bearer '+newer.data.secret})).status,401);
  assert.ok(!JSON.stringify((await control.query('SELECT details FROM audit_events')).rows).includes(key));
 });
 await t.test('wrong database identity and wrong deployment type fail closed',async()=>{
  const old=process.env.HOSTED_TEST_SITE_ID;process.env.HOSTED_TEST_SITE_ID=randomUUID();process.env.SITE_ID=process.env.HOSTED_TEST_SITE_ID;
  assert.equal((await call('/v1/health')).status,503);process.env.HOSTED_TEST_SITE_ID=old;process.env.SITE_ID=old;
  process.env.HOSTED_APP='player';assert.equal((await call('/v1/health')).status,503);process.env.HOSTED_APP='operator';
 });
});
after(async()=>{await pool.end();await control.query(`DROP SCHEMA ${schema} CASCADE`);await control.end();});
