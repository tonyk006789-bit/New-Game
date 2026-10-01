import {hierarchyProvisioner} from './hierarchy-provisioner.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
const db=new URL(process.env.DATABASE_URL||'postgres://invalid/');
if(process.env.GAME_ENV!=='staging'||!['localhost','127.0.0.1'].includes(db.hostname)||db.pathname!=='/new_game_staging')throw new Error('This fixture is only for the local staging environment.');
const folder='.local/operator-demo';await mkdir(folder,{recursive:true});
const path=`${folder}/accounts.json`;let plan;
try{plan=JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;plan={accounts:['console.circle','console.agent','console.alex','console.jamie','console.morgan'].map((username,index)=>({username,displayName:['Console Circle','Demo Agent','Alex Morgan','Jamie Chen','Morgan Lee'][index],password:randomBytes(18).toString('base64url'),requestKey:randomUUID()}))};await writeFile(path,JSON.stringify(plan,null,2),{flag:'wx',mode:0o600});}
const admin=JSON.parse(await readFile('.local/staging/admin-credentials.json','utf8'));let cookie='',csrf='';
async function call(route,body){const r=await fetch(`http://127.0.0.1:3001/v1/${route}`,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:5184','Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});const result=await r.json();if(!r.ok)throw new Error(result.message||result.code);if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];if(result.csrf)csrf=result.csrf;return result;}
async function save(){await writeFile(path,JSON.stringify(plan,null,2),{mode:0o600});}
const provision=hierarchyProvisioner(call,save);
for(let i=0;i<plan.accounts.length;i++)await provision.create(i===0?admin:i===1?plan.accounts[0]:plan.accounts[1],plan.accounts[i]);
if(process.argv.includes('--fund-play-credits')&&!plan.fundingReceipt){
 if(plan.funding)throw Error('Legacy unfinished funding requires receipt review before retrying.');
 plan.hierarchyFunding??={};await save();
 plan.fundingReceipt=await provision.fund([admin,plan.accounts[0],plan.accounts[1]],'10000',plan.hierarchyFunding,'Explicit local operator acceptance fixture: 100 play credits');await save();
}
await call('auth/logout',{});
await writeFile(`${folder}/LOGINS.md`,['# Local operator console test accounts','','Console: http://127.0.0.1:5184','Player: http://127.0.0.1:5183','','Private, local-only credentials. Do not publish. New wallets begin at zero; optional funding uses authenticated Main Admin ADD.','',...plan.accounts.map(a=>`- ${a.displayName} (${a.role}): ID \`${a.username}\`, password \`${a.password}\``)].join('\n'),{mode:0o600});
console.log('Operator demo ready. Credentials saved privately in .local/operator-demo/LOGINS.md. Existing tester accounts are unchanged.');
