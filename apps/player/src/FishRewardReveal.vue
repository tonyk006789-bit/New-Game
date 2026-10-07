<script setup lang="ts">
import AquaticSprite from './AquaticSprite.vue';
import {reefSpecies,reefTier} from '@new-game/game-math';
import {formatCredits} from '@new-game/domain';
defineProps<{species:number;award:string;reducedMotion:boolean}>();
</script>
<template><div class="fish-reward-reveal" :class="{'reward-still':reducedMotion,'jackpot-catch':reefTier(species)==='boss','treasure-catch':species===22}" role="status">
 <div v-if="reefTier(species)==='boss'" class="catch-wheel" aria-hidden="true"><i v-for="n in 8" :key="n" :style="{transform:`rotate(${n*45}deg)`}">✦</i><b>✧</b></div>
 <AquaticSprite v-else-if="species===22" :species="22" class="reward-chest"/>
 <AquaticSprite v-else :species="species" class="reward-creature"/>
 <div><small>{{reefTier(species)==='boss'?'JACKPOT CATCH':species===22?'TREASURE WIN':reefTier(species)==='large'?'MAJOR WIN':'MINOR WIN'}}</small><strong>+{{formatCredits(award)}}</strong><span>{{reefSpecies[species]}}</span></div>
 </div></template>
