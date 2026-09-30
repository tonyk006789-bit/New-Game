import {z} from 'zod';
import {actorFor,parse,type Request} from './auth.js';
import {fail,transaction} from './store.js';
import {paging,date} from './operator.js';
const filters=z.object({...paging,search:z.string().trim().max(100).default(''),from:date,to:date}).strict().refine(v=>!v.from||!v.to||v.from<=v.to);
const bounds=`($3::date IS NULL OR r.created_at>=($3::date::timestamp AT TIME ZONE 'UTC')) AND ($4::date IS NULL OR r.created_at<(($4::date+1)::timestamp AT TIME ZONE 'UTC'))`;
export async function operatorRounds(req:Request,query:unknown){const q=parse(filters,query);return transaction(async db=>{
 const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
 const result=await db.query(`WITH matches AS (
 SELECT r.id,a.id account_id,a.public_id::text public_id,a.username,r.game_id,r.stake_units::text,r.award_units::text,r.created_at,p.before_units::text,coalesce(win.after_units,p.after_units)::text after_units,manager.username manager
 FROM staging_rounds r JOIN accounts a ON a.id=r.account_id JOIN branch_ancestors c ON c.branch_id=a.branch_id AND c.ancestor_id=$1
 JOIN ledger_transactions t ON t.id=r.stake_transaction JOIN branch_ancestors h ON h.branch_id=t.branch_id_at_event AND h.ancestor_id=$1
 JOIN wallets w ON w.account_id=a.id JOIN ledger_postings p ON p.transaction_id=r.stake_transaction AND p.wallet_id=w.id
 LEFT JOIN ledger_postings win ON win.transaction_id=r.award_transaction AND win.wallet_id=w.id
 LEFT JOIN accounts manager ON manager.branch_id=a.branch_id AND manager.role='AGENT'
 WHERE ($2='' OR strpos(lower(a.username),lower($2))>0 OR a.public_id::text=$2 OR a.id::text=$2) AND ${bounds}),
 page AS (SELECT * FROM matches ORDER BY created_at DESC,id LIMIT $5 OFFSET $6)
 SELECT (SELECT count(*)::text FROM matches) total,coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC,id) FROM page),'[]') items,
 (SELECT coalesce(sum(stake_units::numeric),0)::text FROM matches) played,(SELECT coalesce(sum(award_units::numeric),0)::text FROM matches) won`,[actor.branch_id,q.search,q.from||null,q.to||null,q.pageSize,(q.page-1)*q.pageSize]);
 return {...result.rows[0],page:q.page,pageSize:q.pageSize};
});}
export async function operatorTotals(req:Request,query:unknown){const q=parse(filters,query);return transaction(async db=>{
 const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
 const result=await db.query(`WITH agents AS (SELECT a.id,a.username,a.role,a.branch_id FROM accounts a JOIN branch_ancestors c ON c.branch_id=a.branch_id AND c.ancestor_id=$1 WHERE a.role='AGENT' AND ($2='' OR strpos(lower(a.username),lower($2))>0 OR a.public_id::text=$2)),
 players AS (SELECT a.id,a.branch_id FROM accounts a JOIN branch_ancestors c ON c.branch_id=a.branch_id AND c.ancestor_id=$1 WHERE a.role='PLAYER'),
 rounds AS (SELECT a.branch_id,sum(r.stake_units) played,sum(r.award_units) won FROM staging_rounds r JOIN players a ON a.id=r.account_id JOIN ledger_transactions t ON t.id=r.stake_transaction JOIN branch_ancestors h ON h.branch_id=t.branch_id_at_event AND h.ancestor_id=$1 WHERE ${bounds} GROUP BY a.branch_id),
 movements AS (SELECT a.branch_id,sum(p.units) FILTER(WHERE r.kind='TRANSFER') recharged,-sum(p.units) FILTER(WHERE r.kind='REDEEM') redeemed FROM ledger_transactions r JOIN players a ON a.id=r.target_id JOIN branch_ancestors h ON h.branch_id=r.branch_id_at_event AND h.ancestor_id=$1 JOIN wallets w ON w.account_id=a.id JOIN ledger_postings p ON p.wallet_id=w.id AND p.transaction_id=r.id WHERE r.kind IN ('TRANSFER','REDEEM') AND ${bounds} GROUP BY a.branch_id),
 matches AS (SELECT g.id,g.username,g.role,coalesce(r.played,0)::text played,coalesce(r.won,0)::text won,coalesce(m.recharged,0)::text recharged,coalesce(m.redeemed,0)::text redeemed FROM agents g LEFT JOIN rounds r ON r.branch_id=g.branch_id LEFT JOIN movements m ON m.branch_id=g.branch_id),
 page AS (SELECT * FROM matches ORDER BY username,id LIMIT $5 OFFSET $6)
 SELECT (SELECT count(*)::text FROM matches) total,coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY username,id) FROM page),'[]') items,
 (SELECT coalesce(sum(played::numeric),0)::text FROM matches) played,(SELECT coalesce(sum(won::numeric),0)::text FROM matches) won,(SELECT coalesce(sum(recharged::numeric),0)::text FROM matches) recharged,(SELECT coalesce(sum(redeemed::numeric),0)::text FROM matches) redeemed`,[actor.branch_id,q.search,q.from||null,q.to||null,q.pageSize,(q.page-1)*q.pageSize]);
 return {...result.rows[0],page:q.page,pageSize:q.pageSize};
});}
