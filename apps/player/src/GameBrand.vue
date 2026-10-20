<script setup lang="ts">
import {computed} from 'vue';
import {catalog,type GameId} from '@new-game/contracts';
import {gameIdentities} from './game-identity';
const props=defineProps<{game:string}>();
const identity=computed(()=>gameIdentities[props.game as GameId]);
const entry=computed(()=>catalog.find(g=>g.id===props.game));
</script>
<template><span class="game-brand" :class="`brand-${identity?.style||'electric'}`" :data-brand="game" :style="{'--brand-color':entry?.color}"><span>{{entry?.name}}</span></span></template>
