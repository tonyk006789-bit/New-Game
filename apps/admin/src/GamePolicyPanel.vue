<script setup lang="ts">
import {onMounted,ref} from 'vue';
import {testProbabilityPolicy,type RoundPolicy} from '@new-game/game-math';
import {api,ApiError} from './api';
const props=defineProps<{accountId:string}>();
type PolicyView={current:RoundPolicy;history:{revision:string;payingPercent:number;createdAt:string;actor:string|null}[]};
type Change={payingPercent:number;expectedRevision:string;requestKey:string};
const saved=ref<PolicyView|null>(null),percent=ref(20),password=ref(''),busy=ref(false),review=ref(false),error=ref(''),notice=ref(''),pending=ref<Change|null>(null);
const storageKey=`ng-game-policy:${props.accountId}`;
async function load(){saved.value=await api<PolicyView>('operator/game-policy');if(!pending.value)percent.value=saved.value.current.payingPercent;}
function prepare(){error.value='';notice.value='';review.value=true;}
async function save(){
 if(busy.value||!saved.value)return;
 busy.value=true;error.value='';notice.value='';
 try{
  await api('auth/verify',{password:password.value});password.value='';
  if(!pending.value){const change={payingPercent:percent.value,expectedRevision:saved.value.current.revision,requestKey:crypto.randomUUID()};localStorage.setItem(storageKey,JSON.stringify(change));pending.value=change;}
  const result=await api<{current:RoundPolicy}>('operator/game-policy',pending.value);
  localStorage.removeItem(storageKey);pending.value=null;review.value=false;
  await load();notice.value=`Saved ${result.current.payingPercent}% for future slot and keno rounds. Revision ${result.current.revision}.`;
 }catch(e){
  error.value=(e as Error).message;
  if(e instanceof ApiError&&[400,403,404,409].includes(e.status)&&e.code!=='VERIFICATION_REQUIRED'){
   localStorage.removeItem(storageKey);pending.value=null;review.value=false;
   if(e.code==='POLICY_CHANGED')await load().catch(()=>{});
  }
 }finally{password.value='';busy.value=false;}
}
onMounted(async()=>{
 try{const restored=JSON.parse(localStorage.getItem(storageKey)||'null');if(restored&&Number.isInteger(restored.payingPercent)&&restored.payingPercent>=5&&restored.payingPercent<=50&&typeof restored.requestKey==='string'&&typeof restored.expectedRevision==='string'){pending.value=restored;percent.value=restored.payingPercent;review.value=true;}await load();}catch(e){error.value=(e as Error).message;}
});
</script>
<template>
 <section class="panel game-policy-panel">
  <h2 class="panel-heading">Slot & Keno Win Rate</h2>
  <p>Chance of a round returning any credits, including returns smaller than the stake. This is not the percentage of credits returned over time.</p>
  <template v-if="saved">
   <div class="policy-current">Current <strong>{{saved.current.payingPercent}}%</strong><span>Revision {{saved.current.revision}}</span></div>
   <form @submit.prevent="review?save():prepare()">
    <label for="global-win-rate">Global win rate <strong>{{percent}}%</strong></label>
    <input id="global-win-rate" v-model.number="percent" type="range" :min="testProbabilityPolicy.minimumPercent" :max="testProbabilityPolicy.maximumPercent" step="1" :disabled="busy||review||!!pending" :aria-valuetext="`${percent}% chance of any credit return`">
    <div class="policy-range"><span>5%</span><span>50%</span></div>
    <p>Applies equally to every player's future slot and keno rounds. Reward amounts, fish, blackjack and saved rounds stay unchanged. Players can see the current rate in game rules.</p>
    <template v-if="review">
     <p class="policy-review">{{pending?'Retry the saved request to confirm its result.':`Save ${saved.current.payingPercent}% → ${percent}% for future rounds?`}}</p>
     <label>Main Admin password<input v-model="password" type="password" autocomplete="current-password" required :disabled="busy"></label>
     <div class="actions"><button class="primary" :disabled="busy">{{busy?'Saving…':pending?'Retry saved change':'Verify & save rate'}}</button><button v-if="!pending" type="button" :disabled="busy" @click="review=false;password=''">Cancel</button></div>
    </template>
    <button v-else class="primary" :disabled="busy||percent===saved.current.payingPercent">Review change</button>
   </form>
   <p v-if="notice" role="status">{{notice}}</p>
   <details><summary>Rate change history</summary><div class="table-scroll"><table><thead><tr><th>Revision</th><th>Rate</th><th>Changed by</th><th>Time</th></tr></thead><tbody><tr v-for="item in saved.history" :key="item.revision"><td>{{item.revision}}</td><td>{{item.payingPercent}}%</td><td>{{item.actor||'Initial approved setting'}}</td><td>{{new Date(item.createdAt).toLocaleString()}}</td></tr></tbody></table></div></details>
  </template>
  <p v-if="error" role="alert">{{error}}</p>
 </section>
</template>
<style>
.game-policy-panel{max-width:1050px}.game-policy-panel p{font-size:13px;line-height:1.6}.policy-current{display:flex;align-items:center;gap:15px;padding:14px 18px;background:#f3f7fc;border-radius:8px;margin:20px 0}.policy-current strong{font-size:28px;color:#287ad1}.policy-current span{margin-left:auto;font-size:12px}.game-policy-panel form>label:first-child{display:flex;justify-content:space-between;font-size:15px}.game-policy-panel input[type=range]{display:block;width:100%;padding:0;margin:18px 0 0;height:30px;accent-color:#409eff;cursor:pointer}.policy-range{display:flex;justify-content:space-between;font-size:12px}.policy-review{background:#ecf5ff;border:1px solid #b3d8ff;padding:12px;border-radius:4px}.game-policy-panel .actions{margin-top:16px}.game-policy-panel details{margin-top:22px}.game-policy-panel summary{cursor:pointer;font-size:13px}.game-policy-panel [role=alert]{color:#b32d3f}.game-policy-panel [role=status]{color:#287248}
</style>
