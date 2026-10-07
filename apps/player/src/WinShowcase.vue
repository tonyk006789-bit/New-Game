<script setup lang="ts">
import {computed,onBeforeUnmount,ref,watch} from 'vue';
import {formatCredits} from '@new-game/domain';
import {demoWinAmounts,type WinTier} from './win-presentation';
const props=defineProps<{running:boolean;reducedMotion:boolean}>();
const tiers:WinTier[]=['minor','major','jackpot'];
const cycle=ref(0),paused=ref(false),selected=ref<WinTier|null>(null),revealKey=ref(0);
const values=computed(()=>Object.fromEntries(tiers.map((tier,i)=>[tier,demoWinAmounts[tier][(Math.floor(cycle.value/3)+i)%3]])) as Record<WinTier,string>);
let timer:ReturnType<typeof setInterval>|undefined;
watch(()=>[props.running,props.reducedMotion,paused.value,selected.value] as const,()=>{clearInterval(timer);if(props.running&&!props.reducedMotion&&!paused.value&&!selected.value)timer=setInterval(()=>cycle.value++,12000);},{immediate:true});
onBeforeUnmount(()=>clearInterval(timer));
function preview(tier:WinTier){selected.value=tier;revealKey.value++;}
</script>
<template><section class="win-showcase" aria-label="Demo win showcase">
 <header><span><b>THE WIN SHOWCASE</b><small>Generated examples · No credits awarded</small></span><button :aria-pressed="paused||reducedMotion" :disabled="reducedMotion" @click="paused=!paused" :aria-label="paused?'Resume demo displays':'Pause demo displays'">{{paused||reducedMotion?'Ⅱ PAUSED':'Ⅱ PAUSE'}}</button></header>
 <div class="jackpot-meters"><button v-for="(tier,index) in tiers" :key="tier" class="jackpot-meter" :class="[tier,{featured:cycle%3===index}]" :aria-label="`Preview ${tier} demo win`" @click="preview(tier)"><i aria-hidden="true">{{tier==='jackpot'?'♛':tier==='major'?'◆':'✦'}}</i><span class="jackpot-tier">{{tier.toUpperCase()}}</span><strong>{{formatCredits(values[tier])}}</strong><small>DEMO · PLAY CREDITS</small><span class="meter-shimmer" aria-hidden="true"></span></button></div>
 <div v-if="selected" :key="revealKey" class="demo-win-reveal" :class="selected" role="status"><div class="demo-confetti" aria-hidden="true"><i v-for="n in 12" :key="n" :style="{'--piece':n}">✦</i></div><small>DEMO CELEBRATION</small><b>{{selected.toUpperCase()}} WIN</b><strong>{{formatCredits(values[selected])}}</strong><p>Generated example — your balance stays the same.</p><button @click="selected=null" aria-label="Close demo celebration">CLOSE ✕</button></div>
</section></template>
