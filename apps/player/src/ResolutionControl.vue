<script setup lang="ts">
import {displayPreferences} from './display-preferences';
import {gameResolutions,renderDimensions} from './game-screen';
defineProps<{compact?:boolean;portrait?:boolean}>();
</script>
<template><label class="resolution-control" :class="{compact}"><span v-if="!compact">Game resolution</span><select v-model="displayPreferences.resolution" aria-label="Game resolution"><option v-for="size in gameResolutions" :key="size.id" :value="size.id">{{compact?size.id==='2k'?'2K':size.id:`${size.label} · ${renderDimensions(size.id,portrait).width} × ${renderDimensions(size.id,portrait).height}`}}</option></select></label></template>
<style>.resolution-control{display:flex;gap:10px;align-items:center;color:#f1dfbe;font-size:14px}.resolution-control select{background:#24152f;color:#fff0cc;border:1px solid #b29acb;border-radius:8px;padding:10px;font-weight:bold}.resolution-control.compact select{font-size:11px;min-height:36px;padding:5px;max-width:80px}.resolution-control.compact{flex:none}@media(max-width:600px){.resolution-control.compact select{font-size:9px;max-width:66px;min-height:30px}}</style>
