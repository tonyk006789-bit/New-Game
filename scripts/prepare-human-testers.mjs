// Explicit owner-authorized provisioning. Never called by application startup.
import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {totp} from '../dist/server/apps/api/src/security.js';
const root=JSON.parse(await readFile('.local/staging/admin-credentials.json','utf8'));
let cookie='',csrf='';
async function request(path,body){const res=await fetch(`http://127.0.0.1:3001/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:5184','Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await res.json();if(!res.ok)throw new Error(data.message||data.code);if(res.headers.get('set-cookie'))cookie=res.headers.get('set-cookie').split(';')[0];return data;}
if(!(await request('environment')).staging)throw new Error('Isolated staging required.');
csrf=(await request('auth/login',{username:root.username,password:root.password,code:totp(root.totpSecret)})).csrf;
try{
 let saved;try{saved=JSON.parse(await readFile('.local/staging/human-testers.json','utf8'));}catch(error){if(error.code!=='ENOENT')throw error;saved={note:'Five human testers authorized by owner. Each gets a single manual 1000-credit ADD. Reruns replay receipts, never refill.',accounts:[]};}
 const persist=()=>writeFile('.local/staging/human-testers.json',JSON.stringify(saved,null,2)+'\n',{mode:0o600});
 const parent=(await request('admin/accounts')).find(a=>a.username==='stage.agent'&&a.role==='AGENT');if(!parent)throw new Error('Existing staging agent missing.');
 for(const [index,name] of ['one','two','three','four','five'].entries()){
  const username=`tester.${name}`;let entry=saved.accounts.find(a=>a.username===username);
  if(!entry){entry={username,password:`Reef-${randomBytes(9).toString('base64url')}!`,displayName:`Player ${index+1}`};saved.accounts.push(entry);await persist();}
  const existing=(await request('admin/accounts')).find(a=>a.username===username);
  if(existing&&(existing.role!=='PLAYER'||existing.parent_id&&existing.parent_id!==parent.id))throw new Error('Tester name belongs to an unexpected account.');
  const account=existing||await request('admin/accounts',{parentId:parent.id,username,password:entry.password,displayName:entry.displayName});entry.id=account.id;await persist();
  if(!entry.funding){const wallet=(await request('admin/accounts')).find(a=>a.id===entry.id).wallet;entry.funding={targetId:entry.id,direction:'ADD',amount:'100000',expectedVersion:wallet.version,requestKey:`human-testers-1000-v1-${name}`,reason:'Owner-requested one-time 1000 play credits for five-person human testing'};await persist();}
  entry.fundingReceipt=(await request('admin/credit-adjustments',entry.funding)).id;await persist();
 }
 await writeFile('.local/staging/share-audience.json',JSON.stringify({accounts:saved.accounts.map(({id,username})=>({id,username}))},null,2)+'\n',{mode:0o600});
 const accounts=await request('admin/accounts');
 console.log(JSON.stringify(saved.accounts.map(entry=>({username:entry.username,available:accounts.find(a=>a.id===entry.id).wallet.available,fundingReceipt:entry.fundingReceipt})),null,2));
}finally{await request('auth/logout',{});}
