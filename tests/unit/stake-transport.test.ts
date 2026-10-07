import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {api,session,recoverRound} from '../../apps/player/src/api';
import {stage} from '../../apps/player/src/staging-state';
import {creditPresentation,revealCredits} from '../../apps/player/src/credit-presentation';
const reply=(value:unknown,status=200)=>({ok:status===200,status,json:async()=>value});
beforeEach(()=>{
 vi.stubGlobal('navigator',{onLine:true});vi.stubGlobal('document',{hidden:false});
 vi.stubGlobal('localStorage',{setItem:vi.fn(),removeItem:vi.fn(),getItem:()=>null});
 session.current={id:'tester',username:'tester',displayName:'Tester',role:'PLAYER',csrf:'test',wallet:{available:'1000',settled:'1000',reserved:'0',version:'1'}};
 Object.assign(stage,{enabled:true,stake:'25',pending:null,fishPending:[],busy:false,needsRecovery:false,last:null});revealCredits();
});
afterEach(()=>{vi.unstubAllGlobals();revealCredits();session.current=null;stage.enabled=false;stage.pending=null;stage.needsRecovery=false;});
describe('stake presentation at the transport boundary',()=>{
 it('deducts before the response, then keeps only the award hidden without changing the server wallet',async()=>{
  let complete!:(value:unknown)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>complete=resolve)));
  const pending=api('practice/neon-sevens/rounds',{requestKey:'local-test'});
  expect(creditPresentation.held).toBe('975');expect(session.current!.wallet.available).toBe('1000');
  complete(reply({game:'neon-sevens',stake:'25',award:'75',net:'50',after:{available:'1050',settled:'1050',reserved:'0',version:'3'}}));await pending;
  expect(creditPresentation.held).toBe('975');expect(session.current!.wallet.available).toBe('1050');expect(stage.pending).toBeNull();
  revealCredits('neon-sevens');expect(creditPresentation.held).toBeNull();expect(session.current!.wallet.available).toBe('1050');
 });
 it('restores the display on a definitive rejected stake',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>reply({code:'INSUFFICIENT_CREDITS'},409)));
  await expect(api('practice/neon-sevens/rounds',{requestKey:'reject-test'})).rejects.toThrow();
  expect(creditPresentation.held).toBeNull();expect(session.current!.wallet.available).toBe('1000');expect(stage.pending).toBeNull();
 });
 it('keeps the submitted deduction through a timeout and reconciles exactly once without resampling',async()=>{
  const fetcher=vi.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(reply({status:'settled',result:{game:'neon-sevens',stake:'25',award:'0',net:'-25',after:{available:'975',settled:'975',reserved:'0',version:'2'}}}));vi.stubGlobal('fetch',fetcher);
  await expect(api('practice/neon-sevens/rounds',{requestKey:'timeout-test'})).rejects.toThrow('timeout');
  expect(creditPresentation.held).toBe('975');expect(stage.needsRecovery).toBe(true);
  await recoverRound();expect(fetcher).toHaveBeenCalledTimes(2);expect(fetcher.mock.calls[1][0]).toBe('/v1/staging/recover');expect(creditPresentation.held).toBeNull();expect(session.current!.wallet.available).toBe('975');expect(stage.pending).toBeNull();
 });
});
