import {randomInt,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {actorFor,parse,type Request} from './auth.js';
import {audit,fail,idempotent,transaction,walletView} from './store.js';
import {beginLedger,lockWallets,posting} from './ledger.js';
import {stagingEnabled} from './environment.js';
export const wheelRewards=['0','5','10','15','25','75','150','300','500'] as const;
export const wheelCooldown=24*60*60*1000;
function enabled(){if(!stagingEnabled())fail(409,'WHEEL_UNAVAILABLE','The daily wheel is not available in this environment.');}
export async function dailyWheelStatus(req:Request){
 enabled();return transaction(async db=>{
  const actor=await actorFor(db,req);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');
  const last=(await db.query('SELECT result,created_at FROM daily_wheel_spins WHERE account_id=$1 ORDER BY created_at DESC LIMIT 1',[actor.id])).rows[0];
  const wallet=(await db.query('SELECT settled_units-reserved_units available FROM wallets WHERE account_id=$1',[actor.id])).rows[0];
  const now=Date.now(),nextAt=last?new Date(last.created_at).getTime()+wheelCooldown:0;
  return {rewards:wheelRewards,profileId:'daily-wheel-v1',serverTime:now,nextAt,eligible:BigInt(wallet.available)>0n&&now>=nextAt,hasCredits:BigInt(wallet.available)>0n,last:last?.result||null};
 });
}
export async function spinDailyWheel(req:Request,body:unknown){
 enabled();const data=parse(z.object({requestKey:z.string().min(8).max(128)}).strict(),body);
 return transaction(async db=>{
  const actor=await actorFor(db,req,true);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');
  return idempotent(db,actor,'DAILY_WHEEL',data.requestKey,data,async()=>{
   // Wallet locking serializes distinct keys/tabs and races with all other credit operations.
   const [wallet]=await lockWallets(db,[actor.id]);
   if(BigInt(wallet.settled_units)-BigInt(wallet.reserved_units)<=0n)fail(409,'WHEEL_NEEDS_CREDITS','Keep a positive credit balance to use the daily wheel.');
   const last=(await db.query('SELECT created_at FROM daily_wheel_spins WHERE account_id=$1 ORDER BY created_at DESC LIMIT 1',[actor.id])).rows[0];
   const now=Date.now();if(last&&now<new Date(last.created_at).getTime()+wheelCooldown)fail(409,'WHEEL_COOLDOWN','Your next daily spin is not ready yet.');
   const index=randomInt(wheelRewards.length),award=wheelRewards[index],id=randomUUID();
   let transactionId:string|null=null,after=walletView(wallet);
   if(award!=='0'){
    transactionId=await beginLedger(db,actor,actor,'DAILY_WHEEL','Daily wheel reward · daily-wheel-v1',data.requestKey);
    after=(await posting(db,transactionId,wallet,BigInt(award))).after;
    await db.query('INSERT INTO ledger_postings(transaction_id,system_account,units) VALUES($1,\'ISSUANCE\',$2)',[transactionId,(-BigInt(award)).toString()]);
   }
   const receipt={id,profileId:'daily-wheel-v1',index,award,before:walletView(wallet),after,nextAt:now+wheelCooldown,createdAt:now};
   await db.query('INSERT INTO daily_wheel_spins(id,account_id,profile_id,award_units,award_transaction,result,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,actor.id,receipt.profileId,award,transactionId,JSON.stringify(receipt),new Date(now)]);
   await audit(db,actor,'DAILY_WHEEL',receipt);return receipt;
  });
 });
}
