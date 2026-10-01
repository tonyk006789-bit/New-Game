import {hierarchyProvisioner} from './hierarchy-provisioner.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {totp} from '../dist/server/apps/api/src/security.js';
const credentials=JSON.parse(await readFile('.local/staging/admin-credentials.json','utf8'));let cookie='',csrf='';
async function request(path,body){const res=await fetch(`http://127.0.0.1:3001/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:5184','Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});const result=await res.json();if(!res.ok)throw new Error(result.message||result.code);if(res.headers.get('set-cookie'))cookie=res.headers.get('set-cookie').split(';')[0];if(result.csrf)csrf=result.csrf;return result;}
if(!(await request('environment')).staging)throw new Error('The API is not isolated staging.');
csrf=(await request('auth/login',{username:credentials.username,password:credentials.password,code:totp(credentials.totpSecret)})).csrf;
try{
 let saved;
 try{saved=JSON.parse(await readFile('.local/staging/player-credentials.json','utf8'));}catch{saved={note:'Explicitly funded once with 1000 local test credits. No automatic refill.',accounts:[]};}
 async function persist(){await writeFile('.local/staging/player-credentials.json',JSON.stringify(saved,null,2),{mode:0o600});}
 const provision=hierarchyProvisioner(request,persist);
 async function create(parent,username,displayName){
  let entry=saved.accounts.find(a=>a.username===username);
  if(!entry){entry={username,displayName,password:randomBytes(18).toString('base64url')};saved.accounts.push(entry);await persist();}
  return provision.create(parent,entry);
 }
 const distributor=await create(credentials,'stage.circle','Staging Circle'),agent=await create(distributor,'stage.agent','Staging Agent'),player=await create(agent,'stage.player','Test Player');
 if(!saved.fundingReceipt){
  if(saved.funding)throw Error('Legacy unfinished funding requires receipt review before retrying.');
  saved.hierarchyFunding??={};await persist();
  saved.fundingReceipt=await provision.fund([credentials,distributor,agent,player],'100000',saved.hierarchyFunding,'Owner-authorized one-time local staging test funding: 1000 play credits');await persist();
 }
 console.log('One-time 1000-credit staging funding verified through authenticated direct-parent ledger events. Credentials: .local/staging/player-credentials.json');
}finally{await request('auth/logout',{});}
