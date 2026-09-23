<script setup lang="ts">
import {computed,useId} from 'vue';
const props=defineProps<{symbol:string}>();
const id=useId().replace(/:/g,'');
const symbols=['seven','cherry','bell','bar','gem','coin','dragon','moon','lotus','sun','leaf','ruby','sapphire','emerald','amber','amethyst'];
const fish=computed(()=>props.symbol.startsWith('fish'));
const cell=computed(()=>Math.max(0,symbols.indexOf(props.symbol)));
const box=computed(()=>fish.value?`${props.symbol==='fish-pink'?768:1152} 512 384 512`:`${cell.value%4*313.5} ${Math.floor(cell.value/4)*300} 313.5 300`);
</script>
<template><svg :viewBox="box" aria-hidden="true" class="arcade-symbol painted-symbol"><defs><clipPath :id="`${id}-cell`"><rect :x="box.split(' ')[0]" :y="box.split(' ')[1]" :width="box.split(' ')[2]" :height="box.split(' ')[3]"/></clipPath><filter :id="`${id}-matte`" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 -2 1 0 1"/></filter></defs><g :clip-path="`url(#${id}-cell)`"><image v-if="fish" href="/art/reef-creatures-v6.png" width="1536" height="1024" :filter="`url(#${id}-matte)`"/><image v-else href="/art/casino-symbols-v6.png" width="1254" height="1254"/></g></svg></template>
