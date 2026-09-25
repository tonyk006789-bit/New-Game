import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {api,session,recoverRound,refreshAccount,type Account} from '../../apps/player/src/api';
import {stage,restoreFishPending} from '../../apps/player/src/staging-state';
const baseWallet={settled:'1000',reserved:'0',available:'1000',version:'1'};
let requests:{body:Record<string,unknown>;resolve:(response:Response)=>void;reject:(error:Error)=>void}[];
const result=(version:string,available:string)=>({game:'reef-party',stake:'25',award:'0',net:'-25',after:{...baseWallet,version,available,settled:available}});
const respond=(index:number,data:unknown,status=201)=>requests[index].resolve(new Response(JSON.stringify(data),{status}));
beforeEach(()=>{
 const storage=new Map<string,string>();requests=[];
 vi.stubGlobal('localStorage',{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)});
 vi.stubGlobal('navigator',{onLine:true});vi.stubGlobal('document',{hidden:false});
 vi.stubGlobal('fetch',vi.fn((_url:string,init:RequestInit)=>new Promise<Response>((resolve,reject)=>requests.push({body:JSON.parse(init.body as string||'{}'),resolve,reject}))));
 session.current={id:'player-a',username:'a',displayName:'A',role:'PLAYER',csrf:'test',wallet:{...baseWallet}};
 Object.assign(stage,{enabled:true,busy:false,pending:null,needsRecovery:false,fishPending:[],last:null,stake:'25'});
});
afterEach(()=>{session.current=null;vi.unstubAllGlobals();});
it('submits a rapid burst without waiting for any earlier shot and captures each selected stake',async()=>{
 const plays=Array.from({length:8},(_,i)=>api('practice/reef/shots',{requestKey:`shot-${i}`,stake:i%2?'50':'25'}));
 expect(requests).toHaveLength(8);expect(stage.fishPending).toHaveLength(8);expect(stage.busy).toBe(false);
 for(let i=7;i>=0;i--)respond(i,result(String(i+2),String(975-i*25)));
 await Promise.all(plays);
 expect(session.current!.wallet.version).toBe('9');expect(stage.fishPending).toHaveLength(0);
 expect(requests.map(r=>r.body.stake)).toEqual(['25','50','25','50','25','50','25','50']);
});
it('recovers every interrupted shot by its original key without starting another stake',async()=>{
 const plays=[0,1].map(i=>api('practice/reef/shots',{requestKey:`lost-${i}`}));
 requests.forEach(r=>r.reject(new Error('Network lost')));await Promise.allSettled(plays);
 expect(stage.fishPending.every(p=>p.recover)).toBe(true);
 restoreFishPending('player-a');expect(stage.fishPending).toHaveLength(2);
 const recovery=recoverRound();expect(requests[2].body.requestKey).toBe('lost-0');
 respond(2,{status:'SETTLED',result:result('2','975')});
 await vi.waitFor(()=>expect(requests).toHaveLength(4));
 expect(requests[3].body.requestKey).toBe('lost-1');respond(3,{status:'NOT_PLAYED',result:null});await recovery;
 expect(stage.fishPending).toHaveLength(0);expect(session.current!.wallet.available).toBe('975');
});
it('rejects new offline/backgrounded shots and removes a rejected target without blocking other shots',async()=>{
 const first=api('practice/reef/shots',{requestKey:'reject-target'});respond(0,{code:'AIM_MISSED'},409);await expect(first).rejects.toThrow('AIM_MISSED');expect(stage.fishPending).toHaveLength(0);
 vi.stubGlobal('document',{hidden:true});await expect(api('practice/reef/shots',{})).rejects.toThrow('Resume online');
 vi.stubGlobal('document',{hidden:false});vi.stubGlobal('navigator',{onLine:false});await expect(api('practice/reef/shots',{})).rejects.toThrow('Resume online');expect(requests).toHaveLength(1);
});
it('keeps an older account poll from undoing a newer committed shot wallet',async()=>{
 const account={...session.current} as Account,poll=refreshAccount(),shot=api('practice/reef/shots',{requestKey:'poll-race'});
 respond(1,result('2','975'));await shot;respond(0,account);await poll;expect(session.current!.wallet.version).toBe('2');
});
