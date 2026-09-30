<script setup lang="ts">
import { computed } from 'vue';
import type { GameId } from '@new-game/contracts';
import ArcadeSymbol from './ArcadeSymbol.vue';
const props = defineProps<{game: GameId; name: string}>();
const symbols: Record<GameId,string[]> = {
  'ruby-rush':['seven','gem','cherry'], 'sapphire-crown':['lotus','dragon','coin'], 'solar-fortune':['seven','coin','bar'],
  'neon-sevens':['cherry','seven','bell'], 'jade-fortune':['coin','dragon','lotus'], 'coin-carnival':['bar','coin','seven'],
  'aurora-vault':['sapphire','gem','amethyst'], 'ember-relics':['amber','ruby','emerald'],
  'temple-lights':['lotus','sun','moon'], 'orchard-numbers':['leaf','cherry','leaf'], 'reef-party':['gem','coin','gem']
};
const chosen = computed(() => symbols[props.game]);
const newPoster=computed(()=>['ruby-rush','sapphire-crown','solar-fortune'].indexOf(props.game));
</script>
<template>
  <div class="arcade-poster" :class="game" aria-hidden="true">
    <svg v-if="newPoster>=0" class="painted-poster-art" :viewBox="`${newPoster*512} 0 512 1024`" preserveAspectRatio="xMidYMid slice"><image href="/art/cabinet-posters-v15.png" width="1536" height="1024"/></svg>
    <div class="poster-rays"></div><div class="poster-halo"></div><span class="poster-spark one">✦</span><span class="poster-spark two">✦</span>
    <div v-if="game === 'reef-party'" class="poster-fish-school"><ArcadeSymbol v-for="(fish,index) in ['fish','fish-pink','fish']" :key="index" :symbol="fish" /></div>
    <div v-else-if="game === 'orchard-numbers'" class="poster-keno-balls"><b>7</b><b>80</b><b>24</b></div>
    <div v-else-if="newPoster<0" class="poster-symbols"><ArcadeSymbol v-for="(symbol,index) in chosen" :key="index" :symbol="symbol" /></div>
    <div class="machine-title"><span>{{name.split(' ')[0]}}</span><strong>{{name.split(' ').slice(1).join(' ')}}</strong></div>
    <span class="poster-ribbon">{{ game === 'ruby-rush' ? 'RUBY REELS' : game === 'sapphire-crown' ? 'CROWN WILDS' : game === 'solar-fortune' ? 'SUN COIN RESPINS' : game === 'neon-sevens' ? 'CLASSIC REELS' : game === 'jade-fortune' ? 'WILD DRAGONS' : game === 'coin-carnival' ? 'LOCK & RESPIN' : game === 'aurora-vault' ? 'LOCK & COLLECT' : game === 'ember-relics' ? 'CLUSTER CASCADES' : game === 'reef-party' ? '4-SEAT FISHING' : game === 'orchard-numbers' ? 'PICK YOUR NUMBERS' : '5-REEL ADVENTURE' }}</span>
  </div>
</template>
