import { type PoolClient } from 'pg';
import { z } from 'zod';
import { type Actor, audit, branchEnabled, fail, transaction } from './store.js';
import { digest, passwordMatches, token } from './security.js';
import { stagingEnabled, hostedTest } from './environment.js';
import {clientIp,deviceCookie,registerDevice} from './device.js';
export interface Request { headers: Record<string,string|string[]|undefined>; ip?: string; integrationKey?:string }
export interface Response { setHeader(name: string, value: string|string[]): unknown }
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5173,http://127.0.0.1:5174').split(',');
export function checkOrigin(req: Request) { if (!allowedOrigins.includes(String(req.headers.origin || ''))) fail(403,'ORIGIN_REJECTED'); }
const cookieName=stagingEnabled()?(hostedTest()?(process.env.HOSTED_APP==='operator'?'ng_operator_session':'ng_hosted_test_session'):'ng_staging_session'):'ng_session';
export const sessionCookie = (value: string, maxAge=43200) => `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/v1; Max-Age=${maxAge}${process.env.NODE_ENV==='production'||hostedTest()?'; Secure':''}`;
export function readToken(req: Request) { return String(req.headers.cookie||'').split(';').map(part=>part.trim()).find(part=>part.startsWith(`${cookieName}=`))?.slice(cookieName.length+1) || ''; }
export async function actorFor(db: PoolClient, req: Request, mutation=false): Promise<Actor> {
 if(req.integrationKey){
  if(mutation)fail(403,'API_READ_ONLY');
  const key=req.integrationKey;if(!/^ng_[a-f0-9]{64}$/.test(key)||!clientIp(req))fail(401,'API_KEY_REJECTED');
  const row=(await db.query<Actor>(`SELECT a.id,a.branch_id,a.role,a.display_name,a.username,''::text token_hash,''::text csrf_token,NULL::timestamptz verified_at FROM operator_api_keys k JOIN accounts a ON a.id=k.account_id WHERE k.key_hash=$1 AND k.revoked_at IS NULL AND $2::inet=ANY(k.allowed_ips) AND a.active AND a.archived_at IS NULL AND a.role<>'PLAYER' FOR SHARE OF a,k`,[digest(key),clientIp(req)])).rows[0];
  if(!row||!await branchEnabled(db,row.branch_id))fail(401,'API_KEY_REJECTED');return row;
 }
 const session=readToken(req); if(!/^[a-f0-9]{64}$/.test(session))fail(401,'AUTH_REQUIRED','Please sign in.');
 const {rows}=await db.query<Actor>(`SELECT a.id,a.branch_id,a.role,a.display_name,a.username,s.token_hash,s.csrf_token,s.verified_at
 FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND a.active AND a.archived_at IS NULL FOR SHARE OF a,s`,[digest(session)]);
 const actor=rows[0];if(!actor||!await branchEnabled(db,actor.branch_id))fail(401,'SESSION_EXPIRED','Your session expired. Sign in again.');
 if(mutation){checkOrigin(req);if(req.headers['x-csrf-token']!==actor.csrf_token)fail(403,'CSRF_REJECTED');}
 return {...actor,client_ip:clientIp(req)};
}
export function privileged(actor: Actor) { if(actor.role!=='MAIN_ADMIN')fail(403,'MAIN_ADMIN_REQUIRED');if(!actor.verified_at || Date.now()-actor.verified_at.getTime()>300000)fail(403,'VERIFICATION_REQUIRED','Verify your password to continue.'); }
export function verifiedStaff(actor: Actor) {
 if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
 if(actor.role==='MAIN_ADMIN')return privileged(actor);
 if(!actor.verified_at || Date.now()-actor.verified_at.getTime()>300000)fail(403,'VERIFICATION_REQUIRED','Verify your password to continue.');
}
export function parse<T>(schema: z.ZodType<T>, body: unknown): T { const result=schema.safeParse(body);if(!result.success)return fail(400,'INVALID_REQUEST',result.error.issues.map(issue=>`${issue.path.join('.')}: ${issue.message}`).join('; '));return result.data; }
const credentials=z.object({username:z.string().min(3).max(64).transform(v=>v.toLowerCase()),password:z.string().min(1).max(256),code:z.string().max(6).optional()}).strict();
export async function login(req: Request,res: Response,body: unknown, audience?:'staff'|'player') {
 checkOrigin(req);const data=parse(credentials,body);const key=digest(`${req.ip}:${data.username}`);
 // Return errors after COMMIT so failed-attempt counters cannot be rolled back by rejection.
 const result=await transaction(async db=>{
  await db.query('INSERT INTO login_attempts(key_hash) VALUES($1) ON CONFLICT DO NOTHING',[key]);
  const attempt=(await db.query('SELECT * FROM login_attempts WHERE key_hash=$1 FOR UPDATE',[key])).rows[0];
  if(Date.now()-new Date(attempt.window_start).getTime()>900000)await db.query('UPDATE login_attempts SET failures=0,window_start=now() WHERE key_hash=$1',[key]);
  else if(attempt.failures>=8)return {error:'RATE_LIMITED'};
  const account=(await db.query('SELECT * FROM accounts WHERE username=$1 FOR SHARE',[data.username])).rows[0];
  const passwordOk=await passwordMatches(data.password,account?.password_hash);
  if(!account?.active || account.archived_at || !passwordOk || !await branchEnabled(db,account.branch_id) || (audience==='staff'&&account.role==='PLAYER') || (audience==='player'&&account.role!=='PLAYER')){await db.query('UPDATE login_attempts SET failures=failures+1 WHERE key_hash=$1',[key]);return {error:'INVALID_CREDENTIALS'};}
  const device=account.role!=='PLAYER'?await registerDevice(db,req,account):null;
  if(device&&!device.allowed)return {error:'DEVICE_REVIEW_REQUIRED',device:device.raw};
  const raw=token(),csrf=token();
  await db.query('INSERT INTO sessions(token_hash,account_id,csrf_token,expires_at,verified_at,device_id) VALUES($1,$2,$3,now()+interval \'12 hours\',$4,$5)',[digest(raw),account.id,csrf,account.role!=='PLAYER'?new Date():null,device?.id||null]);
  await db.query('UPDATE login_attempts SET failures=0 WHERE key_hash=$1',[key]);
  await audit(db,account,'LOGIN',{ip:clientIp(req)});
  return {raw,csrf,device:device?.raw};
 });
 if(result.error==='DEVICE_REVIEW_REQUIRED'){res.setHeader('Set-Cookie',deviceCookie(result.device!));return {deviceReviewRequired:true};}
 if(result.error)fail(result.error==='RATE_LIMITED'?429:401,result.error,result.error==='RATE_LIMITED'?'Too many attempts. Try again in 15 minutes.':'Login ID or password is incorrect.');
 res.setHeader('Set-Cookie',result.device?[sessionCookie(result.raw!),deviceCookie(result.device)]:sessionCookie(result.raw!));return {csrf:result.csrf};
}
export async function verify(req:Request,body:unknown){
 const data=parse(z.object({password:z.string().min(1).max(256),code:z.string().max(6).optional()}).strict(),body);
 const result=await transaction(async db=>{
  const candidate=(await db.query('SELECT account_id FROM sessions WHERE token_hash=$1',[digest(readToken(req))])).rows[0];
  if(!candidate)fail(401,'AUTH_REQUIRED');
  // Same account-before-session order as password changes. Concurrent verification
  // must not upgrade two shared session locks while holding the rate-limit lock.
  await db.query('SELECT id FROM accounts WHERE id=$1 FOR UPDATE',[candidate.account_id]);
  const actor=await actorFor(db,req,true);if(actor.role==='PLAYER')fail(403,'STAFF_REQUIRED');
  const key=digest(`verify:${actor.id}`);await db.query('INSERT INTO login_attempts(key_hash) VALUES($1) ON CONFLICT DO NOTHING',[key]);
  const attempt=(await db.query('SELECT * FROM login_attempts WHERE key_hash=$1 FOR UPDATE',[key])).rows[0];
  if(Date.now()-new Date(attempt.window_start).getTime()>900000)await db.query('UPDATE login_attempts SET failures=0,window_start=now() WHERE key_hash=$1',[key]);
  else if(attempt.failures>=8)return false;
  const account=(await db.query('SELECT password_hash,totp_secret FROM accounts WHERE id=$1',[actor.id])).rows[0];
  if(!await passwordMatches(data.password,account.password_hash)){await db.query('UPDATE login_attempts SET failures=failures+1 WHERE key_hash=$1',[key]);return false;}
  await db.query('UPDATE sessions SET verified_at=now() WHERE token_hash=$1',[actor.token_hash]);await audit(db,actor,'PRIVILEGED_VERIFICATION',{});return true;
 });
 if(!result)fail(403,'VERIFICATION_FAILED','Verification failed or too many attempts.');return {verified:true};
}
