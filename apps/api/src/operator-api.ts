import {isIP,BlockList} from 'node:net';
import {z} from 'zod';
import {actorFor,parse,verifiedStaff,type Request} from './auth.js';
import {audit,transaction,fail} from './store.js';
import {digest,token} from './security.js';
import {me} from './accounts.js';
import {operatorAccounts,operatorRecords} from './operator.js';
import {operatorRounds} from './operator-reports.js';

export async function operatorIntegration(req:Request,endpoint:string,query:unknown){
 const request={...req,integrationKey:String(req.headers.authorization||'').replace(/^Bearer /,'')||'invalid'};
 if(endpoint==='account'){parse(z.object({}).strict(),query);const {csrf,...account}=await me(request);void csrf;return account;}
 if(endpoint==='users'){const filter=parse(z.record(z.string(),z.string()),query);if('role' in filter)fail(400,'INVALID_REQUEST');return operatorAccounts(request,{...filter,role:'PLAYER'});}
 if(endpoint==='records')return operatorRecords(request,query);
 if(endpoint==='rounds')return operatorRounds(request,query);
 return fail(404,'NOT_FOUND');
}

export function canonicalIp(value:string){if(!isIP(value))return null;const list=new BlockList();list.addAddress(value,isIP(value)===6?'ipv6':'ipv4');return list.rules[0].replace(/^Address: (IPv4|IPv6) /,'');}
export async function operatorApiSettings(req:Request){return transaction(async db=>{
 const actor=await actorFor(db,req);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
 const row=(await db.query('SELECT prefix,allowed_ips::text[],created_at,revoked_at FROM operator_api_keys WHERE account_id=$1',[actor.id])).rows[0];
 return {configured:!!row&&!row.revoked_at,prefix:row?.prefix||'',allowedIps:row?.allowed_ips||[],createdAt:row?.created_at||null};
});}
const updateSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('REGENERATE')}).strict(),
 z.object({action:z.literal('WHITELIST'),ips:z.array(z.string().refine(v=>isIP(v)>0,'Use a single IPv4 or IPv6 address.')).max(20)}).strict()
]);
export async function updateOperatorApi(req:Request,body:unknown){const data=parse(updateSchema,body);return transaction(async db=>{
 const actor=await actorFor(db,req,true);verifiedStaff(actor);
 await audit(db,actor,'API_CONFIGURATION',{action:data.action,...(data.action==='WHITELIST'?{ips:data.ips}:{})});
 if(data.action==='WHITELIST'){
  const result=await db.query('UPDATE operator_api_keys SET allowed_ips=$2::inet[] WHERE account_id=$1 AND revoked_at IS NULL',[actor.id,[...new Set(data.ips.map(ip=>canonicalIp(ip)!))]]);if(!result.rowCount)fail(409,'API_KEY_REQUIRED','Generate a key first.');return {updated:true};
 }
 const secret=`ng_${token()}`;
 await db.query(`INSERT INTO operator_api_keys(account_id,key_hash,prefix) VALUES($1,$2,$3) ON CONFLICT(account_id) DO UPDATE SET key_hash=excluded.key_hash,prefix=excluded.prefix,created_at=now(),revoked_at=NULL`,[actor.id,digest(secret),secret.slice(0,11)]);
 return {secret};
},true);}

export const operatorApiDocumentation=`# New Game Operator API — v1

Base address: this operator site's /v1/integration
Authentication: Authorization: Bearer <API Secret Key>
Use HTTPS from a server. Never put the secret in a browser, URL or player app.
The source IP must be listed in Setting > API Download > API Whitelist IP.
An empty whitelist denies all requests. Regenerating a key invalidates the old key.
The new secret is shown once; only its SHA-256 hash is stored.

GET /account — your account, role and wallet (no session/CSRF credentials).
GET /users?page=1&pageSize=20&search=account — players in your branch.
GET /records?kind=RECHARGE&from=2026-09-01&to=2026-09-30 — branch credit records.
GET /rounds?from=2026-09-01&to=2026-09-30 — one row per committed game round.

All credit values are integer-unit decimal strings (100 units = 1.00 credits).
Game ID / Agent ID is the public_id displayed in User Management / Setting.
Account UUIDs identify API resources; credentials never allow reads outside your branch.
Pagination uses page (1-based) and pageSize (1–100). Dates are UTC inclusive days.
This API is read-only. Create, recharge, redeem, resets and access changes use the
authenticated operator console and its recent-password verification.
Responses use JSON. Errors: 400 invalid filter, 401 invalid credential, 403 IP or
operation denied, 503 service unavailable. No JUWA service or credential is used.
`;
