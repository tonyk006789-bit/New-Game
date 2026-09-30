<script setup lang="ts">
import {computed,useId} from 'vue';
const props=defineProps<{symbol:string;theme?:string}>();
const id=useId().replace(/:/g,'');
const symbols=['seven','cherry','bell','bar','gem','coin','dragon','moon','lotus','sun','leaf','ruby','sapphire','emerald','amber','amethyst'];
const fish=computed(()=>props.symbol.startsWith('fish'));
const cell=computed(()=>Math.max(0,symbols.indexOf(props.symbol)));
const themeCells:Record<string,Record<string,number>>={
 'ruby-rush':{seven:0,cherry:1,bell:2,bar:3,gem:4},
 'sapphire-crown':{dragon:5,coin:6,lotus:7,gem:11,bell:8,leaf:9,seven:15},
 'solar-fortune':{coin:12,cherry:13,bell:14,bar:15,seven:10}
};
const themedCell=computed(()=>props.theme?themeCells[props.theme]?.[props.symbol]:undefined);
// Painted atlas rows have uneven gutters; explicit bounds keep adjacent art out of reels.
const themedBoxes=['20 24 307 291','332 26 291 290','632 30 288 280','931 90 296 190','12 329 310 272','326 318 306 289','632 320 297 265','929 327 308 273','34 608 260 291','326 617 280 291','616 608 320 313','968 643 253 260','6 912 293 303','307 928 329 268','636 925 296 280','947 915 269 277'];
const box=computed(()=>themedCell.value!==undefined?themedBoxes[themedCell.value]:fish.value?`${props.symbol==='fish-pink'?768:1152} 512 384 512`:`${cell.value%4*313.5} ${Math.floor(cell.value/4)*300} 313.5 300`);
</script>
<template><svg :viewBox="box" aria-hidden="true" class="arcade-symbol painted-symbol"><defs><clipPath :id="`${id}-cell`"><rect :x="box.split(' ')[0]" :y="box.split(' ')[1]" :width="box.split(' ')[2]" :height="box.split(' ')[3]"/></clipPath><filter :id="`${id}-matte`" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 -2 1 0 1"/></filter></defs><g :clip-path="`url(#${id}-cell)`"><image v-if="themedCell!==undefined" href="/art/cabinet-symbols-v15.png" width="1254" height="1254"/><image v-else-if="fish" href="/art/reef-creatures-v6.png" width="1536" height="1024" :filter="`url(#${id}-matte)`"/><image v-else href="/art/casino-symbols-v6.png" width="1254" height="1254"/></g></svg></template>
