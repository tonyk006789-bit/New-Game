import {reactive} from 'vue';
import {stagingProfile} from '@new-game/game-math';
export type Pending={accountId:string;path:string;body:Record<string,unknown>};
export type FishPending=Pending&{recover:boolean};
export const stage=reactive({enabled:false,sampleLogin:null as null|{username:string;password:string},profile:stagingProfile,stake:'25',busy:false,needsRecovery:false,pending:null as Pending|null,fishPending:[] as FishPending[],last:null as null|{game:string;stake:string;award:string;net:string},revision:0,recovered:0});
export function restorePending(accountId:string){try{const pending=JSON.parse(localStorage.getItem(`ng-stage-pending:${accountId}`)||'null');stage.pending=pending?.accountId===accountId&&/^staging\/[a-z-]+\/rounds$/.test(pending.path)&&typeof pending.body?.requestKey==='string'?pending:null;}catch{stage.pending=null;}stage.needsRecovery=!!stage.pending;}
export function savePending(pending:Pending){localStorage.setItem(`ng-stage-pending:${pending.accountId}`,JSON.stringify(pending));stage.pending=pending;}
export function clearPending(){if(stage.pending)localStorage.removeItem(`ng-stage-pending:${stage.pending.accountId}`);stage.pending=null;stage.needsRecovery=false;}
export function restoreFishPending(accountId:string){
 try{const saved=JSON.parse(localStorage.getItem(`ng-fish-pending:${accountId}`)||'[]');stage.fishPending=Array.isArray(saved)?saved.filter(p=>p.accountId===accountId&&p.path==='staging/reef-party/rounds'&&typeof p.body?.requestKey==='string').map(p=>({...p,recover:true})):[];}catch{stage.fishPending=[];}
}
function persistFish(accountId:string){const pending=stage.fishPending.filter(p=>p.accountId===accountId);if(pending.length)localStorage.setItem(`ng-fish-pending:${accountId}`,JSON.stringify(pending));else localStorage.removeItem(`ng-fish-pending:${accountId}`);}
export function saveFishPending(pending:FishPending){stage.fishPending.push(pending);try{persistFish(pending.accountId);}catch(error){stage.fishPending.pop();throw error;}}
export function clearFishPending(pending:Pending){stage.fishPending=stage.fishPending.filter(p=>p.accountId!==pending.accountId||p.body.requestKey!==pending.body.requestKey);persistFish(pending.accountId);}
