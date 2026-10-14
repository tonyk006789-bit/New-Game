<script setup lang="ts">
import {computed} from 'vue';
import type {GameId} from '@new-game/contracts';
import {catalog} from '@new-game/contracts';
import assets from './presentation-assets.json';
const props=defineProps<{game:GameId;name:string;priority?:boolean}>();
const color=computed(()=>catalog.find(g=>g.id===props.game)?.color||'#bc91ff');
</script>
<template><div class="arcade-poster rich-poster optimized-poster" :class="game" :style="{'--poster-accent':color}" aria-hidden="true"><img class="poster-thumbnail" :src="assets[game].url" width="480" height="480" alt="" loading="eager" decoding="async" :fetchpriority="priority?'high':'auto'"/></div></template>
<style scoped>
.optimized-poster{contain:paint}.poster-thumbnail{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top}
</style>
