import {randomInt,randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {PoolClient} from 'pg';
import {blackjackCreditApproved,blackjackProfileFor,blackjackGameForProfile,blackjackShoe,blackjackDeal,blackjackAct,blackjackFinish,blackjackCost,blackjackPublic,type BlackjackState} from '@new-game/game-math';
import {actorFor,parse,type Request} from './auth.js';
import {transaction,idempotent,fail,walletView,type Actor,type Wallet} from './store.js';
import {lockWallets,posting,beginLedger} from './ledger.js';
import {canonical,digest} from './security.js';
import {stagingEnabled} from './environment.js';
const profileSchema=z.enum(['stage-blackjack-v1','stage-double-deck-v1','stage-european-v1']);
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('DEAL'),stake:z.string().regex(/^[1-9]\d{1,3}$/).refine(n=>Number(n)>=50&&Number(n)<=2000&&Number(n)%50===0),requestKey:z.uuid(),profileId:profileSchema}).strict(),
 z.object({action:z.enum(['HIT','STAND','DOUBLE','SPLIT']),id:z.uuid(),revision:z.number().int().nonnegative(),requestKey:z.uuid(),profileId:profileSchema}).strict()
]);
type HandRow={id:string;account_id:string;state:BlackjackState;revision:number;reserved_units:string;settled:boolean;expires_at:Date};
function visible(row:HandRow,wallet:Wallet){return {id:row.id,game:row.state.game||'royal-blackjack',profileId:blackjackProfileFor(row.state.game).id,revision:row.revision,expiresAt:row.expires_at,...blackjackPublic(row.state),wallet:walletView(wallet)};}
async function reserve(db:PoolClient,wallet:Wallet,amount:bigint){
 if(BigInt(wallet.settled_units)-BigInt(wallet.reserved_units)<amount)fail(409,'INSUFFICIENT_AVAILABLE','Not enough available credits for this action.');
 wallet.reserved_units=(BigInt(wallet.reserved_units)+amount).toString();wallet.version=(BigInt(wallet.version)+1n).toString();
 await db.query('UPDATE wallets SET reserved_units=$1,version=$2 WHERE id=$3',[wallet.reserved_units,wallet.version,wallet.id]);
}
async function settle(db:PoolClient,actor:Actor,wallet:Wallet,row:HandRow){
 if(row.settled)return;
 const profile=blackjackProfileFor(row.state.game),game=row.state.game||'royal-blackjack';
 const state=blackjackFinish(row.state),stake=BigInt(blackjackCost(state)),award=BigInt(state.award);
 if(stake!==BigInt(row.reserved_units)||BigInt(wallet.reserved_units)<stake)throw Error('Blackjack reservation mismatch');
 await reserve(db,wallet,-stake);
 const stakeTx=await beginLedger(db,actor,actor,'GAME_STAKE',`${game} / ${profile.id}`,row.id);
 const debit=await posting(db,stakeTx,wallet,-stake);
 await db.query("INSERT INTO ledger_postings(transaction_id,system_account,units) VALUES($1,'GAME_CLEARING',$2)",[stakeTx,stake.toString()]);
 let awardTx:string|null=null,after=debit.after;
 if(award>0n){awardTx=await beginLedger(db,actor,actor,'GAME_PAYOUT',`${game} award / ${profile.id}`,row.id,stakeTx);after=(await posting(db,awardTx,{...wallet,settled_units:after.settled,version:after.version},award)).after;await db.query("INSERT INTO ledger_postings(transaction_id,system_account,units) VALUES($1,'GAME_CLEARING',$2)",[awardTx,(-award).toString()]);}
 Object.assign(wallet,{settled_units:after.settled,reserved_units:after.reserved,version:after.version});
 const result={...blackjackPublic(state),id:row.id,game,mode:'STAGING',ruleVersion:profile.id,creditsChanged:true,before:debit.before,after,net:(award-stake).toString(),description:state.hands.map((h,i)=>`Hand ${i+1}: ${h.result}`).join(' · ')};
 await db.query('INSERT INTO staging_rounds(id,account_id,game_id,profile_id,profile_hash,stake_units,award_units,stake_transaction,award_transaction,result) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[row.id,actor.id,game,profile.id,digest(canonical(profile)),stake.toString(),award.toString(),stakeTx,awardTx,JSON.stringify(result)]);
 row.settled=true;row.reserved_units='0';
}
async function save(db:PoolClient,row:HandRow){await db.query('UPDATE blackjack_hands SET state=$1,revision=$2,reserved_units=$3,settled=$4,expires_at=$5,updated_at=now() WHERE id=$6',[JSON.stringify(row.state),row.revision,row.reserved_units,row.settled,row.expires_at,row.id]);}
async function expire(db:PoolClient,actor:Actor,wallet:Wallet,row:HandRow){if(!row.settled&&new Date(row.expires_at).getTime()<=Date.now()){blackjackFinish(row.state);row.revision++;await settle(db,actor,wallet,row);await save(db,row);}}
export async function blackjackCurrent(req:Request){
 if(!stagingEnabled())fail(404,'STAGING_DISABLED');
 return transaction(async db=>{const actor=await actorFor(db,req);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');const [wallet]=await lockWallets(db,[actor.id]);const row=(await db.query<HandRow>('SELECT * FROM blackjack_hands WHERE account_id=$1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE',[actor.id])).rows[0];if(!row)return {hand:null,wallet:walletView(wallet)};await expire(db,actor,wallet,row);return {hand:visible(row,wallet),wallet:walletView(wallet)};});
}
export async function blackjackAction(req:Request,body:unknown){
 if(!stagingEnabled())fail(404,'STAGING_DISABLED');const data=parse(schema,body);
 return transaction(async db=>{const actor=await actorFor(db,req,true);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');return idempotent(db,actor,'BLACKJACK',data.requestKey,data,async()=>{
  const [wallet]=await lockWallets(db,[actor.id]);
  if(data.action==='DEAL'){
   if(!blackjackCreditApproved(blackjackGameForProfile(data.profileId)))fail(409,'GAME_MATH_NOT_APPROVED','This blackjack variant is a free preview pending rule approval.');
   if((await db.query('SELECT 1 FROM blackjack_hands WHERE account_id=$1 AND NOT settled',[actor.id])).rowCount)fail(409,'HAND_ACTIVE','Resume your current hand first.');
   const game=blackjackGameForProfile(data.profileId),profile=blackjackProfileFor(game);
   const state=blackjackDeal(Number(data.stake),blackjackShoe(randomInt,game),game),row:HandRow={id:randomUUID(),account_id:actor.id,state,revision:0,reserved_units:data.stake,settled:false,expires_at:new Date(Date.now()+profile.idleMs)};
   await reserve(db,wallet,BigInt(data.stake));
   await db.query('INSERT INTO blackjack_hands(id,account_id,state,reserved_units,expires_at) VALUES($1,$2,$3,$4,$5)',[row.id,actor.id,JSON.stringify(state),data.stake,row.expires_at]);
   if(state.settled){await settle(db,actor,wallet,row);await save(db,row);}return visible(row,wallet);
  }
  const row=(await db.query<HandRow>('SELECT * FROM blackjack_hands WHERE id=$1 AND account_id=$2 FOR UPDATE',[data.id,actor.id])).rows[0];if(!row)fail(404,'HAND_NOT_FOUND');
  if(data.profileId!==blackjackProfileFor(row.state.game).id)fail(409,'PROFILE_MISMATCH');
  await expire(db,actor,wallet,row);if(row.settled)return visible(row,wallet);
  if(row.revision!==data.revision)fail(409,'HAND_CHANGED','Your hand changed in another session. Refresh to continue.');
  const next=(()=>{try{return blackjackAct(row.state,data.action);}catch{return fail(409,'ACTION_UNAVAILABLE');}})();
  const total=blackjackCost(next);await reserve(db,wallet,BigInt(total)-BigInt(row.reserved_units));
  row.state=next;row.reserved_units=String(total);row.revision++;row.expires_at=new Date(Date.now()+blackjackProfileFor(row.state.game).idleMs);
  if(next.settled)await settle(db,actor,wallet,row);await save(db,row);return visible(row,wallet);
 });});
}
/** Fixed deadline auto-stand, processed on server activity even for suspended accounts. */
export async function settleExpiredBlackjack(){
 if(!stagingEnabled())return;
 return transaction(async db=>{const due=(await db.query<{account_id:string}>("SELECT account_id FROM blackjack_hands WHERE NOT settled AND expires_at<=clock_timestamp() ORDER BY account_id LIMIT 8")).rows;
  for(const {account_id} of due){const [wallet]=await lockWallets(db,[account_id]);const row=(await db.query<HandRow>('SELECT * FROM blackjack_hands WHERE account_id=$1 AND NOT settled FOR UPDATE',[account_id])).rows[0];if(!row)continue;const actor=(await db.query<Actor>('SELECT * FROM accounts WHERE id=$1',[account_id])).rows[0];await expire(db,actor,wallet,row);}
 });
}
