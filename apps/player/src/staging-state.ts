import {reactive} from 'vue';
import {stagingProfile} from '@new-game/game-math';
type Pending={accountId:string;path:string;body:Record<string,unknown>};
export const stage=reactive({enabled:false,sampleLogin:null as null|{username:string;password:string},profile:stagingProfile,stake:'25',busy:false,needsRecovery:false,pending:null as Pending|null,last:null as null|{game:string;stake:string;award:string;net:string},revision:0,recovered:0});
export function restorePending(accountId:string){try{const pending=JSON.parse(localStorage.getItem(`ng-stage-pending:${accountId}`)||'null');stage.pending=pending?.accountId===accountId&&/^staging\/[a-z-]+\/rounds$/.test(pending.path)&&typeof pending.body?.requestKey==='string'?pending:null;}catch{stage.pending=null;}stage.needsRecovery=!!stage.pending;}
export function savePending(pending:Pending){localStorage.setItem(`ng-stage-pending:${pending.accountId}`,JSON.stringify(pending));stage.pending=pending;}
export function clearPending(){if(stage.pending)localStorage.removeItem(`ng-stage-pending:${stage.pending.accountId}`);stage.pending=null;stage.needsRecovery=false;}
