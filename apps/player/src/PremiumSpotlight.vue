<script setup lang="ts">
import type {GameId} from '@new-game/contracts';
import AquaticSprite from './AquaticSprite.vue';
defineProps<{running:boolean;premiumOnly?:boolean}>();
defineEmits<{open:[id:GameId];premium:[]}>();
const offers=[{id:'sunken-dynasty' as const,title:'THE DRAGON AWAKENS',detail:'Boss catch · 20× shot stake',species:30,tone:'jade'},
 {id:'polar-odyssey' as const,title:'LEGENDS BELOW THE ICE',detail:'Boss catch · 20× shot stake',species:39,tone:'ice'}];
</script>
<template><section class="premium-spotlight" aria-label="Featured games"><header><div><span>{{premiumOnly?'PREMIUM TABLE':'TONIGHT ON THE FLOOR'}}</span><h2>{{premiumOnly?'Choose your blackjack table':'Take your next seat.'}}</h2></div><button :disabled="!running" @click="$emit('premium')">EXPLORE PREMIUM <b>→</b></button></header><div class="premium-offers"><button class="premium-offer royal-offer" :disabled="!running" @click="$emit('open','royal-blackjack')"><span class="offer-kicker">PREMIUM · TAKE YOUR SEAT</span><strong>ROYAL<br>BLACKJACK</strong><span class="offer-detail">Natural blackjack pays 3:2</span><i class="offer-cards" aria-hidden="true">A♠<b>K♥</b></i><small>PLAY NOW →</small></button><button v-for="offer in premiumOnly?[]:offers" :key="offer.id" class="premium-offer" :class="offer.tone" :disabled="!running" @click="$emit('open',offer.id)"><span class="offer-kicker">JACKPOT SPOTLIGHT</span><strong>{{offer.title}}</strong><span class="offer-detail">{{offer.detail}}</span><AquaticSprite :species="offer.species"/><small>EXPLORE TABLE →</small></button></div><p>Three blackjack tables · Premium collection available to every tester</p></section></template>
