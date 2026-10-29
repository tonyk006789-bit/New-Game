<script setup lang="ts">
import {onBeforeUnmount,ref,watch} from 'vue';
import {formatCredits} from '@new-game/domain';
import {virtualPools} from './virtual-pools';
import type {WinTier} from './win-presentation';
const props=defineProps<{accountId:string;revision:number;running:boolean;reducedMotion:boolean}>();
const emit=defineEmits<{history:[]}>();
const tiers:WinTier[]=['minor','major','jackpot'];
const amounts=ref(virtualPools(Date.now())),displayed=ref({...amounts.value}),selected=ref<WinTier|null>(null);
let timer:ReturnType<typeof setInterval>|undefined,frame=0;
function show(next:Record<WinTier,string>,animate:boolean){
 if(tiers.every(t=>displayed.value[t]===next[t]))return;
 cancelAnimationFrame(frame);if(!animate||props.reducedMotion||!props.running){displayed.value={...next};return;}
 const previous={...displayed.value},start=performance.now();
 function tick(now:number){const progress=Math.min(1,(now-start)/650),weight=BigInt(Math.round((1-(1-progress)**3)*10000));
  for(const tier of tiers)displayed.value[tier]=(BigInt(previous[tier])+(BigInt(next[tier])-BigInt(previous[tier]))*weight/10000n).toString();
  if(progress<1)frame=requestAnimationFrame(tick);
 }frame=requestAnimationFrame(tick);
}
function refresh(){amounts.value=virtualPools(Date.now());show(amounts.value,true);}
watch(()=>props.running,on=>{clearInterval(timer);cancelAnimationFrame(frame);if(on){refresh();timer=setInterval(refresh,3000);}else show(amounts.value,false);},{immediate:true});
watch(()=>props.reducedMotion,()=>refresh());
onBeforeUnmount(()=>{clearInterval(timer);cancelAnimationFrame(frame);});
</script>
<template><section class="win-showcase virtual-pools" aria-label="Virtual pools, display only">
 <header><span><b>VIRTUAL POOLS</b><small>Independent displays · No player contributions or credit awards</small></span><button @click="emit('history')">PLAY HISTORY ↗</button></header>
 <div class="jackpot-meters"><button v-for="tier in tiers" :key="tier" data-depth-card class="jackpot-meter" :class="[tier,{featured:selected===tier}]" :aria-label="`${tier} virtual display: ${formatCredits(amounts[tier])}`" :aria-expanded="selected===tier" @click="selected=selected===tier?null:tier"><i aria-hidden="true">{{tier==='jackpot'?'♛':tier==='major'?'◆':'✦'}}</i><span class="jackpot-tier">{{tier.toUpperCase()}}</span><strong>{{formatCredits(displayed[tier])}}</strong><small>VIRTUAL · DISPLAY ONLY</small></button></div>
 <div v-if="selected" class="win-tier-details"><b>{{selected.toUpperCase()}} VIRTUAL POOL</b><span>Decorative values increase on a six-hour display cycle, then restart. They are not funded by wagers, cannot be won, and never change your credits. Your real results remain in Play History.</span><button @click="selected=null" aria-label="Close virtual pool details">✕</button></div>
</section></template>
