import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {computed,watchEffect} from 'vue';
import {api,clearPlayerSession,refreshAccount,session,type Account} from '../../apps/player/src/api';
import {stage} from '../../apps/player/src/staging-state';
import {creditPresentation,revealCredits} from '../../apps/player/src/credit-presentation';
import {isNewRelease} from '../../packages/ui/src/client-release';

const wallet=(available:string,version:string)=>({available,settled:available,reserved:'0',version});
const account=(available='1000',version='1'):Account=>({id:'tester',username:'tester1',displayName:'Tester',role:'PLAYER',csrf:'test',wallet:wallet(available,version)});
const reply=(value:unknown)=>({ok:true,status:200,json:async()=>value});
beforeEach(()=>{
 vi.stubGlobal('navigator',{onLine:true});vi.stubGlobal('document',{hidden:false});
 vi.stubGlobal('localStorage',{setItem:vi.fn(),removeItem:vi.fn(),getItem:()=>null});
 clearPlayerSession();session.current=account();
 Object.assign(stage,{enabled:true,roundPolicy:{revision:'1',payingPercent:20},stake:'25',pending:null,fishPending:[],busy:false,needsRecovery:false,last:null});revealCredits();
});
afterEach(()=>{clearPlayerSession();revealCredits();stage.enabled=false;stage.pending=null;vi.unstubAllGlobals();});
describe('one reactive wallet without restarting a game',()=>{
 it.each(['neon-sevens','ember-cascade','orchard-numbers'])('%s immediately deducts submission and renders the committed balance after reveal',async game=>{
  const header=computed(()=>creditPresentation.held??session.current!.wallet.available);
  const affordability=computed(()=>BigInt(session.current!.wallet.available)>=1000n);
  const renders:string[]=[];const stop=watchEffect(()=>{renders.push(header.value);},{flush:'sync'});
  let complete!:(value:unknown)=>void;const fetcher=vi.fn(()=>new Promise(resolve=>complete=resolve));vi.stubGlobal('fetch',fetcher);
  expect(affordability.value).toBe(true);
  const pending=api(`practice/${game}/rounds`,{requestKey:'round-1',picks:[1,2,3,4]});
  expect(header.value).toBe('975');expect(session.current!.wallet.available).toBe('1000');
  complete(reply({game,stake:'25',award:'0',net:'-25',after:wallet('975','2')}));await pending;
  revealCredits(game);expect(header.value).toBe('975');expect(affordability.value).toBe(false);
  expect(fetcher).toHaveBeenCalledWith(`/v1/staging/${game}/rounds`,expect.objectContaining({cache:'no-store'}));
  // An external credit transfer/poll also reaches the already-mounted meters.
  vi.stubGlobal('fetch',vi.fn(async()=>reply(account('950','3'))));await refreshAccount();
  expect(header.value).toBe('950');expect(renders.at(-1)).toBe('950');stop();
 });
 it('updates blackjack affordability when the wallet or its balance changes',()=>{
  const available=computed(()=>session.current!.wallet.available);
  expect(available.value).toBe('1000');
  session.current!.wallet=wallet('950','2');expect(available.value).toBe('950');
  session.current!.wallet.available='900';expect(available.value).toBe('900');
 });
 it('ignores a slow poll older than a committed round',async()=>{
  let complete!:(value:unknown)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>complete=resolve)));
  const refresh=refreshAccount();session.current!.wallet=wallet('975','4');
  complete(reply(account('1000','2')));await refresh;expect(session.current!.wallet).toEqual(wallet('975','4'));
 });
 it('does not restore a signed-out account from a late poll',async()=>{
  let complete!:(value:unknown)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>complete=resolve)));
  const refresh=refreshAccount();clearPlayerSession();complete(reply(account()));
  await expect(refresh).rejects.toThrow('Session changed');expect(session.current).toBeNull();
 });
 it('does not replace a newly signed-in account with the previous account poll',async()=>{
  let complete!:(value:unknown)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>complete=resolve)));
  const refresh=refreshAccount();clearPlayerSession();session.current={...account('500','1'),id:'another-player'};complete(reply(account()));
  await expect(refresh).rejects.toThrow('Session changed');expect(session.current.id).toBe('another-player');expect(session.current.wallet.available).toBe('500');
 });
 it('requires sign-in if another tab changes the cookie account instead of mixing wallets',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>reply({...account('500','1'),id:'other-account'})));
  await expect(refreshAccount()).rejects.toMatchObject({status:401,code:'SESSION_CHANGED'});
  expect(session.current!.id).toBe('tester');expect(session.current!.wallet.available).toBe('1000');
 });
});
describe('stale open deployment detection',()=>{
 it('requires a real changed entry bundle, not an error page or missing entry',()=>{
  const html='<script type="module" crossorigin src="/assets/index-new.js"></script>';
  expect(isNewRelease('/assets/index-old.js',html)).toBe(true);
  expect(isNewRelease('/assets/index-new.js',html)).toBe(false);
  expect(isNewRelease(null,html)).toBe(false);
  expect(isNewRelease('/assets/index-old.js','Service unavailable')).toBe(false);
 });
});
