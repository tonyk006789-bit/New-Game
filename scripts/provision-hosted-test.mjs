// Run manually for the owner-authorized private test. Never a build/start hook.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
import pg from 'pg';
import {validateHostedTest} from '../dist/server/apps/api/src/environment.js';
import {passwordHash,passwordMatches,newTotpSecret,totp} from '../dist/server/apps/api/src/security.js';
validateHostedTest();
const siteId=process.env.HOSTED_TEST_SITE_ID;
if(process.env.CONFIRM_HOSTED_SETUP!==siteId)throw new Error('Explicit setup confirmation must name the dedicated test site ID.');
const origin=process.env.ALLOWED_ORIGINS;
if(!origin||new URL(origin).protocol!=='https:')throw new Error('Use the exact HTTPS test site origin.');
const directory='.local/hosted';await mkdir(directory,{recursive:true});
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
const {createAccount,accounts}=await import('../dist/server/apps/api/src/accounts.js');
const {adjust}=await import('../dist/server/apps/api/src/ledger.js');
const {transaction,pool}=await import('../dist/server/apps/api/src/store.js');
const request={headers:{origin},ip:'manual-hosted-provisioner'};
try{
 const session=await login(request,{setHeader(name,value){if(name==='Set-Cookie')request.headers.cookie=value.split(';')[0];}},{username:saved.root.username,password:saved.root.password,code:totp(saved.root.totpSecret)});request.headers['x-csrf-token']=session.csrf;
 async function create(parentId,entry,role){
  const existing=(await accounts(request)).find(account=>account.username===entry.username);
  if(existing){
   const scope=await transaction(async db=>(await db.query('SELECT a.branch_id,a.password_hash,b.parent_id,p.branch_id AS parent_branch FROM accounts a JOIN branches b ON b.id=a.branch_id JOIN accounts p ON p.id=$2 WHERE a.id=$1',[existing.id,parentId])).rows[0]);
   if(existing.role!==role||(entry.id&&entry.id!==existing.id)||!scope||(role==='PLAYER'?scope.branch_id!==scope.parent_branch:scope.parent_id!==scope.parent_branch)||!await passwordMatches(entry.password,scope.password_hash))throw new Error('Account name belongs to an unexpected identity, role or branch.');
  }
  const account=existing||await createAccount(request,{parentId,username:entry.username,displayName:entry.displayName,password:entry.password});entry.id=account.id;await persist();return account.id;
 }
 if(!saved.distributor){saved.distributor={username:'hosted.circle',displayName:'Test Circle',password:randomBytes(24).toString('base64url')};await persist();}
 if(!saved.agent){saved.agent={username:'hosted.agent',displayName:'Test Agent',password:randomBytes(24).toString('base64url')};await persist();}
 const distributor=await create(saved.root.id,saved.distributor,'SUB_DISTRIBUTOR'),agent=await create(distributor,saved.agent,'AGENT');
 for(const entry of saved.accounts){
  const id=await create(agent,entry,'PLAYER');
  if(!entry.funding){const account=(await accounts(request)).find(account=>account.id===id);if(account.wallet.available!=='0'||account.wallet.version!=='0')throw new Error('An unfunded test account must still have its original zero wallet.');entry.funding={targetId:id,direction:'ADD',amount:'100000',expectedVersion:account.wallet.version,requestKey:`hosted-five-testers-v1-${entry.username}`,reason:'Owner-authorized one-time 1000 play credits for the five-person hosted test'};await persist();}
  entry.receipt=(await adjust(request,entry.funding)).id;await persist();
 }
 const current=await accounts(request);
 console.log(JSON.stringify(saved.accounts.map(entry=>({username:entry.username,available:current.find(account=>account.id===entry.id).wallet.available})),null,2));
 await writeFile(`${directory}/TESTER_LOGINS.md`,`# Private tester logins\n\nGame: ${origin}\n\nEach account received one manual 1,000-credit adjustment. Keep each password private.\n\n| User ID | Password |\n|---|---|\n${saved.accounts.map(account=>`| ${account.username} | ${account.password} |`).join('\n')}\n`,{mode:0o600});
}finally{
 if(request.headers.cookie)await transaction(async db=>{const actor=await actorFor(db,request,true);await db.query('UPDATE sessions SET revoked_at=now() WHERE token_hash=$1',[actor.token_hash]);});
 await pool.end();
}
