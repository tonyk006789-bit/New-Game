import pg from 'pg';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {passwordHash,newTotpSecret} from '../dist/server/apps/api/src/security.js';
const url=new URL(process.env.DATABASE_URL||'postgres://invalid/');
if(!['127.0.0.1','localhost'].includes(url.hostname)||url.pathname!=='/new_game_dev')throw new Error('Use the existing local development connection for setup.');
await mkdir('.local/staging',{recursive:true});
let env;
try{env=await readFile('.local/staging/runtime.env','utf8');}catch{
 const password=randomBytes(24).toString('hex'),stageUrl=new URL(url);stageUrl.username='new_game_stage';stageUrl.password=password;stageUrl.pathname='/new_game_staging';
 env=`DATABASE_URL=${stageUrl.href}\nGAME_ENV=staging\nPORT=3001\nALLOWED_ORIGINS=http://127.0.0.1:5183,http://127.0.0.1:5184\n`;
 await writeFile('.local/staging/runtime.env',env,{flag:'wx',mode:0o600});
}
const stageUrl=new URL(env.match(/^DATABASE_URL=(.+)$/m)[1]);
if(stageUrl.username!=='new_game_stage'||stageUrl.pathname!=='/new_game_staging'||stageUrl.hostname!==url.hostname)throw new Error('Unexpected staging configuration.');
const admin=new pg.Client({connectionString:url.href});await admin.connect();
try{
 if(!(await admin.query("SELECT 1 FROM pg_roles WHERE rolname='new_game_stage'")).rowCount){
  if(!/^[a-f0-9]{48}$/.test(stageUrl.password))throw new Error('Unexpected credential format.');
  await admin.query(`CREATE ROLE new_game_stage LOGIN PASSWORD '${stageUrl.password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
 }
 if(!(await admin.query("SELECT 1 FROM pg_database WHERE datname='new_game_staging'")).rowCount)await admin.query('CREATE DATABASE new_game_staging OWNER new_game_stage');
 await admin.query('REVOKE ALL ON DATABASE new_game_staging FROM PUBLIC');
 await admin.query('GRANT CONNECT ON DATABASE new_game_staging TO new_game_stage');
}finally{await admin.end();}
const migrate=spawnSync(process.execPath,['--env-file=.local/staging/runtime.env','scripts/database.mjs','migrate'],{stdio:'inherit',env:{...process.env,DATABASE_URL:stageUrl.href}});if(migrate.status!==0)throw new Error('Staging migration failed.');
const db=new pg.Client({connectionString:stageUrl.href});await db.connect();
try{
 await db.query('BEGIN');await db.query('SELECT pg_advisory_xact_lock(882310)');
 if((await db.query("SELECT 1 FROM accounts WHERE role='MAIN_ADMIN'")).rowCount){await access('.local/staging/admin-credentials.json');console.log('Existing staging administrator preserved.');}
 else{
  const id=randomUUID(),branch=randomUUID(),password=randomBytes(18).toString('base64url'),totpSecret=newTotpSecret();
  await db.query('INSERT INTO branches(id,name) VALUES($1,$2)',[branch,'Local staging arcade']);await db.query('INSERT INTO branch_ancestors VALUES($1,$1,0)',[branch]);
  await db.query("INSERT INTO accounts(id,branch_id,role,display_name,active,username,password_hash,totp_secret) VALUES($1,$2,'MAIN_ADMIN','Staging Admin',true,'stage.admin',$3,$4)",[id,branch,await passwordHash(password),totpSecret]);
  await db.query('INSERT INTO wallets(id,account_id) VALUES($1,$2)',[randomUUID(),id]);
  await writeFile('.local/staging/admin-credentials.json',JSON.stringify({username:'stage.admin',password,totpSecret,note:'Local staging only. Keep private.'},null,2),{flag:'wx',mode:0o600});
 }
 await db.query('COMMIT');
}catch(error){await db.query('ROLLBACK');throw error;}finally{await db.end();}
console.log('Isolated staging database ready. No player credits issued by setup.');
