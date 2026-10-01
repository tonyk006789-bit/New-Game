import {randomUUID} from 'node:crypto';

// Explicit setup scripts only: authenticate each parent, and persist every
// request before sending it. Never run from startup, builds or deployment.
export function hierarchyProvisioner(request,save){
 async function as(account){await request('auth/logout',{}).catch(()=>{});await request('auth/login',{username:account.username,password:account.password});const own=await request('me');if(account.id&&account.id!==own.id)throw Error('Provisioner identity mismatch');account.id=own.id;return own;}
 async function create(parent,entry){
  const own=await as(parent),role={MAIN_ADMIN:'SUB_DISTRIBUTOR',SUB_DISTRIBUTOR:'AGENT',AGENT:'PLAYER'}[own.role];
  const existing=(await request('admin/accounts')).find(a=>a.username===entry.username);
  if(existing&&(existing.role!==role||entry.id&&entry.id!==existing.id))throw Error('Unexpected existing account');
  entry.requestKey??=randomUUID();await save();
  const result=existing||await request('admin/accounts',{parentId:own.id,username:entry.username,displayName:entry.displayName,password:entry.password,requestKey:entry.requestKey});
  entry.id=result.id;entry.role=result.role;await save();return entry;
 }
 async function fund(path,amount,plan,reason){
  for(let i=1;i<path.length;i++){
   const own=await as(path[i-1]),target=(await request('admin/accounts')).find(a=>a.id===path[i].id);
   if(!target)throw Error('Funding target must be a direct child');
   if(!plan[i]){plan[i]={request:{targetId:target.id,amount,reason,requestKey:randomUUID(),expectedVersion:i===1?target.wallet.version:own.wallet.version,...(i===1?{direction:'ADD'}:{targetVersion:target.wallet.version})}};await save();}
   if(!plan[i].receipt){plan[i].receipt=(await request(i===1?'admin/credit-adjustments':'credit-transfers',plan[i].request)).id;await save();}
  }
  return plan[path.length-1].receipt;
 }
 return {as,create,fund};
}
