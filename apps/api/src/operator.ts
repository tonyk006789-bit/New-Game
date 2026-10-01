import {z} from 'zod';
import {actorFor,parse,type Request} from './auth.js';
import {transaction,directChild,directChildrenSql,fail,inScope,walletView,type Wallet} from './store.js';

export const paging={page:z.coerce.number().int().min(1).max(100000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)};
const search=z.string().trim().max(100).default('');
export const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v);return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;},'Use a valid date.').optional();
const accountQuery=z.object({...paging,search,role:z.enum(['ALL','PLAYER','AGENT','SUB_DISTRIBUTOR','MAIN_ADMIN']).default('ALL'),status:z.enum(['ALL','ACTIVE','SUSPENDED','ARCHIVED']).default('ALL'),sort:z.enum(['created','username','balance']).default('created'),order:z.enum(['asc','desc']).default('desc')}).strict();
const recordQuery=z.object({...paging,search,kind:z.enum(['ALL','RECHARGE','REDEEM','REWARDS','GAMES','ADJUSTMENTS']).default('ALL'),from:date,to:date,accountId:z.uuid().optional()}).strict().refine(d=>!d.from||!d.to||d.from<=d.to,{message:'Start date must be before the end date.'});
const scope=`JOIN branch_ancestors scope ON scope.branch_id=a.branch_id AND scope.ancestor_id=$1`;

export async function operatorAccounts(req:Request,query:unknown){
 const q=parse(accountQuery,query);
 return transaction(async db=>{
  const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
  const params=[actor.branch_id,q.search,q.role,q.status];
  const filter=`${scope} WHERE ${directChildrenSql(actor.role)} AND ($2='' OR strpos(lower(a.username),lower($2))>0 OR strpos(lower(a.display_name),lower($2))>0 OR a.id::text=$2 OR a.public_id::text=$2) AND ($3='ALL' OR a.role::text=$3) AND ($4='ALL' OR ($4='ARCHIVED' AND a.archived_at IS NOT NULL) OR ($4='ACTIVE' AND a.active AND a.archived_at IS NULL) OR ($4='SUSPENDED' AND NOT a.active AND a.archived_at IS NULL))`;
  const sort={created:'a.created_at',username:'a.username',balance:'(w.settled_units-w.reserved_units)'}[q.sort];
  // One statement gives the count and page the same database snapshot.
  const result=await db.query(`WITH matches AS (SELECT a.id,a.username,a.display_name,a.role,a.active,a.archived_at,a.branch_id,a.created_at,a.public_id::text,a.registered_ip,logins.login_count,logins.last_login,latest.last_ip,manager.manager,b.parent_id,b.name branch,NOT EXISTS(SELECT 1 FROM accounts staff JOIN branch_ancestors ac ON ac.ancestor_id=staff.branch_id WHERE ac.branch_id=a.branch_id AND staff.role<>'PLAYER' AND (NOT staff.active OR staff.archived_at IS NOT NULL)) branch_enabled,w.settled_units::text,w.reserved_units::text,w.version::text,${sort} sort_key
   FROM accounts a JOIN wallets w ON w.account_id=a.id JOIN branches b ON b.id=a.branch_id
 LEFT JOIN LATERAL (SELECT count(*)::text login_count,max(created_at) last_login FROM audit_events WHERE actor_id=a.id AND event_type='LOGIN') logins ON true
 LEFT JOIN LATERAL (SELECT details->>'ip' last_ip FROM audit_events WHERE actor_id=a.id AND event_type='LOGIN' ORDER BY created_at DESC LIMIT 1) latest ON true
 LEFT JOIN LATERAL (SELECT parent.username||' ('||parent.public_id::text||')' manager FROM accounts parent WHERE parent.branch_id=CASE WHEN a.role='PLAYER' THEN a.branch_id ELSE b.parent_id END AND parent.role<>'PLAYER' AND parent.id<>a.id AND EXISTS(SELECT 1 FROM branch_ancestors pc WHERE pc.branch_id=parent.branch_id AND pc.ancestor_id=$1) LIMIT 1) manager ON true ${filter}),
   page AS (SELECT * FROM matches ORDER BY sort_key ${q.order==='asc'?'ASC':'DESC'},id LIMIT $5 OFFSET $6)
   SELECT (SELECT count(*)::text FROM matches) total,coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY sort_key ${q.order==='asc'?'ASC':'DESC'},id) FROM page),'[]'::jsonb) items`,[...params,q.pageSize,(q.page-1)*q.pageSize]);
  return {page:q.page,pageSize:q.pageSize,total:result.rows[0].total,items:result.rows[0].items.map((row:Wallet&{username:string;display_name:string;role:string;active:boolean;archived_at:string|null;parent_id:string|null;branch_enabled:boolean;branch:string;created_at:string;branch_id:string;public_id:string;registered_ip:string|null;login_count:string;last_login:string|null;last_ip:string|null;manager:string|null})=>({id:row.id,publicId:row.public_id,registeredIp:row.registered_ip,loginCount:row.login_count,lastLogin:row.last_login,lastIp:row.last_ip,manager:row.manager,username:row.username,displayName:row.display_name,role:row.role,active:row.active,archived:!!row.archived_at,branchEnabled:row.branch_enabled,branch:row.branch,createdAt:row.created_at,wallet:walletView(row),canManage:directChild(actor,row),canRedeem:directChild(actor,row),canTransfer:directChild(actor,row)&&row.active&&!row.archived_at&&row.branch_enabled,canAdjust:actor.role==='MAIN_ADMIN'&&directChild(actor,row)}))};
 });
}

export async function operatorDashboard(req:Request){return transaction(async db=>{
 const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
 const result=await db.query(`WITH players AS (SELECT a.* FROM accounts a ${scope} WHERE a.role='PLAYER'),
 bounds AS (SELECT date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' today),
 movements AS (SELECT t.*,p.units FROM ledger_transactions t JOIN players a ON a.id=t.target_id
  JOIN branch_ancestors h ON h.branch_id=t.branch_id_at_event AND h.ancestor_id=$1
  JOIN wallets w ON w.account_id=a.id JOIN ledger_postings p ON p.wallet_id=w.id AND p.transaction_id=t.id WHERE t.kind IN ('TRANSFER','REDEEM'))
 SELECT (SELECT count(*)::text FROM players) players,
 (SELECT count(*)::text FROM players WHERE active AND archived_at IS NULL) enabled_players,
 (SELECT count(*)::text FROM players a WHERE EXISTS(SELECT 1 FROM audit_events e WHERE e.actor_id=a.id AND e.event_type='LOGIN' AND e.created_at>=now()-interval '24 hours')) active_24h,
 (SELECT count(*)::text FROM players,bounds WHERE created_at>=today-interval '1 day' AND created_at<today) new_yesterday,
 (SELECT count(DISTINCT target_id)::text FROM movements,bounds WHERE kind='TRANSFER' AND created_at>=today-interval '1 day' AND created_at<today) recharged_yesterday,
 (SELECT count(DISTINCT target_id)::text FROM movements,bounds WHERE kind='REDEEM' AND created_at>=today-interval '1 day' AND created_at<today) redeemed_yesterday,
 (SELECT coalesce(sum(units),0)::text FROM movements,bounds WHERE kind='TRANSFER' AND created_at>=today-interval '1 day' AND created_at<today) recharge_yesterday,
 (SELECT coalesce(-sum(units),0)::text FROM movements,bounds WHERE kind='REDEEM' AND created_at>=today-interval '1 day' AND created_at<today) redeem_yesterday,
 (SELECT coalesce(sum(units),0)::text FROM movements WHERE kind='TRANSFER') recharge_total,
 (SELECT coalesce(-sum(units),0)::text FROM movements WHERE kind='REDEEM') redeem_total,
 (SELECT coalesce(sum(w.settled_units-w.reserved_units),0)::text FROM wallets w JOIN players a ON a.id=w.account_id) player_available`,[actor.branch_id]);
 return {...result.rows[0],timezone:'UTC',asOf:new Date().toISOString()};
});}

// Only the subject wallet posting is selected: a transfer is one record, not
// two. Both current account scope and immutable event scope must be authorized.
const recordsFrom=`FROM ledger_transactions t JOIN accounts a ON a.id=t.target_id ${scope}
 JOIN branch_ancestors historical ON historical.branch_id=t.branch_id_at_event AND historical.ancestor_id=$1
 JOIN wallets w ON w.account_id=a.id JOIN ledger_postings p ON p.transaction_id=t.id AND p.wallet_id=w.id JOIN accounts actor ON actor.id=t.actor_id LEFT JOIN staging_rounds r ON r.stake_transaction=t.id OR r.award_transaction=t.id`;
const recordFields=`t.id,t.kind,t.reason,t.request_id,t.related_id,t.created_at,a.id account_id,a.public_id::text public_id,t.origin_ip,a.username,a.display_name,actor.username actor,p.units::text,p.before_units::text,p.after_units::text,p.wallet_version::text,r.id round_id,r.game_id,r.profile_id,r.stake_units::text,r.award_units::text`;
export async function operatorRecords(req:Request,query:unknown){
 const q=parse(recordQuery,query);
 return transaction(async db=>{
  const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
  if(q.accountId){const target=await inScope(db,actor,q.accountId);if(target.id!==actor.id&&!directChild(actor,target))fail(404,'ACCOUNT_NOT_FOUND');}
  const kinds={ALL:[],RECHARGE:['TRANSFER'],REDEEM:['REDEEM'],REWARDS:['DAILY_WHEEL'],GAMES:['GAME_STAKE','GAME_PAYOUT'],ADJUSTMENTS:['MANUAL_ADD','MANUAL_REMOVE','REVERSAL']}[q.kind];
  const filter=`WHERE (a.id=$9 OR ${directChildrenSql(actor.role)}) AND ($2='' OR strpos(lower(a.username),lower($2))>0 OR a.id::text=$2 OR a.public_id::text=$2 OR t.id::text=$2) AND (cardinality($3::text[])=0 OR t.kind=ANY($3::text[])) AND ($4::date IS NULL OR t.created_at>=($4::date::timestamp AT TIME ZONE 'UTC')) AND ($5::date IS NULL OR t.created_at<(($5::date+1)::timestamp AT TIME ZONE 'UTC')) AND ($6::uuid IS NULL OR a.id=$6)`;
  const result=await db.query(`WITH matches AS (SELECT ${recordFields} ${recordsFrom} ${filter}),page AS (SELECT * FROM matches ORDER BY created_at DESC,id DESC LIMIT $7 OFFSET $8)
   SELECT (SELECT count(*)::text FROM matches) total,coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC,id DESC) FROM page),'[]'::jsonb) items`,[actor.branch_id,q.search,kinds,q.from||null,q.to||null,q.accountId||null,q.pageSize,(q.page-1)*q.pageSize,actor.id]);
  return {page:q.page,pageSize:q.pageSize,...result.rows[0],timezone:'UTC'};
 });
}
export async function operatorReceipt(req:Request,id:string){
 const receiptId=parse(z.uuid(),id);
 return transaction(async db=>{
  const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
  const row=(await db.query(`SELECT ${recordFields} ${recordsFrom} WHERE t.id=$2 AND (a.id=$3 OR ${directChildrenSql(actor.role)})`,[actor.branch_id,receiptId,actor.id])).rows[0];
  if(!row)fail(404,'RECEIPT_NOT_FOUND');
  // Never expose the outside distributor's wallet via a branch-visible receipt.
  const postings=(await db.query(`SELECT a.username,p.units::text,p.before_units::text,p.after_units::text,p.wallet_version::text FROM ledger_postings p JOIN wallets w ON w.id=p.wallet_id JOIN accounts a ON a.id=w.account_id ${scope} WHERE p.transaction_id=$2 AND (a.id=$3 OR ${directChildrenSql(actor.role)}) ORDER BY p.id`,[actor.branch_id,receiptId,actor.id])).rows;
  return {...row,postings};
 });
}
export async function operatorSettings(req:Request){return transaction(async db=>{
 const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
 const account=(await db.query('SELECT id,public_id::text,username,display_name,role,created_at FROM accounts WHERE id=$1',[actor.id])).rows[0];
 const logins=await db.query("SELECT count(*)::text count,max(created_at) last_login FROM audit_events WHERE actor_id=$1 AND event_type='LOGIN'",[actor.id]);
 const sessions=await db.query('SELECT created_at,expires_at,(token_hash=$2) current FROM sessions WHERE account_id=$1 AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 50',[actor.id,actor.token_hash]);
 const lastIp=(await db.query("SELECT details->>'ip' ip FROM audit_events WHERE actor_id=$1 AND event_type='LOGIN' ORDER BY created_at DESC LIMIT 1",[actor.id])).rows[0]?.ip||null;
 return {account,...logins.rows[0],lastIp,sessions:sessions.rows};
});}
