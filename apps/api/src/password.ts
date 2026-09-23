import {z} from 'zod';
import {actorFor,checkOrigin,parse,readToken,sessionCookie,type Request,type Response} from './auth.js';
import {audit,fail,transaction} from './store.js';
import {digest,passwordHash,passwordMatches} from './security.js';
export async function changePassword(req:Request,res:Response,body:unknown){
 checkOrigin(req);
 const data=parse(z.object({currentPassword:z.string().min(1).max(256),newPassword:z.string().min(12).max(256)}).strict(),body);
 const result=await transaction(async db=>{
  const candidate=(await db.query('SELECT account_id FROM sessions WHERE token_hash=$1',[digest(readToken(req))])).rows[0];
  if(!candidate)fail(401,'AUTH_REQUIRED');
  // Lock before actorFor's shared locks, so concurrent password changes cannot deadlock upgrades.
  await db.query('SELECT id FROM accounts WHERE id=$1 FOR UPDATE',[candidate.account_id]);
  const actor=await actorFor(db,req,true);if(actor.role!=='PLAYER')fail(403,'PLAYER_REQUIRED');
  const key=digest(`password:${actor.id}`);await db.query('INSERT INTO login_attempts(key_hash) VALUES($1) ON CONFLICT DO NOTHING',[key]);
  const attempt=(await db.query('SELECT * FROM login_attempts WHERE key_hash=$1 FOR UPDATE',[key])).rows[0];
  if(Date.now()-new Date(attempt.window_start).getTime()>900000)await db.query('UPDATE login_attempts SET failures=0,window_start=now() WHERE key_hash=$1',[key]);
  else if(attempt.failures>=8)return 'RATE_LIMITED';
  const account=(await db.query('SELECT password_hash FROM accounts WHERE id=$1',[actor.id])).rows[0];
  if(!await passwordMatches(data.currentPassword,account.password_hash)){await db.query('UPDATE login_attempts SET failures=failures+1 WHERE key_hash=$1',[key]);return 'PASSWORD_INCORRECT';}
  if(data.currentPassword===data.newPassword)return 'PASSWORD_UNCHANGED';
  await db.query('UPDATE accounts SET password_hash=$1 WHERE id=$2',[await passwordHash(data.newPassword),actor.id]);
  await db.query('UPDATE sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[actor.id]);
  await db.query('UPDATE login_attempts SET failures=0 WHERE key_hash=$1',[key]);
  await audit(db,actor,'PASSWORD_CHANGED',{sessionsRevoked:true});return null;
 });
 if(result)fail(result==='RATE_LIMITED'?429:400,result,result==='RATE_LIMITED'?'Too many attempts. Try again in 15 minutes.':result==='PASSWORD_UNCHANGED'?'Choose a different password.':'Your current password is incorrect.');
 res.setHeader('Set-Cookie',sessionCookie('',0));return {changed:true,signInRequired:true};
}
