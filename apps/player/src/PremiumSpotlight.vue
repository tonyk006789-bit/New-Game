<script setup lang="ts">
import type {GameId} from '@new-game/contracts';
import AquaticSprite from './AquaticSprite.vue';
defineProps<{running:boolean}>();
defineEmits<{open:[id:GameId];premium:[]}>();
const offers=[{id:'sunken-dynasty' as const,title:'THE DRAGON AWAKENS',detail:'Boss catch · 20× shot stake',species:30,tone:'jade'},
 {id:'polar-odyssey' as const,title:'LEGENDS BELOW THE ICE',detail:'Boss catch · 20× shot stake',species:39,tone:'ice'}];
</script>
<template><section class="premium-spotlight" aria-label="Premium jackpot offers"><header><div><span>THE PREMIUM COLLECTION</span><h2>Something extraordinary awaits.</h2></div><button :disabled="!running" @click="$emit('premium')">EXPLORE PREMIUM <b>→</b></button></header><div class="premium-offers"><button class="premium-offer royal-offer" :disabled="!running" @click="$emit('open','royal-blackjack')"><span class="offer-kicker">TAKE YOUR SEAT</span><strong>ROYAL<br>BLACKJACK</strong><span class="offer-detail">Natural blackjack pays 3:2</span><i class="offer-cards" aria-hidden="true">A♠<b>K♥</b></i><small>PLAY NOW →</small></button><button v-for="offer in offers" :key="offer.id" class="premium-offer" :class="offer.tone" :disabled="!running" @click="$emit('open',offer.id)"><span class="offer-kicker">JACKPOT SPOTLIGHT</span><strong>{{offer.title}}</strong><span class="offer-detail">{{offer.detail}}</span><AquaticSprite :species="offer.species"/><small>EXPLORE TABLE →</small></button></div><p>Featured game awards · Available to every tester</p></section></template>
