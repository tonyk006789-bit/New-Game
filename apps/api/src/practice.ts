import { randomInt, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { actorFor, type Request, parse } from './auth.js';
import { canonical, digest } from './security.js';
import { fail, transaction } from './store.js';
import { featurePractice, cabinetPractice } from '@new-game/game-math';
import {stagingEnabled} from './environment.js';
import type {PoolClient} from 'pg';
const schema=z.object({requestKey:z.string().min(8).max(128),picks:z.array(z.number().int().min(1).max(80)).max(10).optional()}).strict();
export async function practiceRound(req:Request,game:string,body:unknown){
 if(!['temple-lights','orchard-numbers','aurora-vault','ember-relics','neon-sevens','jade-fortune','coin-carnival'].includes(game))fail(404,'GAME_NOT_FOUND');const data=parse(schema,body);
 if(game!=='orchard-numbers'&&data.picks)fail(400,'PICKS_ONLY_FOR_KENO');
 if(game==='orchard-numbers'&&(!data.picks||data.picks.length<4||new Set(data.picks).size!==data.picks.length))fail(400,'CHOOSE_4_TO_10_UNIQUE');
 return transaction(async db=>{
  const actor=await actorFor(db,req,true);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');
  await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`practice:${actor.id}`]);const hash=digest(canonical({game,...data}));
  const prior=(await db.query('SELECT * FROM practice_rounds WHERE account_id=$1 AND request_key=$2',[actor.id,data.requestKey])).rows[0];
  if(prior){if(prior.request_hash!==hash)fail(409,'IDEMPOTENCY_CONFLICT');return prior.result;}
  if((await db.query("SELECT id FROM practice_rounds WHERE account_id=$1 AND created_at>now()-interval '500 milliseconds'",[actor.id])).rowCount)fail(429,'SLOW_DOWN');
  const id=randomUUID();let result:unknown;
  if(game==='neon-sevens'||game==='jade-fortune'||game==='coin-carnival'){
   result=cabinetPractice(game,id,randomInt);
  }else if(game==='aurora-vault'||game==='ember-relics'){
   result=featurePractice(game,id,randomInt);
  }else if(game==='temple-lights'){
   const symbols=['moon','lotus','gem','sun','leaf'];const grid=Array.from({length:3},()=>Array.from({length:5},()=>symbols[randomInt(symbols.length)]));
   const lines=grid.map((row,index)=>{let count=1;while(count<row.length&&row[count]===row[0])count++;return {row:index,count:count>=3?count:0};}).filter(line=>line.count>0);
   result={id,game,mode:'PRACTICE',grid,lines,description:lines.length?`${lines.length} matching row${lines.length>1?'s':''}!`:'No matching row. Try again.',creditsChanged:false};
  }else{
   const pool=Array.from({length:80},(_,i)=>i+1);for(let i=79;i>0;i--){const j=randomInt(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
   const drawn=pool.slice(0,20),hits=data.picks!.filter(n=>drawn.includes(n));result={id,game,mode:'PRACTICE',drawn,hits,picks:data.picks,description:`${hits.length} of ${data.picks!.length} numbers matched.`,creditsChanged:false};
  }
  await db.query('INSERT INTO practice_rounds(id,account_id,game_id,request_key,request_hash,result) VALUES($1,$2,$3,$4,$5,$6)',[id,actor.id,game,data.requestKey,hash,JSON.stringify(result)]);return result;
 });
}
export async function practiceHistory(req:Request){return transaction(async db=>{const actor=await actorFor(db,req);return (await db.query('SELECT result,created_at FROM practice_rounds WHERE account_id=$1 ORDER BY created_at DESC LIMIT 30',[actor.id])).rows;});}
const joinSchema=z.object({roomId:z.uuid().optional(),seat:z.number().int().min(1).max(4).optional(),newTable:z.boolean().optional()}).strict().refine(value=>!(value.roomId&&value.newTable));
async function cleanReef(db:PoolClient,branch:string){
 await db.query('UPDATE practice_rooms r SET expires_at=now() WHERE r.branch_id=$1 AND r.expires_at>now() AND EXISTS(SELECT 1 FROM practice_targets WHERE room_id=r.id) AND NOT EXISTS(SELECT 1 FROM practice_targets WHERE room_id=r.id AND captured_by IS NULL)',[branch]);
 await db.query("DELETE FROM practice_seats s USING practice_rooms r WHERE r.id=s.room_id AND r.branch_id=$1 AND (s.heartbeat_at < now()-interval '20 seconds' OR r.expires_at<=now())",[branch]);
}
export async function reefTables(req:Request){return transaction(async db=>{
 const actor=await actorFor(db,req);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');
 const rooms=(await db.query("SELECT id FROM practice_rooms r WHERE branch_id=$1 AND expires_at>now() AND EXISTS(SELECT 1 FROM practice_targets WHERE room_id=r.id AND captured_by IS NULL) ORDER BY created_at,id",[actor.branch_id])).rows;
 const seats=(await db.query("SELECT s.room_id,s.seat,a.display_name,s.account_id=$2 yours FROM practice_seats s JOIN accounts a ON a.id=s.account_id JOIN practice_rooms r ON r.id=s.room_id WHERE r.branch_id=$1 AND r.expires_at>now() AND s.heartbeat_at>now()-interval '20 seconds' ORDER BY s.seat",[actor.branch_id,actor.id])).rows;
 return {capacity:4,tables:rooms.map((room,index)=>({id:room.id,number:index+1,capacity:4,seats:seats.filter(s=>s.room_id===room.id).map(({seat,display_name,yours})=>({seat,display_name,yours}))}))};
});}
export async function reefLeave(req:Request,body:unknown){const data=parse(z.object({roomId:z.uuid()}).strict(),body);return transaction(async db=>{
 const actor=await actorFor(db,req,true);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');await db.query('SELECT pg_advisory_xact_lock(772451)');
 await db.query('DELETE FROM practice_seats s USING practice_rooms r WHERE s.room_id=r.id AND s.account_id=$1 AND s.room_id=$2 AND r.branch_id=$3',[actor.id,data.roomId,actor.branch_id]);return {left:true};
});}
export async function reefRoom(req:Request,join=false,body:unknown={}){const data=join?parse(joinSchema,body):{};return transaction(async db=>{
 const actor=await actorFor(db,req,join);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');
 await db.query('SELECT pg_advisory_xact_lock(772451)');
 if(join)await cleanReef(db,actor.branch_id);
 let seat=(await db.query("SELECT s.* FROM practice_seats s JOIN practice_rooms r ON r.id=s.room_id WHERE s.account_id=$1 AND r.branch_id=$2 AND r.expires_at>now() AND s.heartbeat_at>now()-interval '20 seconds'",[actor.id,actor.branch_id])).rows[0];
 if(join&&(!seat||data.newTable||data.roomId&&data.roomId!==seat.room_id||data.seat&&data.seat!==seat.seat)){
  let room=data.roomId?(await db.query('SELECT id FROM practice_rooms WHERE id=$1 AND branch_id=$2 AND expires_at>now()',[data.roomId,actor.branch_id])).rows[0]:data.newTable?null:(await db.query('SELECT r.id FROM practice_rooms r LEFT JOIN practice_seats s ON s.room_id=r.id WHERE r.branch_id=$1 AND r.expires_at>now()+interval \'30 seconds\' GROUP BY r.id HAVING count(s.seat)<4 ORDER BY r.created_at LIMIT 1',[actor.branch_id])).rows[0];
  if(data.roomId&&!room)fail(404,'TABLE_UNAVAILABLE','This table has closed. Choose another table.');
  if(!room){room={id:randomUUID()};await db.query("INSERT INTO practice_rooms(id,expires_at,branch_id) VALUES($1,now()+interval '15 minutes',$2)",[room.id,actor.branch_id]);await db.query('INSERT INTO practice_targets(room_id,target_id) SELECT $1,n FROM generate_series(1,80) n',[room.id]);}
  const occupied=(await db.query('SELECT seat FROM practice_seats WHERE room_id=$1 AND account_id<>$2',[room.id,actor.id])).rows.map(s=>s.seat);const index=data.seat??[1,2,3,4].find(n=>!occupied.includes(n));
  if(!index||occupied.includes(index))fail(409,'TABLE_FULL','That seat was just taken. Choose an open seat.');
  await db.query('DELETE FROM practice_seats WHERE account_id=$1',[actor.id]);
  seat={room_id:room.id,seat:index};await db.query('INSERT INTO practice_seats(room_id,seat,account_id) VALUES($1,$2,$3)',[room.id,index,actor.id]);
 }
 if(!seat)fail(409,'JOIN_REQUIRED');
 // Heartbeat changes are only accepted by authenticated POST; GET snapshots cannot keep a seat alive.
 if(join)await db.query('UPDATE practice_seats SET heartbeat_at=now() WHERE account_id=$1',[actor.id]);
 const room=(await db.query('SELECT * FROM practice_rooms WHERE id=$1',[seat.room_id])).rows[0];
 const seats=(await db.query("SELECT s.seat,a.display_name FROM practice_seats s JOIN accounts a ON a.id=s.account_id WHERE s.room_id=$1 AND s.heartbeat_at>now()-interval '20 seconds' ORDER BY seat",[seat.room_id])).rows;
 const targets=(await db.query('SELECT target_id,captured_by IS NOT NULL captured FROM practice_targets WHERE room_id=$1 ORDER BY target_id',[seat.room_id])).rows;
 const score=(await db.query('SELECT count(*)::integer score FROM practice_targets WHERE room_id=$1 AND captured_by=$2',[seat.room_id,actor.id])).rows[0].score;
 return {id:seat.room_id,seat:seat.seat,seats,targets,score,startedAt:room.created_at,expiresAt:room.expires_at,serverTime:Date.now(),mode:'PRACTICE',creditsChanged:false};
});}
const shotSchema=z.object({roomId:z.uuid(),targetId:z.number().int().min(1).max(80),requestKey:z.string().min(8).max(128)}).strict();
export async function reefShot(req:Request,body:unknown){
 if(stagingEnabled())fail(409,'USE_STAGING_SHOTS','Use the published staging shot rules.');
 const data=parse(shotSchema,body);return transaction(async db=>{
  const actor=await actorFor(db,req,true);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');
  await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`practice:${actor.id}`]);
  const hash=digest(canonical(data));const prior=(await db.query('SELECT * FROM practice_rounds WHERE account_id=$1 AND request_key=$2',[actor.id,data.requestKey])).rows[0];
  if(prior){if(prior.request_hash!==hash)fail(409,'IDEMPOTENCY_CONFLICT');return prior.result;}
  if(!(await db.query('SELECT s.seat FROM practice_seats s JOIN practice_rooms r ON r.id=s.room_id WHERE s.account_id=$1 AND s.room_id=$2 AND r.expires_at>now() AND s.heartbeat_at>now()-interval \'20 seconds\'',[actor.id,data.roomId])).rowCount)fail(409,'JOIN_REQUIRED');
  if((await db.query("SELECT id FROM practice_rounds WHERE account_id=$1 AND created_at>now()-interval '250 milliseconds'",[actor.id])).rowCount)fail(429,'SLOW_DOWN');
  const target=(await db.query('SELECT * FROM practice_targets WHERE room_id=$1 AND target_id=$2 FOR UPDATE',[data.roomId,data.targetId])).rows[0];
  if(!target)fail(404,'TARGET_NOT_FOUND');const captured=!target.captured_by;
  if(captured)await db.query('UPDATE practice_targets SET captured_by=$1,captured_at=now() WHERE room_id=$2 AND target_id=$3',[actor.id,data.roomId,data.targetId]);
  const id=randomUUID();const result={id,game:'reef-party',mode:'PRACTICE',roomId:data.roomId,targetId:data.targetId,captured,description:captured?'Fish caught! Practice score +1.':'Another player already caught this fish.',creditsChanged:false};
  await db.query('INSERT INTO practice_rounds(id,account_id,game_id,request_key,request_hash,result) VALUES($1,$2,$3,$4,$5,$6)',[id,actor.id,'reef-party',data.requestKey,hash,JSON.stringify(result)]);return result;
 });
}
