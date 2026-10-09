<script setup lang="ts">
import {onBeforeUnmount,ref,watch} from 'vue';
import {formatCredits} from '@new-game/domain';
import {api} from './api';
import type {WinTier} from './win-presentation';
const props=defineProps<{accountId:string;revision:number;running:boolean;reducedMotion:boolean}>();
const emit=defineEmits<{history:[]}>();
type Totals={accountId:string;rounds:string;wagered:string;totals:Record<WinTier,string>};
const tiers:WinTier[]=['minor','major','jackpot'];
const totals=ref<Totals|null>(null),displayed=ref<Record<WinTier,string>>({minor:'0',major:'0',jackpot:'0'}),error=ref(false),selected=ref<WinTier|null>(null);
const descriptions:Record<WinTier,string>={minor:'Returns below 5× their round stake.',major:'Returns from 5× to below 20× their round stake.',jackpot:'Returns of 20× their round stake or higher.'};
let timer:ReturnType<typeof setInterval>|undefined,frame=0,generation=0,busy=false,disposed=false;
function show(next:Record<WinTier,string>,animate:boolean){
 if(tiers.every(t=>displayed.value[t]===next[t]))return;
 cancelAnimationFrame(frame);if(!animate||props.reducedMotion||!props.running){displayed.value={...next};return;}
 const previous={...displayed.value},start=performance.now();
 function tick(now:number){const progress=Math.min(1,(now-start)/650),weight=BigInt(Math.round((1-(1-progress)**3)*10000));
  for(const tier of tiers)displayed.value[tier]=(BigInt(previous[tier])+(BigInt(next[tier])-BigInt(previous[tier]))*weight/10000n).toString();
  if(progress<1)frame=requestAnimationFrame(tick);
 }frame=requestAnimationFrame(tick);
}
async function refresh(){
 if(!props.running||!props.accountId||busy)return;busy=true;const ticket=generation,accountId=props.accountId;
 try{const next=await api<Totals>('staging/wins');if(disposed||ticket!==generation||accountId!==props.accountId)return;
  if(next.accountId!==accountId||!/^\d+$/.test(next.wagered)||!tiers.every(t=>/^\d+$/.test(next.totals[t])))throw new Error('Invalid totals');
  show(next.totals,!!totals.value);totals.value=next;error.value=false;
 }catch{if(!disposed&&ticket===generation)error.value=true;}finally{if(ticket===generation)busy=false;}
}
watch(()=>props.accountId,()=>{generation++;busy=false;totals.value=null;error.value=false;selected.value=null;show({minor:'0',major:'0',jackpot:'0'},false);});
watch(()=>[props.accountId,props.running] as const,()=>{clearInterval(timer);if(props.running){void refresh();timer=setInterval(()=>void refresh(),15000);}else if(totals.value)show(totals.value.totals,false);},{immediate:true});
watch(()=>props.revision,()=>void refresh());
watch(()=>props.reducedMotion,on=>{if(on&&totals.value)show(totals.value.totals,false);});
onBeforeUnmount(()=>{disposed=true;generation++;clearInterval(timer);cancelAnimationFrame(frame);});
</script>
<template><section class="win-showcase personal-wins" aria-label="Your awarded wins">
 <header><span><b>YOUR WINS</b><small>Total wagered <strong>{{totals?formatCredits(totals.wagered):'—'}}</strong> · Play credits</small></span><button @click="emit('history')">PLAY HISTORY ↗</button></header>
 <p v-if="error" class="win-totals-error" role="status">{{totals?'Unable to refresh win totals.':'Win totals are unavailable.'}} <button @click="refresh">RETRY</button></p>
 <div class="jackpot-meters" :aria-busy="!totals&&!error"><button v-for="tier in tiers" :key="tier" data-depth-card class="jackpot-meter" :class="[tier,{featured:selected===tier}]" :aria-label="`${tier} awarded credits: ${totals?formatCredits(totals.totals[tier]):'loading'}`" :aria-expanded="selected===tier" @click="selected=selected===tier?null:tier"><i aria-hidden="true">{{tier==='jackpot'?'♛':tier==='major'?'◆':'✦'}}</i><span class="jackpot-tier">{{tier.toUpperCase()}}</span><strong>{{totals?formatCredits(displayed[tier]):'—'}}</strong><small>AWARDED CREDITS</small></button></div>
 <div v-if="selected" class="win-tier-details"><b>{{selected.toUpperCase()}} WINS</b><span>{{descriptions[selected]}} Your total includes only settled game returns, including any returned stake.</span><button @click="selected=null" aria-label="Close win details">✕</button></div>
</section></template>
