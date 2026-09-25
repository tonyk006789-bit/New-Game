import {randomInt,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {stagingProfile,stagingOutcome,stagingMultiplier,reefOutcome,reefTierProfile,reefFlight,reefBallistics,validStake,type StagingGame} from '@new-game/game-math';
import {stagingEnabled} from './environment.js';
import {actorFor,parse,type Request} from './auth.js';
import {transaction,fail,idempotent} from './store.js';
import {lockWallets,posting,beginLedger} from './ledger.js';
import {canonical,digest} from './security.js';
export const profileHash=digest(canonical(stagingProfile));
export function environment(){return {staging:stagingEnabled(),productionApproved:false,sampleLogin:process.env.GAME_ENV==='staging'&&stagingEnabled()&&process.env.STAGING_DEMO_PASSWORD?{username:'stage.player',password:process.env.STAGING_DEMO_PASSWORD}:null,profile:stagingEnabled()?{...stagingProfile,hash:profileHash}:null};}
function gate(){if(!stagingEnabled())fail(404,'STAGING_DISABLED');}
const schema=z.object({requestKey:z.string().min(8).max(128),stake:z.string().refine(validStake),profileId:z.string().min(1).max(80),picks:z.array(z.number().int().min(1).max(80)).min(4).max(10).optional(),roomId:z.uuid().optional(),targetId:z.number().int().min(1).max(80).optional(),aimX:z.number().min(0).max(1200).optional(),aimY:z.number().min(0).max(600).optional(),observedAt:z.number().int().optional(),firedAt:z.number().int().optional(),angle:z.number().min(-Math.PI).max(Math.PI).optional()}).strict();
export async function stagingRound(req:Request,id:string,body:unknown){
 gate();if(!Object.hasOwn(stagingProfile.rules,id))fail(404,'GAME_NOT_FOUND');const game=id as StagingGame,data=parse(schema,body);
 if(game==='orchard-numbers'){if(!data.picks||new Set(data.picks).size!==data.picks.length)fail(400,'CHOOSE_4_TO_10_UNIQUE');}else if(data.picks)fail(400,'PICKS_ONLY_FOR_KENO');
 if(game!=='reef-party'&&[data.roomId,data.targetId,data.aimX,data.aimY,data.observedAt,data.firedAt,data.angle].some(v=>v!==undefined))fail(400,'FISH_FIELDS_ONLY');

 return transaction(async db=>{
  const actor=await actorFor(db,req,true);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');
  const result=await idempotent<Record<string,unknown>>(db,actor,'ROUND',data.requestKey,{game,...data},async()=>{
   // Accepted historical receipts replay before checking the profile for new plays.
   const profileId=game==='reef-party'?reefTierProfile.id:stagingProfile.id;
   const roundProfileHash=game==='reef-party'?digest(canonical({profile:reefTierProfile,ballistics:reefBallistics.version})):profileHash;
   if(data.profileId!==profileId)fail(400,'PROFILE_CHANGED','Refresh the arcade before starting a new round.');
 if(game==='reef-party'&&[data.roomId,data.targetId,data.aimX,data.aimY,data.observedAt,data.firedAt,data.angle].some(v=>v===undefined))fail(400,'TARGET_REQUIRED');
   const [wallet]=await lockWallets(db,[actor.id]);
   if(BigInt(wallet.settled_units)-BigInt(wallet.reserved_units)<BigInt(data.stake))fail(409,'INSUFFICIENT_AVAILABLE','Insufficient available play credits.');
   if(game==='reef-party'){
    // Burst allowance for manual clicks; the wallet lock still serializes debits.
    if(Number((await db.query("SELECT count(*) n FROM staging_rounds WHERE account_id=$1 AND game_id='reef-party' AND created_at>clock_timestamp()-interval '1 second'",[actor.id])).rows[0].n)>=20)fail(429,'SLOW_DOWN','Too many shots arriving. Please pause briefly.');
   }else if((await db.query("SELECT id FROM staging_rounds WHERE account_id=$1 AND created_at>clock_timestamp()-interval '250 milliseconds'",[actor.id])).rowCount)fail(429,'SLOW_DOWN');
   if(game==='reef-party'){
    const room=(await db.query("SELECT r.*,s.seat FROM practice_rooms r JOIN practice_seats s ON s.room_id=r.id WHERE r.id=$1 AND r.branch_id=$2 AND s.account_id=$3 AND s.heartbeat_at>now()-interval '20 seconds' AND r.expires_at>now()",[data.roomId,actor.branch_id,actor.id])).rows[0];
    if(!room)fail(409,'JOIN_REQUIRED');
    const now=Date.now();
    if(data.firedAt!>now+100||now-data.firedAt!>12000||data.observedAt!>now+120||now-data.observedAt!>10000)fail(409,'STALE_AIM','Shot expired; no credits charged.');
    const targets=(await db.query('SELECT target_id FROM practice_targets WHERE room_id=$1 AND captured_by IS NULL',[data.roomId])).rows.map(row=>Number(row.target_id));
    const flight=reefFlight(room.seat,data.angle!,(data.firedAt!-new Date(room.created_at).getTime())/1000,targets);
    if(flight.targetId!==data.targetId||Math.abs(data.observedAt!-data.firedAt!-flight.time*1000)>30||Math.hypot(flight.x-data.aimX!,flight.y-data.aimY!)>2)fail(409,'AIM_MISSED','The cannon trajectory missed this fish. No credits charged.');
    const target=(await db.query('SELECT * FROM practice_targets WHERE room_id=$1 AND target_id=$2 FOR UPDATE',[data.roomId,data.targetId])).rows[0];
    if(!target||target.captured_by)fail(409,'TARGET_UNAVAILABLE','This fish is already caught. No credits charged.');
   }
   const visual=game==='reef-party'?reefOutcome(randomUUID(),data.targetId!,randomInt):stagingOutcome(game,randomUUID(),randomInt,data.picks),multiplier=stagingMultiplier(visual),award=BigInt(data.stake)*BigInt(multiplier);
   const stakeTx=await beginLedger(db,actor,actor,'GAME_STAKE',`Staging ${game} / ${profileId}`,data.requestKey);
   const debit=await posting(db,stakeTx,wallet,-BigInt(data.stake));
   await db.query("INSERT INTO ledger_postings(transaction_id,system_account,units) VALUES($1,'GAME_CLEARING',$2)",[stakeTx,data.stake]);
   let awardTx:string|null=null,after=debit.after;
   if(award>0n){awardTx=await beginLedger(db,actor,actor,'GAME_PAYOUT',`Staging award ${game} / ${profileId}`,data.requestKey,stakeTx);after=(await posting(db,awardTx,{...wallet,settled_units:after.settled,version:after.version},award)).after;await db.query("INSERT INTO ledger_postings(transaction_id,system_account,units) VALUES($1,'GAME_CLEARING',$2)",[awardTx,(-award).toString()]);}
   if(game==='reef-party'&&visual.captured)await db.query('UPDATE practice_targets SET captured_by=$1,captured_at=now() WHERE room_id=$2 AND target_id=$3',[actor.id,data.roomId,data.targetId]);
   const result={...visual,mode:'STAGING',ruleVersion:profileId,profileHash:roundProfileHash,creditsChanged:true,stake:data.stake,award:award.toString(),multiplier,net:(award-BigInt(data.stake)).toString(),before:debit.before,after,roomId:data.roomId,targetId:data.targetId,...(game==='reef-party'?{flight:{version:reefBallistics.version,firedAt:data.firedAt,impactAt:data.observedAt,angle:data.angle,x:data.aimX,y:data.aimY}}:{}),description:`${visual.description} Return ${(Number(award)/100).toFixed(2)} credits.`};
   await db.query('INSERT INTO staging_rounds(id,account_id,game_id,profile_id,profile_hash,stake_units,award_units,stake_transaction,award_transaction,result) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[visual.id,actor.id,game,profileId,roundProfileHash,data.stake,award.toString(),stakeTx,awardTx,JSON.stringify(result)]);
   return result;
  });
  if(result.cancelled)fail(409,'ROUND_CANCELLED','This interrupted request was not played.');
  return result;
 });
}
// Resolve the saved request without ever starting a new stake. The same durable
// request lock serializes this with an in-flight round. A missing round receives
// a tombstone so a delayed original HTTP request cannot charge after recovery.
export async function recoverStagingRound(req:Request,body:unknown){
 gate();const {game,...data}=parse(schema.extend({game:z.string().refine(id=>Object.hasOwn(stagingProfile.rules,id))}),body);
 return transaction(async db=>{
  const actor=await actorFor(db,req,true);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');
  const result=await idempotent<Record<string,unknown>>(db,actor,'ROUND',data.requestKey,{game,...data},async()=>({cancelled:true,creditsChanged:false}));
  return result.cancelled?{status:'NOT_PLAYED',result:null}:{status:'SETTLED',result};
 });
}
export async function stagingHistory(req:Request){gate();return transaction(async db=>{const actor=await actorFor(db,req);return (await db.query('SELECT result,created_at FROM staging_rounds WHERE account_id=$1 ORDER BY created_at DESC LIMIT 50',[actor.id])).rows;});}
export async function stagingStats(req:Request){gate();return transaction(async db=>{const actor=await actorFor(db,req);return (await db.query(`SELECT game_id,profile_id,count(*)::int rounds,count(*) FILTER(WHERE award_units>0)::int paying,count(*) FILTER(WHERE award_units>stake_units)::int net_wins,count(*) FILTER(WHERE award_units=stake_units)::int pushes,sum(stake_units)::text staked,sum(award_units)::text returned,(sum(award_units)-sum(stake_units))::text net FROM staging_rounds WHERE account_id=$1 GROUP BY game_id,profile_id ORDER BY game_id`,[actor.id])).rows;});}
