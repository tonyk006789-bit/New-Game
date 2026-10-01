import {hierarchyProvisioner} from './hierarchy-provisioner.mjs';
// Run manually for the owner-authorized private test. Never a build/start hook.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
import pg from 'pg';
import {validateHostedTest} from '../dist/server/apps/api/src/environment.js';
import {passwordHash,newTotpSecret} from '../dist/server/apps/api/src/security.js';
validateHostedTest();
const siteId=process.env.HOSTED_TEST_SITE_ID;
if(process.env.CONFIRM_HOSTED_SETUP!==siteId)throw new Error('Explicit setup confirmation must name the dedicated test site ID.');
const origin=process.env.ALLOWED_ORIGINS;
if(!origin||new URL(origin).protocol!=='https:')throw new Error('Use the exact HTTPS test site origin.');
const directory=process.env.HOSTED_TEST_PLATFORM==='vercel'?'.local/vercel':'.local/hosted';await mkdir(directory,{recursive:true});
const credentialsFile=`${directory}/accounts.json`;
let saved;
try{saved=JSON.parse(await readFile(credentialsFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;const previous=JSON.parse(await readFile('.local/staging/human-testers.json','utf8'));saved={siteId,origin,root:{id:randomUUID(),branch:randomUUID(),username:'hosted.admin',password:randomBytes(24).toString('base64url'),totpSecret:newTotpSecret()},accounts:previous.accounts.map(({username,password,displayName})=>({username,password,displayName}))};}
if(saved.siteId!==siteId||saved.origin!==origin)throw new Error('Saved credentials belong to another test site.');
const expected=['tester.one','tester.two','tester.three','tester.four','tester.five'];
if(saved.accounts.length!==5||expected.some(name=>!saved.accounts.some(account=>account.username===name)))throw new Error('Exactly the five authorized testers are required.');
const persist=()=>writeFile(credentialsFile,JSON.stringify(saved,null,2)+'\n',{mode:0o600});await persist();
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
try{
 await db.query('BEGIN');await db.query('SELECT pg_advisory_xact_lock(882311)');
 const marker=(await db.query('SELECT site_id FROM hosted_test_environment WHERE singleton=true')).rows[0];
 if(marker&&marker.site_id!==siteId)throw new Error('Database belongs to another test site.');
 if(!marker){if((await db.query('SELECT 1 FROM accounts LIMIT 1')).rowCount)throw new Error('Refusing to repurpose a populated database.');await db.query('INSERT INTO hosted_test_environment(site_id) VALUES($1)',[siteId]);}
 const root=(await db.query("SELECT id FROM accounts WHERE role='MAIN_ADMIN'")).rows;
 if(root.length&&(root.length!==1||root[0].id!==saved.root.id))throw new Error('Unexpected existing Main Admin.');
 if(!root.length){
  await db.query('INSERT INTO branches(id,name) VALUES($1,$2)',[saved.root.branch,'Private hosted test']);await db.query('INSERT INTO branch_ancestors VALUES($1,$1,0)',[saved.root.branch]);
  await db.query("INSERT INTO accounts(id,branch_id,role,display_name,active,username,password_hash,totp_secret) VALUES($1,$2,'MAIN_ADMIN','Hosted Test Admin',true,$3,$4,$5)",[saved.root.id,saved.root.branch,saved.root.username,await passwordHash(saved.root.password),saved.root.totpSecret]);
  await db.query('INSERT INTO wallets(id,account_id) VALUES($1,$2)',[randomUUID(),saved.root.id]);
 }
 await db.query('COMMIT');
}catch(error){await db.query('ROLLBACK');throw error;}finally{await db.end();}

const {login,actorFor}=await import('../dist/server/apps/api/src/auth.js');
const {createAccount,accounts,me}=await import('../dist/server/apps/api/src/accounts.js');
const {adjust,transfer}=await import('../dist/server/apps/api/src/ledger.js');
const {transaction,pool}=await import('../dist/server/apps/api/src/store.js');
const request={headers:{origin},ip:'manual-hosted-provisioner'};
async function requestApi(path,body){
 if(path==='auth/login'){const session=await login(request,{setHeader(name,value){if(name==='Set-Cookie')request.headers.cookie=(Array.isArray(value)?value:[value]).map(cookie=>cookie.split(';')[0]).join('; ');}},body);request.headers['x-csrf-token']=session.csrf;return session;}
 if(path==='auth/logout'){if(request.headers.cookie)await transaction(async db=>{const actor=await actorFor(db,request,true);await db.query('UPDATE sessions SET revoked_at=now() WHERE token_hash=$1',[actor.token_hash]);});request.headers.cookie='';return {};}
 if(path==='me')return me(request);
 if(path==='admin/accounts')return body?createAccount(request,body):accounts(request);
 if(path==='admin/credit-adjustments')return adjust(request,body);
 if(path==='credit-transfers')return transfer(request,body);
 throw Error('Unsupported provisioning action');
}
try{
 const provision=hierarchyProvisioner(requestApi,persist);
 if(!saved.distributor){saved.distributor={username:'hosted.circle',displayName:'Test Circle',password:randomBytes(24).toString('base64url')};await persist();}
 if(!saved.agent){saved.agent={username:'hosted.agent',displayName:'Test Agent',password:randomBytes(24).toString('base64url')};await persist();}
 await provision.create(saved.root,saved.distributor);await provision.create(saved.distributor,saved.agent);
 for(const entry of saved.accounts){
  await provision.create(saved.agent,entry);
  if(!entry.receipt){
   if(entry.funding)throw Error('Legacy unfinished funding requires receipt review before retrying.');
   const target=(await accounts(request)).find(a=>a.id===entry.id);if(!entry.hierarchyFunding&&(target.wallet.available!=='0'||target.wallet.version!=='0'))throw Error('Unfunded tester must have an original zero wallet');
   entry.hierarchyFunding??={};await persist();
   entry.receipt=await provision.fund([saved.root,saved.distributor,saved.agent,entry],'100000',entry.hierarchyFunding,'Owner-authorized one-time 1000 play credits for the five-person hosted test');await persist();
  }
 }
 const current=await accounts(request);
 console.log(JSON.stringify(saved.accounts.map(entry=>({username:entry.username,available:current.find(account=>account.id===entry.id).wallet.available})),null,2));
 await writeFile(`${directory}/TESTER_LOGINS.md`,`# Private tester logins\n\nGame: ${origin}\n\nEach account received one authorized 1,000-credit allocation. Keep each password private.\n\n| User ID | Password |\n|---|---|\n${saved.accounts.map(account=>`| ${account.username} | ${account.password} |`).join('\n')}\n`,{mode:0o600});

}finally{
 if(request.headers.cookie)await transaction(async db=>{const actor=await actorFor(db,request,true);await db.query('UPDATE sessions SET revoked_at=now() WHERE token_hash=$1',[actor.token_hash]);});
 await pool.end();
}
