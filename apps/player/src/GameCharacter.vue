<script setup lang="ts">
import {computed} from 'vue';
import {gameIdentities,identityArt} from './game-identity';
import type {GameId} from '@new-game/contracts';
const props=defineProps<{game:string;compact?:boolean}>();
const sheet=computed(()=>identityArt(props.game));
const name=computed(()=>gameIdentities[props.game as GameId]?.host);
</script>
<template><figure v-if="sheet" class="game-character identity-character" :class="{'character-compact':compact}" :data-host="game"><svg :viewBox="`${sheet.host*256} 0 256 256`" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image :href="sheet.url" :width="sheet.width" height="256"/></svg><figcaption>{{name}}</figcaption></figure></template>
