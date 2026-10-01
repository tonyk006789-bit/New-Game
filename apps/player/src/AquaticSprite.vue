<script setup lang="ts">
import {computed,useId} from 'vue';
import {abyssCannons} from './abyss-cannons';
import {abyssRegions} from './abyss-atlas';
const props=defineProps<{species?:number;cannon?:number;game?:string}>();
const id=useId().replace(/:/g,'');
const regions=[[8,65,365,350],[392,75,368,310],[776,60,361,380],[1140,90,395,310],[5,490,384,440],[393,486,370,445],[779,490,350,445],[1130,510,405,405]];
const abyssCannon=computed(()=>props.cannon!==undefined&&props.game==='abyss-legends');
const box=computed(()=>abyssCannon.value?abyssCannons.regions[props.cannon!].join(' '):props.cannon!==undefined?`${props.cannon%2*768} ${Math.floor(props.cannon/2)*512} 768 512`:(props.species??0)>=16?abyssRegions[(props.species??16)-16].join(' '):(props.species??0)>=8?`${((props.species??8)-8)%4*448} ${Math.floor(((props.species??8)-8)/4)*448} 448 448`:regions[props.species??0].join(' '));
</script>
<template><svg :viewBox="box" class="aquatic-sprite" aria-hidden="true"><defs><clipPath :id="`${id}-aquatic-crop`"><rect :x="box.split(' ')[0]" :y="box.split(' ')[1]" :width="box.split(' ')[2]" :height="box.split(' ')[3]"/></clipPath><filter :id="`${id}-aquatic-key`" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 -2 1 0 1"/></filter></defs><g :clip-path="`url(#${id}-aquatic-crop)`"><image :href="abyssCannon?'/art/abyss-cannons-v18.png':cannon!==undefined?'/art/reef-cannons-v6.png':(species??0)>=16?'/art/abyss-creatures-v17.png':(species??0)>=8?'/art/reef-legends-v10.png':'/art/reef-creatures-v6.png'" :width="abyssCannon?abyssCannons.width:cannon===undefined&&(species??0)>=16?1774:cannon===undefined&&(species??0)>=8?1792:1536" :height="abyssCannon?abyssCannons.height:cannon===undefined&&(species??0)>=16?887:cannon===undefined&&(species??0)>=8?896:1024" :filter="abyssCannon||cannon===undefined&&(species??0)>=8?undefined:`url(#${id}-aquatic-key)`"/></g></svg></template>
