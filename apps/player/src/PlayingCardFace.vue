<script setup lang="ts">
import {computed} from 'vue';
import type {Card} from '@new-game/game-math';
import {cardPips,cardRank,cardSuits} from './blackjack-cards';
const props=defineProps<{card:Card|null}>();
const pips=computed(()=>props.card?cardPips(props.card.rank):[]);
</script>
<template><span class="card-ink" aria-hidden="true">
 <template v-if="card">
  <b class="card-index">{{cardRank(card.rank)}}<small>{{cardSuits[card.suit]}}</small></b>
  <span v-if="card.rank<=10" class="card-pips" :class="{'ace-pip':card.rank===1}"><i v-for="(pip,i) in pips" :key="i" :class="{inverted:pip.flipped}" :style="{left:pip.x+'%',top:pip.y+'%'}">{{cardSuits[card.suit]}}</i></span>
  <span v-else class="card-court"><i>♛<b>{{cardRank(card.rank)}}</b></i><i>♛<b>{{cardRank(card.rank)}}</b></i></span>
  <b class="card-index card-bottom">{{cardRank(card.rank)}}<small>{{cardSuits[card.suit]}}</small></b>
 </template>
 <span v-else class="card-back-medallion">♠</span>
</span></template>
