import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type PoolClient } from 'pg';
import { actorFor, parse, privileged, type Request } from './auth.js';
import { type Actor, type Wallet, audit, fail, idempotent, inScope, transaction, walletView } from './store.js';
const units=z.string().regex(/^[1-9]\d{0,14}$/);
const version=z.string().regex(/^(0|[1-9]\d{0,18})$/);
const base={targetId:z.uuid(),amount:units,reason:z.string().trim().min(5).max(500),requestKey:z.string().min(8).max(128),expectedVersion:version};
const adjustmentSchema=z.object({...base,direction:z.enum(['ADD','REMOVE'])}).strict();
const transferSchema=z.object({...base,targetVersion:version}).strict();
const reversalSchema=z.object({transactionId:z.uuid(),reason:base.reason,requestKey:base.requestKey,expectedVersion:version}).strict();
export async function lockWallets(db:PoolClient, accounts:string[]) {
 const {rows}=await db.query<Wallet>('SELECT * FROM wallets WHERE account_id=ANY($1::uuid[]) ORDER BY id FOR UPDATE',[accounts]);
 if(rows.length!==new Set(accounts).size)fail(404,'WALLET_NOT_FOUND');return rows;
}
export async function posting(db:PoolClient,id:string,wallet:Wallet,delta:bigint){
 const after=BigInt(wallet.settled_units)+delta;
 if(after<BigInt(wallet.reserved_units))fail(409,'INSUFFICIENT_AVAILABLE','Only available credits may be removed or transferred.');
 if(after>9223372036854775807n)fail(409,'BALANCE_LIMIT');
 const next=(BigInt(wallet.version)+1n).toString();
 await db.query('UPDATE wallets SET settled_units=$1,version=$2 WHERE id=$3',[after.toString(),next,wallet.id]);
 await db.query('INSERT INTO ledger_postings(transaction_id,wallet_id,units,before_units,after_units,wallet_version) VALUES($1,$2,$3,$4,$5,$6)',[id,wallet.id,delta.toString(),wallet.settled_units,after.toString(),next]);
 return {before:walletView(wallet),after:walletView({...wallet,settled_units:after.toString(),version:next})};
}
export async function beginLedger(db:PoolClient,actor:Actor,target:Actor,kind:string,reason:string,key:string,related:string|null=null){
 const id=randomUUID();
 await db.query('INSERT INTO ledger_transactions(id,actor_id,target_id,branch_id_at_event,kind,reason,request_id,related_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,actor.id,target.id,target.branch_id,kind,reason,key,related]);
 return id;
}
function fresh(wallet:Wallet,expected:string){if(wallet.version!==expected)fail(409,'STALE_WALLET','The balance changed. Refresh and review this action again.');}
export async function adjust(req:Request,body:unknown){
 const data=parse(adjustmentSchema,body);
 return transaction(async db=>{
  const actor=await actorFor(db,req,true);privileged(actor);const target=await inScope(db,actor,data.targetId);
  return idempotent(db,actor,`MANUAL_${data.direction}`,data.requestKey,data,async()=>{
   const [wallet]=await lockWallets(db,[target.id]);fresh(wallet,data.expectedVersion);
   const delta=BigInt(data.amount)*(data.direction==='ADD'?1n:-1n);
   const id=await beginLedger(db,actor,target,`MANUAL_${data.direction}`,data.reason,data.requestKey);
   const balance=await posting(db,id,wallet,delta);
   await db.query('INSERT INTO ledger_postings(transaction_id,system_account,units) VALUES($1,$2,$3)',[id,data.direction==='ADD'?'ISSUANCE':'RETIREMENT',(-delta).toString()]);
   const receipt={id,kind:`MANUAL_${data.direction}`,targetId:target.id,amount:data.amount,reason:data.reason,...balance};
   await audit(db,actor,receipt.kind,receipt);return receipt;
  });
 });
}
export async function transfer(req:Request,body:unknown){
 const data=parse(transferSchema,body);
 return transaction(async db=>{
  const actor=await actorFor(db,req,true);if(!['SUB_DISTRIBUTOR','AGENT','MAIN_ADMIN'].includes(actor.role))fail(403,'TRANSFER_FORBIDDEN');
  const target=await inScope(db,actor,data.targetId);
  const rank={MAIN_ADMIN:0,SUB_DISTRIBUTOR:1,AGENT:2,PLAYER:3};
  if(!target.active||rank[target.role]<=rank[actor.role])fail(403,'TRANSFER_FORBIDDEN','Transfer only your own existing credits to a lower role in your branch.');
  return idempotent(db,actor,'TRANSFER',data.requestKey,data,async()=>{
   const wallets=await lockWallets(db,[actor.id,target.id]);const source=wallets.find(w=>w.account_id===actor.id)!;const destination=wallets.find(w=>w.account_id===target.id)!;
   fresh(source,data.expectedVersion);fresh(destination,data.targetVersion);
   const id=await beginLedger(db,actor,target,'TRANSFER',data.reason,data.requestKey);
   const from=await posting(db,id,source,-BigInt(data.amount));const to=await posting(db,id,destination,BigInt(data.amount));
   const receipt={id,kind:'TRANSFER',sourceId:actor.id,targetId:target.id,amount:data.amount,reason:data.reason,from,to};await audit(db,actor,'TRANSFER',receipt);return receipt;
  });
 });
}
export async function reverse(req:Request,body:unknown){
 const data=parse(reversalSchema,body);
 return transaction(async db=>{
  const actor=await actorFor(db,req,true);privileged(actor);
  const original=(await db.query('SELECT t.*,p.units FROM ledger_transactions t JOIN ledger_postings p ON p.transaction_id=t.id AND p.wallet_id IS NOT NULL WHERE t.id=$1 AND t.kind IN (\'MANUAL_ADD\',\'MANUAL_REMOVE\')',[data.transactionId])).rows[0];
  if(!original)fail(404,'ADJUSTMENT_NOT_FOUND');const target=await inScope(db,actor,original.target_id);
  return idempotent(db,actor,'REVERSAL',data.requestKey,data,async()=>{
   await db.query('SELECT id FROM ledger_transactions WHERE id=$1 FOR UPDATE',[original.id]);
   if((await db.query('SELECT id FROM ledger_transactions WHERE related_id=$1',[original.id])).rowCount)fail(409,'ALREADY_REVERSED');
   const [wallet]=await lockWallets(db,[target.id]);fresh(wallet,data.expectedVersion);
   const delta=-BigInt(original.units);const id=await beginLedger(db,actor,target,'REVERSAL',data.reason,data.requestKey,original.id);
   const balance=await posting(db,id,wallet,delta);await db.query('INSERT INTO ledger_postings(transaction_id,system_account,units) VALUES($1,$2,$3)',[id,delta>0?'ISSUANCE':'RETIREMENT',(-delta).toString()]);
   const receipt={id,kind:'REVERSAL',relatedId:original.id,targetId:target.id,reason:data.reason,...balance};await audit(db,actor,'REVERSAL',receipt);return receipt;
  });
 });
}
