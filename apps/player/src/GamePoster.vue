<script setup lang="ts">
import { computed } from 'vue';
import {isPremiumGame,type GameId } from '@new-game/contracts';
import AquaticSprite from './AquaticSprite.vue';
import ArcadeSymbol from './ArcadeSymbol.vue';
const props = defineProps<{game: GameId; name: string}>();
import {isFishGame,isKenoGame,fishBosses} from '@new-game/game-math';
import {fishWorlds} from './fish-worlds';
const symbols: Record<GameId,string[]> = {
  'royal-blackjack':['gem','coin','gem'],'sunken-dynasty':['gem'],'polar-odyssey':['gem'],'neon-numbers':['gem'],'pearl-keno':['gem'],
  'ruby-rush':['seven','gem','cherry'], 'sapphire-crown':['lotus','dragon','coin'], 'solar-fortune':['seven','coin','bar'],
  'neon-sevens':['cherry','seven','bell'], 'jade-fortune':['coin','dragon','lotus'], 'coin-carnival':['bar','coin','seven'],
  'aurora-vault':['sapphire','gem','amethyst'], 'ember-relics':['amber','ruby','emerald'],
  'temple-lights':['lotus','sun','moon'], 'orchard-numbers':['leaf','cherry','leaf'], 'reef-party':['gem','coin','gem'],'abyss-legends':['gem','coin','gem']
};
const chosen = computed(() => symbols[props.game]);
const newPoster=computed(()=>['ruby-rush','sapphire-crown','solar-fortune'].indexOf(props.game));
const ribbons: Record<GameId,string> = {
  'royal-blackjack':'BLACKJACK PAYS 3:2', 'sunken-dynasty':'JADE PALACE FISHING', 'polar-odyssey':'FROZEN FRONTIER',
  'neon-numbers':'NEON KENO', 'pearl-keno':'PEARL KENO', 'ruby-rush':'RUBY REELS', 'sapphire-crown':'CROWN WILDS',
  'solar-fortune':'SUN COIN RESPINS', 'neon-sevens':'CLASSIC REELS', 'jade-fortune':'WILD DRAGONS',
  'coin-carnival':'LOCK & RESPIN', 'aurora-vault':'LOCK & COLLECT', 'ember-relics':'CLUSTER CASCADES',
  'abyss-legends':'TREASURE & LEGENDS', 'reef-party':'4-SEAT FISHING', 'orchard-numbers':'PICK YOUR NUMBERS',
  'temple-lights':'5-REEL ADVENTURE'
};
</script>
<template>
  <div class="arcade-poster" :class="game" :style="isFishGame(game)&&fishWorlds[game]?{backgroundImage:`url(${fishWorlds[game]!.background})`,backgroundSize:'cover'}:{}" aria-hidden="true">
    <svg v-if="newPoster>=0" class="painted-poster-art" :viewBox="`${newPoster*512} 0 512 1024`" preserveAspectRatio="xMidYMid slice"><image href="/art/cabinet-posters-v15.png" width="1536" height="1024"/></svg>
    <div class="poster-rays"></div><div class="poster-halo"></div><span class="poster-spark one">✦</span><span class="poster-spark two">✦</span>
    <div v-if="isFishGame(game)&&game!=='reef-party'" class="abyss-poster-creatures"><AquaticSprite :species="fishBosses[game][0]"/><AquaticSprite :species="fishBosses[game][1]"/></div><div v-else-if="game === 'reef-party'" class="poster-fish-school"><ArcadeSymbol v-for="(fish,index) in ['fish','fish-pink','fish']" :key="index" :symbol="fish" /></div>
    <div v-else-if="isKenoGame(game)" class="poster-keno-balls"><b>7</b><b>80</b><b>24</b></div>
    <div v-else-if="game==='royal-blackjack'" class="blackjack-poster-cards"><b>A<span>♠</span></b><b>K<span>♥</span></b></div><div v-else-if="newPoster<0" class="poster-symbols"><ArcadeSymbol v-for="(symbol,index) in chosen" :key="index" :symbol="symbol" /></div>
    <div class="machine-title"><span>{{name.split(' ')[0]}}</span><strong>{{name.split(' ').slice(1).join(' ')}}</strong></div>
    <span v-if="isPremiumGame(game)" class="premium-poster-mark">PREMIUM</span><span class="poster-ribbon">{{ ribbons[game] }}</span>
  </div>
</template>
