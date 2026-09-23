import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type Request, actorFor, parse, privileged } from './auth.js';
import { type Wallet, audit, fail, inScope, transaction, walletView } from './store.js';
import { passwordHash } from './security.js';
export async function me(req:Request){return transaction(async db=>{
 const actor=await actorFor(db,req);const wallet=(await db.query<Wallet>('SELECT * FROM wallets WHERE account_id=$1',[actor.id])).rows[0];
 return {id:actor.id,displayName:actor.display_name,username:actor.username,role:actor.role,csrf:actor.csrf_token,wallet:walletView(wallet)};
});}
export async function accounts(req:Request){return transaction(async db=>{
 const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
 const {rows}=await db.query(`SELECT a.id,a.username,a.display_name,a.role,a.active,b.name branch,w.settled_units,w.reserved_units,w.version FROM accounts a
 JOIN branches b ON b.id=a.branch_id JOIN branch_ancestors c ON c.branch_id=a.branch_id JOIN wallets w ON w.account_id=a.id WHERE c.ancestor_id=$1 ORDER BY a.created_at DESC LIMIT 500`,[actor.branch_id]);
 return rows.map(row=>({id:row.id,username:row.username,displayName:row.display_name,role:row.role,active:row.active,branch:row.branch,wallet:walletView(row as Wallet)}));
});}
const createSchema=z.object({parentId:z.uuid(),username:z.string().regex(/^[a-z0-9][a-z0-9._-]{2,63}$/),displayName:z.string().trim().min(1).max(100),password:z.string().min(12).max(256)}).strict();
export async function createAccount(req:Request,body:unknown){
 const data=parse(createSchema,body);const hash=await passwordHash(data.password);
 return transaction(async db=>{
  const actor=await actorFor(db,req,true);privileged(actor);const parent=await inScope(db,actor,data.parentId);
  const next={MAIN_ADMIN:'SUB_DISTRIBUTOR',SUB_DISTRIBUTOR:'AGENT',AGENT:'PLAYER',PLAYER:null};const role=next[parent.role];if(!role)fail(400,'PLAYER_CANNOT_PARENT');
  await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`username:${data.username}`]);
  if((await db.query('SELECT id FROM accounts WHERE username=$1',[data.username])).rowCount)fail(409,'USERNAME_EXISTS');
  const id=randomUUID();let branch=parent.branch_id;
  if(role!=='PLAYER'){
   branch=randomUUID();await db.query('INSERT INTO branches(id,parent_id,name) VALUES($1,$2,$3)',[branch,parent.branch_id,data.displayName]);
   await db.query('INSERT INTO branch_ancestors(branch_id,ancestor_id,depth) SELECT $1,ancestor_id,depth+1 FROM branch_ancestors WHERE branch_id=$2',[branch,parent.branch_id]);
   await db.query('INSERT INTO branch_ancestors VALUES($1,$1,0)',[branch]);
  }
  await db.query('INSERT INTO accounts(id,branch_id,role,display_name,active,username,password_hash) VALUES($1,$2,$3,$4,true,$5,$6)',[id,branch,role,data.displayName,data.username,hash]);
  await db.query('INSERT INTO wallets(id,account_id) VALUES($1,$2)',[randomUUID(),id]);
  await audit(db,actor,'ACCOUNT_CREATED',{id,parentId:parent.id,role,username:data.username});return {id,role,username:data.username};
 });
}
export async function history(req:Request,targetId?:string){return transaction(async db=>{
 const actor=await actorFor(db,req);const target=targetId?parse(z.uuid(),targetId):actor.id;await inScope(db,actor,target);
 return (await db.query(`SELECT t.id,t.kind,t.reason,t.created_at,t.related_id,p.units,p.before_units,p.after_units,p.wallet_version,a.display_name actor
 FROM ledger_postings p JOIN wallets w ON w.id=p.wallet_id JOIN ledger_transactions t ON t.id=p.transaction_id JOIN accounts a ON a.id=t.actor_id WHERE w.account_id=$1 ORDER BY p.id DESC LIMIT 100`,[target])).rows;
});}
export async function report(req:Request){return transaction(async db=>{
 const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
 // Aggregation is scoped before grouping, including the historical branch of each event.
 return (await db.query(`SELECT t.kind,count(DISTINCT t.id)::text transactions,coalesce(sum(p.units) FILTER (WHERE p.units>0),0)::text positive_units
 FROM ledger_transactions t JOIN branch_ancestors c ON c.branch_id=t.branch_id_at_event JOIN ledger_postings p ON p.transaction_id=t.id AND p.wallet_id IS NOT NULL
 WHERE c.ancestor_id=$1 GROUP BY t.kind ORDER BY t.kind`,[actor.branch_id])).rows;
});}
export async function auditHistory(req:Request){return transaction(async db=>{const actor=await actorFor(db,req);if(actor.role!=='MAIN_ADMIN')fail(403,'MAIN_ADMIN_REQUIRED');return (await db.query('SELECT e.id,e.event_type,e.details,e.created_at,a.display_name actor FROM audit_events e JOIN accounts a ON a.id=e.actor_id JOIN branch_ancestors c ON c.branch_id=e.branch_id_at_event WHERE c.ancestor_id=$1 ORDER BY e.created_at DESC LIMIT 100',[actor.branch_id])).rows;});}
const manageSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('RESET_PASSWORD'),password:z.string().min(12).max(256),reason:z.string().trim().min(5).max(500)}).strict(),
 z.object({action:z.literal('SET_ACTIVE'),active:z.boolean(),reason:z.string().trim().min(5).max(500)}).strict()
]);
export async function manageAccount(req:Request,id:string,body:unknown){
 const targetId=parse(z.uuid(),id),data=parse(manageSchema,body);
 const hash=data.action==='RESET_PASSWORD'?await passwordHash(data.password):null;
 return transaction(async db=>{const actor=await actorFor(db,req,true);privileged(actor);const target=await inScope(db,actor,targetId);
  if(target.role==='MAIN_ADMIN')fail(403,'ROOT_RECOVERY_SEPARATE','Main Admin recovery requires the local operator recovery procedure.');
  if(data.action==='RESET_PASSWORD')await db.query('UPDATE accounts SET password_hash=$1 WHERE id=$2',[hash,target.id]);
  else await db.query('UPDATE accounts SET active=$1 WHERE id=$2',[data.active,target.id]);
  await db.query('UPDATE sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[target.id]);
  await audit(db,actor,data.action,{targetId:target.id,reason:data.reason,...(data.action==='SET_ACTIVE'?{active:data.active}:{})});return {updated:true,sessionsRevoked:true};
 });
}
