<script setup lang="ts">
import {computed} from 'vue';
import type {GameId} from '@new-game/contracts';
import {gameFacts} from './game-facts';
const props=defineProps<{game:GameId}>();
const facts=computed(()=>gameFacts(props.game));
</script>
<template><dl class="game-facts"><div><dt>Screen</dt><dd>{{facts.orientation}}</dd></div><div><dt>Play style</dt><dd>{{facts.mechanic}}</dd></div><div><dt>{{facts.preview?'Preview stake from':'Minimum stake'}}</dt><dd>{{facts.minimum}} · {{facts.mode}}</dd></div></dl></template>
<style scoped>.game-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:0 0 20px}.game-facts>div{padding:12px;border:1px solid #7d668f;border-radius:10px;background:#251d38}.game-facts dt{font-size:11px;color:#c9b8d9;text-transform:uppercase;letter-spacing:1px}.game-facts dd{margin:5px 0 0;color:#fff4d6;font-size:14px}</style>
