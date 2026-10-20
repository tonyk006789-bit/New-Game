<script setup lang="ts">
import {computed} from 'vue';
import type {GameId} from '@new-game/contracts';
import {posterSource,posterSizes} from './poster-source';
const props=defineProps<{game:GameId;name:string;priority?:boolean;floor?:boolean}>();
const source=computed(()=>posterSource(props.game));
</script>
<template><div class="arcade-poster rich-poster optimized-poster" :class="game" aria-hidden="true"><img class="poster-thumbnail" :src="source.src" :srcset="source.srcset" :sizes="floor?posterSizes.floor:posterSizes.shelf" width="480" height="480" alt="" :loading="priority||floor?'eager':'lazy'" decoding="async" :fetchpriority="priority?'high':'auto'"/></div></template>
<style scoped>
.optimized-poster{contain:paint;background:#141022}.poster-thumbnail{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top}
</style>
