import {it,expect} from 'vitest';
// @ts-expect-error Node-only explicit setup helper has no declaration file.
import {hierarchyProvisioner} from '../../scripts/hierarchy-provisioner.mjs';
it('resumes explicit funding after a lost response without issuing twice or skipping a parent',async()=>{
 const path=['root','sub','agent','player'].map((username,id)=>({id:String(id),username,password:'fixture'}));
 let actor=0,failOnce=true;const balances=[0n,0n,0n,0n],versions=[0,0,0,0],receipts=new Map<string,{id:string}>(),actors:number[]=[],saved:string[]=[];
 const plan:Record<string,unknown>={};
 const provision=hierarchyProvisioner(async(route:string,body:Record<string,string>)=>{
  if(route==='auth/logout')return {};
  if(route==='auth/login'){actor=path.findIndex(a=>a.username===body.username);return {};}
  if(route==='me')return {id:String(actor),wallet:{version:String(versions[actor])}};
  if(route==='admin/accounts')return [{id:String(actor+1),wallet:{version:String(versions[actor+1])}}];
  expect(saved.some(v=>v.includes(body.requestKey))).toBe(true);
  if(receipts.has(body.requestKey))return receipts.get(body.requestKey);
  const target=Number(body.targetId);expect(target).toBe(actor+1);expect(body.expectedVersion).toBe(String(versions[route==='admin/credit-adjustments'?target:actor]));
  if(route==='credit-transfers'){expect(body.targetVersion).toBe(String(versions[target]));balances[actor]-=BigInt(body.amount);versions[actor]++;}else expect(actor).toBe(0);
  balances[target]+=BigInt(body.amount);versions[target]++;actors.push(actor);const receipt={id:body.requestKey};receipts.set(body.requestKey,receipt);
  if(actor===1&&failOnce){failOnce=false;throw Error('response lost after commit');}return receipt;
 },async()=>{saved.push(JSON.stringify(plan));});
 await expect(provision.fund(path,'100000',plan,'Explicit test allocation')).rejects.toThrow('response lost');
 await provision.fund(path,'100000',plan,'Explicit test allocation');await provision.fund(path,'100000',plan,'Explicit test allocation');
 expect(actors).toEqual([0,1,2]);expect(balances).toEqual([0n,0n,0n,100000n]);expect(receipts.size).toBe(3);
});
