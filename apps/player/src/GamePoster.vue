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
 if(recent>=0||classics>=0){const top=recent>=0?[80,180,150][recent]:[80,130,50][classics];return {src:recent>=0?'/art/cabinet-posters-v23.png':'/art/cabinet-posters-v15.png',box:`${Math.max(recent,classics)*512} ${top} 512 ${1024-top}`,width:1536,height:1024};}
 return null;
});
const symbols:Partial<Record<GameId,string>>={'neon-sevens':'seven','jade-fortune':'dragon','coin-carnival':'coin','aurora-vault':'sapphire','ember-relics':'ruby','temple-lights':'lotus'};
const symbol=computed(()=>symbols[props.game]||'gem');
const color=computed(()=>catalog.find(g=>g.id===props.game)?.color||'#bc91ff');
const scenes:Partial<Record<GameId,string>>={
 'reef-party':'reef-seabed-v5.png','abyss-legends':'abyss-caldera-v18.png','sunken-dynasty':'dynasty-background-v22.png','polar-odyssey':'polar-background-v22.png','corsair-cove':'corsair-background-v28.png','cosmic-tides':'cosmic-background-v28.png',
 'neon-sevens':'arcade-city.png','jade-fortune':'temple-rich.png','coin-carnival':'arcade-hall-v7.png','aurora-vault':'aurora-vault.png','ember-relics':'ember-relics.png','temple-lights':'temple-rich.png','orchard-numbers':'orchard-rich.png','neon-numbers':'arcade-city.png','pearl-keno':'reef-rich.png','royal-blackjack':'arcade-hall-v7.png'
};
const scene=computed(()=>scenes[props.game]);
const accents=computed(()=>props.game==='neon-sevens'?['cherry','bell']:props.game==='jade-fortune'?['lotus','coin']:props.game==='ember-relics'?['coin','ruby']:['coin','gem']);
</script>
<template><div class="arcade-poster rich-poster" :class="[game,{'poster-fish':isFishGame(game),'poster-illustrated':!!art}]" :style="{'--poster-accent':color}" aria-hidden="true">
 <img v-if="scene&&!art" class="poster-scene" :src="`/art/${scene}`" alt="" loading="lazy"/>
 <span class="poster-glow"/>
 <div class="poster-art-frame">
  <svg v-if="art" class="poster-full-art" :viewBox="art.box" preserveAspectRatio="xMidYMin slice"><defs><clipPath :id="clip"><rect :x="art.box.split(' ')[0]" :y="art.box.split(' ')[1]" :width="art.box.split(' ')[2]" :height="art.box.split(' ')[3]"/></clipPath></defs><image :href="art.src" :width="art.width" :height="art.height" :clip-path="`url(#${clip})`"/></svg>
  <AquaticSprite v-else-if="isFishGame(game)" :species="fishBosses[game][0]"/>
  <div v-else-if="isKenoGame(game)" class="poster-keno"><b>7</b><b>24</b><b>80</b><b>12</b><b>36</b></div>
  <div v-else-if="isBlackjackGame(game)" class="poster-cards"><i/><i/><b>A<span>♠</span></b><b>K<span>♥</span></b></div>
  <template v-else><ArcadeSymbol class="poster-side-symbol left" :symbol="accents[0]" :theme="game"/><ArcadeSymbol class="poster-side-symbol right" :symbol="accents[1]" :theme="game"/><ArcadeSymbol class="poster-hero-symbol" :symbol="symbol" :theme="game"/></template>
 </div>
 <span class="poster-vignette"/>
</div></template>
