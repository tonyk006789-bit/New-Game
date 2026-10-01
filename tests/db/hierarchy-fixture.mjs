import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Isolated-test setup follows the same authenticated direct-child workflow as
// the console. Database reads inspect fixtures; all funds use ordinary APIs.
export function hierarchyFixture({db,call,signin,rootId,rootAuth}) {
 const sessions=new Map([[rootId,rootAuth]]);
 async function auth(id){if(!sessions.has(id)){const row=(await db.query('SELECT username FROM accounts WHERE id=$1',[id])).rows[0];sessions.set(id,await signin(row.username));}return sessions.get(id);}
 async function wallet(id){return (await db.query('SELECT settled_units settled,reserved_units reserved,version,(settled_units-reserved_units)::text available FROM wallets WHERE account_id=$1',[id])).rows[0];}
 async function chain(id){const path=[];let row=(await db.query('SELECT a.*,b.parent_id FROM accounts a JOIN branches b ON b.id=a.branch_id WHERE a.id=$1',[id])).rows[0];
  while(row.id!==rootId){path.unshift(row.id);row=(await db.query("SELECT a.*,b.parent_id FROM accounts a JOIN branches b ON b.id=a.branch_id WHERE a.branch_id=$1 AND a.role=$2",[row.role==='PLAYER'?row.branch_id:row.parent_id,{PLAYER:'AGENT',AGENT:'SUB_DISTRIBUTOR',SUB_DISTRIBUTOR:'MAIN_ADMIN'}[row.role]])).rows[0];assert.ok(row,'Fixture parent exists');}return path;
 }
 async function fund(id,amount){const path=await chain(id),first=path.shift()||rootId;
  let result=await call('admin/credit-adjustments',{targetId:first,direction:'ADD',amount,reason:'Explicit isolated fixture funding through hierarchy',requestKey:randomUUID(),expectedVersion:(await wallet(first)).version},rootAuth);
  assert.equal(result.status,201,JSON.stringify(result.data));let parent=first;
  for(const child of path){result=await call('credit-transfers',{targetId:child,amount,reason:'Explicit isolated fixture branch transfer',requestKey:randomUUID(),expectedVersion:(await wallet(parent)).version,targetVersion:(await wallet(child)).version},await auth(parent));assert.equal(result.status,201,JSON.stringify(result.data));parent=child;}return result;
 }
 return {auth,wallet,fund};
}
