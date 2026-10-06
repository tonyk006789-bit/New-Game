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
let player,playerAuth,peerAuth;
async function create(parentId,username){const response=await call('admin/accounts',{parentId,username,displayName:username,password:adminPassword},await fixture.auth(parentId));assert.equal(response.status,201,JSON.stringify(response.data));return response.data.id;}
async function wallet(id){return fixture.wallet(id);}
async function adjust(id,direction,amount){assert.equal(direction,'ADD');return fixture.fund(id,amount);}
const {blackjackDeal,blackjackProfile,stagingGameProfileId,stagingMultiplier}=await import('../../packages/game-math/src/index.ts');
const {settleExpiredBlackjack}=await import('../../dist/server/apps/api/src/blackjack.js');
const deal=(stake='50')=>({action:'DEAL',stake,profileId:blackjackProfile.id,requestKey:randomUUID()});
const move=(hand,action)=>({action,id:hand.id,revision:hand.revision,profileId:blackjackProfile.id,requestKey:randomUUID()});
const shoe=(...ranks)=>[...ranks,...Array(100).fill(10)].map((rank,i)=>({rank,suit:i%4}));
// Replace only the private shoe in this disposable schema to exercise exact
// payouts and races. Accounts/funding still use the authenticated hierarchy.
async function arranged(stake='50',ranks=[8,10,8,7,3,2,10,10]){
 for(let n=0;n<20;n++){
  const r=await call('blackjack',deal(stake),playerAuth);assert.equal(r.status,201,JSON.stringify(r.data));
  if(r.data.settled)continue;
  await control.query('UPDATE blackjack_hands SET state=$1 WHERE id=$2',[JSON.stringify(blackjackDeal(Number(stake),shoe(...ranks))),r.data.id]);
  return (await call('blackjack',undefined,playerAuth)).data.hand;
 }throw Error('Could not obtain an active test hand');
}
test('PostgreSQL blackjack reservations, receipts and premium variants',async t=>{
 let agent;
 await t.test('zero-start player creation, manual funding and access separation',async()=>{
  const sub=await create(adminId,'blackjack.sub1');agent=await create(sub,'blackjack.agent1');player=await create(agent,'blackjack.player1');await create(agent,'blackjack.peer1');playerAuth=await signin('blackjack.player1');peerAuth=await signin('blackjack.peer1');
  assert.equal((await call('blackjack',deal(),playerAuth)).status,409);
  assert.equal((await adjust(player,'ADD','100000')).status,201);
  assert.equal((await call('blackjack',undefined,admin)).status,403);assert.equal((await call('blackjack',undefined)).status,401);
  for(const stake of ['25','75','2050','050'])assert.equal((await call('blackjack',deal(stake),playerAuth)).status,400);
 });
 await t.test('concurrent deal retry reserves or settles once and hides the shoe',async()=>{
  const command=deal(),before=await wallet(player),all=await Promise.all(Array.from({length:8},()=>call('blackjack',command,playerAuth)));
  assert.ok(all.every(r=>r.status===201),JSON.stringify(all));for(const r of all)assert.deepEqual(r.data,all[0].data);
  const hand=all[0].data;assert.equal((await control.query('SELECT count(*)::int n FROM blackjack_hands')).rows[0].n,1);
  assert.equal(hand.shoe,undefined);assert.equal(hand.cursor,undefined);
  const after=await wallet(player);
  if(!hand.settled){assert.equal(after.settled,before.settled);assert.equal(after.reserved,'50');assert.equal(hand.dealer[1],null);assert.equal((await call('blackjack',deal(),playerAuth)).status,409);assert.equal((await call('blackjack',move(hand,'STAND'),peerAuth)).status,404);assert.equal((await call('blackjack',move(hand,'STAND'),playerAuth)).status,201);}
  else assert.equal(BigInt(after.settled),BigInt(before.settled)-50n+BigInt(hand.award));
  const settled=await wallet(player);assert.deepEqual((await call('blackjack',command,playerAuth)).data,hand);assert.deepEqual(await wallet(player),settled);
  assert.equal((await call('blackjack',{...command,stake:'100'},playerAuth)).status,409);
 });
 await t.test('split and double reserve exact stakes, commit one balanced settlement at maximum exposure',async()=>{
  let h=await arranged('2000'),before=await wallet(player);assert.equal(before.reserved,'2000');
  h=(await call('blackjack',move(h,'SPLIT'),playerAuth)).data;assert.equal(h.wallet.reserved,'4000');assert.equal(h.hands.length,2);
  h=(await call('blackjack',move(h,'DOUBLE'),playerAuth)).data;assert.equal(h.wallet.reserved,'6000');assert.equal(h.active,1);
  const command=move(h,'DOUBLE'),r=await call('blackjack',command,playerAuth);assert.equal(r.status,201,JSON.stringify(r.data));h=r.data;
  assert.equal(h.stake,'8000');assert.equal(h.award,'16000');assert.equal(h.wallet.reserved,'0');assert.equal(BigInt(h.wallet.settled),BigInt(before.settled)+8000n);
  const round=(await control.query('SELECT * FROM staging_rounds WHERE id=$1',[h.id])).rows[0];assert.equal(round.stake_units,'8000');assert.equal(round.award_units,'16000');
  assert.deepEqual((await call('blackjack',command,playerAuth)).data,h);assert.equal((await control.query('SELECT count(*)::int n FROM staging_rounds WHERE id=$1',[h.id])).rows[0].n,1);
  await assert.rejects(()=>control.query('UPDATE blackjack_hands SET state=$1 WHERE id=$2',['{}',h.id]),/immutable/);
 });
 await t.test('competing revisions accept one move and reject stale actions',async()=>{
  const h=await arranged('50',[2,10,3,7,2,2,10]);const results=await Promise.all([call('blackjack',move(h,'HIT'),playerAuth),call('blackjack',move(h,'HIT'),playerAuth)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);const next=results.find(r=>r.status===201).data;assert.equal(next.hands[0].cards.length,3);assert.equal(next.revision,1);
  assert.equal((await call('blackjack',move(next,'STAND'),playerAuth)).status,201);
 });
 await t.test('agents cannot redeem reserved credits; failed extra stakes leave hand unchanged',async()=>{
  const h=await arranged('2000'),before=await wallet(player),agentAuth=await fixture.auth(agent),agentWallet=await wallet(agent);
  const redeem=await call('operator/redeems',{targetId:player,amount:before.settled,requestKey:randomUUID(),expectedVersion:agentWallet.version,targetVersion:before.version},agentAuth);assert.equal(redeem.status,409,JSON.stringify(redeem.data));assert.deepEqual(await wallet(player),before);
  // Redeem only the available part; the accepted hand retains its reservation.
  const available=await call('operator/redeems',{targetId:player,amount:before.available,requestKey:randomUUID(),expectedVersion:agentWallet.version,targetVersion:before.version},agentAuth);assert.equal(available.status,201,JSON.stringify(available.data));
  const reserved=await wallet(player);assert.equal(reserved.available,'0');assert.equal((await call('blackjack',move(h,'SPLIT'),playerAuth)).status,409);assert.deepEqual(await wallet(player),reserved);
  const resumed=(await call('blackjack',undefined,playerAuth)).data.hand;assert.equal(resumed.revision,h.revision);assert.equal(resumed.hands.length,1);assert.equal((await call('blackjack',move(resumed,'STAND'),playerAuth)).status,201);
  await adjust(player,'ADD','100000');
 });
 await t.test('expired suspended players still settle once and unblock reserved credits',async()=>{
  const h=await arranged('50',[10,6,8,10,10]),before=await wallet(player);
  await control.query("UPDATE blackjack_hands SET expires_at=now()-interval '6 minutes' WHERE id=$1",[h.id]);await control.query('UPDATE accounts SET active=false WHERE id=$1',[player]);
  await Promise.all([settleExpiredBlackjack(),settleExpiredBlackjack()]);const after=await wallet(player);assert.equal(after.reserved,'0');assert.equal(BigInt(after.settled),BigInt(before.settled)+50n);
  assert.equal((await control.query('SELECT count(*)::int n FROM staging_rounds WHERE id=$1',[h.id])).rows[0].n,1);
  await control.query('UPDATE accounts SET active=true WHERE id=$1',[player]);
 });
 await t.test('new keno games persist evaluated awards and fish lounges stay separate',async()=>{
  for(const game of ['neon-numbers','pearl-keno']){await new Promise(r=>setTimeout(r,275));const command={requestKey:randomUUID(),stake:'25',profileId:stagingGameProfileId(game),picks:[1,2,3,4,5,6]};const r=await call(`staging/${game}/rounds`,command,playerAuth);assert.equal(r.status,201,JSON.stringify(r.data));assert.equal(r.data.award,String(25*stagingMultiplier(r.data)));assert.deepEqual((await call(`staging/${game}/rounds`,command,playerAuth)).data,r.data);}
  const ids=[];for(const game of ['sunken-dynasty','polar-odyssey']){const joined=await call('practice/reef/join',{newTable:true,game},playerAuth);assert.equal(joined.status,201,JSON.stringify(joined.data));ids.push(joined.data.id);assert.equal(joined.data.game,game);}
  assert.notEqual(ids[0],ids[1]);
 });
 await t.test('history is scoped and all postings still balance',async()=>{
  assert.deepEqual((await call('staging/history',undefined,peerAuth)).data,[]);
  assert.equal((await control.query('SELECT sum(units)::text n FROM ledger_postings')).rows[0].n,'0');
  assert.equal((await control.query('SELECT count(*)::int n FROM game_profiles')).rows[0].n,0);
  assert.equal((await wallet(player)).reserved,'0');
 });
});
after(async()=>{await app.close();await pool.end();await control.query(`DROP SCHEMA ${schema} CASCADE`);await control.end();});
