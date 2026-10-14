<script setup lang="ts">
import {computed} from 'vue';
import type {BlackjackGame} from '@new-game/game-math';
const props=defineProps<{game:BlackjackGame;pose:number;running:boolean;reducedMotion:boolean}>();
const dealers:Record<BlackjackGame,{art:string;description:string}>={
 'royal-blackjack':{art:'/art/blackjack-dealer-v37.png',description:'Royal Blackjack virtual dealer: woman with a brown bob, black waistcoat and bow tie'},
 'double-deck-blackjack':{art:'/art/blackjack-double-dealer-v38.png',description:'Double Deck Blackjack virtual dealer: man with short dark hair, a neat beard and burgundy waistcoat'},
 'european-blackjack':{art:'/art/blackjack-european-dealer-v38.png',description:'European Blackjack virtual dealer: woman with a black hair bun, navy waistcoat and necktie'}
};
const dealer=computed(()=>dealers[props.game]);
</script>
<template>
 <div class="dealer-character" :data-game="game" :class="{'dealer-resting':pose===0,'dealer-paused':!running||reducedMotion}" role="img" :aria-label="dealer.description">
  <div class="dealer-halo" aria-hidden="true"></div>
  <div class="dealer-figure" aria-hidden="true"><span v-for="frame in 4" :key="frame" class="dealer-pose" :class="{'pose-active':pose===frame-1}" :style="{'background-image':`url('${dealer.art}')`,'background-position':`${(frame-1)%2*100}% ${Math.floor((frame-1)/2)*100}%`}"></span></div>
 </div>
</template>
