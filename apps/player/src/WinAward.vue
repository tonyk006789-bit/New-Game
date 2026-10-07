<script setup lang="ts">
import {computed} from 'vue';
import {formatCredits} from '@new-game/domain';
import {winTier} from './win-presentation';
const props=defineProps<{award:string;stake:string}>();
const tier=computed(()=>winTier(props.award,props.stake));
</script>
<template><div v-if="tier" class="committed-win" :class="tier" role="status"><span aria-hidden="true">{{tier==='jackpot'?'♛':'✦'}}</span><div><small>{{tier==='jackpot'?'JACKPOT WIN':`${tier.toUpperCase()} WIN`}}</small><strong>{{formatCredits(award)}}</strong><em>ROUND RETURN · PLAY CREDITS</em></div><span aria-hidden="true">{{tier==='jackpot'?'♛':'✦'}}</span></div></template>
