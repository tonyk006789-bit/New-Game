import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {totp} from '../dist/server/apps/api/src/security.js';
const credentials=JSON.parse(await readFile('.local/staging/admin-credentials.json','utf8'));let cookie='',csrf='';
async function request(path,body){const res=await fetch(`http://127.0.0.1:3001/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:5184','Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});const result=await res.json();if(!res.ok)throw new Error(result.message||result.code);if(res.headers.get('set-cookie'))cookie=res.headers.get('set-cookie').split(';')[0];return result;}
if(!(await request('environment')).staging)throw new Error('The API is not isolated staging.');
csrf=(await request('auth/login',{username:credentials.username,password:credentials.password,code:totp(credentials.totpSecret)})).csrf;
try{
 const admin=await request('me');let saved;
 try{saved=JSON.parse(await readFile('.local/staging/player-credentials.json','utf8'));}catch{saved={note:'Explicitly funded once with 1000 local test credits. No automatic refill.',accounts:[]};}
 async function persist(){await writeFile('.local/staging/player-credentials.json',JSON.stringify(saved,null,2),{mode:0o600});}
 async function create(parentId,username,displayName){
  let entry=saved.accounts.find(a=>a.username===username);
  if(!entry){entry={username,displayName,password:randomBytes(18).toString('base64url')};saved.accounts.push(entry);await persist();}
  const existing=(await request('admin/accounts')).find(a=>a.username===username);
  const account=existing||await request('admin/accounts',{parentId,username,displayName,password:entry.password});
  entry.id=account.id;entry.role=account.role;await persist();return entry.id;
 }
 const distributor=await create(admin.id,'stage.circle','Staging Circle'),agent=await create(distributor,'stage.agent','Staging Agent'),player=await create(agent,'stage.player','Test Player');
 // Freeze the complete manual adjustment before submitting. Re-running replays the receipt, never refills.
 if(!saved.funding){const wallet=(await request('admin/accounts')).find(a=>a.id===player).wallet;saved.funding={targetId:player,direction:'ADD',amount:'100000',reason:'Owner-authorized one-time local staging test funding: 1000 play credits',requestKey:'owner-staging-funding-1000-v1',expectedVersion:wallet.version};await persist();}
 const receipt=await request('admin/credit-adjustments',saved.funding);saved.fundingReceipt=receipt.id;await persist();
 console.log('One-time 1000-credit staging funding verified through authenticated Main Admin adjustment. Credentials: .local/staging/player-credentials.json');
}finally{await request('auth/logout',{});}
