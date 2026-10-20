<script setup lang="ts">
import {computed,useId} from 'vue';
import type {GameId} from '@new-game/contracts';
import {catalog} from '@new-game/contracts';
import assets from './presentation-assets.json';
import {identityArt} from './game-identity';
const props=defineProps<{game:GameId;name:string;priority?:boolean}>();
const color=computed(()=>catalog.find(g=>g.id===props.game)?.color||'#bc91ff');
const identity=computed(()=>identityArt(props.game)),id=useId().replace(/:/g,'');
</script>
<template><div class="arcade-poster rich-poster optimized-poster" :class="[game,{'identity-poster':identity}]" :style="{'--poster-accent':color}" aria-hidden="true"><img class="poster-thumbnail" :src="assets[game].url" width="480" height="480" alt="" loading="eager" decoding="async" :fetchpriority="priority?'high':'auto'"/><template v-if="identity"><div class="identity-poster-glow"></div><svg class="identity-poster-host" :viewBox="`${identity.host*256} 0 256 256`"><defs><clipPath :id="`${id}-host`"><rect :x="identity.host*256" y="0" width="256" height="256"/></clipPath></defs><image :href="identity.url" :width="identity.width" height="256" :clip-path="`url(#${id}-host)`"/></svg><div class="identity-poster-props"><svg v-for="cell in identity.host===1?[0]:[0,1,2]" :key="cell" :viewBox="`${cell*256} 0 256 256`"><defs><clipPath :id="`${id}-prop-${cell}`"><rect :x="cell*256" y="0" width="256" height="256"/></clipPath></defs><image :href="identity.url" :width="identity.width" height="256" :clip-path="`url(#${id}-prop-${cell})`"/></svg></div></template></div></template>
<style scoped>
.optimized-poster{contain:paint}.poster-thumbnail{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top}
.identity-poster .poster-thumbnail{opacity:.22}.identity-poster{background:radial-gradient(ellipse at 70% 25%,var(--poster-accent),#090c18 72%)}
.identity-poster-glow{position:absolute;inset:4% 16% 17%;border:2px solid var(--poster-accent);border-radius:50% 50% 20% 20%;box-shadow:0 0 24px var(--poster-accent),inset 0 0 30px #0008}
.identity-poster-host{position:absolute;top:-1%;right:5%;width:76%;height:92%;border-radius:45% 45% 8% 8%;overflow:hidden;mask-image:linear-gradient(#000 72%,transparent 98%)}
.identity-poster-props{position:absolute;left:2%;top:8%;bottom:29%;width:31%;display:flex;flex-direction:column;gap:2px;align-items:center}
.identity-poster-props svg{width:100%;min-height:0;flex:1;border:1px solid #d6b97988;border-radius:26%;background:#090c18;box-shadow:2px 3px 5px #0009;overflow:hidden}
</style>
