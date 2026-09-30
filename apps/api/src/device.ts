import {randomUUID} from 'node:crypto';
import {isIP} from 'node:net';
import type {PoolClient} from 'pg';
import {z} from 'zod';
import {actorFor,parse,verifiedStaff,type Request} from './auth.js';
import {audit,fail,transaction} from './store.js';
import {digest,token} from './security.js';
import {hostedTest} from './environment.js';

export const clientIp=(req:Request)=>isIP(req.ip||'')?req.ip!:null;
const cookieName='ng_operator_device';
export const deviceCookie=(raw:string)=>`${cookieName}=${raw}; HttpOnly; SameSite=Strict; Path=/v1; Max-Age=31536000${hostedTest()||process.env.NODE_ENV==='production'?'; Secure':''}`;
export function deviceToken(req:Request){return String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${cookieName}=`))?.slice(cookieName.length+1)||'';}
/** Called only after password and branch checks, inside the login transaction. */
export async function registerDevice(db:PoolClient,req:Request,account:{id:string;device_review_enabled:boolean}){
 await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`devices:${account.id}`]);
 const incoming=deviceToken(req),raw=/^[a-f0-9]{64}$/.test(incoming)?incoming:token();
 const existing=(await db.query('SELECT * FROM operator_devices WHERE account_id=$1 AND secret_hash=$2 FOR UPDATE',[account.id,digest(raw)])).rows[0];
 let device=existing;
 if(existing)await db.query('UPDATE operator_devices SET last_ip=$2,last_seen=now(),login_count=login_count+1,user_agent=$3 WHERE id=$1',[existing.id,clientIp(req),String(req.headers['user-agent']||'Unknown').slice(0,500)]);
 else {
  const first=!(await db.query('SELECT 1 FROM operator_devices WHERE account_id=$1 LIMIT 1',[account.id])).rowCount;
  device=(await db.query(`INSERT INTO operator_devices(id,account_id,secret_hash,user_agent,first_ip,last_ip,status,can_review) VALUES($1,$2,$3,$4,$5,$5,$6,$7) RETURNING *`,[randomUUID(),account.id,digest(raw),String(req.headers['user-agent']||'Unknown').slice(0,500),clientIp(req),first?'APPROVED':'PENDING',first])).rows[0];
 }
 return {id:device.id,raw,allowed:device.status!=='REJECTED'&&(!account.device_review_enabled||device.status==='APPROVED')};
}
const querySchema=z.object({search:z.string().max(100).default(''),status:z.enum(['ALL','PENDING','APPROVED','REJECTED']).default('ALL'),from:z.iso.date().optional(),to:z.iso.date().optional(),page:z.coerce.number().int().min(1).max(100000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)}).strict().refine(v=>!v.from||!v.to||v.from<=v.to);
export async function operatorDevices(req:Request,query:unknown){const q=parse(querySchema,query);return transaction(async db=>{
 const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
 const result=await db.query(`WITH all_devices AS (SELECT id,user_agent,first_ip,last_ip,first_seen,last_seen,login_count::text,status,can_review,(id=(SELECT device_id FROM sessions WHERE token_hash=$2)) current FROM operator_devices WHERE account_id=$1), matches AS (SELECT * FROM all_devices WHERE ($3='' OR strpos(id::text,$3)>0) AND ($4='ALL' OR status=$4) AND ($5::date IS NULL OR last_seen>=($5::date::timestamp AT TIME ZONE 'UTC')) AND ($6::date IS NULL OR last_seen<(($6::date+1)::timestamp AT TIME ZONE 'UTC'))), page AS (SELECT * FROM matches ORDER BY last_seen DESC,id LIMIT $7 OFFSET $8)
 SELECT (SELECT count(*)::text FROM matches) total,coalesce((SELECT jsonb_agg(to_jsonb(page)) FROM page),'[]') items,
 (SELECT count(*)::text FROM all_devices) devices,(SELECT count(*)::text FROM all_devices WHERE status='PENDING') pending,(SELECT count(*)::text FROM all_devices WHERE status='APPROVED') approved,(SELECT count(*)::text FROM all_devices WHERE status='REJECTED') rejected,
 (SELECT device_review_enabled FROM accounts WHERE id=$1) enabled,coalesce((SELECT can_review FROM all_devices WHERE current),false) can_review`,[actor.id,actor.token_hash,q.search,q.status,q.from||null,q.to||null,q.pageSize,(q.page-1)*q.pageSize]);
 return {...result.rows[0],page:q.page,pageSize:q.pageSize};
});}
const changeSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('SET_REVIEW'),enabled:z.boolean()}).strict(),
 z.object({action:z.enum(['APPROVE','REJECT','ALLOW_REVIEW','REVOKE_REVIEW']),id:z.uuid()}).strict()
]);
export async function manageDevice(req:Request,body:unknown){const data=parse(changeSchema,body);return transaction(async db=>{
 const actor=await actorFor(db,req,true);verifiedStaff(actor);
 const current=(await db.query('SELECT d.* FROM operator_devices d JOIN sessions s ON s.device_id=d.id WHERE s.token_hash=$1 AND d.account_id=$2',[actor.token_hash,actor.id])).rows[0];
 const enabled=(await db.query('SELECT device_review_enabled FROM accounts WHERE id=$1',[actor.id])).rows[0].device_review_enabled;
 // While review is off, password-authenticated devices already have access.
 // Enabling it approves this device so a lost first-device cookie cannot make
 // it impossible to turn protection on. Once enabled, reviewers alone govern it.
 const initialEnable=data.action==='SET_REVIEW'&&data.enabled&&!enabled&&current&&current.status!=='REJECTED';
 if(initialEnable)await db.query("UPDATE operator_devices SET status='APPROVED',can_review=true WHERE id=$1",[current.id]);
 else if(!current?.can_review||current.status!=='APPROVED')fail(403,'REVIEW_DEVICE_REQUIRED','Use an approved review device.');
 if(data.action==='SET_REVIEW'){
  await db.query('UPDATE accounts SET device_review_enabled=$2 WHERE id=$1',[actor.id,data.enabled]);
  if(data.enabled)await db.query(`UPDATE sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL AND (device_id IS NULL OR device_id IN (SELECT id FROM operator_devices WHERE account_id=$1 AND status<>'APPROVED'))`,[actor.id]);
 }else{
  const target=(await db.query('SELECT * FROM operator_devices WHERE id=$1 AND account_id=$2 FOR UPDATE',[data.id,actor.id])).rows[0];if(!target)fail(404,'DEVICE_NOT_FOUND');
  if(target.id===current.id&&['REJECT','REVOKE_REVIEW'].includes(data.action))fail(409,'CURRENT_REVIEW_DEVICE','Use another review device to change this device.');
  if(data.action==='ALLOW_REVIEW'&&target.status!=='APPROVED')fail(409,'DEVICE_NOT_APPROVED');
  if(data.action==='APPROVE')await db.query("UPDATE operator_devices SET status='APPROVED' WHERE id=$1",[target.id]);
  if(data.action==='REJECT'){
   await db.query("UPDATE operator_devices SET status='REJECTED',can_review=false WHERE id=$1",[target.id]);
   await db.query('UPDATE sessions SET revoked_at=now() WHERE device_id=$1 AND revoked_at IS NULL',[target.id]);
  }
  if(['ALLOW_REVIEW','REVOKE_REVIEW'].includes(data.action))await db.query('UPDATE operator_devices SET can_review=$2 WHERE id=$1',[target.id,data.action==='ALLOW_REVIEW']);
 }
 await audit(db,actor,'DEVICE_REVIEW',data);return {updated:true};
},true);}
