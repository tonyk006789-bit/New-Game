<script setup lang="ts">
import AquaticSprite from './AquaticSprite.vue';
import {reefSpecies,reefTier} from '@new-game/game-math';
import {formatCredits} from '@new-game/domain';
import WinBurst from './WinBurst.vue';
defineProps<{id:string;game:string;species:number;award:string;reducedMotion:boolean;running:boolean}>();
</script>
<template><div class="fish-reward-reveal" :class="{'reward-still':reducedMotion,'jackpot-catch':reefTier(species)==='boss','treasure-catch':species===22}" role="status">
 <WinBurst :game="game" :id="id" :award="award" stake="25" :running="running" :reduced-motion="reducedMotion" compact/>
 <AquaticSprite v-if="species===22" :species="22" class="reward-chest"/>
 <AquaticSprite v-else :species="species" class="reward-creature"/>
 <div><small>{{reefTier(species)==='boss'?'JACKPOT CATCH':species===22?'TREASURE WIN':'CAUGHT'}}</small><strong>+{{formatCredits(award)}}</strong><span>{{reefSpecies[species]}}</span></div>
 </div></template>
