<script setup lang="ts">
import {computed} from 'vue';
import {formatCredits} from '@new-game/domain';
import type {BossReveal} from './boss-reveal';
const props=defineProps<{title?:string;reward:BossReveal|null;reducedMotion:boolean}>();
const amount=computed(()=>props.reward?formatCredits(props.reward.award):'20×');
</script>
<template><aside class="abyss-jackpot" :class="{'wheel-still':reducedMotion,'wheel-awarded':!!reward}" :aria-label="`${title||'Abyss'} jackpot wheel`">
 <h3>{{(title||'Abyss').toUpperCase()}} <b>JACKPOT</b></h3>
 <div class="abyss-wheel-rim"><span class="abyss-wheel-pointer" aria-hidden="true">◆</span>
  <div :key="reward?.id||'idle'" class="abyss-wheel-disc" :class="{'wheel-spinning':!!reward}" aria-hidden="true"><i v-for="n in 8" :key="n" :style="{transform:`rotate(${n*45}deg)`}"><span>{{n%2?'◆':'✦'}}</span></i></div>
  <div class="abyss-wheel-hub" :key="`award-${reward?.id||'idle'}`"><small>{{reward?`CANNON ${reward.seat}`:'BOSS CATCH'}}</small><strong>{{reward?'+':''}}{{amount}}</strong><span>{{reward?'CAUGHT & WON':'SHOT STAKE'}}</span></div>
 </div><p role="status">{{reward?'Jackpot catch awarded':'Capture a boss · reveal the wheel'}}</p>
</aside></template>
