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
const {passwordHash,newTotpSecret,totp,canonical,digest}=await import('../../dist/server/apps/api/src/security.js');
const {createApi}=await import('../../dist/server/apps/api/src/app.js');
const {pool}=await import('../../dist/server/apps/api/src/store.js');
const adminId=randomUUID(),branch=randomUUID(),adminPassword='LocalTestPassword-1234',secret=newTotpSecret();
await control.query('INSERT INTO branches(id,name) VALUES($1,$2)',[branch,'Test root']);await control.query('INSERT INTO branch_ancestors VALUES($1,$1,0)',[branch]);
await control.query("INSERT INTO accounts(id,branch_id,role,display_name,active,username,password_hash,totp_secret) VALUES($1,$2,'MAIN_ADMIN','Test admin',true,'test.admin',$3,$4)",[adminId,branch,await passwordHash(adminPassword),secret]);await control.query('INSERT INTO wallets(id,account_id) VALUES($1,$2)',[randomUUID(),adminId]);
const app=await createApi();await app.listen(0,'127.0.0.1');const base=await app.getUrl();
async function call(path,body,auth,extra={}){const response=await fetch(`${base}/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:5184','Content-Type':'application/json',...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrf}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
async function signin(username,password=adminPassword,code){const response=await call('auth/login',{username,password,...(code?{code}:{})});assert.equal(response.status,201,JSON.stringify(response.data));return {cookie:response.cookie,csrf:response.data.csrf};}
const admin=await signin('test.admin',adminPassword,totp(secret));
let player,playerAuth,peerAuth;
async function create(parentId,username){const response=await call('admin/accounts',{parentId,username,displayName:username,password:adminPassword},admin);assert.equal(response.status,201,JSON.stringify(response.data));return response.data.id;}
async function wallet(id){const r=await call('admin/accounts',undefined,admin);return r.data.find(a=>a.id===id).wallet;}
async function adjust(id,direction,amount,key=randomUUID(),expectedVersion){const w=await wallet(id);return call('admin/credit-adjustments',{targetId:id,direction,amount,reason:'Explicit manual test adjustment',requestKey:key,expectedVersion:expectedVersion??w.version},admin);}
const {stagingMultiplier,reefFlight}=await import('../../packages/game-math/src/index.ts');
const sleep=()=>new Promise(resolve=>setTimeout(resolve,275));
const body=(extra={})=>({requestKey:randomUUID(),stake:'25',profileId:'stage-paying30-v2',...extra});
test('isolated staging accounting and outcomes',async t=>{
 await t.test('zero-start hierarchy and environment separation',async()=>{
  const north=await create(adminId,'stage.north'),agent=await create(north,'stage.agent');player=await create(agent,'stage.player');await create(agent,'stage.peer');playerAuth=await signin('stage.player');peerAuth=await signin('stage.peer');
  assert.equal((await wallet(player)).settled,'0');assert.ok(playerAuth.cookie.startsWith('ng_staging_session='));
  assert.equal((await call('environment')).data.staging,true);
  assert.equal((await call('staging/neon-sevens/rounds',body(),playerAuth)).status,409);
  assert.equal((await adjust(player,'ADD','100000')).status,201);
 });
 await t.test('concurrent identical requests commit exactly once',async()=>{
  const data=body(),before=(await wallet(player)).settled;
  const results=await Promise.all(Array.from({length:8},()=>call('staging/neon-sevens/rounds',data,playerAuth)));
  assert.ok(results.every(r=>r.status===201),JSON.stringify(results));for(const r of results)assert.deepEqual(r.data,results[0].data);
  const r=results[0].data;assert.equal(BigInt((await wallet(player)).settled),BigInt(before)-25n+BigInt(r.award));
  assert.equal((await call('staging/neon-sevens/rounds',{...data,stake:'50'},playerAuth)).status,409);
  assert.equal((await call('staging/jade-fortune/rounds',data,playerAuth)).status,409);
  assert.equal((await control.query('SELECT count(*)::int n FROM staging_rounds')).rows[0].n,1);
 });
 await t.test('automatic recovery returns committed receipts and never places missing or delayed stakes',async()=>{
  await sleep();const data=body();const played=await call('staging/neon-sevens/rounds',data,playerAuth);assert.equal(played.status,201);
  const before=await wallet(player),count=(await control.query('SELECT count(*)::int n FROM staging_rounds')).rows[0].n;
  const recovered=await call('staging/recover',{game:'neon-sevens',...data},playerAuth);assert.equal(recovered.status,201);assert.equal(recovered.data.status,'SETTLED');assert.deepEqual(recovered.data.result,played.data);
  const missing=body();assert.equal((await call('staging/recover',{game:'neon-sevens',...missing},playerAuth)).data.status,'NOT_PLAYED');
  assert.equal((await call('staging/neon-sevens/rounds',missing,playerAuth)).data.code,'ROUND_CANCELLED');
  assert.equal((await call('staging/recover',{game:'neon-sevens',...data},peerAuth)).data.status,'NOT_PLAYED');
  assert.deepEqual(await wallet(player),before);assert.equal((await control.query('SELECT count(*)::int n FROM staging_rounds')).rows[0].n,count);
  assert.equal((await call('staging/recover',{game:'neon-sevens',...data,stake:'50'},playerAuth)).status,409);
 });
 await t.test('four real players choose one table; fifth cannot take a full seat; tables remain branch-scoped',async()=>{
  const branch=await create(adminId,'reef.branch'),agent=await create(branch,'reef.agent'),users=[];
  for(let i=0;i<5;i++){await create(agent,`reef.player${i}`);users.push(await signin(`reef.player${i}`));}
  const initial=await call('practice/reef/join',{newTable:true,seat:4},users[0]);assert.equal(initial.status,201);const roomId=initial.data.id;assert.equal(initial.data.seat,4);
  const arrivals=await Promise.all(users.slice(1).map(auth=>call('practice/reef/join',{roomId},auth)));
  assert.equal(arrivals.filter(r=>r.status===201).length,3);assert.equal(arrivals.filter(r=>r.status===409).length,1);
  const snapshot=(await call('practice/reef/room',undefined,users[0])).data;assert.equal(snapshot.seats.length,4);assert.equal(new Set(snapshot.seats.map(s=>s.seat)).size,4);
  const listed=(await call('practice/reef/tables',undefined,users[0])).data.tables.find(r=>r.id===roomId);assert.equal(listed.capacity,4);assert.equal(listed.seats.length,4);
  assert.ok(!(await call('practice/reef/tables',undefined,playerAuth)).data.tables.some(r=>r.id===roomId));assert.equal((await call('practice/reef/join',{roomId},playerAuth)).status,404);
  assert.equal((await call('practice/reef/join',{roomId,seat:5},users[0])).status,400);
  const outsider=users[arrivals.findIndex(r=>r.status===409)+1];const overflow=await call('practice/reef/join',{},outsider);assert.equal(overflow.status,201);assert.notEqual(overflow.data.id,roomId);
  assert.equal((await call('practice/reef/leave',{roomId},users[0])).status,201);
  const switched=await call('practice/reef/join',{roomId,seat:4},outsider);assert.equal(switched.status,201);assert.equal(switched.data.seat,4);
  assert.equal((await call('practice/reef/room',undefined,users[0])).status,409);
  const after=(await call('practice/reef/tables',undefined,outsider)).data.tables;assert.equal(after.find(r=>r.id===roomId).seats.length,4);assert.equal(after.find(r=>r.id===overflow.data.id).seats.length,0);
 });
 await t.test('all seven round games persist visible outcomes with exact evaluated awards',async()=>{
  let wins=0;
  for(let i=0;i<28;i++){
   await sleep();const game=['neon-sevens','jade-fortune','coin-carnival','temple-lights','aurora-vault','ember-relics','orchard-numbers'][i%7];const data=body({stake:['25','50','75'][i%3],...(game==='orchard-numbers'?{picks:[1,2,3,4,5,6]}:{})});
   const before=await wallet(player),r=await call(`staging/${game}/rounds`,data,playerAuth);assert.equal(r.status,201,JSON.stringify(r.data));
   assert.equal(r.data.award,(BigInt(data.stake)*BigInt(stagingMultiplier(r.data))).toString());
   assert.equal(BigInt((await wallet(player)).settled),BigInt(before.settled)-BigInt(data.stake)+BigInt(r.data.award));wins+=Number(BigInt(r.data.award)>0n);
   assert.deepEqual((await call(`staging/${game}/rounds`,data,playerAuth)).data,r.data);
  }
  assert.ok(wins>0,'Positive awards must exercise the two-update wallet reconciliation');
 });
 await t.test('expanded stakes enforce quarter steps through twenty credits and preserve old-profile receipts',async()=>{
  for(const stake of ['100','275','1975','2000']){await sleep();const r=await call('staging/neon-sevens/rounds',body({stake}),playerAuth);assert.equal(r.status,201,JSON.stringify(r.data));assert.equal(r.data.stake,stake);assert.ok(r.data.frames.every(f=>f.grid.every(row=>row.length===5)));}
  for(const stake of ['0','24','26','2025','2500','025','25.0','2e3'])assert.equal((await call('staging/neon-sevens/rounds',body({stake}),playerAuth)).status,400);
  const legacy=body({profileId:'stage-paying30-v1'}),receipt={id:randomUUID(),game:'neon-sevens',ruleVersion:'stage-paying30-v1',stake:'25',award:'75',frames:[{grid:[['seven','bell','bar'],['gem','gem','gem'],['bar','bell','cherry']],locked:[],remaining:0}]};
  await control.query("INSERT INTO idempotency_records(actor_id,operation,request_key,request_hash,response) VALUES($1,'ROUND',$2,$3,$4)",[player,legacy.requestKey,digest(canonical({game:'neon-sevens',...legacy})),JSON.stringify(receipt)]);
  const before=(await wallet(player)).settled;assert.deepEqual((await call('staging/neon-sevens/rounds',legacy,playerAuth)).data,receipt);assert.equal((await wallet(player)).settled,before);
  assert.equal((await call('staging/neon-sevens/rounds',{...legacy,requestKey:randomUUID()},playerAuth)).status,400);
 });
 await t.test('validation, origin, roles and reserved credits are enforced',async()=>{
  for(const extra of [{stake:'26'},{award:'999'},{profileId:'production'},{grid:[]},{picks:[1,2,3,4]}])assert.equal((await call('staging/neon-sevens/rounds',body(extra),playerAuth)).status,400);
  assert.equal((await call('staging/orchard-numbers/rounds',body({picks:[1,1,2,3]}),playerAuth)).status,400);
  assert.equal((await call('staging/neon-sevens/rounds',body(),admin)).status,403);
  assert.equal((await call('staging/neon-sevens/rounds',body(),playerAuth,{'X-CSRF-Token':'invalid'})).status,403);
  assert.equal((await call('staging/neon-sevens/rounds',body(),playerAuth,{Origin:'https://example.invalid'})).status,403);
  await control.query('UPDATE wallets SET reserved_units=settled_units WHERE account_id=$1',[player]);
  assert.equal((await call('staging/neon-sevens/rounds',body(),playerAuth)).status,409);
  await control.query('UPDATE wallets SET reserved_units=0 WHERE account_id=$1',[player]);
  assert.equal((await call('games/neon-sevens/rounds',{},playerAuth)).status,409);
  assert.equal((await call('practice/reef/shots',{},playerAuth)).status,409);
 });
 await t.test('fish reject stale or distant aim and settle valid targets only once',async()=>{
  const room=(await call('practice/reef/join',{},playerAuth)).data;await sleep();
  const aim=()=>{const firedAt=Date.now()-1600;for(let angle=-3;angle<0;angle+=.1){const f=reefFlight(room.seat,angle,(firedAt-new Date(room.startedAt).getTime())/1000,Array.from({length:80},(_,i)=>i+1));if(f.targetId!==null)return body({roomId:room.id,targetId:f.targetId,aimX:f.x,aimY:f.y,observedAt:Math.round(firedAt+f.time*1000),firedAt,angle});}throw new Error('No trajectory');};
  const before=(await wallet(player)).settled;
  assert.equal((await call('staging/reef-party/rounds',aim(),peerAuth)).status,409);
  assert.equal((await call('staging/reef-party/rounds',{...aim(),observedAt:Date.now()-5000},playerAuth)).status,409);
  assert.equal((await call('staging/reef-party/rounds',{...aim(),aimY:0},playerAuth)).status,409);
  assert.equal((await call('staging/reef-party/rounds',{...aim(),firedAt:Date.now()+300},playerAuth)).status,409);
  const teleport=aim();delete teleport.firedAt;delete teleport.angle;assert.equal((await call('staging/reef-party/rounds',teleport,playerAuth)).status,400);
  assert.equal((await wallet(player)).settled,before);
  let captured=false,last;
  for(let i=0;i<25&&!captured;i++){await sleep();const data=aim(),r=await call('staging/reef-party/rounds',data,playerAuth);assert.equal(r.status,201,JSON.stringify(r));captured=r.data.captured;last=data;assert.equal(r.data.flight.version,'reef-ballistics-v2');assert.equal(r.data.award,captured?'75':'0');assert.deepEqual((await call('staging/reef-party/rounds',data,playerAuth)).data,r.data);}
  assert.equal(captured,true);await sleep();assert.equal((await call('staging/reef-party/rounds',{...last,requestKey:randomUUID()},playerAuth)).status,409);
  // A durable v5 receipt is replayable after the trajectory-proof upgrade.
  const legacy={...last,profileId:'stage-paying30-v1',requestKey:randomUUID()};delete legacy.firedAt;delete legacy.angle;
  const receipt=(await control.query("SELECT result FROM staging_rounds WHERE account_id=$1 AND game_id='reef-party' ORDER BY created_at DESC LIMIT 1",[player])).rows[0].result;delete receipt.flight;
  await control.query("INSERT INTO idempotency_records(actor_id,operation,request_key,request_hash,response) VALUES($1,'ROUND',$2,$3,$4)",[player,legacy.requestKey,digest(canonical({game:'reef-party',...legacy})),JSON.stringify(receipt)]);
  const savedBalance=(await wallet(player)).settled;assert.deepEqual((await call('staging/reef-party/rounds',legacy,playerAuth)).data,receipt);assert.equal((await wallet(player)).settled,savedBalance);
  await control.query('UPDATE practice_targets SET captured_by=$1,captured_at=now() WHERE room_id=$2',[player,room.id]);
  const replacement=(await call('practice/reef/join',{},playerAuth)).data;
  assert.notEqual(replacement.id,room.id);assert.equal(replacement.targets.length,80);assert.ok(replacement.targets.every(t=>!t.captured));
 });
 await t.test('daily wheel enforces positive available balance, roles, cooldown, durable replay and balanced awards',async()=>{
  assert.equal((await call('daily-wheel')).status,401);
  assert.equal((await call('daily-wheel/spin',{requestKey:randomUUID()},admin)).status,403);
  assert.equal((await call('daily-wheel',undefined,peerAuth)).data.eligible,false);
  assert.equal((await call('daily-wheel/spin',{requestKey:randomUUID()},peerAuth)).data.code,'WHEEL_NEEDS_CREDITS');
  assert.equal((await call('daily-wheel/spin',{requestKey:randomUUID(),award:'500'},playerAuth)).status,400);
  assert.equal((await call('daily-wheel/spin',{requestKey:randomUUID()},playerAuth,{'X-CSRF-Token':'wrong'})).status,403);
  const before=await wallet(player),data={requestKey:randomUUID()};
  const replies=await Promise.all(Array.from({length:6},()=>call('daily-wheel/spin',data,playerAuth)));
  assert.ok(replies.every(r=>r.status===201),JSON.stringify(replies));for(const r of replies)assert.deepEqual(r.data,replies[0].data);
  const receipt=replies[0].data;assert.ok(['0','5','10','15','25','75','150','300','500'].includes(receipt.award));
  assert.equal(receipt.nextAt-receipt.createdAt,86400000);
  assert.equal(BigInt((await wallet(player)).available),BigInt(before.available)+BigInt(receipt.award));
  assert.equal((await control.query('SELECT count(*)::int n FROM daily_wheel_spins WHERE account_id=$1',[player])).rows[0].n,1);
  assert.equal((await call('daily-wheel/spin',{requestKey:randomUUID()},playerAuth)).data.code,'WHEEL_COOLDOWN');
  const realNow=Date.now;Date.now=()=>receipt.nextAt-1;
  try{assert.equal((await call('daily-wheel/spin',{requestKey:randomUUID()},playerAuth)).data.code,'WHEEL_COOLDOWN');}finally{Date.now=realNow;}
  Date.now=()=>receipt.nextAt;
  try{const race=await Promise.all(Array.from({length:5},()=>call('daily-wheel/spin',{requestKey:randomUUID()},playerAuth)));assert.equal(race.filter(r=>r.status===201).length,1);assert.equal(race.filter(r=>r.status===409).length,4);}finally{Date.now=realNow;}
  await assert.rejects(()=>control.query('UPDATE daily_wheel_spins SET award_units=0'),/immutable/);
  const mismatches=(await control.query("SELECT count(*)::int n FROM daily_wheel_spins d LEFT JOIN ledger_postings p ON p.transaction_id=d.award_transaction AND p.wallet_id IS NOT NULL WHERE d.award_units>0 AND (p.units IS NULL OR p.units<>d.award_units)")).rows[0].n;assert.equal(mismatches,0);
  const available=(await wallet(player)).available;await control.query('UPDATE wallets SET reserved_units=settled_units WHERE account_id=$1',[player]);
  try{assert.equal((await call('daily-wheel',undefined,playerAuth)).data.hasCredits,false);assert.deepEqual((await call('daily-wheel/spin',data,playerAuth)).data,receipt);}finally{await control.query('UPDATE wallets SET reserved_units=0 WHERE account_id=$1',[player]);}
  assert.equal((await wallet(player)).available,available);
 });
 await t.test('player password changes require current secret and CSRF, revoke every session, and preserve credits',async()=>{
  const second=await signin('stage.peer'),before=(await call('me',undefined,peerAuth)).data.wallet;
  const password='Changed-Private-Test-Password-123';
  assert.equal((await call('auth/password',{currentPassword:adminPassword,newPassword:password},peerAuth,{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await call('auth/password',{currentPassword:'wrong',newPassword:password},peerAuth)).status,400);
  assert.equal((await call('auth/password',{currentPassword:adminPassword,newPassword:'short'},peerAuth)).status,400);
  assert.equal((await call('auth/password',{currentPassword:adminPassword,newPassword:password},peerAuth)).status,201);
  assert.equal((await call('me',undefined,peerAuth)).status,401);assert.equal((await call('me',undefined,second)).status,401);
  assert.equal((await call('auth/login',{username:'stage.peer',password:adminPassword})).status,401);
  peerAuth=await signin('stage.peer',password);assert.deepEqual((await call('me',undefined,peerAuth)).data.wallet,before);
  for(let i=0;i<8;i++)assert.equal((await call('auth/password',{currentPassword:'wrong',newPassword:adminPassword},peerAuth)).status,400);
  assert.equal((await call('auth/password',{currentPassword:password,newPassword:adminPassword},peerAuth)).status,429);
  const audit=(await control.query("SELECT details FROM audit_events WHERE event_type='PASSWORD_CHANGED'")).rows;assert.equal(audit.length,1);assert.ok(!JSON.stringify(audit).includes(password));
 });
 await t.test('statistics exclude grants, scope to player, and match immutable history',async()=>{
  const rows=(await control.query('SELECT * FROM staging_rounds WHERE account_id=$1',[player])).rows;
  const stats=(await call('staging/stats',undefined,playerAuth)).data;
  assert.equal(stats.reduce((n,s)=>n+s.rounds,0),rows.length);
  assert.equal(stats.reduce((n,s)=>n+BigInt(s.returned),0n),rows.reduce((n,r)=>n+BigInt(r.award_units),0n));
  assert.deepEqual((await call('staging/stats',undefined,peerAuth)).data,[]);
  assert.deepEqual((await call('staging/history',undefined,peerAuth)).data,[]);
  await assert.rejects(()=>control.query('UPDATE staging_rounds SET award_units=0'),/immutable/);
  await assert.rejects(()=>control.query('UPDATE wallets SET settled_units=settled_units+1 WHERE account_id=$1',[player]),/reconcile/);
  assert.equal((await control.query('SELECT count(*)::int n FROM game_profiles')).rows[0].n,0);
  assert.equal((await control.query('SELECT sum(units)::text n FROM ledger_postings')).rows[0].n,'0');
 });
 await t.test('runtime gate fails closed outside the dedicated database',async()=>{
  const original=process.env.DATABASE_URL;process.env.DATABASE_URL=original.replace('/new_game_staging','/new_game_dev');
  try{assert.equal((await call('environment')).status,503);}finally{process.env.DATABASE_URL=original;}
 });
});
after(async()=>{await app.close();await pool.end();await control.query(`DROP SCHEMA ${schema} CASCADE`);await control.end();});
