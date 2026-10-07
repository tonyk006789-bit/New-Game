import {hierarchyFixture} from './hierarchy-fixture.mjs';
import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('A local PostgreSQL DATABASE_URL is required; database tests are not simulated.');
const url=new URL(process.env.DATABASE_URL);if(!['127.0.0.1','localhost'].includes(url.hostname)||!/^\/new_game_staging$/.test(url.pathname))throw new Error('Tests only run against local development databases.');
const schema=`test_${randomUUID().replaceAll('-','')}`;const control=new pg.Client({connectionString:process.env.DATABASE_URL});await control.connect();await control.query(`CREATE SCHEMA ${schema}`);await control.query(`SET search_path TO ${schema}`);
for(const file of (await readdir('database/migrations')).filter(f=>f.endsWith('.sql')).sort())await control.query(await readFile(`database/migrations/${file}`,'utf8'));
process.env.PGOPTIONS=`-c search_path=${schema}`;
const {passwordHash,newTotpSecret,totp}=await import('../../dist/server/apps/api/src/security.js');
const {createApi}=await import('../../dist/server/apps/api/src/app.js');
const {pool}=await import('../../dist/server/apps/api/src/store.js');
const adminId=randomUUID(),branch=randomUUID(),adminPassword='LocalTestPassword-1234',secret=newTotpSecret();
await control.query('INSERT INTO branches(id,name) VALUES($1,$2)',[branch,'Test root']);await control.query('INSERT INTO branch_ancestors VALUES($1,$1,0)',[branch]);
await control.query("INSERT INTO accounts(id,branch_id,role,display_name,active,username,password_hash,totp_secret) VALUES($1,$2,'MAIN_ADMIN','Test admin',true,'test.admin',$3,$4)",[adminId,branch,await passwordHash(adminPassword),secret]);await control.query('INSERT INTO wallets(id,account_id) VALUES($1,$2)',[randomUUID(),adminId]);
const app=await createApi();await app.listen(0,'127.0.0.1');const base=await app.getUrl();
async function call(path,body,auth,extra={}){const response=await fetch(`${base}/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:5184','Content-Type':'application/json',...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrf}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
async function signin(username,password=adminPassword,code){const response=await call('auth/login',{username,password,...(code?{code}:{})});assert.equal(response.status,201,JSON.stringify(response.data));return {cookie:response.cookie,csrf:response.data.csrf};}
const admin=await signin('test.admin',adminPassword,totp(secret));
const fixture=hierarchyFixture({db:control,call,signin,rootId:adminId,rootAuth:admin});
async function create(parentId,username,auth){auth??=await fixture.auth(parentId);const r=await call('admin/accounts',{parentId,username,displayName:username,password:adminPassword,requestKey:randomUUID()},auth);assert.equal(r.status,201,JSON.stringify(r.data));return r.data.id;}
async function wallet(id){return (await control.query('SELECT settled_units settled,reserved_units reserved,version,(settled_units-reserved_units)::text available FROM wallets WHERE account_id=$1',[id])).rows[0];}
async function adjust(id,amount){return fixture.fund(id,amount);}
async function move(path,actorAuth,actorId,playerId,amount,extra={}){return call(path,{targetId:playerId,amount,reason:'Approved operator workflow test',requestKey:randomUUID(),expectedVersion:(await wallet(actorId)).version,targetVersion:(await wallet(playerId)).version,...extra},actorAuth);}
let north,agent,player,peer,southAgent,southPlayer,operator,playerAuth,subAuth,redeemReceipt;
const ok=r=>assert.equal(r.status,201,JSON.stringify(r.data));
test('agent console authorization and accounting in isolated PostgreSQL',async t=>{
 await t.test('agent creates a zero-credit player exactly once under retries',async()=>{
  north=await create(adminId,'operator.north1');agent=await create(north,'operator.agent1');operator=await signin('operator.agent1');subAuth=await signin('operator.north1');
  const body={parentId:agent,username:'operator.player1',displayName:'North player',password:adminPassword,requestKey:randomUUID()};
  const attempts=await Promise.all(Array.from({length:5},()=>call('admin/accounts',body,operator)));attempts.forEach(ok);assert.equal(new Set(attempts.map(r=>r.data.id)).size,1);player=attempts[0].data.id;playerAuth=await signin('operator.player1');
  assert.equal((await wallet(player)).settled,'0');assert.equal((await control.query('SELECT count(*)::int n FROM ledger_transactions')).rows[0].n,0);
  assert.equal((await call('admin/accounts',{...body,displayName:'Changed name'},operator)).status,409);
  peer=await create(agent,'operator.peer1',operator);const south=await create(adminId,'operator.south1');southAgent=await create(south,'operator.southagent1');southPlayer=await create(southAgent,'operator.southplayer1');
 });
 await t.test('no branch escape or privilege escalation through account creation',async()=>{
  const body={parentId:agent,username:'unauthorized1',displayName:'Unauthorized',password:adminPassword};
  assert.equal((await call('admin/accounts',{...body,parentId:southAgent},operator)).status,403);
  assert.equal((await call('admin/accounts',{...body,role:'MAIN_ADMIN'},operator)).status,400);
  assert.equal((await call('admin/accounts',body,playerAuth)).status,403);
  assert.equal((await call('admin/accounts',body,subAuth)).status,403);
  assert.equal((await call('admin/accounts',body,operator,{'X-CSRF-Token':'invalid'})).status,403);
 });
 await t.test('main admin and sub-contractors cannot host or operate individual clients',async()=>{
  const before=(await control.query('SELECT account_id,settled_units,version FROM wallets WHERE account_id IS NOT NULL ORDER BY account_id')).rows;
  for(const [auth,actorId,targets] of [[admin,adminId,[agent,player]],[subAuth,north,[player]]]){
   for(const targetId of targets){
    assert.equal((await call('admin/accounts',{parentId:targetId,username:'skip.level1',displayName:'Denied',password:adminPassword,requestKey:randomUUID()},auth)).status,403);
    for(const direction of ['ADD','REMOVE'])assert.equal((await call('admin/credit-adjustments',{targetId,direction,amount:'1',reason:'Reject skipped-level adjustment',requestKey:randomUUID(),expectedVersion:(await wallet(targetId)).version},auth)).status,403);
    assert.equal((await move('credit-transfers',auth,actorId,targetId,'1')).status,403);
    for(const data of [{action:'EDIT_PROFILE',displayName:'Denied'},{action:'RESET_PASSWORD',password:'DeniedPassword-12345'},{action:'SET_ACTIVE',active:false},{action:'SET_ARCHIVED',archived:true}])
     assert.equal((await call(`admin/accounts/${targetId}/manage`,{...data,reason:'Reject skipped-level management',requestKey:randomUUID()},auth)).status,403);
    assert.equal((await call('history?accountId='+targetId,undefined,auth)).status,404);
    assert.equal((await call('operator/records?accountId='+targetId,undefined,auth)).status,404);
   }
   assert.equal((await call('operator/accounts?role=PLAYER',undefined,auth)).data.total,'0');
   assert.equal((await call('operator/rounds',undefined,auth)).status,403);
  }
  assert.deepEqual((await control.query('SELECT account_id,settled_units,version FROM wallets WHERE account_id IS NOT NULL ORDER BY account_id')).rows,before);
  for(const [auth,role,canAdjust] of [[admin,'SUB_DISTRIBUTOR',true],[subAuth,'AGENT',false],[operator,'PLAYER',false]]){
   const list=(await call('operator/accounts',undefined,auth)).data;
   assert.ok(list.items.length>0);assert.ok(list.items.every(row=>row.role===role&&row.canManage&&row.canTransfer&&row.canRedeem&&row.canAdjust===canAdjust));
  }
 });
 await t.test('server-side search, pagination, ordering and counts are branch scoped',async()=>{
  const first=await call('operator/accounts?pageSize=1&sort=username&order=asc',undefined,operator);assert.equal(first.status,200,JSON.stringify(first.data));assert.equal(first.data.total,'2');assert.equal(first.data.items.length,1);assert.equal(typeof first.data.items[0].wallet.version,'string');
  const second=await call('operator/accounts?pageSize=1&page=2&sort=username&order=asc',undefined,operator);assert.notEqual(first.data.items[0].id,second.data.items[0].id);
  assert.equal((await call('operator/accounts?search=operator.south1',undefined,operator)).data.total,'0');
  assert.equal((await call('operator/accounts?search=%25',undefined,operator)).data.total,'0');
  assert.equal((await call('operator/accounts?sort=created%3BDROP',undefined,operator)).status,400);
  assert.equal((await call('operator/accounts?page=0',undefined,operator)).status,400);
  assert.equal((await call('operator/accounts',undefined,playerAuth)).status,403);
  assert.equal((await call('operator/dashboard',undefined,operator)).data.players,'2');
  assert.equal((await call('operator/dashboard',undefined,playerAuth)).status,403);
 });
 await t.test('recharge debits the agent and cannot issue supply',async()=>{
  ok(await adjust(agent,'20000'));ok(await move('credit-transfers',operator,agent,player,'4000'));
  assert.equal((await wallet(agent)).settled,'16000');assert.equal((await wallet(player)).settled,'4000');
  assert.equal((await call('admin/credit-adjustments',{targetId:player,direction:'ADD',amount:'1',reason:'Unauthorized grant attempt',requestKey:randomUUID(),expectedVersion:(await wallet(player)).version},operator)).status,403);
 });
 await t.test('concurrent redeem retries have a single balanced receipt and exact supply',async()=>{
  const before=(await control.query('SELECT sum(settled_units)::text amount FROM wallets')).rows[0].amount;
  const body={targetId:player,amount:'750',reason:'Player requested credit collection',requestKey:randomUUID(),expectedVersion:(await wallet(agent)).version,targetVersion:(await wallet(player)).version};
  const attempts=await Promise.all(Array.from({length:8},()=>call('operator/redeems',body,operator)));attempts.forEach(ok);assert.equal(new Set(attempts.map(r=>r.data.id)).size,1);redeemReceipt=attempts[0].data.id;
  assert.equal((await wallet(agent)).settled,'16750');assert.equal((await wallet(player)).settled,'3250');
  assert.equal((await control.query('SELECT sum(settled_units)::text amount FROM wallets')).rows[0].amount,before);
  assert.equal((await control.query('SELECT sum(units)::text amount,count(*)::int n FROM ledger_postings WHERE transaction_id=$1',[redeemReceipt])).rows[0].amount,'0');
  assert.equal((await call('operator/redeems',{...body,amount:'500'},operator)).status,409);
 });
 await t.test('redeem rejects all roles and sources except the assigned agent/player pair',async()=>{
  assert.equal((await move('operator/redeems',operator,agent,southPlayer,'1')).status,404);
  assert.equal((await move('operator/redeems',operator,agent,agent,'1')).status,403);
  assert.equal((await move('operator/redeems',admin,adminId,player,'1')).status,403);
  assert.equal((await move('operator/redeems',subAuth,north,player,'1')).status,403);
  assert.equal((await move('operator/redeems',playerAuth,player,player,'1')).status,403);
  const body={targetId:player,amount:'1',reason:'Forged source attempt',requestKey:randomUUID(),expectedVersion:'0',targetVersion:'0',sourceId:southPlayer};
  assert.equal((await call('operator/redeems',body,operator)).status,400);
  assert.equal((await call('operator/redeems',{...body,sourceId:undefined},operator,{Origin:'https://foreign.invalid'})).status,403);
 });
 await t.test('competing requests cannot overspend or take reserved credits',async()=>{
  const body={targetId:player,amount:'2000',reason:'Concurrent collection test',expectedVersion:(await wallet(agent)).version,targetVersion:(await wallet(player)).version};
  const results=await Promise.all([call('operator/redeems',{...body,requestKey:randomUUID()},operator),call('operator/redeems',{...body,requestKey:randomUUID()},operator)]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);assert.equal((await wallet(player)).settled,'1250');
  await control.query('UPDATE wallets SET reserved_units=1000 WHERE account_id=$1',[player]);const before=await wallet(player);
  assert.equal((await move('operator/redeems',operator,agent,player,'251')).status,409);assert.deepEqual(await wallet(player),before);
  await control.query('UPDATE wallets SET reserved_units=0 WHERE account_id=$1',[player]);
 });
 await t.test('receipt, record totals and aggregates cannot disclose another branch',async()=>{
  ok(await adjust(southPlayer,'876'));const rows=await call('operator/records?kind=REDEEM',undefined,operator);assert.equal(rows.status,200,JSON.stringify(rows.data));assert.equal(rows.data.total,'2');assert.ok(rows.data.items.every(r=>r.username==='operator.player1'));
  assert.equal((await call('operator/records?accountId='+southPlayer,undefined,operator)).status,404);
  const other=(await control.query('SELECT id FROM ledger_transactions WHERE target_id=$1 LIMIT 1',[southPlayer])).rows[0].id;
  assert.equal((await call('operator/receipts/'+other,undefined,operator)).status,404);
  const receipt=await call('operator/receipts/'+redeemReceipt,undefined,operator);assert.equal(receipt.status,200);assert.equal(receipt.data.postings.length,2);assert.equal(receipt.data.units,'-750');
  assert.equal((await call('operator/records?from=2026-02-30',undefined,operator)).status,400);
  assert.equal((await call('operator/records?from=2026-10-01&to=2026-09-01',undefined,operator)).status,400);
  assert.equal((await call('operator/records?from=2001-01-01&to=2001-01-02',undefined,operator)).data.total,'0');
  const dashboard=(await call('operator/dashboard',undefined,operator)).data;assert.equal(dashboard.recharge_total,'4000');assert.equal(dashboard.redeem_total,'2750');
  const recharge=(await call('operator/records?kind=RECHARGE',undefined,operator)).data;assert.equal(recharge.total,'2');
  ok(await adjust(agent,'1'));
  const incoming=(await control.query("SELECT id FROM ledger_transactions WHERE target_id=$1 AND kind='TRANSFER'",[agent])).rows[0].id;
  const scopedReceipt=(await call('operator/receipts/'+incoming,undefined,operator)).data;assert.equal(scopedReceipt.postings.length,1);assert.equal(scopedReceipt.postings[0].username,'operator.agent1');
  for(const auth of [admin,subAuth])assert.equal((await call('operator/receipts/'+redeemReceipt,undefined,auth)).status,404);
 });
 await t.test('five-minute staff verification uses passwords without requiring an authenticator',async()=>{
  await control.query("UPDATE sessions SET verified_at=now()-interval '6 minutes' WHERE account_id=$1",[agent]);
  const rejected=await move('operator/redeems',operator,agent,player,'1');assert.equal(rejected.status,403);assert.equal(rejected.data.code,'VERIFICATION_REQUIRED');
  assert.equal((await call('auth/verify',{password:'invalid-password'},operator)).status,403);
  const verified=await Promise.all(Array.from({length:5},()=>call('auth/verify',{password:adminPassword},operator)));verified.forEach(ok);
  assert.equal((await call('auth/verify',{password:adminPassword},admin)).status,201);ok(await call('auth/verify',{password:adminPassword,code:totp(secret)},admin));
 });
 await t.test('game settlement and redemption races reconcile without canceling awards',async()=>{
  const before=await wallet(player),amount=before.available;
  const result=await Promise.all([call('staging/neon-sevens/rounds',{requestKey:randomUUID(),stake:'25',profileId:'stage-rate-v31-r1-20-stage-classic3-v1'},playerAuth),move('operator/redeems',operator,agent,player,amount)]);
  assert.ok(result.every(r=>[201,409].includes(r.status)),JSON.stringify(result));assert.ok(result.some(r=>r.status===201));
  const after=await wallet(player);assert.ok(BigInt(after.settled)>=0n);
  assert.equal((await control.query('SELECT coalesce(sum(p.units),0)::text n FROM ledger_postings p JOIN wallets w ON w.id=p.wallet_id WHERE w.account_id=$1',[player])).rows[0].n,after.settled);
  if(result[0].status===201){const round=(await control.query('SELECT * FROM staging_rounds WHERE account_id=$1',[player])).rows[0];assert.ok(round);const receipt=(await call('operator/receipts/'+round.stake_transaction,undefined,operator)).data;assert.equal(receipt.round_id,round.id);assert.equal(receipt.award_units,round.award_units);}
 });
 await t.test('reference game and total reports aggregate committed rounds once and preserve branch scope',async()=>{
  await new Promise(resolve=>setTimeout(resolve,1100));
  ok(await adjust(player,'1000'));
  ok(await call('staging/neon-sevens/rounds',{requestKey:randomUUID(),stake:'25',profileId:'stage-rate-v31-r1-20-stage-classic3-v1'},playerAuth));
  const expected=(await control.query('SELECT count(*)::text total,sum(stake_units)::text played,sum(award_units)::text won FROM staging_rounds WHERE account_id=$1',[player])).rows[0];
  const rounds=await call('operator/rounds',undefined,operator);assert.equal(rounds.status,200,JSON.stringify(rounds.data));assert.equal(rounds.data.total,expected.total);assert.equal(rounds.data.played,expected.played);assert.equal(rounds.data.won,expected.won);
  for(const row of rounds.data.items){assert.equal(BigInt(row.before_units)-BigInt(row.stake_units)+BigInt(row.award_units),BigInt(row.after_units));assert.equal(row.manager,'operator.agent1');}
  const totals=await call('operator/totals',undefined,operator);assert.equal(totals.status,200,JSON.stringify(totals.data));assert.equal(totals.data.total,'1');assert.equal(totals.data.played,expected.played);assert.equal(totals.data.recharged,'5000');assert.ok(totals.data.items.every(row=>row.id===agent));
  for(const [auth,role] of [[admin,'SUB_DISTRIBUTOR'],[subAuth,'AGENT']]){const rollup=await call('operator/totals',undefined,auth);assert.equal(rollup.status,200,JSON.stringify(rollup.data));assert.ok(rollup.data.items.every(row=>row.role===role));assert.equal(rollup.data.played,expected.played);}
  assert.equal((await call('operator/rounds?search=operator.south1',undefined,operator)).data.total,'0');assert.equal((await call('operator/totals?search=operator.south1',undefined,operator)).data.total,'0');
  assert.equal((await call('operator/rounds?from=2026-99-99',undefined,operator)).status,400);assert.equal((await call('operator/totals',undefined,playerAuth)).status,403);
  const member=(await call('operator/accounts?search=operator.player1',undefined,operator)).data.items[0];assert.match(member.publicId,/^\d+$/);assert.equal(member.registeredIp,'127.0.0.1');assert.equal(member.lastIp,'127.0.0.1');assert.ok(BigInt(member.loginCount)>0n);assert.match(member.manager,/operator.agent1/);
  assert.equal((await call('operator/accounts?role=ALL&search='+agent,undefined,operator)).data.total,'0');
  assert.equal((await call('operator/accounts?search='+member.publicId,undefined,operator)).data.items[0].id,player);
 });
 await t.test('agent edits/reset/suspension are scoped and preserve the ledger',async()=>{
  const before=await wallet(player);const edit={action:'EDIT_PROFILE',displayName:'Updated player',reason:'Player profile correction',requestKey:randomUUID()};ok(await call(`admin/accounts/${player}/manage`,edit,operator));ok(await call(`admin/accounts/${player}/manage`,edit,operator));
  assert.equal((await call(`admin/accounts/${southPlayer}/manage`,edit,operator)).status,404);assert.equal((await call(`admin/accounts/${agent}/manage`,edit,operator)).status,403);
  assert.equal((await call(`admin/accounts/${adminId}/manage`,edit,admin)).status,403);
  const suspend={action:'SET_ACTIVE',active:false,reason:'Operator access test',requestKey:randomUUID()};ok(await call(`admin/accounts/${player}/manage`,suspend,operator));assert.equal((await call('me',undefined,playerAuth)).status,401);
  assert.equal((await call('operator/accounts?status=SUSPENDED',undefined,operator)).data.total,'1');
  ok(await call(`admin/accounts/${player}/manage`,{...suspend,active:true,requestKey:randomUUID()},operator));
  ok(await call(`admin/accounts/${player}/manage`,{action:'RESET_PASSWORD',password:'ReplacementPassword-1234',reason:'Player password recovery',requestKey:randomUUID()},operator));
  assert.equal((await call('auth/login',{username:'operator.player1',password:adminPassword})).status,401);await signin('operator.player1','ReplacementPassword-1234');assert.deepEqual(await wallet(player),before);
  const sensitive=(await control.query('SELECT details FROM audit_events')).rows;assert.ok(!JSON.stringify(sensitive).includes('ReplacementPassword-1234'));
 });
 await t.test('sub-contractors manage direct agents; parent redemption stays supply neutral',async()=>{
  const sub=await create(adminId,'hierarchy.sub1'),subSession=await signin('hierarchy.sub1');
  const child=await create(sub,'hierarchy.agent1',subSession),childSession=await signin('hierarchy.agent1');
  const leaf=await create(child,'hierarchy.player1',childSession);
  assert.equal((await wallet(child)).settled,'0');
  assert.equal((await call('admin/accounts',{parentId:north,username:'escape.agent1',displayName:'Escape',password:adminPassword},subSession)).status,403);
  const edit={action:'EDIT_PROFILE',displayName:'Managed agent',reason:'Sub-contractor manages its agent',requestKey:randomUUID()};
  ok(await call(`admin/accounts/${child}/manage`,edit,subSession));
  assert.equal((await call(`admin/accounts/${leaf}/manage`,edit,subSession)).status,403);
  assert.equal((await call(`admin/accounts/${southAgent}/manage`,edit,subSession)).status,404);
  ok(await adjust(sub,'1000'));ok(await move('credit-transfers',subSession,sub,child,'500'));
  const total=()=>control.query('SELECT sum(settled_units)::text n FROM wallets').then(r=>r.rows[0].n),before=await total();
  const body={targetId:child,amount:'200',reason:'Direct agent credit collection',requestKey:randomUUID(),expectedVersion:(await wallet(sub)).version,targetVersion:(await wallet(child)).version};
  const retries=await Promise.all(Array.from({length:5},()=>call('operator/redeems',body,subSession)));retries.forEach(ok);assert.equal(new Set(retries.map(r=>r.data.id)).size,1);
  ok(await move('operator/redeems',admin,adminId,sub,'250'));assert.equal(await total(),before);
  assert.equal((await wallet(child)).settled,'300');assert.equal((await wallet(sub)).settled,'450');
  const rows=(await call('operator/accounts?role=AGENT',undefined,subSession)).data.items;
  assert.equal(rows.length,1);assert.equal(rows[0].canManage,true);assert.equal(rows[0].canRedeem,true);
 });
 await t.test('staff suspension and archive block the entire branch without erasing balances',async()=>{
  const sub=(await control.query("SELECT id FROM accounts WHERE username='hierarchy.sub1'")).rows[0].id;
  const child=(await control.query("SELECT id FROM accounts WHERE username='hierarchy.agent1'")).rows[0].id;
  const leaf=(await control.query("SELECT id FROM accounts WHERE username='hierarchy.player1'")).rows[0].id;
  let childSession=await signin('hierarchy.agent1'),leafSession=await signin('hierarchy.player1');
  const before=await wallet(child),ledger=(await control.query('SELECT count(*)::text n FROM ledger_transactions')).rows[0].n;
  const status={action:'SET_ACTIVE',active:false,reason:'Suspend a whole managed branch',requestKey:randomUUID()};
  ok(await call(`admin/accounts/${sub}/manage`,status,admin));
  for(const session of [childSession,leafSession])assert.equal((await call('me',undefined,session)).status,401);
  assert.equal((await call('auth/login',{username:'hierarchy.player1',password:adminPassword})).status,401);
  assert.equal((await call('operator/accounts?search='+child+'&role=ALL',undefined,admin)).data.total,'0');
  ok(await call(`admin/accounts/${sub}/manage`,{...status,active:true,requestKey:randomUUID()},admin));
  childSession=await signin('hierarchy.agent1');leafSession=await signin('hierarchy.player1');
  // An individually suspended child must remain suspended after the parent is restored.
  ok(await call(`admin/accounts/${leaf}/manage`,{...status,requestKey:randomUUID()},childSession));
  const archive={action:'SET_ARCHIVED',archived:true,reason:'Owner approved account archive',requestKey:randomUUID()};
  const results=await Promise.all([call(`admin/accounts/${sub}/manage`,archive,admin),call('me',undefined,childSession)]);
  ok(results[0]);assert.ok([200,401].includes(results[1].status));
  assert.equal((await call('me',undefined,childSession)).status,401);
  assert.equal((await call('auth/login',{username:'hierarchy.agent1',password:adminPassword})).status,401);
  assert.equal((await call('operator/accounts?role=SUB_DISTRIBUTOR&status=ARCHIVED',undefined,admin)).data.items.some(r=>r.id===sub),true);
  assert.equal((await call('admin/accounts',{parentId:sub,username:'blocked.child1',displayName:'Blocked',password:adminPassword},admin)).status,403);
  ok(await call(`admin/accounts/${sub}/manage`,{...archive,archived:false,requestKey:randomUUID()},admin));
  await signin('hierarchy.agent1');assert.equal((await call('auth/login',{username:'hierarchy.player1',password:adminPassword})).status,401);
  assert.deepEqual(await wallet(child),before);assert.equal((await control.query('SELECT count(*)::text n FROM ledger_transactions')).rows[0].n,ledger);
  assert.equal((await call('me',undefined,leafSession)).status,401);
 });
 await t.test('all three operator tiers can manage and move credits with empty reasons and durable receipts',async()=>{
  const prior=(await control.query("SELECT id,reason FROM ledger_transactions ORDER BY id")).rows;
  const sub=await create(adminId,'blank.sub1'),subSession=await signin('blank.sub1');
  const child=await create(sub,'blank.agent1',subSession),childSession=await signin('blank.agent1');
  const leaf=await create(child,'blank.player1',childSession);
  const receipts=[];
  const grant=async(targetId,direction,amount)=>{
   const body={targetId,direction,amount,expectedVersion:(await wallet(targetId)).version,requestKey:randomUUID()};
   const accepted=await call('admin/credit-adjustments',body,admin);ok(accepted);receipts.push(accepted.data.id);assert.equal(accepted.data.reason,'');
   const retried=await call('admin/credit-adjustments',{...body,reason:''},admin);ok(retried);assert.equal(retried.data.id,accepted.data.id);return accepted.data;
  };
  await grant(adminId,'ADD','1000');
  for(const [auth,parent,target] of [[admin,adminId,sub],[subSession,sub,child],[childSession,child,leaf]]){
   const body={targetId:target,amount:'100',expectedVersion:(await wallet(parent)).version,targetVersion:(await wallet(target)).version,requestKey:randomUUID()};
   const attempts=await Promise.all([call('credit-transfers',body,auth),call('credit-transfers',{...body,reason:'   '},auth)]);attempts.forEach(ok);assert.equal(attempts[0].data.id,attempts[1].data.id);assert.equal(attempts[0].data.reason,'');receipts.push(attempts[0].data.id);
   const edit={action:'EDIT_PROFILE',displayName:'No reason required',requestKey:randomUUID()};ok(await call(`admin/accounts/${target}/manage`,edit,auth));ok(await call(`admin/accounts/${target}/manage`,{...edit,reason:''},auth));
  }
  for(const [auth,parent,target] of [[childSession,child,leaf],[subSession,sub,child],[admin,adminId,sub]]){
   const accepted=await move('operator/redeems',auth,parent,target,'25',{reason:undefined});ok(accepted);assert.equal(accepted.data.reason,'');receipts.push(accepted.data.id);
  }
  await grant(sub,'ADD','50');await grant(sub,'REMOVE','5');const addition=await grant(sub,'ADD','25');
  const reversed=await call('admin/reversals',{transactionId:addition.id,expectedVersion:(await wallet(sub)).version,requestKey:randomUUID()},admin);ok(reversed);receipts.push(reversed.data.id);assert.equal(reversed.data.reason,'');
  for(const [auth,target] of [[admin,sub],[subSession,child],[childSession,leaf]]){
   const beforeManagement=await wallet(target);
   ok(await call(`admin/accounts/${target}/manage`,{action:'SET_ACTIVE',active:false,requestKey:randomUUID()},auth));
   ok(await call(`admin/accounts/${target}/manage`,{action:'SET_ACTIVE',active:true,requestKey:randomUUID()},auth));
   ok(await call(`admin/accounts/${target}/manage`,{action:'SET_ARCHIVED',archived:true,requestKey:randomUUID()},auth));
   ok(await call(`admin/accounts/${target}/manage`,{action:'SET_ARCHIVED',archived:false,requestKey:randomUUID()},auth));
   ok(await call(`admin/accounts/${target}/manage`,{action:'RESET_PASSWORD',password:adminPassword,requestKey:randomUUID()},auth));
   assert.deepEqual(await wallet(target),beforeManagement);
   // Suspending a staff parent revokes its sessions. Refresh before testing the next tier.
   if(target===sub)Object.assign(subSession,await signin('blank.sub1'));
   if(target===child)Object.assign(childSession,await signin('blank.agent1'));
  }
  const stored=(await control.query('SELECT t.reason,sum(p.units)::text total FROM ledger_transactions t JOIN ledger_postings p ON p.transaction_id=t.id WHERE t.id=ANY($1::uuid[]) GROUP BY t.id',[receipts])).rows;
  assert.equal(stored.length,receipts.length);assert.ok(stored.every(row=>row.reason===''&&row.total==='0'));
  assert.deepEqual((await control.query('SELECT id,reason FROM ledger_transactions WHERE id=ANY($1::uuid[]) ORDER BY id',[prior.map(row=>row.id)])).rows,prior);
  assert.ok((await control.query("SELECT details FROM audit_events WHERE actor_id=ANY($1::uuid[]) AND event_type='EDIT_PROFILE'",[[adminId,sub,child]])).rows.some(row=>row.details.reason===''));
  assert.equal((await call('admin/credit-adjustments',{targetId:leaf,direction:'ADD',amount:'1',expectedVersion:(await wallet(leaf)).version,requestKey:randomUUID()},childSession)).status,403);
 });
 await t.test('six-character credentials work through every tier, reset, own change and case-insensitive login',async()=>{
  let parent=adminId,auth=admin,leaf,leafAuth;
  for(const username of ['Alpha1','Agent1','User12']){
   const response=await call('admin/accounts',{parentId:parent,username,displayName:username,password:'abc123',requestKey:randomUUID()},auth);ok(response);
   assert.equal(response.data.username,username.toLowerCase());
   const signed=await signin(username.toUpperCase(),'abc123');assert.equal((await wallet(response.data.id)).available,'0');
   if(username==='User12'){leaf=response.data.id;leafAuth=signed;break;}parent=response.data.id;auth=signed;
  }
  for(const value of ['short','abcdef','123456']){
   assert.equal((await call('admin/accounts',{parentId:parent,username:value,displayName:'Invalid',password:'abc123'},auth)).status,400);
   assert.equal((await call('admin/accounts',{parentId:parent,username:'Valid1',displayName:'Invalid',password:value},auth)).status,400);
  }
  const extra='Mixed + Account123';const created=await call('admin/accounts',{parentId:parent,username:extra,displayName:'Flexible punctuation',password:'ABC123'},auth);ok(created);await signin(extra,'ABC123');
  assert.equal((await call('admin/accounts',{parentId:parent,username:extra.toUpperCase(),displayName:'Duplicate',password:'ABC123'},auth)).status,409);
  const before=await wallet(leaf);ok(await call(`admin/accounts/${leaf}/manage`,{action:'RESET_PASSWORD',password:'xyz123',requestKey:randomUUID()},auth));
  assert.equal((await call('me',undefined,leafAuth)).status,401);leafAuth=await signin('USER12','xyz123');
  ok(await call('auth/password',{currentPassword:'xyz123',newPassword:'new123'},leafAuth));assert.equal((await call('me',undefined,leafAuth)).status,401);await signin('user12','new123');assert.deepEqual(await wallet(leaf),before);
  ok(await call('auth/password',{currentPassword:'abc123',newPassword:'new123'},auth));await signin('Agent1','new123');
 });
 await t.test('bigint balances survive paginated JSON without precision loss',async()=>{
  for(let i=0;i<10;i++)ok(await adjust(peer,'999999999999999'));
  ok(await adjust(peer,'1'));const expected='9999999999999991';assert.equal((await wallet(peer)).settled,expected);
  const row=(await call('operator/accounts?search=operator.peer1',undefined,operator)).data.items[0];assert.equal(row.wallet.settled,expected);assert.equal(typeof row.wallet.available,'string');
 });
 await t.test('operator settings expose only own sessions; password change signs them out',async()=>{
  const second=await signin('operator.agent1');const response=await call('operator/settings',undefined,operator);assert.equal(response.status,200);assert.equal(response.data.account.id,agent);assert.ok(response.data.sessions.every(s=>!s.token_hash&&!s.csrf_token));assert.equal((await call('operator/settings',undefined,playerAuth)).status,401);
  assert.equal((await call('auth/password',{currentPassword:'wrong',newPassword:'ChangedOperatorPassword-123'},operator)).status,400);
  ok(await call('auth/password',{currentPassword:adminPassword,newPassword:'ChangedOperatorPassword-123'},operator));assert.equal((await call('me',undefined,operator)).status,401);assert.equal((await call('me',undefined,second)).status,401);await signin('operator.agent1','ChangedOperatorPassword-123');
 });
});
after(async()=>{await app.close();await pool.end();await control.query(`DROP SCHEMA ${schema} CASCADE`);await control.end();});
