import { Capacitor } from '@capacitor/core';
import {reefTierProfile} from '@new-game/game-math';
import {stage,savePending,clearPending,restorePending} from './staging-state';
import {holdCredits,revealCredits} from './credit-presentation';
export interface Account {id:string;username:string;displayName:string;role:string;csrf:string;wallet:{settled:string;reserved:string;available:string;version:string}}
export const session: {current:Account|null} = {current:null};
export const expiredSession=(error:unknown):boolean=>error instanceof Error && 'status' in error && error.status===401;
async function request<T>(path:string,body?:unknown):Promise<T>{
 if(Capacitor.isNativePlatform())throw new Error('Account play is not available in this device build yet. You can explore the guest preview.');
 const response=await fetch(`/v1/${path}`,{method:body===undefined?'GET':'POST',credentials:'include',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',...(session.current?{'X-CSRF-Token':session.current.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const result=await response.json();if(!response.ok)throw Object.assign(new Error(result.message||result.code||'The service is unavailable.'),{status:response.status,code:result.code});return result as T;
}
export async function api<T>(path:string,body?:unknown):Promise<T>{
 if(stage.enabled&&session.current?.role==='PLAYER'){
  if(path==='practice/history')path='staging/history';
  if(/^practice\/[^/]+\/rounds$/.test(path)||path==='practice/reef/shots'){
   if(!navigator.onLine||document.hidden)throw new Error('Resume online before staking credits.');
   if(stage.busy)throw new Error('A round is being settled.');
   const target=path==='practice/reef/shots'?'staging/reef-party/rounds':path.replace('practice/','staging/');
   if(stage.pending)throw new Error('Your connection is being restored. Please wait.');
   if(!stage.pending)savePending({accountId:session.current.id,path:target,body:{...(body as Record<string,unknown>),stake:stage.stake,profileId:target==='staging/reef-party/rounds'?reefTierProfile.id:stage.profile.id}});
   return settle<T>();
  }
 }
 return request<T>(path,body);
}
async function settle<T>():Promise<T>{
 if(!stage.pending||!session.current||stage.pending.accountId!==session.current.id)throw new Error('Sign in to the account with the pending round.');
 const pending=stage.pending;stage.busy=true;
 holdCredits(pending.path.split('/')[1],session.current.id,session.current.wallet.available);
 try{
  const result=await request<T&{game:string;stake:string;award:string;net:string}>(pending.path,pending.body);
  if(stage.pending===pending&&session.current?.id===pending.accountId){clearPending();stage.last=result;stage.revision++;}return result;
 }catch(error){revealCredits();if(stage.pending===pending){if(error instanceof Error&&'status' in error&&[400,403,404,409,429].includes(Number(error.status)))clearPending();else stage.needsRecovery=true;}throw error;}finally{stage.busy=false;}
}
export async function recoverRound(){
 const pending=stage.pending;
 if(!pending||!stage.needsRecovery||!navigator.onLine||document.hidden||stage.busy||session.current?.id!==pending.accountId)return;
 stage.busy=true;
 try{
  const receipt=await request<{status:string;result:typeof stage.last}>('staging/recover',{...pending.body,game:pending.path.split('/')[1]});
  if(stage.pending!==pending||session.current?.id!==pending.accountId)return;
  clearPending();if(receipt.result)stage.last=receipt.result;stage.revision++;stage.recovered++;
 }finally{stage.busy=false;}
}
export async function loadEnvironment(){const info=await request<{staging:boolean;sampleLogin?:{username:string;password:string};profile?:typeof stage.profile}>('environment');stage.enabled=info.staging&&info.profile?.id===stage.profile.id;stage.sampleLogin=stage.enabled?info.sampleLogin||null:null;}
export async function refreshAccount(){session.current=await api<Account>('me');return session.current;}
export async function signIn(username:string,password:string,code?:string){await api('auth/login',{username,password,...(code?{code}:{})});const account=await refreshAccount();restorePending(account.id);return account;}
