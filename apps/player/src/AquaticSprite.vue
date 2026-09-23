<script setup lang="ts">
import {computed,useId} from 'vue';
const props=defineProps<{species?:number;cannon?:number}>();
const id=useId().replace(/:/g,'');
const regions=[[8,65,365,350],[392,75,368,310],[776,60,361,380],[1140,90,395,310],[5,490,384,440],[393,486,370,445],[779,490,350,445],[1130,510,405,405]];
const box=computed(()=>props.cannon!==undefined?`${props.cannon%2*768} ${Math.floor(props.cannon/2)*512} 768 512`:regions[props.species??0].join(' '));
</script>
<template><svg :viewBox="box" class="aquatic-sprite" aria-hidden="true"><defs><clipPath :id="`${id}-aquatic-crop`"><rect :x="box.split(' ')[0]" :y="box.split(' ')[1]" :width="box.split(' ')[2]" :height="box.split(' ')[3]"/></clipPath><filter :id="`${id}-aquatic-key`" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 -2 1 0 1"/></filter></defs><g :clip-path="`url(#${id}-aquatic-crop)`"><image :href="cannon!==undefined?'/art/reef-cannons-v6.png':'/art/reef-creatures-v6.png'" width="1536" height="1024" :filter="`url(#${id}-aquatic-key)`"/></g></svg></template>
