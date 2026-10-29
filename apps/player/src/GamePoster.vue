<script setup lang="ts">
import {computed,onMounted,ref,watch} from 'vue';
import type {GameId} from '@new-game/contracts';
import {posterSource,posterSizes} from './poster-source';
const props=defineProps<{game:GameId;name:string;priority?:boolean;floor?:boolean}>();
const source=computed(()=>posterSource(props.game));
const thumbnail=ref<HTMLImageElement>(),loaded=ref(false),failed=ref(false);
watch(()=>props.game,()=>{loaded.value=false;failed.value=false;});
onMounted(()=>{if(thumbnail.value?.complete&&thumbnail.value.naturalWidth)loaded.value=true;});
</script>
<template><div class="arcade-poster rich-poster optimized-poster" :class="[game,{'poster-loaded':loaded,'poster-failed':failed}]" aria-hidden="true"><span v-if="failed" class="poster-fallback">{{name}}<small>Artwork unavailable</small></span><img v-else ref="thumbnail" class="poster-thumbnail" :src="source.src" :srcset="source.srcset" :sizes="floor?posterSizes.floor:posterSizes.shelf" width="480" height="480" alt="" :loading="priority||floor?'eager':'lazy'" decoding="async" :fetchpriority="priority?'high':'auto'" @load="loaded=true" @error="failed=true"/></div></template>
<style scoped>
.optimized-poster{contain:paint;background:radial-gradient(ellipse at 50% 30%,#3e285c,#141022 80%)}.poster-thumbnail{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;opacity:0;transition:opacity .16s ease-out}.poster-loaded .poster-thumbnail{opacity:1}.poster-fallback{position:absolute;inset:15% 8%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#f7deb6;font-weight:800;text-align:center}.poster-fallback small{font-size:10px;color:#c4b5d6;font-weight:400}@media(prefers-reduced-motion:reduce){.poster-thumbnail{transition:none}}
</style>
