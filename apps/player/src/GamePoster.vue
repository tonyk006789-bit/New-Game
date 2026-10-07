<script setup lang="ts">
import {computed,useId} from 'vue';
import type {GameId} from '@new-game/contracts';
import {catalog} from '@new-game/contracts';
import {isFishGame,isKenoGame,isBlackjackGame,fishBosses} from '@new-game/game-math';
import {characterBox,characterCell} from './expansion-theme';
import AquaticSprite from './AquaticSprite.vue';
import ArcadeSymbol from './ArcadeSymbol.vue';
const props=defineProps<{game:GameId;name:string}>();
const clip=useId().replace(/:/g,'')+'-poster';
const art=computed(()=>{
 if(characterCell(props.game)>=0)return {src:'/art/expansion-posters-v28.png',box:characterBox(props.game),width:1536,height:1024};
 const classics=['ruby-rush','sapphire-crown','solar-fortune'].indexOf(props.game),recent=['disco-diamonds','midnight-express','pirate-gold'].indexOf(props.game);
 if(recent>=0||classics>=0)return {src:recent>=0?'/art/cabinet-posters-v23.png':'/art/cabinet-posters-v15.png',box:`${Math.max(recent,classics)*512} 0 512 1024`,width:1536,height:1024};
 return null;
});
const symbols:Partial<Record<GameId,string>>={'neon-sevens':'seven','jade-fortune':'dragon','coin-carnival':'coin','aurora-vault':'sapphire','ember-relics':'ruby','temple-lights':'lotus'};
const symbol=computed(()=>symbols[props.game]||'gem');
const color=computed(()=>catalog.find(g=>g.id===props.game)?.color||'#bc91ff');
</script>
<template><div class="arcade-poster clean-poster" :class="game" :style="{'--poster-accent':color}" aria-hidden="true">
 <div class="poster-art-frame">
  <svg v-if="art" class="poster-contained-art" :viewBox="art.box" preserveAspectRatio="xMidYMid meet"><defs><clipPath :id="clip"><rect :x="art.box.split(' ')[0]" :y="art.box.split(' ')[1]" :width="art.box.split(' ')[2]" :height="art.box.split(' ')[3]"/></clipPath></defs><image :href="art.src" :width="art.width" :height="art.height" :clip-path="`url(#${clip})`"/></svg>
  <AquaticSprite v-else-if="isFishGame(game)" :species="fishBosses[game][0]"/>
  <div v-else-if="isKenoGame(game)" class="clean-keno"><b>7</b><b>24</b><b>80</b></div>
  <div v-else-if="isBlackjackGame(game)" class="clean-cards"><b>A<span>♠</span></b><b>K<span>♥</span></b></div>
  <ArcadeSymbol v-else :symbol="symbol" :theme="game"/>
 </div>
</div></template>
