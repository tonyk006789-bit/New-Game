import pg from 'pg';
import { randomUUID,randomBytes } from 'node:crypto';
import { mkdir,writeFile } from 'node:fs/promises';
import { passwordHash,newTotpSecret } from '../dist/server/apps/api/src/security.js';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required.');
const target=new URL(process.env.DATABASE_URL);
if(!['127.0.0.1','localhost'].includes(target.hostname)||target.pathname!=='/new_game_dev')throw new Error('This bootstrap tool only creates a local development administrator.');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
try{
 await db.query('BEGIN');await db.query('SELECT pg_advisory_xact_lock(882310)');
 if((await db.query("SELECT id FROM accounts WHERE role='MAIN_ADMIN'")).rowCount)throw new Error('Main Admin already exists. Bootstrap will not overwrite it.');
 const id=randomUUID(),branch=randomUUID(),password=randomBytes(18).toString('base64url'),totpSecret=newTotpSecret();
 await db.query('INSERT INTO branches(id,name) VALUES($1,$2)',[branch,'Private arcade']);await db.query('INSERT INTO branch_ancestors VALUES($1,$1,0)',[branch]);
 await db.query("INSERT INTO accounts(id,branch_id,role,display_name,active,username,password_hash,totp_secret) VALUES($1,$2,'MAIN_ADMIN','Main Admin',true,'main.admin',$3,$4)",[id,branch,await passwordHash(password),totpSecret]);
 await db.query('INSERT INTO wallets(id,account_id) VALUES($1,$2)',[randomUUID(),id]);
 await mkdir('.local',{recursive:true});await writeFile('.local/admin-credentials.json',JSON.stringify({username:'main.admin',password,totpSecret,authenticatorUri:`otpauth://totp/NewGame:main.admin?secret=${totpSecret}&issuer=NewGame`,note:'Local development only. Import the secret into your authenticator. This file is ignored by Git.'},null,2),{flag:'wx',mode:0o600});
 await db.query('COMMIT');console.log('Created Main Admin with zero credits. Credentials saved privately in .local/admin-credentials.json; no password was printed.');
}catch(error){await db.query('ROLLBACK');throw error;}finally{await db.end();}
